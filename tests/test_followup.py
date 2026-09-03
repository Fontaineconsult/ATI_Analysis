"""FollowUp: the post-meeting message that chases what a meeting left open.

Layered per the project's build order: vocabulary (no DB), then the create
invariant and the gap table (DB).

All test data is scoped to a sentinel meeting title and torn down by prefix, so
nothing here can touch production records even if a real campus or indicator is
referenced.
"""
import re

import pytest
from neomodel import db

from app.data_config import query_categories, followup_statuses
from app.database.graph_schema import FollowUp, MeetingMinutes
from app.database.queries.followup.create import create_follow_up
from app.database.queries.followup.read import (
    build_follow_up_table,
    follow_ups_for_meeting,
    get_follow_up,
)
from app.database.queries.followup.reply import (
    link_reply_to_follow_up,
    replies_for_follow_up,
)
from app.database.queries.followup.update import (
    mark_follow_up_sent,
    set_follow_up_status,
    update_follow_up,
)
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError

SENTINEL_MEETING = "ZZZ-TEST Follow-up meeting 9999-9999"
SENTINEL_SUBJECT = "ZZZ-TEST follow-up"


# --------------------------------------------------------------------------- #
# Layer 1 — vocabulary, no DB                                                  #
# --------------------------------------------------------------------------- #
@pytest.mark.unit
def test_artifact_request_is_a_query_category():
    """A document offered but not delivered is its own kind of ask: the answer
    is not unknown, the artifact simply has not arrived."""
    assert "artifact_request" in query_categories
    assert query_categories["artifact_request"] == "Artifact Request"


@pytest.mark.unit
def test_followup_statuses_vocabulary():
    assert set(followup_statuses) == {"draft", "sent"}


# --------------------------------------------------------------------------- #
# Fixtures                                                                     #
# --------------------------------------------------------------------------- #
@pytest.fixture
def sentinel_meeting(neo4j_connection):
    """A throwaway meeting, with every follow-up hung off it cleaned up after."""
    minutes = MeetingMinutes(title=SENTINEL_MEETING).save()
    yield minutes
    db.cypher_query(
        "MATCH (f:FollowUp) WHERE f.subject STARTS WITH $s DETACH DELETE f",
        {"s": "ZZZ-TEST"},
    )
    db.cypher_query(
        "MATCH (m:MeetingMinutes {title: $t}) DETACH DELETE m", {"t": SENTINEL_MEETING}
    )


# --------------------------------------------------------------------------- #
# Layer 3 — the create invariant                                               #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_create_follow_up_wires_the_required_anchor(sentinel_meeting):
    """The anchor edge is the whole reason this create function exists —
    neomodel cannot enforce a required RelationshipTo at save time."""
    data = create_follow_up(
        subject=SENTINEL_SUBJECT,
        meeting_minutes_id=sentinel_meeting.unique_id,
        body_markdown="Gaps: the attendee list, please.",
    )
    node = FollowUp.nodes.get(unique_id=data["unique_id"])
    assert node.follows_up_on.single().unique_id == sentinel_meeting.unique_id
    assert node.status == "draft"
    assert node.date_created is not None


@pytest.mark.integration
def test_create_stamps_a_generation_timestamp(sentinel_meeting):
    """The gap table a follow-up was written against keeps moving, so the text
    needs a moment attached to it. A date alone cannot separate two drafts
    written either side of an evidence change on the same day.

    Stored as an ISO-8601 string rather than a DateTimeProperty: neomodel
    inflates that through zoneinfo, which raises "No time zone found with key
    UTC" on Windows without the tzdata package — and this app is IIS-hosted.
    """
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    node = FollowUp.nodes.get(unique_id=data["unique_id"])
    assert node.generated_at is not None
    assert re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", node.generated_at)
    assert data["generated_at"] == node.generated_at


@pytest.mark.integration
def test_create_follow_up_rejects_unknown_status(sentinel_meeting):
    with pytest.raises(ValidationError):
        create_follow_up(
            subject=SENTINEL_SUBJECT,
            meeting_minutes_id=sentinel_meeting.unique_id,
            status="posted",
        )


