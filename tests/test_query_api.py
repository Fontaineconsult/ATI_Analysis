"""
Tests for the Query domain (pending questions raised under a WorkingGroupPlan).

All test data is scoped to the sentinel academic year 9999-9999: the test creates a
sentinel CampusPlan (which seeds the three WorkingGroupPlans) and anchors queries under
its Web plan. Cleanup is by the sentinel-prefixed plan identifiers (cleanup_plan_family)
and by the captured Query unique_ids (cleanup_queries) — never a blanket delete.
"""
import pytest

from conftest import TEST_ACADEMIC_YEAR_NAME

from neomodel import db

from app.database.graph_schema import Campus, YearSuccessEvidence
from app.database.identifiers import make_working_group_plan_identifier
from app.database.queries.committees.create import create_campus_plan
from app.database.queries.query.create import create_query
from app.database.queries.query.read import (
    get_query,
    query_panel_for_plan,
    query_panel_for_working_group,
)
from app.database.queries.query.update import (
    update_query,
    settle_query,
    attach_evidence,
    detach_evidence,
    set_query_answerable_by,
)
from app.database.queries.query.delete import delete_query
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError


pytestmark = [pytest.mark.integration]


@pytest.fixture
def cleanup_queries(neo4j_connection):
    """Detach-delete every Query (and its notes) whose unique_id the test appends to the
    yielded list. Order-independent and sentinel-safe — matches only the ids we created."""
    created_ids = []
    yield created_ids
    if created_ids:
        db.cypher_query(
            """
            MATCH (q:Query) WHERE q.unique_id IN $ids
            OPTIONAL MATCH (q)-[:has_note]->(n:Note)
            DETACH DELETE q, n
            """,
            {"ids": created_ids},
        )


@pytest.fixture
def sentinel_web_plan(sentinel_academic_year, cleanup_plan_family):
    """A sentinel CampusPlan for a real campus + 9999-9999, yielding the Web
    WorkingGroupPlan identifier to anchor queries under. cleanup_plan_family removes the
    plan family afterward."""
    campuses = Campus.nodes.all()
    if not campuses:
        pytest.skip("No Campus reference data in the graph")
    campus_abbrev = campuses[0].abbreviation

    try:
        create_campus_plan(campus_abbrev, TEST_ACADEMIC_YEAR_NAME)
    except ValidationError:
        # Left over from a previous run that failed to clean up — reuse it.
        pass

    wgp_identifier = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, campus_abbrev, "web")
    return {"campus_abbrev": campus_abbrev, "wgp_identifier": wgp_identifier}


# --- Query layer -------------------------------------------------------------------

def test_create_and_get_query(sentinel_web_plan, cleanup_queries):
    q = create_query(
        question="Should we adopt the new VPAT review workflow?",
        working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
        category="policy_decision",
        detail="Raised during planning.",
    )
    cleanup_queries.append(q.unique_id)

    data = get_query(q.unique_id)
    assert data["question"] == "Should we adopt the new VPAT review workflow?"
    assert data["category"] == "policy_decision"
    assert data["category_label"] == "Policy Decision"
    assert data["status"] == "open"
    assert data["detail"] == "Raised during planning."
    # Coordinates derived from the anchor WorkingGroupPlan.
    assert data["working_group_plan_identifier"] == sentinel_web_plan["wgp_identifier"]
    assert data["academic_year"] == TEST_ACADEMIC_YEAR_NAME
    assert data["campus_abbrev"] == sentinel_web_plan["campus_abbrev"]
    assert data["working_group"] == "Web"
    assert data["date_raised"]  # set server-side


def test_create_query_rejects_bad_category(sentinel_web_plan, cleanup_queries):
    with pytest.raises(ValidationError):
        create_query(
            question="Bad category?",
            working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
            category="not_a_real_category",
        )


def test_create_query_missing_plan_raises_not_found(cleanup_queries):
    with pytest.raises(NotFoundError):
        create_query(
            question="Anchored to nothing.",
            working_group_plan_identifier=f"{TEST_ACADEMIC_YEAR_NAME}-nope-web",
        )


