"""
Layers 3 to 5 for the TAAP node: create function, reads, edge writes, and the
/taaps endpoint.

The node mirrors the CSU TAAP form (template 3.2 051225). These tests check that
the composite identifier is built from asset + requesting unit + creation year,
that the required edges are wired by create_taap, that checkbox sections are
validated against their vocabularies, that signers carry role and date on the
edge, and that the outcome-versus-checklist consistency flag is derived.

Isolation: every created node carries the sentinel year prefix (9999-9999...).
The real `sfsu` Campus is reference data and is only linked to, never changed.
"""
from datetime import date

import pytest
from neomodel import db

SENTINEL = "9999-9999"

ASSET_ID = f"{SENTINEL}-test-taap-asset"
UNIT_NAME = f"{SENTINEL} Test Requesting Department"
UNIT_SLUG = f"{SENTINEL}-test-requesting-department"
OTHER_UNIT_NAME = f"{SENTINEL} Test Other Department"
SIGNER_NAME = f"{SENTINEL} Test TAAP Signer"
EXEC_NAME = f"{SENTINEL} Test TAAP Executive"
PREPARER_NAME = f"{SENTINEL} Test TAAP Preparer"
DOC_HASH = f"{SENTINEL}-test-taap-signed-copy"
YSE_IDENTIFIER = f"{SENTINEL}-8.10-pro-sfsu"
CAMPUS = "sfsu"

EXPECTED_ID = f"{ASSET_ID}--{UNIT_SLUG}--2026"

pytestmark = [pytest.mark.integration, pytest.mark.api]


