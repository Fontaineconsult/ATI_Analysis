"""
IsEvidenceForRel.satisfies — which parts of the companion bar an evidence link claims.

Isolation: these tests write to a real is_evidence_for rel, because that is the only
place satisfies lives and there is no sentinel evidence link to borrow. The fixture
records the rel's original array and restores it afterwards, so a run leaves the live
graph exactly as it found it.
"""
import pytest
from neomodel import db

IMPLEMENTATIONS_URL = "/ati/data-api/v1/implementations"
INDICATORS_URL = "/ati/data-api/v1/indicators"


@pytest.fixture
def evidence_link(neo4j_connection):
    """An existing evidence link whose indicator has requirements authored.

    Yields (year_identifier, impl_type, impl_unique_id, [handles...]) and restores the
    link's original satisfies array on teardown.
    """
    rows, _ = db.cypher_query(
        """
        MATCH (impl)-[r:is_evidence_for]->(yse:YearSuccessEvidence)-[:tracks]->(si:SuccessIndicator)
        MATCH (si)-[:has_evidence_requirement]->(er:EvidenceRequirement)
        WITH yse, impl, r, si, er ORDER BY er.level, er.seq
        WITH yse.year_identifier AS yid, labels(impl)[0] AS type, impl.unique_id AS uid,
             coalesce(r.satisfies, []) AS original, collect(er.handle) AS handles
        WHERE size(handles) >= 3
        RETURN yid, type, uid, original, handles LIMIT 1
        """
    )
    if not rows:
        pytest.skip("no evidence link whose indicator has 3+ requirements")

    yid, impl_type, uid, original, handles = rows[0]
    yield yid, impl_type, uid, handles

    db.cypher_query(
        """
        MATCH (impl {unique_id: $uid})-[r:is_evidence_for]->(:YearSuccessEvidence {year_identifier: $yid})
        SET r.satisfies = $original
        """,
        {"uid": uid, "yid": yid, "original": original},
    )


def _set(client, yid, impl_type, uid, satisfies):
    return client.put(IMPLEMENTATIONS_URL, json={
        "action": "set_evidence_satisfies",
        "year_success_identifier": yid,
        "implementation_type": impl_type,
        "unique_id": uid,
        "satisfies": satisfies,
    })


@pytest.mark.integration
@pytest.mark.api
def test_claims_are_stored_and_replaced(flask_client, evidence_link):
    yid, impl_type, uid, handles = evidence_link

    response = _set(flask_client, yid, impl_type, uid, handles[:2])
    assert response.status_code == 200
    assert sorted(response.get_json()["data"]["satisfies"]) == sorted(handles[:2])

    # Full replace, not append — un-checking a box has to be expressible.
    response = _set(flask_client, yid, impl_type, uid, [handles[0]])
    assert response.get_json()["data"]["satisfies"] == [handles[0]]


@pytest.mark.integration
@pytest.mark.api
def test_claims_come_back_in_bar_order(flask_client, evidence_link):
    """Stored in the order the bar reads, not the order the checkboxes were clicked, so
    every consumer renders the same sequence without re-sorting."""
    yid, impl_type, uid, handles = evidence_link

    response = _set(flask_client, yid, impl_type, uid, list(reversed(handles[:3])))
    assert response.get_json()["data"]["satisfies"] == handles[:3]


@pytest.mark.integration
@pytest.mark.api
def test_duplicate_handles_collapse(flask_client, evidence_link):
    yid, impl_type, uid, handles = evidence_link
    response = _set(flask_client, yid, impl_type, uid, [handles[0], handles[0], handles[1]])
    assert response.get_json()["data"]["satisfies"] == handles[:2]


@pytest.mark.integration
@pytest.mark.api
def test_empty_list_clears_claims(flask_client, evidence_link):
    yid, impl_type, uid, handles = evidence_link
    _set(flask_client, yid, impl_type, uid, handles[:2])

    response = _set(flask_client, yid, impl_type, uid, [])
    assert response.status_code == 200
    assert response.get_json()["data"]["satisfies"] == []