def test_create_query_by_campus_year_working_group(sentinel_web_plan, cleanup_queries):
    q = create_query(
        question="Resolved via the (campus, year, working_group) triple?",
        campus_abbrev=sentinel_web_plan["campus_abbrev"],
        year_name=TEST_ACADEMIC_YEAR_NAME,
        working_group="web",
    )
    cleanup_queries.append(q.unique_id)
    data = get_query(q.unique_id)
    assert data["working_group_plan_identifier"] == sentinel_web_plan["wgp_identifier"]


def test_update_query(sentinel_web_plan, cleanup_queries):
    q = create_query(question="Update me", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_queries.append(q.unique_id)

    updated = update_query(q.unique_id, category="resource_request", status="in_progress",
                           detail="now with detail")
    assert updated["category"] == "resource_request"
    assert updated["status"] == "in_progress"
    assert updated["detail"] == "now with detail"
    # Omitted fields untouched.
    assert updated["question"] == "Update me"


def test_settle_query(sentinel_web_plan, cleanup_queries):
    q = create_query(question="Settle me", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_queries.append(q.unique_id)

    settled = settle_query(q.unique_id, "Yes — approved by the committee.")
    assert settled["status"] == "settled"
    assert settled["answer"] == "Yes — approved by the committee."
    assert settled["date_settled"]


def test_attach_and_detach_evidence(sentinel_web_plan, cleanup_queries, cleanup_yse_family):
    # A minimal sentinel YSE — enough to attach by year_identifier.
    yse_id = f"{TEST_ACADEMIC_YEAR_NAME}-test.attach-web-{sentinel_web_plan['campus_abbrev']}"
    YearSuccessEvidence(year_identifier=yse_id).save()

    q = create_query(question="Bears on evidence", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_queries.append(q.unique_id)

    after_attach = attach_evidence(q.unique_id, yse_id)
    assert any(e["year_identifier"] == yse_id for e in after_attach["addresses_evidence"])

    after_detach = detach_evidence(q.unique_id, yse_id)
    assert all(e["year_identifier"] != yse_id for e in after_detach["addresses_evidence"])


def _sentinel_person(name):
    """A throwaway Person for owner-assignment tests."""
    from app.database.graph_schema import Person
    person = Person.nodes.get_or_none(name=name)
    if person is None:
        person = Person(name=name, active=True, can_approve_yse=False,
                        non_committee_member_active=False).save()
    return person


def test_answerable_by_is_empty_until_someone_is_named(sentinel_web_plan, cleanup_queries):
    """A question with no named owner is the default, and the read has to say so
    rather than omitting the key — the follow-up groups by this field."""
    q = create_query(question="Who owns timely adoption?",
                     working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_queries.append(q.unique_id)
    assert get_query(q.unique_id)["answerable_by"] == []


def test_create_query_can_name_who_owes_the_answer(sentinel_web_plan, cleanup_queries):
    person = _sentinel_person("ZZZ-TEST Answerer")
    try:
        q = create_query(question="Did the series run again?",
                         working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
                         answerable_by_unique_ids=[person.unique_id])
        cleanup_queries.append(q.unique_id)
        names = [p["name"] for p in get_query(q.unique_id)["answerable_by"]]
        assert names == ["ZZZ-TEST Answerer"]
    finally:
        person.delete()


def test_set_answerable_by_replaces_the_whole_set(sentinel_web_plan, cleanup_queries):
    """Replace semantics, not append: reassigning an owner must not leave the
    previous one still on the hook."""
    first = _sentinel_person("ZZZ-TEST Owner One")
    second = _sentinel_person("ZZZ-TEST Owner Two")
    try:
        q = create_query(question="Who enforces the policy?",
                         working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
                         answerable_by_unique_ids=[first.unique_id])
        cleanup_queries.append(q.unique_id)

        data = set_query_answerable_by(q.unique_id, [second.unique_id])
        assert [p["name"] for p in data["answerable_by"]] == ["ZZZ-TEST Owner Two"]
    finally:
        first.delete()
        second.delete()


def test_set_answerable_by_can_clear_a_wrong_assignment(sentinel_web_plan, cleanup_queries):
    """An owner assigned from a mis-read transcript has to be removable without
    deleting the question."""
    person = _sentinel_person("ZZZ-TEST Mistaken Owner")
    try:
        q = create_query(question="Who owns this?",
                         working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
                         answerable_by_unique_ids=[person.unique_id])
        cleanup_queries.append(q.unique_id)
        assert set_query_answerable_by(q.unique_id, [])["answerable_by"] == []
    finally:
        person.delete()


def test_answerable_by_is_distinct_from_raised_by(sentinel_web_plan, cleanup_queries):
    """Who asked and who owes the answer are different people and different edges;
    conflating them would send every chase back to the person who raised it."""
    asker = _sentinel_person("ZZZ-TEST Asker")
    owner = _sentinel_person("ZZZ-TEST Owner")
    try:
        q = create_query(question="Has the policy been adopted?",
                         working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
                         raised_by_unique_id=asker.unique_id,
                         answerable_by_unique_ids=[owner.unique_id])
        cleanup_queries.append(q.unique_id)
        data = get_query(q.unique_id)
        assert data["raised_by"]["name"] == "ZZZ-TEST Asker"
        assert [p["name"] for p in data["answerable_by"]] == ["ZZZ-TEST Owner"]
    finally:
        asker.delete()
        owner.delete()


def test_set_answerable_by_rejects_an_unknown_person(sentinel_web_plan, cleanup_queries):
    q = create_query(question="Who owns this?",
                     working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_queries.append(q.unique_id)
    with pytest.raises(NotFoundError):
        set_query_answerable_by(q.unique_id, ["definitely-not-a-person"])


def test_panel_for_plan_lists_queries(sentinel_web_plan, cleanup_queries):
    q = create_query(question="Panel visible", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_queries.append(q.unique_id)

    panel = query_panel_for_plan(sentinel_web_plan["wgp_identifier"])
    assert panel["exists"] is True
    assert panel["working_group"] == "Web"
    assert any(item["unique_id"] == q.unique_id for item in panel["queries"])
    assert "candidate_evidence" in panel


def test_panel_for_working_group_missing_plan_is_empty():
    # A campus+year with no campus plan -> exists False, not an error.
    panel = query_panel_for_working_group("zzz-nocampus", TEST_ACADEMIC_YEAR_NAME, "web")
    assert panel["exists"] is False
    assert panel["queries"] == []


def test_delete_query(sentinel_web_plan, cleanup_queries):
    q = create_query(question="Delete me", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    uid = q.unique_id
    cleanup_queries.append(uid)  # harmless if already deleted

    assert delete_query(uid) is True
    with pytest.raises(NotFoundError):
        get_query(uid)


# --- Endpoint layer ----------------------------------------------------------------

@pytest.mark.api
def test_endpoint_create_list_settle_delete(flask_client, sentinel_web_plan, cleanup_queries):
    base = "/ati/data-api/v1/queries"

    # Create
    resp = flask_client.post(base, json={
        "action": "create_query",
        "question": "Endpoint-created question",
        "working_group_plan_identifier": sentinel_web_plan["wgp_identifier"],
        "category": "information_gap",
    })
    assert resp.status_code == 201, resp.get_json()
    uid = resp.get_json()["data"]["unique_id"]
    cleanup_queries.append(uid)

    # List via panel-for-plan
    resp = flask_client.get(f"{base}/plan/{sentinel_web_plan['wgp_identifier']}")
    assert resp.status_code == 200
    panel = resp.get_json()["data"]
    assert any(item["unique_id"] == uid for item in panel["queries"])

    # Settle
    resp = flask_client.put(base, json={
        "action": "settle_query", "unique_id": uid, "answer": "Closed out.",
    })
    assert resp.status_code == 200
    assert resp.get_json()["data"]["status"] == "settled"

    # Delete
    resp = flask_client.delete(f"{base}/{uid}")
    assert resp.status_code == 200

    # Confirm gone
    resp = flask_client.get(f"{base}/item/{uid}")
    assert resp.status_code == 404
