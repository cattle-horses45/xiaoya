"""
AI Chat Service — Core DeepSeek API integration with two-pass architecture.

Flow:
1. First pass: Send user message + system prompt + history to DeepSeek
2. Parse response for [ACTION:QUERY_PRODUCT:xxx] / [ACTION:QUERY_ORDER:xxx] tags
3. If action tags found: query MySQL → inject results → second pass to DeepSeek
4. Check for [CANNOT_ANSWER] → save to DB
5. Track dissatisfaction count → trigger transfer if >= 3
"""
import json
import logging
from datetime import datetime
from typing import Optional, List, Tuple

import httpx
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import settings
from app.models.chat import ChatSession, ChatMessage, UnansweredQuestion
from app.models.product import Product
from app.models.order import Order
from app.utils.system_prompt import SYSTEM_PROMPT
from app.utils.action_parser import parse_actions, has_action_tags
from app.services.emotion import detect_emotion, check_dissatisfied

logger = logging.getLogger(__name__)


async def call_deepseek(messages: list) -> str:
    """
    Make a single call to the DeepSeek API.

    Args:
        messages: List of message dicts [{"role": "system"|"user"|"assistant", "content": "..."}]

    Returns:
        AI response text
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.deepseek_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.deepseek_model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2000,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


def format_chat_history(messages: List[ChatMessage]) -> str:
    """Format recent chat messages into a string for the system prompt."""
    if not messages:
        return "（无历史对话）"

    lines = []
    for msg in messages:
        role_label = "用户" if msg.role == "user" else "小鸭"
        lines.append(f"{role_label}: {msg.content}")
    return "\n".join(lines)


def query_products(db: Session, keyword: str) -> List[dict]:
    """Query products from database by keyword."""
    if keyword == "全部" or keyword == "all" or not keyword:
        products = db.query(Product).filter(Product.stock > 0).all()
    else:
        products = db.query(Product).filter(
            or_(
                Product.name.like(f"%{keyword}%"),
                Product.description.like(f"%{keyword}%"),
            )
        ).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "stock": p.stock,
            "description": p.description,
            "specs": p.specs,
        }
        for p in products
    ]


def query_order(db: Session, order_no: str) -> Optional[dict]:
    """Query a single order by order number."""
    order = db.query(Order).filter(Order.order_no == order_no).first()
    if not order:
        return None

    items = []
    for item in order.items:
        product = item.product
        items.append({
            "product_name": product.name if product else "未知商品",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": item.quantity * item.unit_price,
        })

    return {
        "order_no": order.order_no,
        "status": order.status,
        "total_amount": order.total_amount,
        "shipping_address": order.shipping_address,
        "items": items,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }


async def process_chat_message(
    message: str,
    session_token: str,
    user_id: Optional[int],
    db: Session,
) -> dict:
    """
    Full AI chat processing pipeline.

    Returns:
        dict with: reply, is_transfer, session_token
    """
    # ── 1. Get or create chat session ──
    session = db.query(ChatSession).filter(
        ChatSession.session_token == session_token
    ).first()

    if not session:
        session = ChatSession(
            user_id=user_id,
            session_token=session_token,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # ── 2. Detect emotion ──
    emotion = detect_emotion(message)

    # ── 3. Save user message ──
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=message,
        emotion=emotion,
    )
    db.add(user_msg)
    db.commit()

    # ── 4. Get recent 5 turns (10 messages) ──
    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.id.desc())
        .limit(10)
        .all()
    )
    recent_messages.reverse()  # Chronological order
    chat_history = format_chat_history(recent_messages)

    # ── 5. Build prompt ──
    system_prompt = SYSTEM_PROMPT.format(
        current_time=datetime.now().strftime("%Y年%m月%d日 %H:%M"),
        user_info=f"用户ID: {user_id}" if user_id else "游客用户",
        chat_history=chat_history,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    # ── 6. First pass: Call DeepSeek ──
    try:
        first_response = await call_deepseek(messages)
    except Exception as e:
        logger.error(f"DeepSeek API error (first pass): {e}")
        return {
            "reply": "抱歉，我暂时遇到了一些技术问题，请稍后再试。如果问题紧急，请拨打客服热线 400-888-XXXX。",
            "is_transfer": False,
            "session_token": session_token,
        }

    # ── 7. Check for action tags ──
    actions = parse_actions(first_response)

    final_reply = first_response

    # If action tags found, do second pass
    if actions["product_queries"] or actions["order_queries"]:
        # Query products
        product_results = []
        for keyword in actions["product_queries"]:
            results = query_products(db, keyword)
            product_results.extend(results)

        # Query orders
        order_results = []
        for order_no in actions["order_queries"]:
            result = query_order(db, order_no)
            if result:
                order_results.append(result)

        # Build injection message
        injection_parts = []
        if product_results:
            products_text = json.dumps(product_results, ensure_ascii=False, indent=2)
            injection_parts.append(f"[系统查询结果 - 商品数据]\n以下是数据库中匹配的商品信息，请你基于这些真实数据组织回复：\n{products_text}")

        if order_results:
            orders_text = json.dumps(order_results, ensure_ascii=False, indent=2)
            injection_parts.append(f"[系统查询结果 - 订单数据]\n以下是查询到的订单信息：\n{orders_text}")

        if not product_results and actions["product_queries"] and not order_results:
            injection_parts.append("[系统查询结果]\n未找到匹配的商品或订单数据。请如实告知用户该商品暂时缺货或未上架。")

        if not order_results and actions["order_queries"] and not product_results:
            injection_parts.append("[系统查询结果]\n未找到该订单。请告知用户订单号可能不正确。")

        injection_msg = "\n\n".join(injection_parts)

        # Second pass
        second_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
            {"role": "assistant", "content": first_response},  # Include first pass response
            {"role": "system", "content": injection_msg},
        ]

        try:
            second_response = await call_deepseek(second_messages)
            final_reply = second_response
            # Re-parse for CANNOT_ANSWER in second response
            actions = parse_actions(final_reply)
        except Exception as e:
            logger.error(f"DeepSeek API error (second pass): {e}")
            # Fallback to first response with cleaned text
            final_reply = actions["clean_text"]

    # ── 8. Handle CANNOT_ANSWER ──
    if actions["has_cannot_answer"]:
        unanswered = UnansweredQuestion(
            question=message,
            session_id=session.id,
        )
        db.add(unanswered)
        db.commit()
        # Strip the tag from displayed reply
        final_reply = actions["clean_text"]

    # ── 9. Check dissatisfaction ──
    is_transfer = False
    if check_dissatisfied(message):
        session.dissatisfied_count += 1
        if session.dissatisfied_count >= 3:
            is_transfer = True
            session.needs_followup = True
            final_reply = (
                "我理解您希望获得更深入的帮助。正在为您转接专业的人工客服，请稍候……"
                "（模拟转接中）预计等待时间约2分钟。您也可以拨打鸭梨官方客服热线 400-888-XXXX 获取即时支持。"
            )
        db.commit()

    # ── 10. Save assistant reply ──
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=final_reply,
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "reply": final_reply,
        "is_transfer": is_transfer,
        "session_token": session_token,
    }


def create_new_session(db: Session, user_id: Optional[int] = None) -> str:
    """Create a new chat session and return the session token."""
    import uuid
    token = str(uuid.uuid4())
    session = ChatSession(
        user_id=user_id,
        session_token=token,
    )
    db.add(session)
    db.commit()
    return token
