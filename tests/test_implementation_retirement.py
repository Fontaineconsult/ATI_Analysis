"""Retirement lifecycle on implementations (retired / retired_date / retired_note).

Layer 3 (create/update functions) + layer 5 (the retire_implementation endpoint
action), plus the two enforcement points: retired implementations can't be
assigned to new evidence, and don't carry forward at academic-year rollover.
Test nodes are created here with a sentinel-prefixed title and deleted in the
fixture teardown — the live-DB isolation rule.
"""
import uuid

import pytest

from app.database.queries.implementation.update import retire_implementation
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError

SENTINEL_TITLE_PREFIX = "9999-9999 retirement-test "


@pytest.fixture()
def sentinel_process(neo4j_connection):
    """A throwaway Process node, removed (detach delete) on teardown."""
    from app.database.graph_schema import Process

    node = Process(title=f"{SENTINEL_TITLE_PREFIX}{uuid.uuid4().hex[:8]}",
                   description="retirement lifecycle test").save()
    yield node
    from neomodel import db
    db.cypher_query(
        "MATCH (p:Process {unique_id: $uid}) DETACH DELETE p",
        {"uid": node.unique_id},
    )


@pytest.mark.integration
def test_new_implementation_is_not_retired(sentinel_process):
    data = sentinel_process.serialize()
    assert data["retired"] is False
    assert data["retired_date"] is None
    assert data["retired_note"] is None


@pytest.mark.integration
def test_retire_stamps_flag_date_and_note(sentinel_process):
    result = retire_implementation(
        "Process", sentinel_process.unique_id, True,
        retired_date="2026-06-30", retired_note="Superseded by the new intake process.",
    )
    assert result["retired"] is True
    assert result["retired_date"] == "2026-06-30"
    assert result["retired_note"] == "Superseded by the new intake process."


@pytest.mark.integration
def test_retire_defaults_date_to_today(sentinel_process):
    from datetime import date
    result = retire_implementation("Process", sentinel_process.unique_id, True)
    assert result["retired"] is True
    assert result["retired_date"] == str(date.today())
    assert result["retired_note"] is None


@pytest.mark.integration
def test_unretire_clears_date_and_note(sentinel_process):
    retire_implementation("Process", sentinel_process.unique_id, True,
                          retired_date="2026-06-30", retired_note="old note")
    result = retire_implementation("Process", sentinel_process.unique_id, False)
    assert result["retired"] is False
    assert result["retired_date"] is None
    assert result["retired_note"] is None


@pytest.mark.integration
def test_retire_rejects_bad_date_and_unknown_targets(sentinel_process):
    with pytest.raises(ValidationError):
        retire_implementation("Process", sentinel_process.unique_id, True,
                              retired_date="June 30, 2026")
    with pytest.raises(ValidationError):
        retire_implementation("NotAType", sentinel_process.unique_id, True)
    with pytest.raises(NotFoundError):
        retire_implementation("Process", "no-such-uid", True)


@pytest.mark.api
def test_endpoint_retire_and_reactivate(flask_client, sentinel_process):
    base = "/ati/data-api/v1/implementations"

    resp = flask_client.put(base, json={
        "action": "retire_implementation",
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "retired": True,
        "retired_date": "2026-07-01",
        "retired_note": "endpoint test",
    })
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["data"]["retired"] is True
    assert payload["data"]["retired_date"] == "2026-07-01"

    resp = flask_client.put(base, json={
        "action": "retire_implementation",
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "retired": False,
    })
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["data"]["retired"] is False
    assert payload["data"]["retired_date"] is None


def _sentinel_yse(year_name):
    """Get-or-create a sentinel YSE for the given sentinel year (cleaned up by
    cleanup_yse_family via the year-identifier prefix)."""
    from neomodel import db as _db
    from app.database.graph_schema import (
        AcademicYear, Campus, SuccessIndicator, YearSuccessEvidence,
    )
    from app.database.identifiers import make_yse_identifier

    rows, _ = _db.cypher_query(
        "MATCH (si:SuccessIndicator) WHERE si.removed = false OR si.removed IS NULL RETURN si.composite_key LIMIT 1"
    )
    composite_key = rows[0][0]
    yse_id = make_yse_identifier(year_name, composite_key, "sfsu")
    existing = YearSuccessEvidence.nodes.filter(year_identifier=yse_id)
    if existing:
        return existing[0]
    yse = YearSuccessEvidence(year_identifier=yse_id).save()
    yse.tracks_success_indicator.connect(SuccessIndicator.nodes.get(composite_key=composite_key))
    yse.campus.connect(Campus.nodes.get(abbreviation="sfsu"))
    yse.academic_year.connect(AcademicYear.nodes.get(name=year_name))
    return yse


@pytest.mark.integration
def test_retired_implementation_cannot_be_assigned_to_yse(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    from app.database.queries.evidence.update import assign_implementation_to_year_success_indicator

    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)
    retire_implementation("Process", sentinel_process.unique_id, True)

    with pytest.raises(ValidationError):
        assign_implementation_to_year_success_indicator(
            yse.year_identifier, "Process", sentinel_process.title,
        )

    # Reactivated, the same assignment goes through.
    retire_implementation("Process", sentinel_process.unique_id, False)
    assert assign_implementation_to_year_success_indicator(
        yse.year_identifier, "Process", sentinel_process.title,
    ) is True


@pytest.mark.integration
def test_rollover_does_not_carry_retired_implementations_forward(
    sentinel_process, cleanup_yse_family, neo4j_connection,
):
    """duplicate_year_success_evidence copies is_evidence_for edges to the new
    year's YSE for active implementations but skips retired ones."""
    from neomodel import db as _db
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME, TEST_PREVIOUS_ACADEMIC_YEAR_NAME
    from app.database.graph_schema import Process
    from app.database.tools.create_new_ay_campus import duplicate_year_success_evidence

    old_yse = _sentinel_yse(TEST_PREVIOUS_ACADEMIC_YEAR_NAME)

    active = Process(title=f"{SENTINEL_TITLE_PREFIX}active-{uuid.uuid4().hex[:8]}").save()
    active.is_evidence_for.connect(old_yse)
    retired = sentinel_process
    retired.is_evidence_for.connect(old_yse)
    retire_implementation("Process", retired.unique_id, True, retired_note="rollover test")

    try:
        duplicate_year_success_evidence(TEST_PREVIOUS_ACADEMIC_YEAR_NAME, TEST_ACADEMIC_YEAR_NAME)

        new_yse_id = TEST_ACADEMIC_YEAR_NAME + old_yse.year_identifier[len(TEST_PREVIOUS_ACADEMIC_YEAR_NAME):]
        rows, _ = _db.cypher_query(
            """
            MATCH (impl)-[:is_evidence_for]->(yse:YearSuccessEvidence {year_identifier: $yid})
            RETURN impl.unique_id
            """,
            {"yid": new_yse_id},
        )
        carried = {r[0] for r in rows}
        assert active.unique_id in carried, "active implementation should carry forward"
        assert retired.unique_id not in carried, "retired implementation must NOT carry forward"
    finally:
        _db.cypher_query(
            "MATCH (p:Process {unique_id: $uid}) DETACH DELETE p",
            {"uid": active.unique_id},
        )


@pytest.mark.api
def test_endpoint_retired_must_be_boolean(flask_client, sentinel_process):
    resp = flask_client.put("/ati/data-api/v1/implementations", json={
        "action": "retire_implementation",
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "retired": "yes",
    })
    assert resp.status_code == 400