@pytest.mark.integration
@pytest.mark.api
def test_requirement_from_another_indicator_is_rejected(flask_client, evidence_link):
    """The core integrity rule. Handles are strings, so nothing structural stops writing
    another indicator's handle here — it would then read as a satisfied requirement of an
    indicator this work was never assessed against."""
    yid, impl_type, uid, handles = evidence_link

    composite_key = handles[0].split(":")[1]
    other, _ = db.cypher_query(
        "MATCH (er:EvidenceRequirement) WHERE er.composite_key <> $ck RETURN er.handle LIMIT 1",
        {"ck": composite_key},
    )
    foreign = other[0][0]

    response = _set(flask_client, yid, impl_type, uid, [handles[0], foreign])
    assert response.status_code == 400
    assert foreign in response.get_json()["error"]

    # Rejected wholesale — the valid half of a bad payload must not land either.
    rows, _ = db.cypher_query(
        "MATCH (impl {unique_id: $uid})-[r:is_evidence_for]->(:YearSuccessEvidence {year_identifier: $yid}) "
        "RETURN coalesce(r.satisfies, [])",
        {"uid": uid, "yid": yid},
    )
    assert handles[0] not in rows[0][0]


@pytest.mark.integration
@pytest.mark.api
def test_nonexistent_handle_is_rejected(flask_client, evidence_link):
    yid, impl_type, uid, _ = evidence_link
    response = _set(flask_client, yid, impl_type, uid, ["evidence:not-a-real-key:established:1"])
    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.api
def test_non_list_payload_is_rejected(flask_client, evidence_link):
    yid, impl_type, uid, _ = evidence_link
    response = flask_client.put(IMPLEMENTATIONS_URL, json={
        "action": "set_evidence_satisfies",
        "year_success_identifier": yid,
        "implementation_type": impl_type,
        "unique_id": uid,
        "satisfies": "evidence:4.6-pro:established:1",
    })
    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.api
def test_unlinked_implementation_is_rejected(flask_client, evidence_link):
    """satisfies qualifies an existing evidence link. There is nothing to qualify when the
    implementation does not evidence that YSE."""
    yid, impl_type, _, handles = evidence_link
    rows, _ = db.cypher_query(
        """
        MATCH (impl) WHERE labels(impl)[0] = $type AND impl.unique_id IS NOT NULL
          AND NOT (impl)-[:is_evidence_for]->(:YearSuccessEvidence {year_identifier: $yid})
        RETURN impl.unique_id LIMIT 1
        """,
        {"type": impl_type, "yid": yid},
    )
    if not rows:
        pytest.skip(f"every {impl_type} already evidences {yid}")

    response = _set(flask_client, yid, impl_type, rows[0][0], [handles[0]])
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.api
def test_error_body_carries_the_message(flask_client, evidence_link):
    """The endpoint used to pass a dict positionally into make_response, which nested the
    whole envelope under `status` and left `error` null — so the client got a failure it
    could not explain. Validation is pointless if the reason never reaches the curator."""
    yid, impl_type, uid, _ = evidence_link
    body = _set(flask_client, yid, impl_type, uid, ["evidence:bogus:established:1"]).get_json()

    assert body["status"] == "error"
    assert isinstance(body["error"], str) and body["error"]


@pytest.mark.integration
@pytest.mark.api
def test_deleting_a_requirement_clears_claims_that_referenced_it(flask_client, evidence_link):
    """A handle is not a reference, so a deleted requirement would otherwise leave the
    array pointing at nothing — invisible, and silently under-reporting coverage."""
    yid, impl_type, uid, handles = evidence_link
    composite_key = handles[0].split(":")[1]

    created = flask_client.post(INDICATORS_URL, json={
        "action": "add_evidence_requirement",
        "composite_key": composite_key,
        "level": "established",
        "requirement": "Temporary requirement for the dangling-handle test.",
    }).get_json()["data"]

    assert _set(flask_client, yid, impl_type, uid,
                [handles[0], created["handle"]]).status_code == 200

    deleted = flask_client.delete(INDICATORS_URL, json={
        "action": "delete_evidence_requirement", "unique_id": created["unique_id"],
    })
    assert deleted.status_code == 200
    assert deleted.get_json()["data"]["claims_cleared"] >= 1

    rows, _ = db.cypher_query(
        "MATCH (impl {unique_id: $uid})-[r:is_evidence_for]->(:YearSuccessEvidence {year_identifier: $yid}) "
        "RETURN coalesce(r.satisfies, [])",
        {"uid": uid, "yid": yid},
    )
    remaining = rows[0][0]
    assert created["handle"] not in remaining
    assert handles[0] in remaining, "unrelated claims must survive the delete"
