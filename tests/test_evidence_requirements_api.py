"""
EvidenceRequirement CRUD — the companion bar broken into addressable pieces.

Isolation note: unlike the plan/YSE suites, these can't hang off the sentinel academic
year — EvidenceRequirement attaches to a real SuccessIndicator (shared reference data)
and carries no year at all. So `cleanup_evidence_requirements` tracks the unique_ids the
test actually created and deletes exactly those. A prefix sweep would be wrong here: the
seeded requirements live on the same indicators, and there is no year to filter on.
"""
import pytest
from neomodel import db

from app.database.identifiers import make_evidence_requirement_handle

# A real, stable indicator. Reused, never modified — the test only adds and removes its
# own requirement nodes, and asserts the seeded ones are untouched at the end.
TEST_COMPOSITE_KEY = "4.6-pro"

INDICATORS_URL = "/ati/data-api/v1/indicators"


@pytest.fixture
def cleanup_evidence_requirements(neo4j_connection):
    """Delete only the EvidenceRequirement nodes a test created."""
    created = []
    yield created
    if created:
        db.cypher_query(
            "MATCH (er:EvidenceRequirement) WHERE er.unique_id IN $uids DETACH DELETE er",
            {"uids": created},
        )


def _add(client, created, **overrides):
    """POST one requirement, register it for cleanup, return the response."""
    payload = {
        "action": "add_evidence_requirement",
        "composite_key": TEST_COMPOSITE_KEY,
        "level": "established",
        "requirement": "Test requirement.",
    }
    payload.update(overrides)
    response = client.post(INDICATORS_URL, json=payload)
    if response.status_code == 201:
        created.append(response.get_json()["data"]["unique_id"])
    return response


# --- Layer 1: identifier helper (no DB) -------------------------------------------------

@pytest.mark.unit
def test_handle_format_is_namespaced_and_sequenced():
    assert make_evidence_requirement_handle("4.6-pro", "established", 4) == \
        "evidence:4.6-pro:established:4"


@pytest.mark.unit
def test_handle_distinguishes_level_and_seq():
    """The handle must separate every coordinate — two requirements differing only by
    level or only by seq cannot collapse onto the same handle."""
    handles = {
        make_evidence_requirement_handle("4.6-pro", "established", 1),
        make_evidence_requirement_handle("4.6-pro", "managed", 1),
        make_evidence_requirement_handle("4.6-pro", "established", 2),
        make_evidence_requirement_handle("4.5-ins", "established", 1),
    }
    assert len(handles) == 4


# --- Layer 5: API ------------------------------------------------------------------------

@pytest.mark.integration
@pytest.mark.api
def test_add_requirement_attaches_to_indicator(flask_client, cleanup_evidence_requirements):
    response = _add(flask_client, cleanup_evidence_requirements, element="Output",
                    requirement="Records are centrally logged.")
    assert response.status_code == 201

    data = response.get_json()["data"]
    assert data["composite_key"] == TEST_COMPOSITE_KEY
    assert data["level"] == "established"
    assert data["element"] == "Output"
    assert data["requirement"] == "Records are centrally logged."
    assert data["handle"].startswith(f"evidence:{TEST_COMPOSITE_KEY}:established:")

    # The required edge is the whole reason add_evidence_requirement exists — a node
    # without it is an orphan the schema can't reject.
    rows, _ = db.cypher_query(
        "MATCH (si:SuccessIndicator {composite_key: $ck})"
        "-[:has_evidence_requirement]->(er:EvidenceRequirement {unique_id: $uid}) "
        "RETURN count(*)",
        {"ck": TEST_COMPOSITE_KEY, "uid": data["unique_id"]},
    )
    assert rows[0][0] == 1


@pytest.mark.integration
@pytest.mark.api
def test_rubric_dimension_derives_from_element(flask_client, cleanup_evidence_requirements):
    for element, expected in (
        ("Position", "resources"),
        ("Budget", "resources"),
        ("Procedures", "procedures"),
        ("Output", "documentation_evidence"),
    ):
        response = _add(flask_client, cleanup_evidence_requirements, element=element)
        assert response.status_code == 201
        assert response.get_json()["data"]["rubric_dimension"] == expected