@pytest.mark.integration
def test_create_follow_up_requires_a_subject(sentinel_meeting):
    with pytest.raises(ValidationError):
        create_follow_up(subject="   ", meeting_minutes_id=sentinel_meeting.unique_id)


@pytest.mark.integration
def test_create_follow_up_rejects_a_missing_meeting():
    with pytest.raises(NotFoundError):
        create_follow_up(subject=SENTINEL_SUBJECT, meeting_minutes_id="no-such-meeting")


@pytest.mark.integration
def test_a_bad_edge_leaves_no_orphan_followup(sentinel_meeting):
    """If any edge fails to wire, the node is removed rather than left anchored
    to nothing — an unanchored FollowUp is exactly the invariant being
    protected."""
    before = len(FollowUp.nodes.filter(subject=SENTINEL_SUBJECT))
    with pytest.raises(NotFoundError):
        create_follow_up(
            subject=SENTINEL_SUBJECT,
            meeting_minutes_id=sentinel_meeting.unique_id,
            addressed_to_ids=["definitely-not-a-person"],
        )
    assert len(FollowUp.nodes.filter(subject=SENTINEL_SUBJECT)) == before


# --------------------------------------------------------------------------- #
# Layer 4 — reads                                                              #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_listing_carries_the_body_and_timestamp(sentinel_meeting):
    """The listing IS the display surface — follow-ups are composed elsewhere
    and read back here, so the message has to come with it."""
    create_follow_up(subject=SENTINEL_SUBJECT,
                     meeting_minutes_id=sentinel_meeting.unique_id,
                     body_markdown="Gaps: the attendee list, please.")
    row = follow_ups_for_meeting(sentinel_meeting.unique_id)[0]
    assert "attendee list" in row["body_markdown"]
    assert row["generated_at"] is not None


@pytest.mark.integration
def test_follow_ups_for_meeting_lists_the_slices(sentinel_meeting):
    create_follow_up(subject=SENTINEL_SUBJECT + " A",
                     meeting_minutes_id=sentinel_meeting.unique_id)
    create_follow_up(subject=SENTINEL_SUBJECT + " B",
                     meeting_minutes_id=sentinel_meeting.unique_id)
    rows = follow_ups_for_meeting(sentinel_meeting.unique_id)
    assert {r["subject"] for r in rows} == {SENTINEL_SUBJECT + " A", SENTINEL_SUBJECT + " B"}


@pytest.mark.integration
def test_get_follow_up_resolves_relationships(sentinel_meeting):
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    full = get_follow_up(data["unique_id"])
    assert full["follows_up_on"]["title"] == SENTINEL_MEETING
    assert full["addressed_to"] == []
    assert full["includes_query"] == []


@pytest.mark.integration
def test_get_follow_up_raises_for_unknown_id():
    with pytest.raises(NotFoundError):
        get_follow_up("no-such-followup")


# --------------------------------------------------------------------------- #
# Layer 4 — the narrow update surface                                          #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_marking_sent_records_the_date_and_status(sentinel_meeting):
    """Sent-ness is load-bearing: an ask still open under a SENT follow-up is a
    non-response, while the same ask on a draft is an unfinished chase."""
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    sent = mark_follow_up_sent(data["unique_id"], date_sent="2026-09-02")
    assert sent["status"] == "sent"
    assert sent["date_sent"] == "2026-09-02"


@pytest.mark.integration
def test_marking_sent_rejects_a_malformed_date(sentinel_meeting):
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    with pytest.raises(ValidationError):
        mark_follow_up_sent(data["unique_id"], date_sent="02-09-2026")


@pytest.mark.integration
def test_pulling_back_to_draft_clears_the_sent_date(sentinel_meeting):
    """Leaving the date behind would keep asserting it went out."""
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    mark_follow_up_sent(data["unique_id"])
    back = set_follow_up_status(data["unique_id"], "draft")
    assert back["status"] == "draft"
    assert back["date_sent"] is None


