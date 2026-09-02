#
# FOLLOWUP READ QUERIES
#
# Two jobs: read saved FollowUp records, and build the gap table a new one is
# generated from.
#
# The table is the interesting half. "Which indicators did this meeting discuss"
# is DERIVED, not stored: an ingest attaches each Note to both the YSE and the
# MeetingMinutes, so the indicators discussed are those sharing a Note with the
# meeting. That means no schema had to be added to make follow-ups possible, and
# it stays correct as long as ingests keep that convention.
#
from app.database.graph_schema import FollowUp
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from neomodel import db


# One round trip. A neomodel walk here would be N+1 across six indicators x four
# collections; model property defaults would also read back as null, so anything
# added to these projections needs coalescing at the Cypher level.
_TABLE_CYPHER = """
MATCH (mm:MeetingMinutes {unique_id: $meeting_minutes_id})-[:has_note]->(:Note)<-[:has_note]-(y:YearSuccessEvidence)
// DISTINCT because an indicator discussed at length shares SEVERAL notes with the
// meeting; without it the row fans out once per note.
WITH DISTINCT y
MATCH (y)-[:tracks]->(si:SuccessIndicator)
OPTIONAL MATCH (y)-[:status_is]->(sl:StatusLevel)

CALL (y) {
    MATCH (impl)-[ev:is_evidence_for]->(y)
    WHERE coalesce(impl.retired, false) = false
    RETURN collect({
        title: coalesce(impl.title, impl.name),
        type: labels(impl)[0],
        strength: ev.strength
    }) AS evidence
}
CALL (y) {
    MATCH (q:Query)-[:addresses_evidence]->(y)
    WHERE q.status <> 'settled'
    OPTIONAL MATCH (q)-[:answerable_by]->(owner:Person)
    RETURN collect(DISTINCT {
        unique_id: q.unique_id,
        question: q.question,
        detail: q.detail,
        category: q.category,
        status: q.status,
        answerable_by: owner.name
    }) AS queries
}
CALL (y) {
    MATCH (y)-[:has_recommendation]->(r:Recommendation)
    WHERE r.status = 'open'
    RETURN collect({
        unique_id: r.unique_id,
        recommendation: r.recommendation,
        detail: r.detail
    }) AS recommendations
}
CALL (y) {
    MATCH (y)-[:has_concern]->(c:Concern)
    WHERE c.status = 'open'
    RETURN collect({
        unique_id: c.unique_id,
        concern: c.concern,
        detail: c.detail
    }) AS concerns
}

RETURN si.composite_key    AS composite_key,
       si.success_indicator AS success_indicator,
       y.year_identifier   AS year_identifier,
       sl.status_level     AS status_level,
       evidence, queries, recommendations, concerns
ORDER BY composite_key
"""


def build_follow_up_table(meeting_minutes_id: str) -> list:
    """The per-indicator gap table for one meeting.

    One row per success indicator the meeting touched, carrying its current
    status, the live evidence behind it, and every open ask against it — queries
    to answer, recommendations to act on, concerns with no path yet.

    An indicator with an empty `queries` list is not necessarily settled; it may
    mean the gaps were written as prose notes rather than as asks. That is a
    routing question for the ingest, not something this query can infer.
    """
    rows, meta = db.cypher_query(
        _TABLE_CYPHER, {"meeting_minutes_id": meeting_minutes_id}
    )
    return [dict(zip(meta, row)) for row in rows]


def get_follow_up(unique_id: str) -> dict:
    """One saved FollowUp with its relationships resolved."""
    node = FollowUp.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"FollowUp {unique_id!r} not found")

    data = node.serialize()
    minutes = node.follows_up_on.single()
    guide = node.derived_from.single()
    community = node.pertains_to.single()
    campus = node.for_campus.single()

    data["follows_up_on"] = (
        {"unique_id": minutes.unique_id, "title": minutes.title,
         "meeting_date": minutes.meeting_date.isoformat() if minutes.meeting_date else None}
        if minutes else None
    )
    data["derived_from"] = (
        {"unique_id": guide.unique_id, "title": guide.title} if guide else None
    )
    data["community"] = community.name if community else None
    data["campus"] = campus.abbreviation if campus else None
    data["addressed_to"] = [
        {"unique_id": p.unique_id, "name": p.name, "email": p.email}
        for p in node.addressed_to.all()
    ]
    data["covers_evidence"] = [y.year_identifier for y in node.covers_evidence.all()]
    data["includes_query"] = [
        {"unique_id": q.unique_id, "question": q.question, "status": q.status}
        for q in node.includes_query.all()
    ]
    data["includes_recommendation"] = [
        {"unique_id": r.unique_id, "recommendation": r.recommendation, "status": r.status}
        for r in node.includes_recommendation.all()
    ]
    data["includes_concern"] = [
        {"unique_id": c.unique_id, "concern": c.concern, "status": c.status}
        for c in node.includes_concern.all()
    ]
    return data


def follow_ups_for_meeting(meeting_minutes_id: str) -> list:
    """Every FollowUp chasing one meeting — one per community x campus slice."""
    rows, meta = db.cypher_query(
        """
        MATCH (f:FollowUp)-[:follows_up_on]->(:MeetingMinutes {unique_id: $mid})
        OPTIONAL MATCH (f)-[:pertains_to]->(cop:CommunityOfPractice)
        OPTIONAL MATCH (f)-[:for_campus]->(c:Campus)
        RETURN f.unique_id AS unique_id, f.subject AS subject, f.status AS status,
               toString(f.date_created) AS date_created,
               toString(f.date_sent) AS date_sent,
               cop.name AS community, c.abbreviation AS campus
        ORDER BY f.date_created DESC, f.subject
        """,
        {"mid": meeting_minutes_id},
    )
    return [dict(zip(meta, row)) for row in rows]