@pytest.mark.integration
@pytest.mark.api
def test_unlabelled_requirement_is_allowed(flask_client, cleanup_evidence_requirements):
    """Eight indicators state their bar as unlabelled prose. An unlabelled requirement
    is a legitimate record, not a validation failure."""
    response = _add(flask_client, cleanup_evidence_requirements, element=None)
    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["element"] is None
    assert data["rubric_dimension"] is None


@pytest.mark.integration
@pytest.mark.api
def test_seq_increments_within_level(flask_client, cleanup_evidence_requirements):
    first = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]
    second = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]
    assert second["seq"] == first["seq"] + 1
    assert first["handle"] != second["handle"]


@pytest.mark.integration
@pytest.mark.api
def test_seq_is_tracked_per_level(flask_client, cleanup_evidence_requirements):
    """Levels number independently — managed:1 and established:1 coexist."""
    managed = _add(flask_client, cleanup_evidence_requirements, level="managed",
                   element="Metrics").get_json()["data"]
    assert managed["level"] == "managed"
    assert managed["handle"] == make_evidence_requirement_handle(
        TEST_COMPOSITE_KEY, "managed", managed["seq"]
    )


@pytest.mark.integration
@pytest.mark.api
def test_delete_does_not_renumber_survivors(flask_client, cleanup_evidence_requirements):
    """Renumbering on delete would rewrite the handles of surviving rows, breaking any
    satisfies-array already pointing at them."""
    first = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]
    second = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]

    assert flask_client.delete(INDICATORS_URL, json={
        "action": "delete_evidence_requirement", "unique_id": first["unique_id"],
    }).status_code == 200

    rows, _ = db.cypher_query(
        "MATCH (er:EvidenceRequirement {unique_id: $uid}) RETURN er.seq, er.handle",
        {"uid": second["unique_id"]},
    )
    assert rows[0][0] == second["seq"]
    assert rows[0][1] == second["handle"]


@pytest.mark.integration
@pytest.mark.api
def test_update_text_preserves_element(flask_client, cleanup_evidence_requirements):
    """Partial-update semantics: editing text must not clear the element."""
    created = _add(flask_client, cleanup_evidence_requirements,
                   element="Procedures").get_json()["data"]

    response = flask_client.put(INDICATORS_URL, json={
        "action": "update_evidence_requirement",
        "unique_id": created["unique_id"],
        "requirement": "Edited requirement text.",
    })
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["requirement"] == "Edited requirement text."
    assert data["element"] == "Procedures"
    assert data["rubric_dimension"] == "procedures"


@pytest.mark.integration
@pytest.mark.api
def test_changing_element_moves_rubric_dimension(flask_client, cleanup_evidence_requirements):
    """A stale dimension after an element change would misfile the requirement in every
    rubric roll-up, so the two move together."""
    created = _add(flask_client, cleanup_evidence_requirements,
                   element="Output").get_json()["data"]
    assert created["rubric_dimension"] == "documentation_evidence"

    response = flask_client.put(INDICATORS_URL, json={
        "action": "update_evidence_requirement",
        "unique_id": created["unique_id"],
        "element": "Budget",
    })
    assert response.status_code == 200
    assert response.get_json()["data"]["rubric_dimension"] == "resources"


@pytest.mark.integration
@pytest.mark.api
def test_clearing_element_unlabels_the_requirement(flask_client, cleanup_evidence_requirements):
    created = _add(flask_client, cleanup_evidence_requirements,
                   element="Position").get_json()["data"]

    response = flask_client.put(INDICATORS_URL, json={
        "action": "update_evidence_requirement",
        "unique_id": created["unique_id"],
        "element": None,
    })
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["element"] is None
    assert data["rubric_dimension"] is None


@pytest.mark.integration
@pytest.mark.api
def test_identity_fields_are_not_editable(flask_client, cleanup_evidence_requirements):
    """handle / composite_key / level / seq are identity. An update that tried to move
    them would leave a handle that lies about where the requirement sits."""
    created = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]

    flask_client.put(INDICATORS_URL, json={
        "action": "update_evidence_requirement",
        "unique_id": created["unique_id"],
        "level": "optimizing",
        "composite_key": "9.9-zzz",
        "seq": 99,
        "requirement": "Still here.",
    })

    rows, _ = db.cypher_query(
        "MATCH (er:EvidenceRequirement {unique_id: $uid}) "
        "RETURN er.level, er.composite_key, er.seq, er.handle",
        {"uid": created["unique_id"]},
    )
    assert rows[0][0] == created["level"]
    assert rows[0][1] == created["composite_key"]
    assert rows[0][2] == created["seq"]
    assert rows[0][3] == created["handle"]


