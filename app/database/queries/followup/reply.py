#
# FOLLOWUP REPLY QUERIES
#
# Linking an inbound reply to the chase that prompted it.
#
# A Message already attaches to the YearSuccessEvidence it concerns. What it
# could not say is which follow-up it answers, or who wrote it: `created_by` is
# whoever entered it into the app, not the sender. Without both, a sent
# follow-up cannot tell "nobody replied" from "somebody replied and did not
# cover this part", and those need different next moves.
#
from app.database.graph_schema import FollowUp, Message, Person
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def link_reply_to_follow_up(message_unique_id: str,
                            follow_up_unique_id: str,
                            from_person_unique_id: str = None) -> dict:
    """Record that one Message is a reply to one FollowUp, and who sent it.

    Idempotent: re-linking the same pair changes nothing. `replies_to` is
    ZeroOrOne, so a message answers at most one chase; a reply that genuinely
    spans two follow-ups is two messages, which is also how it arrived.
    """
    message = Message.nodes.get_or_none(unique_id=message_unique_id)
    if message is None:
        raise NotFoundError(f"Message {message_unique_id!r} not found")

    follow_up = FollowUp.nodes.get_or_none(unique_id=follow_up_unique_id)
    if follow_up is None:
        raise NotFoundError(f"FollowUp {follow_up_unique_id!r} not found")

    sender = None
    if from_person_unique_id:
        sender = Person.nodes.get_or_none(unique_id=from_person_unique_id)
        if sender is None:
            raise NotFoundError(f"Person {from_person_unique_id!r} not found")

    try:
        if not message.replies_to.is_connected(follow_up):
            message.replies_to.disconnect_all()
            message.replies_to.connect(follow_up)
        if sender is not None:
            message.from_person.disconnect_all()
            message.from_person.connect(sender)
    except Exception as e:
        raise CrudError(
            f"Failed to link Message {message_unique_id!r} to FollowUp "
            f"{follow_up_unique_id!r}: {e}"
        )

    return replies_for_follow_up(follow_up_unique_id)


def replies_for_follow_up(follow_up_unique_id: str) -> dict:
    """What came back from one chase, and what is still outstanding.

    Returns the replies with their senders, plus every ask the follow-up carried
    with its CURRENT status. An ask still open after a reply arrived is the
    interesting case: it means they answered, but not that part.
    """
    follow_up = FollowUp.nodes.get_or_none(unique_id=follow_up_unique_id)
    if follow_up is None:
        raise NotFoundError(f"FollowUp {follow_up_unique_id!r} not found")

    from neomodel import db
    rows, meta = db.cypher_query(
        """
        MATCH (f:FollowUp {unique_id: $fid})
        OPTIONAL MATCH (m:Message)-[:replies_to]->(f)
        OPTIONAL MATCH (m)-[:from_person]->(sender:Person)
        WITH f, collect(DISTINCT {
            unique_id: m.unique_id, name: m.name, type: m.type,
            date_created: toString(m.date_created),
            from_person: sender.name
        }) AS replies
        OPTIONAL MATCH (f)-[:includes_query]->(q:Query)
        WITH f, replies, collect(DISTINCT {
            unique_id: q.unique_id, question: q.question, status: q.status,
            answerable_by: [ (q)-[:answerable_by]->(p:Person) | p.name ]
        }) AS asked_queries
        OPTIONAL MATCH (f)-[:includes_recommendation]->(r:Recommendation)
        RETURN f.subject AS subject, f.status AS status,
               toString(f.date_sent) AS date_sent,
               [x IN replies WHERE x.unique_id IS NOT NULL] AS replies,
               [x IN asked_queries WHERE x.unique_id IS NOT NULL] AS queries,
               collect(DISTINCT {unique_id: r.unique_id,
                                 recommendation: r.recommendation,
                                 status: r.status}) AS recommendations
        """,
        {"fid": follow_up_unique_id},
    )
    data = dict(zip(meta, rows[0]))
    data["recommendations"] = [
        r for r in data["recommendations"] if r.get("unique_id")
    ]

    open_queries = [q for q in data["queries"] if q["status"] != "settled"]
    open_recs = [r for r in data["recommendations"] if r["status"] == "open"]

    data["outstanding"] = len(open_queries) + len(open_recs)
    # The distinction the follow-up exists to make. A draft with open asks was
    # never sent, so nobody has failed to answer it.
    data["awaiting_reply"] = bool(
        data["status"] == "sent" and not data["replies"] and data["outstanding"]
    )
    data["partially_answered"] = bool(
        data["replies"] and data["outstanding"]
    )
    return data
