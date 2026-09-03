#
# FOLLOWUP UPDATE QUERIES
#
# A FollowUp is a record of what was chased. Its body is not meant to churn —
# editing the text of a message already sent would falsify the record — so the
# update surface is deliberately narrow: correct a draft, or mark it sent.
#
from datetime import date

from app.database.graph_schema import FollowUp
from app.data_config import followup_statuses
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _get(unique_id: str) -> FollowUp:
    node = FollowUp.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"FollowUp {unique_id!r} not found")
    return node


def update_follow_up(unique_id: str,
                     subject: str = None,
                     body_markdown: str = None,
                     generated_at: str = None) -> dict:
    """Correct a follow-up's subject or body. Only supplied fields change.

    `generated_at` is accepted so a re-composed message can re-stamp when it was
    written against the graph — a body that changed but kept its old timestamp
    would claim to describe evidence it never saw.
    """
    if subject is None and body_markdown is None and generated_at is None:
        raise ValidationError(
            "Nothing to update: pass subject, body_markdown and/or generated_at"
        )

    node = _get(unique_id)
    if subject is not None:
        if not subject.strip():
            raise ValidationError("subject cannot be blank")
        node.subject = subject.strip()
    if body_markdown is not None:
        node.body_markdown = body_markdown
    if generated_at is not None:
        node.generated_at = generated_at

    try:
        node.save()
    except Exception as e:
        raise CrudError(f"Failed to update FollowUp {unique_id!r}: {e}")
    return node.serialize()


def mark_follow_up_sent(unique_id: str, date_sent: str = None) -> dict:
    """Record that a follow-up actually went out.

    This is the half of the loop that makes an unanswered ask meaningful: a
    query still open under a follow-up that was never sent is not a
    non-response, it is an unfinished chase.
    """
    node = _get(unique_id)

    if date_sent:
        try:
            node.date_sent = date.fromisoformat(date_sent)
        except ValueError:
            raise ValidationError(
                f"Invalid date_sent (expected YYYY-MM-DD): {date_sent}"
            )
    else:
        node.date_sent = date.today()

    node.status = "sent"
    try:
        node.save()
    except Exception as e:
        raise CrudError(f"Failed to mark FollowUp {unique_id!r} sent: {e}")
    return node.serialize()


def set_follow_up_status(unique_id: str, status: str) -> dict:
    """Set the lifecycle status directly (draft <-> sent)."""
    if status not in followup_statuses:
        raise ValidationError(
            f"Invalid status {status!r}; must be one of {list(followup_statuses.keys())}"
        )
    node = _get(unique_id)
    node.status = status
    if status == "draft":
        # A follow-up pulled back to draft was not sent after all; leaving the
        # date would keep asserting it was.
        node.date_sent = None
    try:
        node.save()
    except Exception as e:
        raise CrudError(f"Failed to set status on FollowUp {unique_id!r}: {e}")
    return node.serialize()
