"""
Ticket Classifier for SupportFlow AI

Classifies incoming support messages into one of:
  - billing
  - technical
  - account_access
  - unknown

Uses keyword heuristic scoring with density-weighted confidence.
Transparent logic for interview-ready demonstration.
"""
from typing import Dict, Any
from ..utils.logger import get_logger

logger = get_logger("TicketClassifier")

# ─── Keyword Vocabulary ────────────────────────────────────────────────────────

BILLING_KEYWORDS = [
    "charge", "charged", "bill", "billing", "invoice", "payment", "paid", "pay",
    "subscription", "refund", "money", "price", "cost", "fee", "plan", "credit",
    "card", "transaction", "overcharge", "double charge", "twice", "receipt",
    "renewal", "renew", "upgrade plan", "downgrade", "auto-renew", "deducted",
    "amount", "currency", "stripe", "bank", "checkout", "purchase", "order"
]

TECHNICAL_KEYWORDS = [
    "crash", "crashes", "error", "bug", "broken", "not working", "fails", "failure",
    "upload", "download", "slow", "freeze", "stuck", "timeout", "connection", "api",
    "integration", "500", "404", "export", "import", "pdf", "feature", "button",
    "page", "loading", "performance", "server", "application", "software", "app",
    "fix", "issue", "problem", "incorrect", "missing", "format", "corrupt", "glitch",
    "unresponsive", "blank", "cannot open", "cannot load", "failed to", "try again"
]

ACCOUNT_KEYWORDS = [
    "login", "log in", "sign in", "password", "forgot", "reset", "account",
    "access", "locked", "2fa", "two factor", "two-factor", "authentication",
    "username", "email", "profile", "blocked", "suspended", "verify",
    "verification", "otp", "code", "cannot access", "cannot login",
    "lost access", "sign out", "session expired", "new device", "link expired",
    "sso", "single sign-on", "identity", "credential"
]

# Human-readable labels and badge colors per category
CATEGORY_META = {
    "billing":        {"label": "Billing",        "color": "amber"},
    "technical":      {"label": "Technical",      "color": "blue"},
    "account_access": {"label": "Account Access", "color": "violet"},
    "unknown":        {"label": "Unknown",         "color": "slate"},
}


# ─── Internal helpers ──────────────────────────────────────────────────────────

def _count_matches(text: str, keywords: list) -> int:
    """Count keyword matches (case-insensitive substring match)."""
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw.lower() in text_lower)


def _score_to_confidence(score: int) -> float:
    """
    Map raw keyword match count → confidence float [0, 0.97].
    
    Score  → Confidence
      0    → 0.00 (used for unknown)
      1    → 0.65
      2    → 0.80
      3    → 0.90
      4+   → 0.95-0.97 (capped)
    """
    if score == 0:
        return 0.0
    return round(min(0.50 + score * 0.15, 0.97), 2)


# ─── Classifier ───────────────────────────────────────────────────────────────

class TicketClassifier:
    """
    Transparent, keyword-based classifier for customer support ticket triage.

    Design decision: rule-based over ML for explainability — the confidence
    score is directly traceable to keyword matches, making it easy to explain
    during technical demonstrations.
    """

    @staticmethod
    def classify(message: str) -> Dict[str, Any]:
        """
        Classify a support ticket message.

        Args:
            message: Raw user support message string.

        Returns:
            {
              "category": str,           # billing | technical | account_access | unknown
              "confidence": float,        # 0.0 – 0.97
              "reason": str,             # human-readable classification rationale
              "label": str,              # display label
              "color": str               # tailwind color token for badge
            }
        """
        if not message or not message.strip():
            return {
                "category": "unknown",
                "confidence": 0.10,
                "reason": "Empty or blank message received.",
                **CATEGORY_META["unknown"]
            }

        billing_score  = _count_matches(message, BILLING_KEYWORDS)
        technical_score = _count_matches(message, TECHNICAL_KEYWORDS)
        account_score  = _count_matches(message, ACCOUNT_KEYWORDS)

        max_score = max(billing_score, technical_score, account_score)

        if max_score == 0:
            logger.info(f"[Classifier] UNKNOWN — 0 keyword matches: '{message[:60]}'")
            return {
                "category": "unknown",
                "confidence": 0.15,
                "reason": (
                    "No keywords matched any supported support category "
                    "(Billing, Technical, or Account Access). "
                    "This query appears to be outside the scope of our automated support system."
                ),
                **CATEGORY_META["unknown"]
            }

        # Resolve winning category (billing wins ties over technical; account wins last)
        if billing_score == max_score:
            category = "billing"
            reason = (
                f"Detected {billing_score} billing-related term(s) — "
                f"charge/payment/subscription keywords identified."
            )
        elif technical_score == max_score:
            category = "technical"
            reason = (
                f"Detected {technical_score} technical keyword(s) — "
                f"application error, upload issue, or performance problem identified."
            )
        else:
            category = "account_access"
            reason = (
                f"Detected {account_score} account-related keyword(s) — "
                f"login/password/access terms identified."
            )

        confidence = _score_to_confidence(max_score)

        logger.info(
            f"[Classifier] {category.upper()} | conf={confidence} | "
            f"scores: billing={billing_score}, tech={technical_score}, account={account_score} | "
            f"msg='{message[:60]}'"
        )

        return {
            "category": category,
            "confidence": confidence,
            "reason": reason,
            **CATEGORY_META[category]
        }