@pytest.mark.integration
@pytest.mark.api
@pytest.mark.parametrize("payload,expected", [
    ({"requirement": "   "}, 400),
    ({"level": "nonexistent"}, 400),
    ({"element": "Vibes"}, 400),
    ({"composite_key": "99.9-zzz"}, 404),
])
def test_add_rejects_bad_input(flask_client, cleanup_evidence_requirements, payload, expected):
    assert _add(flask_client, cleanup_evidence_requirements, **payload).status_code == expected


@pytest.mark.integration
@pytest.mark.api
def test_update_rejects_blank_requirement(flask_client, cleanup_evidence_requirements):
    created = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]
    response = flask_client.put(INDICATORS_URL, json={
        "action": "update_evidence_requirement",
        "unique_id": created["unique_id"],
        "requirement": "   ",
    })
    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.api
def test_missing_node_returns_404(flask_client):
    for call in (
        lambda: flask_client.put(INDICATORS_URL, json={
            "action": "update_evidence_requirement",
            "unique_id": "does-not-exist", "requirement": "x"}),
        lambda: flask_client.delete(INDICATORS_URL, json={
            "action": "delete_evidence_requirement", "unique_id": "does-not-exist"}),
    ):
        assert call().status_code == 404


@pytest.mark.integration
@pytest.mark.api
def test_delete_removes_the_node(flask_client, cleanup_evidence_requirements):
    created = _add(flask_client, cleanup_evidence_requirements).get_json()["data"]

    assert flask_client.delete(INDICATORS_URL, json={
        "action": "delete_evidence_requirement", "unique_id": created["unique_id"],
    }).status_code == 200

    rows, _ = db.cypher_query(
        "MATCH (er:EvidenceRequirement {unique_id: $uid}) RETURN count(er)",
        {"uid": created["unique_id"]},
    )
    assert rows[0][0] == 0


@pytest.mark.integration
@pytest.mark.api
def test_unknown_action_is_rejected(flask_client):
    assert flask_client.delete(
        INDICATORS_URL, json={"action": "drop_everything"}
    ).status_code == 400


@pytest.mark.integration
@pytest.mark.api
def test_read_projection_exposes_requirements(flask_client, cleanup_evidence_requirements):
    """The settings page lists requirements from the indicators payload, so they have to
    ride along with the indicator rather than needing a second call."""
    created = _add(flask_client, cleanup_evidence_requirements,
                   requirement="Projection probe.").get_json()["data"]

    response = flask_client.get("/ati/data-api/v1/indicators/2026-2027")
    assert response.status_code == 200

    match = None
    for category in response.get_json()["data"]:
        for goal in category.get("goals", []):
            for si in goal.get("successIndicators", []):
                if si.get("composite_key") == TEST_COMPOSITE_KEY:
                    match = si
    assert match is not None, f"{TEST_COMPOSITE_KEY} missing from the payload"

    requirements = match.get("evidenceRequirements") or []
    assert any(r["unique_id"] == created["unique_id"] for r in requirements)
    # Ordered by level then seq, so the UI can group without re-sorting server data.
    assert [r["seq"] for r in requirements if r["level"] == "established"] == \
        sorted(r["seq"] for r in requirements if r["level"] == "established")


@pytest.mark.integration
@pytest.mark.api
def test_seeded_requirements_are_untouched(flask_client):
    """Guard on the shared reference data: the suite adds and removes its own nodes and
    must leave the seeded companion bars exactly as they were."""
    rows, _ = db.cypher_query(
        "MATCH (:SuccessIndicator)-[:has_evidence_requirement]->(er:EvidenceRequirement) "
        "RETURN count(DISTINCT er)"
    )
    assert rows[0][0] >= 253

    orphans, _ = db.cypher_query(
        "MATCH (er:EvidenceRequirement) "
        "WHERE NOT (:SuccessIndicator)-[:has_evidence_requirement]->(er) "
        "RETURN count(er)"
    )
    assert orphans[0][0] == 0
