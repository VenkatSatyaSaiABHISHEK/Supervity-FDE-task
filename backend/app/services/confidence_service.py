"""
Confidence Service for SupportFlow AI

Evaluates whether a support ticket should be escalated to a human agent
based on two independent confidence signals:
  1. Ticket classification confidence (how certain we are about the category)
  2. RAG retrieval confidence (how relevant the knowledge base content is)

Configurable thresholds allow tuning without code changes.
"""
from typing import Tuple
from ..utils.logger import get_logger

logger = get_logger("ConfidenceService")

# ─── Configurable Thresholds ──────────────────────────────────────────────────
# Raise these to escalate more aggressively; lower to resolve more with AI.

CATEGORY_CONFIDENCE_THRESHOLD = 0.70
"""Minimum classification confidence to attempt a grounded AI answer."""

RETRIEVAL_CONFIDENCE_THRESHOLD = 0.65
"""Minimum knowledge base retrieval score to trust the retrieved context."""


# ─── Service ──────────────────────────────────────────────────────────────────

class ConfidenceService:
    """
    Decision engine for SupportFlow AI triage escalation.

    Escalation conditions (checked in priority order):
      1. Category is 'unknown'  →  always escalate
      2. Category confidence < CATEGORY_CONFIDENCE_THRESHOLD  →  escalate
      3. Retrieval confidence  < RETRIEVAL_CONFIDENCE_THRESHOLD  →  escalate
      4. All thresholds met  →  proceed with AI answer
    """

    @staticmethod
    def should_escalate(
        category: str,
        category_confidence: float,
        retrieval_confidence: float
    ) -> Tuple[bool, str]:
        """
        Determine if the ticket should be escalated.

        Args:
            category: Classified category string.
            category_confidence: Float [0, 1] from TicketClassifier.
            retrieval_confidence: Float [0, 1] from max RAG chunk score.

        Returns:
            (escalate: bool, reason: str)
        """
        # Rule 1: Unknown category
        if category == "unknown":
            reason = (
                "This query could not be classified into a supported category "
                "(Billing, Technical, or Account Access). "
                "It appears to be outside the scope of our automated support system."
            )
            logger.info("[Escalation] Triggered by UNKNOWN category.")
            return True, reason

        # Rule 2: Low classification confidence
        if category_confidence < CATEGORY_CONFIDENCE_THRESHOLD:
            reason = (
                f"Classification confidence ({category_confidence:.0%}) is below the required "
                f"threshold ({CATEGORY_CONFIDENCE_THRESHOLD:.0%}). "
                f"The query is ambiguous and may require human judgment to correctly categorize."
            )
            logger.info(
                f"[Escalation] Low category confidence: {category_confidence:.0%} "
                f"< {CATEGORY_CONFIDENCE_THRESHOLD:.0%}"
            )
            return True, reason

        # Rule 3: Low knowledge base retrieval confidence
        if retrieval_confidence < RETRIEVAL_CONFIDENCE_THRESHOLD:
            reason = (
                f"No sufficiently relevant information was found in the support knowledge base "
                f"(retrieval confidence: {retrieval_confidence:.0%}, "
                f"required: {RETRIEVAL_CONFIDENCE_THRESHOLD:.0%}). "
                f"A human agent with full account access can better assist you."
            )
            logger.info(
                f"[Escalation] Low retrieval confidence: {retrieval_confidence:.0%} "
                f"< {RETRIEVAL_CONFIDENCE_THRESHOLD:.0%}"
            )
            return True, reason

        # All checks passed — proceed with AI answer
        logger.info(
            f"[Escalation] No escalation. category={category}, "
            f"cat_conf={category_confidence:.0%}, ret_conf={retrieval_confidence:.0%}"
        )
        return False, ""

    @staticmethod
    def get_thresholds() -> dict:
        """Returns current threshold configuration for display in settings/debug."""
        return {
            "category_confidence_threshold": CATEGORY_CONFIDENCE_THRESHOLD,
            "retrieval_confidence_threshold": RETRIEVAL_CONFIDENCE_THRESHOLD,
        }
