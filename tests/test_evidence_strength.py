"""Evidence strength (0-3) on the is_evidence_for relationship (IsEvidenceForRel).

Covers: assignment with a strength, rating/clearing an existing link, input
validation, the endpoint action, and strength surviving the academic-year
rollover (relationship properties are copied with the link).
"""
import uuid

import pytest

from app.database.queries.evidence.update import (
    assign_implementation_to_year_success_indicator,
    set_evidence_strength,
)
from app.database.queries.implementation.update import retire_implementation
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError
from tests.test_implementation_retirement import SENTINEL_TITLE_PREFIX, _sentinel_yse, sentinel_process  # noqa: F401


def _rel(process, yse):
    return process.is_evidence_for.relationship(yse)


@pytest.mark.integration
def test_assign_with_strength_stamps_the_rel(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)

    assign_implementation_to_year_success_indicator(
        yse.year_identifier, "Process", sentinel_process.title, strength=2,
    )
    assert _rel(sentinel_process, yse).strength == 2


@pytest.mark.integration
def test_assign_without_strength_leaves_link_unrated(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)

    assign_implementation_to_year_success_indicator(
        yse.year_identifier, "Process", sentinel_process.title,
    )
    assert _rel(sentinel_process, yse).strength is None


@pytest.mark.integration
def test_set_update_and_clear_strength(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)
    assign_implementation_to_year_success_indicator(
        yse.year_identifier, "Process", sentinel_process.title,
    )

    assert set_evidence_strength(yse.year_identifier, "Process", sentinel_process.unique_id, 3) == {"strength": 3}
    assert _rel(sentinel_process, yse).strength == 3

    assert set_evidence_strength(yse.year_identifier, "Process", sentinel_process.unique_id, 0) == {"strength": 0}
    assert _rel(sentinel_process, yse).strength == 0

    assert set_evidence_strength(yse.year_identifier, "Process", sentinel_process.unique_id, None) == {"strength": None}
    assert _rel(sentinel_process, yse).strength is None


@pytest.mark.integration
def test_strength_validation_and_missing_link(sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)

    for bad in (4, -1, "2", 2.5, True):
        with pytest.raises(ValidationError):
            set_evidence_strength(yse.year_identifier, "Process", sentinel_process.unique_id, bad)

    with pytest.raises(ValidationError):
        assign_implementation_to_year_success_indicator(
            yse.year_identifier, "Process", sentinel_process.title, strength=7,
        )

    # No link yet → NotFoundError.
    with pytest.raises(NotFoundError):
        set_evidence_strength(yse.year_identifier, "Process", sentinel_process.unique_id, 1)


@pytest.mark.api
def test_endpoint_set_evidence_strength(flask_client, sentinel_process, cleanup_yse_family):
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME
    yse = _sentinel_yse(TEST_ACADEMIC_YEAR_NAME)
    base = "/ati/data-api/v1/implementations"

    resp = flask_client.put(base, json={
        "action": "assign_implementation_to_yse",
        "year_success_identifier": yse.year_identifier,
        "implementation_type": "Process",
        "implementation_title": sentinel_process.title,
        "strength": 1,
    })
    assert resp.status_code == 200
    assert _rel(sentinel_process, yse).strength == 1

    resp = flask_client.put(base, json={
        "action": "set_evidence_strength",
        "year_success_identifier": yse.year_identifier,
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "strength": 3,
    })
    assert resp.status_code == 200
    assert resp.get_json()["data"] == {"strength": 3}

    resp = flask_client.put(base, json={
        "action": "set_evidence_strength",
        "year_success_identifier": yse.year_identifier,
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "strength": 9,
    })
    assert resp.status_code == 400


@pytest.mark.integration
def test_rollover_carries_strength_with_the_link(sentinel_process, cleanup_yse_family, neo4j_connection):
    """Relationship properties ride the rollover copy — a rated link stays rated
    in the new year (unless the implementation is retired, which is excluded)."""
    from neomodel import db as _db
    from tests.conftest import TEST_ACADEMIC_YEAR_NAME, TEST_PREVIOUS_ACADEMIC_YEAR_NAME
    from app.database.tools.create_new_ay_campus import duplicate_year_success_evidence

    old_yse = _sentinel_yse(TEST_PREVIOUS_ACADEMIC_YEAR_NAME)
    assign_implementation_to_year_success_indicator(
        old_yse.year_identifier, "Process", sentinel_process.title, strength=2,
    )

    duplicate_year_success_evidence(TEST_PREVIOUS_ACADEMIC_YEAR_NAME, TEST_ACADEMIC_YEAR_NAME)

    new_yse_id = TEST_ACADEMIC_YEAR_NAME + old_yse.year_identifier[len(TEST_PREVIOUS_ACADEMIC_YEAR_NAME):]
    rows, _ = _db.cypher_query(
        """
        MATCH (p:Process {unique_id: $uid})-[r:is_evidence_for]->(yse:YearSuccessEvidence {year_identifier: $yid})
        RETURN r.strength
        """,
        {"uid": sentinel_process.unique_id, "yid": new_yse_id},
    )
    assert rows and rows[0][0] == 2, "strength should carry forward with the copied link"