@pytest.mark.integration
def test_update_can_restamp_when_the_body_is_recomposed(sentinel_meeting):
    """A rewritten body keeping its old timestamp would claim to describe
    evidence it never saw."""
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id,
                            body_markdown="first pass")
    updated = update_follow_up(data["unique_id"],
                               body_markdown="second pass",
                               generated_at="2026-09-03T11:00:00")
    assert updated["body_markdown"] == "second pass"
    assert updated["generated_at"] == "2026-09-03T11:00:00"


@pytest.mark.integration
def test_update_requires_something_to_change(sentinel_meeting):
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    with pytest.raises(ValidationError):
        update_follow_up(data["unique_id"])


@pytest.mark.integration
def test_update_rejects_an_unknown_follow_up():
    with pytest.raises(NotFoundError):
        update_follow_up("no-such-followup", subject="x")


# --------------------------------------------------------------------------- #
# Layer 4 — replies coming back                                                #
# --------------------------------------------------------------------------- #
@pytest.fixture
def sentinel_reply(neo4j_connection):
    """A throwaway Message and Person to stand in for an inbound reply."""
    db.cypher_query(
        """
        CREATE (m:Message {unique_id: 'zzzreplymsg', name: 'ZZZ-TEST reply',
                           type: 'e-mail'})
        CREATE (p:Person {unique_id: 'zzzreplyperson', name: 'ZZZ-TEST Sender'})
        """
    )
    yield {"message": "zzzreplymsg", "person": "zzzreplyperson"}
    db.cypher_query(
        "MATCH (n) WHERE n.unique_id IN ['zzzreplymsg','zzzreplyperson'] DETACH DELETE n"
    )


@pytest.mark.integration
def test_a_draft_with_open_asks_is_not_awaiting_a_reply(sentinel_meeting):
    """Nobody has failed to answer a message that was never sent. This is the
    distinction the sent/draft split exists for."""
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    state = replies_for_follow_up(data["unique_id"])
    assert state["status"] == "draft"
    assert state["awaiting_reply"] is False


@pytest.mark.integration
def test_linking_a_reply_records_the_sender(sentinel_meeting, sentinel_reply):
    """created_by is whoever typed it in. from_person is who wrote it, and on a
    reply those differ."""
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    mark_follow_up_sent(data["unique_id"])
    state = link_reply_to_follow_up(
        sentinel_reply["message"], data["unique_id"], sentinel_reply["person"]
    )
    assert len(state["replies"]) == 1
    assert state["replies"][0]["from_person"] == "ZZZ-TEST Sender"


@pytest.mark.integration
def test_linking_a_reply_is_idempotent(sentinel_meeting, sentinel_reply):
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    link_reply_to_follow_up(sentinel_reply["message"], data["unique_id"])
    state = link_reply_to_follow_up(sentinel_reply["message"], data["unique_id"])
    assert len(state["replies"]) == 1


@pytest.mark.integration
def test_a_sent_follow_up_with_no_reply_is_awaiting_one(sentinel_meeting):
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    mark_follow_up_sent(data["unique_id"])
    # no asks wired, so nothing is outstanding and nothing is awaited
    assert replies_for_follow_up(data["unique_id"])["awaiting_reply"] is False


@pytest.mark.integration
def test_link_reply_rejects_an_unknown_message(sentinel_meeting):
    data = create_follow_up(subject=SENTINEL_SUBJECT,
                            meeting_minutes_id=sentinel_meeting.unique_id)
    with pytest.raises(NotFoundError):
        link_reply_to_follow_up("no-such-message", data["unique_id"])


@pytest.mark.integration
def test_link_reply_rejects_an_unknown_follow_up(sentinel_reply):
    with pytest.raises(NotFoundError):
        link_reply_to_follow_up(sentinel_reply["message"], "no-such-followup")


# --------------------------------------------------------------------------- #
# Layer 4 — the gap table                                                      #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_table_is_empty_for_a_meeting_with_no_notes(sentinel_meeting):
    """Indicators discussed are derived from shared notes, so a meeting that has
    not been ingested yields nothing rather than erroring."""
    assert build_follow_up_table(sentinel_meeting.unique_id) == []