@pytest.fixture
def taap_fixture(neo4j_connection, sentinel_academic_year, cleanup_yse_family):
    from app.database.graph_schema import Asset, Department, Document, Person, YearSuccessEvidence

    Asset(asset_identifier=ASSET_ID, title="Sentinel Product", scope="campus").save()
    Department(name=UNIT_NAME).save()
    Person(name=SIGNER_NAME).save()
    Person(name=EXEC_NAME).save()
    Person(name=PREPARER_NAME).save()
    Document(hash=DOC_HASH, name="Sentinel signed TAAP", raw_text="signed form text").save()
    YearSuccessEvidence(year_identifier=YSE_IDENTIFIER).save()

    yield

    db.cypher_query("MATCH (n:TAAP) WHERE n.taap_identifier STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Asset) WHERE n.asset_identifier STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:OrgUnit) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Person) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Document) WHERE n.hash STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})


def _create(**overrides):
    from app.database.queries.assets.create import create_taap

    kwargs = dict(
        title="Sentinel Product",
        asset_identifier=ASSET_ID,
        campus_abbrev=CAMPUS,
        requesting_unit=UNIT_NAME,
        creation_date="2026-09-02",
        review_due="2027-09-02",
        academic_year=SENTINEL,
        template_version="3.2 051225",
        affected_user_groups=["blindness", "low_vision", "deafness", "hard_of_hearing"],
        requirements_met=["same_information", "no_disparate_burden", "equivalent_ease_of_use"],
        outcome="non_equal_alternative",
        institutional_risk="moderate",
        accommodation_requirement="moderate",
        distribution_actions=["point_of_access", "requesting_department", "acr_repository"],
        statement_elements=["known_barriers", "impacted_groups", "disclaimer", "assistance_contact"],
        taap_status="signed",
    )
    kwargs.update(overrides)
    return create_taap(**kwargs)


# --- Layer 3: create function --------------------------------------------------------

def test_create_builds_identifier_and_required_edges(taap_fixture):
    from app.database.queries.assets.read import get_taap

    taap = _create()
    assert taap.taap_identifier == EXPECTED_ID

    detail = get_taap(EXPECTED_ID)
    assert detail["covers_asset"][0]["asset_identifier"] == ASSET_ID
    assert detail["at_campus"]["abbreviation"] == CAMPUS
    assert detail["in_year"] == SENTINEL
    assert [u["name"] for u in detail["requested_by"]] == [UNIT_NAME]
    assert detail["affected_user_groups"] == ["blindness", "low_vision", "deafness", "hard_of_hearing"]
    assert detail["requirements_met_count"] == 3
    assert detail["checklist_consistent"] is True


def test_create_rejects_duplicate_identifier(taap_fixture):
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    _create()
    with pytest.raises(ValidationError, match="already exists"):
        _create()


def test_same_asset_second_unit_is_a_second_plan(taap_fixture):
    first = _create()
    second = _create(requesting_unit=OTHER_UNIT_NAME, create_missing_unit=True)
    assert first.taap_identifier != second.taap_identifier
    assert second.taap_identifier.endswith(f"--{SENTINEL}-test-other-department--2026")
    # The missing unit was created as a Department under the campus.
    rows, _ = db.cypher_query(
        "MATCH (d:Department {name: $n})-[:operates_under_campus]->(c:Campus) RETURN c.abbreviation",
        {"n": OTHER_UNIT_NAME},
    )
    assert rows == [[CAMPUS]]


def test_create_requires_a_date_for_the_identifier(taap_fixture):
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    with pytest.raises(ValidationError, match="creation_date or effective_date"):
        _create(creation_date=None, review_due=None)


def test_create_validates_checkbox_vocabularies(taap_fixture):
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    with pytest.raises(ValidationError, match="affected_user_groups"):
        _create(affected_user_groups=["blindness", "colour_blindness"])
    with pytest.raises(ValidationError, match="outcome"):
        _create(outcome="partially")
    with pytest.raises(ValidationError, match="Unknown TAAP fields"):
        _create(legal_framework="Title II")


def test_create_rejects_unknown_requesting_unit_without_flag(taap_fixture):
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    with pytest.raises(NotFoundError):
        _create(requesting_unit=f"{SENTINEL} Nowhere Department")


def test_academic_year_derivation_follows_july_boundary():
    from app.database.queries.assets.create import _academic_year_for

    assert _academic_year_for(date(2026, 7, 29)) == "2026-2027"
    assert _academic_year_for(date(2026, 5, 12)) == "2025-2026"
    assert _academic_year_for(date(2025, 12, 5)) == "2025-2026"


# --- Layer 4: edge writes and reads --------------------------------------------------

def test_signer_carries_role_and_date_and_can_be_dated_later(taap_fixture):
    from app.database.graph_schema import Person
    from app.database.queries.assets.read import get_taap
    from app.database.queries.assets.update import assign_signer_to_taap

    _create()
    signer = Person.nodes.get(name=SIGNER_NAME)
    executive = Person.nodes.get(name=EXEC_NAME)

    assign_signer_to_taap(EXPECTED_ID, signer.unique_id, role="department_head")
    assign_signer_to_taap(EXPECTED_ID, executive.unique_id, role="division_executive", signed_date="2026-09-02")
    # Re-asserting the first signer dates the pending signature in place.
    assign_signer_to_taap(EXPECTED_ID, signer.unique_id, signed_date="2026-09-03")

    signers = {s["name"]: s for s in get_taap(EXPECTED_ID)["signed_by"]}
    assert len(signers) == 2
    assert signers[SIGNER_NAME]["role"] == "department_head"
    assert signers[SIGNER_NAME]["signed_date"] == date(2026, 9, 3)
    assert signers[EXEC_NAME]["role"] == "division_executive"


def test_signer_role_is_validated(taap_fixture):
    from app.database.graph_schema import Person
    from app.database.queries.assets.update import assign_signer_to_taap
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    _create()
    signer = Person.nodes.get(name=SIGNER_NAME)
    with pytest.raises(ValidationError, match="role"):
        assign_signer_to_taap(EXPECTED_ID, signer.unique_id, role="provost")


def test_evidence_link_carries_strength_and_control(taap_fixture):
    from app.database.queries.assets.read import get_taap
    from app.database.queries.assets.update import connect_taap_to_yse

    _create()
    connect_taap_to_yse(EXPECTED_ID, YSE_IDENTIFIER, strength=3, control="internal")
    evidence = get_taap(EXPECTED_ID)["is_evidence_for"]
    assert evidence == [{"year_identifier": YSE_IDENTIFIER, "strength": 3, "control": "internal"}]


def test_signed_copy_and_preparer(taap_fixture):
    from app.database.graph_schema import Document, Person
    from app.database.queries.assets.read import get_taap
    from app.database.queries.assets.update import assign_preparer_to_taap, attach_signed_copy_to_taap

    _create()
    doc = Document.nodes.get(hash=DOC_HASH)
    preparer = Person.nodes.get(name=PREPARER_NAME)
    attach_signed_copy_to_taap(EXPECTED_ID, doc.unique_id)
    assign_preparer_to_taap(EXPECTED_ID, preparer.unique_id)

    detail = get_taap(EXPECTED_ID)
    assert detail["signed_copy"]["unique_id"] == doc.unique_id
    assert detail["signed_copy"]["has_raw_text"] is True
    assert [p["name"] for p in detail["prepared_by"]] == [PREPARER_NAME]


def test_renewal_supersedes_and_retires_previous(taap_fixture):
    from app.database.queries.assets.read import get_taap
    from app.database.queries.assets.update import set_taap_supersedes

    _create()
    renewal = _create(creation_date="2027-09-01", review_due="2028-09-01")
    set_taap_supersedes(renewal.taap_identifier, EXPECTED_ID)

    previous = get_taap(EXPECTED_ID)
    assert previous["taap_status"] == "renewed"
    assert previous["active"] is False
    assert previous["superseded_by"] == [renewal.taap_identifier]
    assert get_taap(renewal.taap_identifier)["supersedes"] == EXPECTED_ID


def test_checklist_inconsistency_is_flagged_not_corrected(taap_fixture):
    from app.database.queries.assets.read import get_taap

    # Six requirements met but graded as partially effective: stored as written, flagged.
    _create(requirements_met=list(["same_information", "same_availability", "independent_access",
                                   "no_disparate_burden", "equivalent_ease_of_use", "privacy_protected"]),
            outcome="non_equal_alternative")
    detail = get_taap(EXPECTED_ID)
    assert detail["outcome"] == "non_equal_alternative"
    assert detail["checklist_consistent"] is False


def test_title_fallback_resolves_only_when_unambiguous(taap_fixture):
    from app.database.queries.assets.read import get_taap
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    _create()
    assert get_taap("Sentinel Product")["taap_identifier"] == EXPECTED_ID
    _create(requesting_unit=OTHER_UNIT_NAME, create_missing_unit=True)
    with pytest.raises(ValidationError, match="matches several"):
        get_taap("Sentinel Product")


def test_campus_year_listing(taap_fixture):
    from app.database.queries.assets.read import get_taaps_by_campus

    _create()
    ids = [t["taap_identifier"] for t in get_taaps_by_campus(CAMPUS, SENTINEL)]
    assert ids == [EXPECTED_ID]
    assert get_taaps_by_campus(CAMPUS, "9998-9998") == []


# --- Layer 5: endpoint ---------------------------------------------------------------

def test_endpoint_round_trip(flask_client, taap_fixture):
    from app.database.graph_schema import Person

    payload = {
        "title": "Sentinel Product",
        "asset_identifier": ASSET_ID,
        "campus_abbrev": CAMPUS,
        "requesting_unit": UNIT_NAME,
        "creation_date": "2026-09-02",
        "review_due": "2027-09-02",
        "academic_year": SENTINEL,
        "outcome": "non_equal_alternative",
        "affected_user_groups": ["blindness"],
        "requirements_met": ["same_information"],
    }
    resp = flask_client.post("/ati/data-api/v1/taaps", json=payload)
    assert resp.status_code == 201, resp.get_json()
    assert resp.get_json()["data"]["taap"]["taap_identifier"] == EXPECTED_ID

    resp = flask_client.get(f"/ati/data-api/v1/taaps/{EXPECTED_ID}")
    assert resp.status_code == 200
    assert resp.get_json()["data"]["requested_by"][0]["name"] == UNIT_NAME

    resp = flask_client.get(f"/ati/data-api/v1/taaps?campus={CAMPUS}&year={SENTINEL}")
    assert [t["taap_identifier"] for t in resp.get_json()["data"]["items"]] == [EXPECTED_ID]

    signer = Person.nodes.get(name=SIGNER_NAME)
    resp = flask_client.put("/ati/data-api/v1/taaps", json={
        "action": "assign_signer", "taap_identifier": EXPECTED_ID,
        "person_unique_id": signer.unique_id, "role": "department_head", "signed_date": "2026-09-02",
    })
    assert resp.status_code == 200, resp.get_json()

    resp = flask_client.put("/ati/data-api/v1/taaps", json={
        "action": "update", "taap_identifier": EXPECTED_ID, "taap_status": "under_review",
        "requirements_met": ["same_information", "privacy_protected"],
    })
    assert resp.status_code == 200, resp.get_json()
    assert resp.get_json()["data"]["taap"]["taap_status"] == "under_review"

    resp = flask_client.put("/ati/data-api/v1/taaps", json={
        "action": "update", "taap_identifier": EXPECTED_ID, "outcome": "not-a-grade",
    })
    assert resp.status_code == 400

    resp = flask_client.delete("/ati/data-api/v1/taaps", json={"taap_identifier": EXPECTED_ID})
    assert resp.status_code == 200
    resp = flask_client.get(f"/ati/data-api/v1/taaps/{EXPECTED_ID}")
    assert resp.status_code == 404


def test_endpoint_post_requires_campus_and_unit(flask_client, taap_fixture):
    resp = flask_client.post("/ati/data-api/v1/taaps", json={
        "title": "Sentinel Product", "asset_identifier": ASSET_ID, "creation_date": "2026-09-02",
    })
    assert resp.status_code == 400
