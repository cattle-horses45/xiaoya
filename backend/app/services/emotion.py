"""
Keyword-based emotion detection for customer messages.
"""

# Negative emotion keywords
NEGATIVE_KEYWORDS = [
    "垃圾", "烂", "太差了", "坑人", "退货", "投诉",
    "气死了", "失望", "无语", "烦", "骗人", "根本没用",
    "差劲", "坑爹", "恶心", "后悔", "别买", "千万不要",
]

# Positive emotion keywords
POSITIVE_KEYWORDS = [
    "谢谢", "很好", "不错", "满意", "开心", "好用",
    "太棒了", "给力", "喜欢", "赞", "好评", "推荐",
    "感谢", "真不错", "太好了",
]

# Dissatisfied keywords (for transfer-to-human trigger)
DISSATISFIED_KEYWORDS = [
    "没用", "听不懂", "还是不行", "算了", "换个人",
    "转人工", "人工客服", "没用的", "根本不行",
    "你在说什么", "答非所问", "无语", "放弃",
    "有什么用", "服了", "不说了",
]


def detect_emotion(message: str) -> str:
    """
    Detect user emotion from message text.
    Returns: "angry", "sad", "happy", or "neutral"
    """
    msg_lower = message.lower()

    # Check negative first (stronger signal)
    negative_count = sum(1 for kw in NEGATIVE_KEYWORDS if kw in msg_lower)
    if negative_count > 0:
        # Check for specific anger indicators
        anger_keywords = ["垃圾", "烂", "气死了", "坑人", "骗人", "恶心"]
        if any(kw in msg_lower for kw in anger_keywords):
            return "angry"
        return "sad"

    # Check positive
    positive_count = sum(1 for kw in POSITIVE_KEYWORDS if kw in msg_lower)
    if positive_count > 0:
        return "happy"

    return "neutral"


def check_dissatisfied(message: str) -> bool:
    """Check if message indicates dissatisfaction (for transfer trigger)."""
    return any(kw in message for kw in DISSATISFIED_KEYWORDS)
