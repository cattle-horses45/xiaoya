"""
AI Chat Service — Core DeepSeek API integration with streaming support.

Flow:
1. First pass (non-streaming): Detect [ACTION:QUERY_PRODUCT] / [ACTION:QUERY_ORDER] tags
2. If action tags found: query MySQL → inject results → stream second pass
3. If no action tags → stream first pass directly
4. Check for [CANNOT_ANSWER] → save to DB
5. Track dissatisfaction count
"""
import json
import logging
from datetime import datetime
from typing import Optional, List, AsyncGenerator

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
    """Make a single non-streaming call to the DeepSeek API."""
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


async def call_deepseek_stream(messages: list) -> AsyncGenerator[str, None]:
    """Call DeepSeek API with streaming enabled. Yields text chunks."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
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
                "stream": True,
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue


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


def build_system_prompt(user_id: Optional[int]) -> str:
    """Build system prompt with current context."""
    return SYSTEM_PROMPT.format(
        current_time=datetime.now().strftime("%Y年%m月%d日 %H:%M"),
        user_info=f"用户ID: {user_id}" if user_id else "游客用户",
        chat_history="（暂无历史对话）",
    )


def build_messages_with_history(
    system_prompt: str,
    history_messages: List[ChatMessage],
    current_message: str,
) -> list:
    """Build the full messages array with system prompt and chat history."""
    messages = [{"role": "system", "content": system_prompt}]

    # Add recent history (exclude the current message which is already saved)
    for msg in history_messages:
        messages.append({"role": msg.role, "content": msg.content})

    return messages


async def process_chat_stream(
    message: str,
    session_token: str,
    user_id: Optional[int],
    db: Session,
) -> AsyncGenerator[str, None]:
    """
    Streaming AI chat processing.

    Yields text chunks as they arrive from DeepSeek.
    The caller is responsible for assembling the full response and saving it.
    """
    # ── 1. Get or create chat session ──
    session = db.query(ChatSession).filter(
        ChatSession.session_token == session_token
    ).first()

    if not session:
        session = ChatSession(user_id=user_id, session_token=session_token)
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

    # ── 4. Get recent 5 turns ──
    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.id.desc())
        .limit(10)
        .all()
    )
    recent_messages.reverse()
    chat_history = format_chat_history(recent_messages)

    # ── 5. Build system prompt with history ──
    history_str = "\n".join([
        f"{'用户' if m.role == 'user' else '小鸭'}: {m.content}"
        for m in recent_messages
    ]) if recent_messages else "（无历史对话）"

    system_prompt = SYSTEM_PROMPT.format(
        current_time=datetime.now().strftime("%Y年%m月%d日 %H:%M"),
        user_info=f"用户ID: {user_id}" if user_id else "游客用户",
        chat_history=history_str,
    )

    # ── 6. First pass: non-streaming to detect action tags ──
    first_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": message},
    ]

    try:
        first_response = await call_deepseek(first_messages)
    except Exception as e:
        logger.error(f"DeepSeek first pass error: {e}")
        yield "抱歉，我暂时遇到了一些技术问题，请稍后再试。如果问题紧急，请拨打客服热线 400-888-XXXX。"
        session.dissatisfied_count += 1
        db.commit()
        return

    # ── 7. Check for action tags ──
    actions = parse_actions(first_response)
    streaming_messages = first_messages.copy()

    # If action tags found, do DB queries and prepare second pass
    if actions["product_queries"] or actions["order_queries"]:
        product_results = []
        for keyword in actions["product_queries"]:
            product_results.extend(query_products(db, keyword))

        order_results = []
        for order_no in actions["order_queries"]:
            result = query_order(db, order_no)
            if result:
                order_results.append(result)

        injection_parts = []
        if product_results:
            injection_parts.append(
                "[系统查询结果 - 商品数据]\n以下是数据库中匹配的商品信息，请基于真实数据回复：\n"
                + json.dumps(product_results, ensure_ascii=False, indent=2)
            )
        if order_results:
            injection_parts.append(
                "[系统查询结果 - 订单数据]\n查询到的订单信息：\n"
                + json.dumps(order_results, ensure_ascii=False, indent=2)
            )
        if not product_results and actions["product_queries"] and not order_results:
            injection_parts.append("[系统查询结果]\n未找到匹配的商品数据。请如实告知用户该商品暂未上架。")
        if not order_results and actions["order_queries"] and not product_results:
            injection_parts.append("[系统查询结果]\n未找到该订单。请告知用户订单号可能不正确。")

        injection_msg = "\n\n".join(injection_parts)
        streaming_messages.append({"role": "assistant", "content": first_response})
        streaming_messages.append({"role": "system", "content": injection_msg})

    # ── 8. Stream the final response ──
    full_response = ""
    try:
        async for chunk in call_deepseek_stream(streaming_messages):
            full_response += chunk
            yield chunk
    except Exception as e:
        logger.error(f"DeepSeek stream error: {e}")
        if not full_response:
            yield "抱歉，我暂时遇到了一些技术问题，请稍后再试。"
            full_response = "抱歉，我暂时遇到了一些技术问题，请稍后再试。"

    # ── 9. Post-processing on assembled response ──
    post_actions = parse_actions(full_response)

    if post_actions["has_cannot_answer"]:
        UnansweredQuestion(question=message, session_id=session.id)
        db.add(UnansweredQuestion(question=message, session_id=session.id))
        db.commit()

    # ── 10. Check dissatisfaction ──
    if check_dissatisfied(message):
        session.dissatisfied_count += 1
        if session.dissatisfied_count >= 3:
            session.needs_followup = True
            transfer_msg = "我理解您希望获得更深入的帮助。正在为您转接专业的人工客服，请稍候…（模拟转接中）预计等待时间约2分钟。"
            ChatMessage(session_id=session.id, role="assistant", content=transfer_msg)
            db.add(ChatMessage(session_id=session.id, role="assistant", content=transfer_msg))
        db.commit()

    # ── 11. Save assistant reply ──
    if full_response:
        ChatMessage(session_id=session.id, role="assistant", content=full_response)
        db.add(ChatMessage(session_id=session.id, role="assistant", content=full_response))
        db.commit()


def create_new_session(db: Session, user_id: Optional[int] = None) -> str:
    """Create a new chat session and return the session token."""
    import uuid
    token = str(uuid.uuid4())
    session = ChatSession(user_id=user_id, session_token=token)
    db.add(session)
    db.commit()
    return token


# Keep old function for backward compatibility
async def process_chat_message(
    message: str,
    session_token: str,
    user_id: Optional[int],
    db: Session,
) -> dict:
    """Non-streaming version (fallback)."""
    full = ""
    chunks = []
    async for chunk in process_chat_stream(message, session_token, user_id, db):
        chunks.append(chunk)

    full_response = "".join(chunks)

    # Check if transfer happened
    session = db.query(ChatSession).filter(
        ChatSession.session_token == session_token
    ).first()
    is_transfer = session.needs_followup if session else False

    return {
        "reply": full_response,
        "is_transfer": is_transfer,
        "session_token": session_token,
    }
