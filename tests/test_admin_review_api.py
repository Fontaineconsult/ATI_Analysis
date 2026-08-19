"""
Administrative review — approver-flag enforcement on assign_approver.

The bug: Person.can_approve_yse was collected in Settings but never checked —
any person could complete a review. Enforcement lives in
assign_approver_to_yse (AuthorizationError) so every caller (endpoint, MCP,
script) funnels through it; the endpoint maps it to 403.

Isolation: people + the bare YSE carry the sentinel year prefix (9999-9999...)
in their unique keys; cleanup deletes exactly that prefix. The bare YSE is
create-function-free on purpose — approval only touches the node itself.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

APPROVER_NAME = f"{SENTINEL} Test Approver"
APPROVER_EMPLOYEE_ID = f"{SENTINEL}-emp-approver"
NON_APPROVER_NAME = f"{SENTINEL} Test Non-Approver"
NON_APPROVER_EMPLOYEE_ID = f"{SENTINEL}-emp-non-approver"
YSE_IDENTIFIER = f"{SENTINEL}-7.11-ins-zz"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1/evidence"


@pytest.fixture
def review_fixture(neo4j_connection, sentinel_academic_year):
    from app.database.graph_schema import Person, YearSuccessEvidence

    approver = Person(
        name=APPROVER_NAME, employee_id=APPROVER_EMPLOYEE_ID, can_approve_yse=True
    ).save()
    non_approver = Person(
        name=NON_APPROVER_NAME, employee_id=NON_APPROVER_EMPLOYEE_ID, can_approve_yse=False
    ).save()
    yse = YearSuccessEvidence(year_identifier=YSE_IDENTIFIER).save()
    # Concern → Plan conversion reads the academic year off the YSE, so the
    # sentinel year has to be wired even though approval itself never uses it.
    yse.academic_year.connect(sentinel_academic_year)
    yield approver, non_approver, yse
    # Plans spawned by concern conversion — matched by the sentinel-prefixed
    # description the tests write, so production plans can never be caught.
    db.cypher_query(
        "MATCH (p:Plan) WHERE p.description STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (e:YearSuccessEvidence)-[:has_concern]->(c:Concern) "
        "WHERE e.year_identifier STARTS WITH $prefix DETACH DELETE c",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (e:YearSuccessEvidence)-[:has_recommendation]->(r:Recommendation) "
        "WHERE e.year_identifier STARTS WITH $prefix DETACH DELETE r",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (e:YearSuccessEvidence) WHERE e.year_identifier STARTS WITH $prefix DETACH DELETE e",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


def _yse_state():
    rows, _ = db.cypher_query(
        "MATCH (e:YearSuccessEvidence {year_identifier: $yid}) "
        "OPTIONAL MATCH (e)-[:admin_review_completed_by]->(p:Person) "
        "RETURN e.administrative_review_complete, e.administrative_review_completed_date, "
        "       collect(p.employee_id)",
        {"yid": YSE_IDENTIFIER},
    )
    return rows[0]


def test_non_approver_is_rejected_with_403(flask_client, review_fixture):
    resp = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": NON_APPROVER_EMPLOYEE_ID,
    })
    assert resp.status_code == 403
    assert "can_approve_yse" in resp.get_json()["error"]

    complete, completed_date, approvers = _yse_state()
    assert complete is False, "a rejected approval must not touch the node"
    assert completed_date is None
    assert approvers == []


def test_approver_completes_the_review(flask_client, review_fixture):
    resp = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert resp.status_code == 200

    complete, completed_date, approvers = _yse_state()
    assert complete is True
    assert completed_date is not None
    assert approvers == [APPROVER_EMPLOYEE_ID]


def test_query_function_raises_authorization_error(review_fixture):
    from app.database.queries.evidence.update import assign_approver_to_yse
    from app.endpoints.data_api.errors.custom_exceptions import AuthorizationError

    with pytest.raises(AuthorizationError):
        assign_approver_to_yse(YSE_IDENTIFIER, NON_APPROVER_EMPLOYEE_ID)


# --- Step one: ready_for_admin_review -----------------------------------------

def _ready_state():
    rows, _ = db.cypher_query(
        "MATCH (e:YearSuccessEvidence {year_identifier: $yid}) RETURN e.ready_for_admin_review",
        {"yid": YSE_IDENTIFIER},
    )
    return rows[0][0]


def test_ready_for_review_round_trip(flask_client, review_fixture):
    # Mark ready.
    marked = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": True,
    })
    assert marked.status_code == 200
    assert _ready_state() is True

    # Withdraw the mark (pre-approval state is reversible).
    withdrawn = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": False,
    })
    assert withdrawn.status_code == 200
    assert _ready_state() is False


def test_ready_then_approve_leaves_both_states(flask_client, review_fixture):
    flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": True,
    })
    approved = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert approved.status_code == 200

    complete, _date, approvers = _yse_state()
    assert complete is True
    assert approvers == [APPROVER_EMPLOYEE_ID]
    # Approval leaves the ready flag untouched (display gives Approved precedence).
    assert _ready_state() is True


def test_ready_error_mapping(flask_client, review_fixture):
    missing_flag = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
    })
    assert missing_flag.status_code == 400

    non_boolean = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": "yes",
    })
    assert non_boolean.status_code == 400

    missing_yse = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": f"{SENTINEL}-no-such-yse",
        "ready": True,
    })
    assert missing_yse.status_code == 404


# --- Re-approve idempotence + withdraw ----------------------------------------

def test_reapprove_is_idempotent(flask_client, review_fixture):
    for _ in range(2):
        resp = flask_client.put(API, json={
            "action": "assign_approver",
            "year_success_evidence": YSE_IDENTIFIER,
            "employee_id": APPROVER_EMPLOYEE_ID,
        })
        assert resp.status_code == 200

    complete, _date, approvers = _yse_state()
    assert complete is True
    assert approvers == [APPROVER_EMPLOYEE_ID], "re-approve must not duplicate the edge"


def test_second_approver_does_not_rewire(flask_client, review_fixture):
    from app.database.graph_schema import Person

    second = Person(
        name=f"{SENTINEL} Test Second Approver",
        employee_id=f"{SENTINEL}-emp-approver-2",
        can_approve_yse=True,
    ).save()

    flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    resp = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": second.employee_id,
    })
    assert resp.status_code == 200

    _complete, _date, approvers = _yse_state()
    assert approvers == [APPROVER_EMPLOYEE_ID], "first completion wins; no silent rewire"


def test_withdraw_approval_round_trip(flask_client, review_fixture):
    flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": True,
    })

    withdrawn = flask_client.put(API, json={
        "action": "withdraw_approval",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert withdrawn.status_code == 200

    complete, completed_date, approvers = _yse_state()
    assert complete is False
    assert completed_date is None
    assert approvers == []
    assert _ready_state() is True, "withdraw returns the evidence to ready-awaiting-approval"

    # Idempotent: withdrawing an incomplete review is a no-op.
    again = flask_client.put(API, json={
        "action": "withdraw_approval",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert again.status_code == 200


def test_withdraw_requires_approver_flag(flask_client, review_fixture):
    flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    resp = flask_client.put(API, json={
        "action": "withdraw_approval",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": NON_APPROVER_EMPLOYEE_ID,
    })
    assert resp.status_code == 403

    complete, _date, approvers = _yse_state()
    assert complete is True, "a rejected withdrawal must not touch the record"
    assert approvers == [APPROVER_EMPLOYEE_ID]


# --- Recommendations: end-of-cycle improvement tracking ------------------------

def test_recommendation_lifecycle_round_trip(flask_client, review_fixture):
    approver, _non, _yse = review_fixture

    created = flask_client.post(API, json={
        "action": "add_recommendation",
        "year_success_evidence": YSE_IDENTIFIER,
        "recommendation": "Document the intake triage routing",
        "detail": "The four-outcome rule exists as practice; write it down and start counting requests.",
        "created_by_employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert created.status_code == 201, created.get_json()
    rec = created.get_json()["data"]
    assert rec["status"] == "open"
    assert rec["date_created"] is not None
    assert rec["date_resolved"] is None

    # Wired to the YSE + creator.
    rows, _ = db.cypher_query(
        "MATCH (:YearSuccessEvidence {year_identifier: $yid})-[:has_recommendation]->"
        "(r:Recommendation {unique_id: $uid})-[:created_by]->(p:Person) RETURN p.employee_id",
        {"yid": YSE_IDENTIFIER, "uid": rec["unique_id"]},
    )
    assert rows and rows[0][0] == APPROVER_EMPLOYEE_ID

    # Address it: resolution + stamped date.
    addressed = flask_client.put(API, json={
        "action": "update_recommendation",
        "unique_id": rec["unique_id"],
        "status": "addressed",
        "resolution": "Triage procedure documented and Springshare tagging enabled.",
    })
    assert addressed.status_code == 200
    body = addressed.get_json()["data"]
    assert body["status"] == "addressed"
    assert body["date_resolved"] is not None
    assert "Springshare" in body["resolution"]

    # Reopen clears the resolved date; the record survives (no delete path).
    reopened = flask_client.put(API, json={
        "action": "update_recommendation",
        "unique_id": rec["unique_id"],
        "status": "open",
    })
    assert reopened.status_code == 200
    assert reopened.get_json()["data"]["date_resolved"] is None


def test_recommendation_error_mapping(flask_client, review_fixture):
    missing = flask_client.post(API, json={
        "action": "add_recommendation",
        "year_success_evidence": YSE_IDENTIFIER,
    })
    assert missing.status_code == 400

    bad_yse = flask_client.post(API, json={
        "action": "add_recommendation",
        "year_success_evidence": f"{SENTINEL}-no-such",
        "recommendation": "x",
    })
    assert bad_yse.status_code == 404

    bad_status = flask_client.put(API, json={
        "action": "update_recommendation",
        "unique_id": "no-such",
        "status": "deferred",
    })
    assert bad_status.status_code == 400

    missing_rec = flask_client.put(API, json={
        "action": "update_recommendation",
        "unique_id": "no-such",
        "status": "addressed",
    })
    assert missing_rec.status_code == 404


# --- Concerns: issues with no resolution path, and their conversions ----------

def test_concern_lifecycle_round_trip(flask_client, review_fixture):
    """Raise a concern, dismiss it, reopen it. Concerns are records — no delete."""
    created = flask_client.post(API, json={
        "action": "add_concern",
        "year_success_evidence": YSE_IDENTIFIER,
        "concern": "Nobody owns the alternate-format turnaround target",
        "detail": "Raised in review; no candidate owner named.",
        "raised_by_employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert created.status_code == 201
    con = created.get_json()["data"]
    assert con["status"] == "open"
    assert con["date_raised"] is not None
    assert con["date_resolved"] is None

    # Wired to the YSE + the person who raised it.
    rows, _ = db.cypher_query(
        "MATCH (:YearSuccessEvidence {year_identifier: $yid})-[:has_concern]->"
        "(c:Concern {unique_id: $uid})-[:raised_by]->(p:Person) RETURN p.employee_id",
        {"yid": YSE_IDENTIFIER, "uid": con["unique_id"]},
    )
    assert rows and rows[0][0] == APPROVER_EMPLOYEE_ID

    dismissed = flask_client.put(API, json={
        "action": "update_concern",
        "unique_id": con["unique_id"],
        "status": "dismissed",
        "resolution": "Duplicate of the turnaround metric already tracked.",
    })
    assert dismissed.status_code == 200
    body = dismissed.get_json()["data"]
    assert body["status"] == "dismissed"
    assert body["date_resolved"] is not None

    reopened = flask_client.put(API, json={
        "action": "update_concern",
        "unique_id": con["unique_id"],
        "status": "open",
    })
    assert reopened.status_code == 200
    assert reopened.get_json()["data"]["date_resolved"] is None


def test_concern_converts_to_recommendation(flask_client, review_fixture):
    """Promotion creates the Recommendation, keeps the Concern, wires provenance."""
    con = flask_client.post(API, json={
        "action": "add_concern",
        "year_success_evidence": YSE_IDENTIFIER,
        "concern": "LMS role for alt-media staff is undefined",
        "raised_by_employee_id": APPROVER_EMPLOYEE_ID,
    }).get_json()["data"]

    converted = flask_client.put(API, json={
        "action": "convert_concern_to_recommendation",
        "unique_id": con["unique_id"],
        "created_by_employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert converted.status_code == 200
    payload = converted.get_json()["data"]

    # Concern closed as converted; recommendation inherits its text by default.
    assert payload["concern"]["status"] == "converted"
    assert payload["concern"]["date_resolved"] is not None
    assert payload["recommendation"]["recommendation"] == "LMS role for alt-media staff is undefined"
    assert payload["recommendation"]["status"] == "open"

    # Provenance edge exists, and the recommendation hangs off the same YSE.
    rows, _ = db.cypher_query(
        "MATCH (c:Concern {unique_id: $cid})-[:became_recommendation]->(r:Recommendation) "
        "MATCH (:YearSuccessEvidence {year_identifier: $yid})-[:has_recommendation]->(r) "
        "RETURN r.unique_id",
        {"cid": con["unique_id"], "yid": YSE_IDENTIFIER},
    )
    assert rows and rows[0][0] == payload["recommendation"]["unique_id"]

    # Converting twice is refused — reopen first.
    again = flask_client.put(API, json={
        "action": "convert_concern_to_recommendation",
        "unique_id": con["unique_id"],
    })
    assert again.status_code == 400


def test_concern_converts_to_plan(flask_client, review_fixture):
    """Promotion creates the Plan in the YSE's academic year and wires became_plan."""
    plan_description = f"{SENTINEL} define and publish the alt-media turnaround target"
    con = flask_client.post(API, json={
        "action": "add_concern",
        "year_success_evidence": YSE_IDENTIFIER,
        "concern": "No published turnaround target",
        "raised_by_employee_id": APPROVER_EMPLOYEE_ID,
    }).get_json()["data"]

    converted = flask_client.put(API, json={
        "action": "convert_concern_to_plan",
        "unique_id": con["unique_id"],
        "name": f"{SENTINEL} Turnaround target",
        "description": plan_description,
    })
    assert converted.status_code == 200
    payload = converted.get_json()["data"]
    assert payload["concern"]["status"] == "converted"
    assert payload["plan"]["description"] == plan_description

    # Plan furthers the YSE, sits in its academic year, and carries provenance.
    rows, _ = db.cypher_query(
        "MATCH (c:Concern {unique_id: $cid})-[:became_plan]->(p:Plan) "
        "MATCH (p)-[:furthers_yse]->(:YearSuccessEvidence {year_identifier: $yid}) "
        "MATCH (p)-[:in_academic_year]->(a:AcademicYear) "
        "RETURN a.name",
        {"cid": con["unique_id"], "yid": YSE_IDENTIFIER},
    )
    assert rows and rows[0][0] == SENTINEL


def test_concern_error_mapping(flask_client, review_fixture):
    missing = flask_client.post(API, json={
        "action": "add_concern",
        "year_success_evidence": YSE_IDENTIFIER,
    })
    assert missing.status_code == 400

    bad_yse = flask_client.post(API, json={
        "action": "add_concern",
        "year_success_evidence": f"{SENTINEL}-no-such",
        "concern": "x",
    })
    assert bad_yse.status_code == 404

    bad_status = flask_client.put(API, json={
        "action": "update_concern",
        "unique_id": "no-such",
        "status": "addressed",   # a recommendation status, not a concern one
    })
    assert bad_status.status_code == 400

    missing_con = flask_client.put(API, json={
        "action": "update_concern",
        "unique_id": "no-such",
        "status": "dismissed",
    })
    assert missing_con.status_code == 404

    plan_needs_name = flask_client.put(API, json={
        "action": "convert_concern_to_plan",
        "unique_id": "no-such",
    })
    assert plan_needs_name.status_code == 400
