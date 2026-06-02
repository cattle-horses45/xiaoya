"""
Parser for AI response action tags:
- [ACTION:QUERY_PRODUCT:keyword] → query products table
- [ACTION:QUERY_ORDER:order_no] → query orders table
- [CANNOT_ANSWER] → mark as unanswered
"""
import re

# Regex patterns for action tags
ACTION_PRODUCT = re.compile(r'\[ACTION:QUERY_PRODUCT:(.+?)\]', re.IGNORECASE)
ACTION_ORDER = re.compile(r'\[ACTION:QUERY_ORDER:(.+?)\]', re.IGNORECASE)
CANNOT_ANSWER = re.compile(r'\[CANNOT_ANSWER\]', re.IGNORECASE)


def parse_actions(response_text: str) -> dict:
    """
    Parse AI response for action tags and return structured data.

    Returns:
        dict with:
        - has_cannot_answer: bool
        - product_queries: list[str] — product keywords to search
        - order_queries: list[str] — order numbers to query
        - clean_text: str — text with all tags removed
    """
    product_queries = [p.strip() for p in ACTION_PRODUCT.findall(response_text)]
    order_queries = [o.strip() for o in ACTION_ORDER.findall(response_text)]
    has_cannot_answer = bool(CANNOT_ANSWER.search(response_text))

    # Remove all tags from text
    clean_text = ACTION_PRODUCT.sub('', response_text)
    clean_text = ACTION_ORDER.sub('', clean_text)
    clean_text = CANNOT_ANSWER.sub('', clean_text)
    clean_text = clean_text.strip()

    return {
        "has_cannot_answer": has_cannot_answer,
        "product_queries": product_queries,
        "order_queries": order_queries,
        "clean_text": clean_text,
    }


def has_action_tags(text: str) -> bool:
    """Check if text contains any action tags."""
    return bool(
        ACTION_PRODUCT.search(text)
        or ACTION_ORDER.search(text)
    )