@pytest.mark.integration
def test_a_query_with_two_owners_appears_once(sentinel_meeting):
    """Two people can owe one answer. Collecting them with an OPTIONAL MATCH fans
    the query out to one row per person, which double-counts it in the ask badge
    and prints it twice in a follow-up. The owners are a pattern comprehension so
    the query stays one row carrying both names."""
    yse_id = "9999-9999-ZZZ-owners-test"
    db.cypher_query(
        """
        MATCH (m:MeetingMinutes {unique_id: $mid})
        CREATE (y:YearSuccessEvidence {unique_id: 'zzzowneryse', year_identifier: $yid})
        CREATE (si:SuccessIndicator {unique_id: 'zzzownersi', composite_key: $yid,
                                     success_indicator: 'ZZZ owners indicator'})
        CREATE (y)-[:tracks]->(si)
        CREATE (n:Note {unique_id: 'zzzownernote', name: 'ZZZ-TEST owners note'})
        CREATE (m)-[:has_note]->(n)
        CREATE (y)-[:has_note]->(n)
        CREATE (q:Query {unique_id: 'zzzownerq', question: 'Who settles this?', status: 'open'})
        CREATE (q)-[:addresses_evidence]->(y)
        CREATE (p1:Person {unique_id: 'zzzowner1', name: 'ZZZ Owner One'})
        CREATE (p2:Person {unique_id: 'zzzowner2', name: 'ZZZ Owner Two'})
        CREATE (q)-[:answerable_by]->(p1)
        CREATE (q)-[:answerable_by]->(p2)
        """,
        {"mid": sentinel_meeting.unique_id, "yid": yse_id},
    )
    try:
        rows = build_follow_up_table(sentinel_meeting.unique_id)
        row = [r for r in rows if r["composite_key"] == yse_id][0]
        assert len(row["queries"]) == 1
        assert sorted(row["queries"][0]["answerable_by"]) == ["ZZZ Owner One", "ZZZ Owner Two"]
    finally:
        db.cypher_query(
            """
            MATCH (n) WHERE n.unique_id IN
              ['zzzowneryse','zzzownersi','zzzownernote','zzzownerq','zzzowner1','zzzowner2']
            DETACH DELETE n
            """
        )


@pytest.mark.integration
def test_table_returns_one_row_per_indicator_not_per_note(sentinel_meeting):
    """An indicator discussed at length shares SEVERAL notes with the meeting.
    Without DISTINCT the row fans out once per note, which silently multiplies
    the indicator in a generated message."""
    yse_id = "9999-9999-ZZZ-followup-test"
    db.cypher_query(
        """
        MATCH (m:MeetingMinutes {unique_id: $mid})
        CREATE (y:YearSuccessEvidence {unique_id: 'zzztestyse', year_identifier: $yid})
        CREATE (si:SuccessIndicator {unique_id: 'zzztestsi', composite_key: $yid,
                                     success_indicator: 'ZZZ test indicator'})
        CREATE (y)-[:tracks]->(si)
        CREATE (n1:Note {unique_id: 'zzztestn1', name: 'ZZZ-TEST note 1'})
        CREATE (n2:Note {unique_id: 'zzztestn2', name: 'ZZZ-TEST note 2'})
        CREATE (m)-[:has_note]->(n1)
        CREATE (m)-[:has_note]->(n2)
        CREATE (y)-[:has_note]->(n1)
        CREATE (y)-[:has_note]->(n2)
        """,
        {"mid": sentinel_meeting.unique_id, "yid": yse_id},
    )
    try:
        rows = build_follow_up_table(sentinel_meeting.unique_id)
        assert len(rows) == 1
        assert rows[0]["composite_key"] == yse_id
        assert rows[0]["evidence"] == []
        assert rows[0]["queries"] == []
    finally:
        db.cypher_query(
            """
            MATCH (n) WHERE n.unique_id IN
              ['zzztestyse','zzztestsi','zzztestn1','zzztestn2'] DETACH DELETE n
            """
        )
