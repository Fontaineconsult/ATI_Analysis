"""Derived ICT stewardship behind a YSE's internal evidence.

The chain under test: internal is_evidence_for links (unset control counts as
internal) → the implementations' owners/participants → their employing
Department/College → Assets whose §508 stewardship edges land on those units
or people. External-controlled links must NOT contribute to the basis.

Isolation: every node carries the sentinel year prefix (9999-9999...).
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

PERSON_NAME = f"{SENTINEL} Test Steward Person"
PERSON_EMPLOYEE_ID = f"{SENTINEL}-emp-steward"
EXTERNAL_PERSON_NAME = f"{SENTINEL} Test External Operator"
DEPT_NAME = f"{SENTINEL} Test Steward Department"
PROCESS_TITLE = f"{SENTINEL} Test Internal Process"
EXTERNAL_PROCESS_TITLE = f"{SENTINEL} Test External Process"
ASSET_ID = f"{SENTINEL}-test-asset"
EXTERNAL_ASSET_ID = f"{SENTINEL}-external-asset"
YSE_IDENTIFIER = f"{SENTINEL}-7.99-ins-zz"

pytestmark = [pytest.mark.integration, pytest.mark.api]


@pytest.fixture
def stewardship_fixture(neo4j_connection):
    from app.database.graph_schema import Asset, Department, Person, Process, YearSuccessEvidence

    person = Person(name=PERSON_NAME, employee_id=PERSON_EMPLOYEE_ID).save()
    external_person = Person(name=EXTERNAL_PERSON_NAME, employee_id=f"{SENTINEL}-emp-ext").save()
    dept = Department(name=DEPT_NAME).save()
    dept.employs.connect(person)

    yse = YearSuccessEvidence(year_identifier=YSE_IDENTIFIER).save()

    process = Process(title=PROCESS_TITLE).save()
    process.owned_by.connect(person)
    process.is_evidence_for.connect(yse, {"control": "internal"})

    external_process = Process(title=EXTERNAL_PROCESS_TITLE).save()
    external_process.owned_by.connect(external_person)
    external_process.is_evidence_for.connect(yse, {"control": "external"})

    asset = Asset(asset_identifier=ASSET_ID, title="Sentinel Catalog", scope="campus").save()
    asset.used_by_unit.connect(dept)
    asset.maintained_by.connect(person)

    # Stewarded by the EXTERNAL process's operator — must not appear.
    external_asset = Asset(asset_identifier=EXTERNAL_ASSET_ID, title="External Platform", scope="campus").save()
    external_asset.maintained_by.connect(external_person)

    yield
    db.cypher_query("MATCH (n:Process) WHERE n.title STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Asset) WHERE n.asset_identifier STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Department) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Person) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:YearSuccessEvidence) WHERE n.year_identifier STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})


def test_derivation_units_people_and_assets(stewardship_fixture):
    from app.database.queries.assets.read import get_stewarded_ict_for_yse

    result = get_stewarded_ict_for_yse(YSE_IDENTIFIER)

    assert PERSON_NAME in result["people"]
    assert EXTERNAL_PERSON_NAME not in result["people"], \
        "external-controlled links must not contribute owners to the basis"
    assert result["units"] == [{"name": DEPT_NAME, "type": "Department"}]

    by_id = {a["asset_identifier"]: a for a in result["assets"]}
    assert ASSET_ID in by_id
    assert EXTERNAL_ASSET_ID not in by_id, \
        "assets stewarded only by the external operator must not appear"

    stewards = {s["name"]: s for s in by_id[ASSET_ID]["stewards"]}
    assert stewards[DEPT_NAME]["holder_type"] == "Department"
    assert stewards[DEPT_NAME]["capacities"] == ["used"]
    assert stewards[PERSON_NAME]["holder_type"] == "Person"
    assert stewards[PERSON_NAME]["capacities"] == ["maintained"]


def test_endpoint_serves_derivation_and_404s(flask_client, stewardship_fixture):
    resp = flask_client.get(f"/ati/data-api/v1/assets/stewarded-for-yse/{YSE_IDENTIFIER}")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert [a["asset_identifier"] for a in data["assets"]] == [ASSET_ID]

    missing = flask_client.get(f"/ati/data-api/v1/assets/stewarded-for-yse/{SENTINEL}-no-such-yse")
    assert missing.status_code == 404
