"""Copy-evidence-to-campuses: duplicating an implementation's current-year
is_evidence_for links (and optionally the source YSEs' assigned people) onto
the same indicators' YSEs at other campuses.

All graph writes are scoped to sentinel-year YSEs and sentinel-titled
Process/Person nodes, deleted in teardown.
"""
import uuid

import pytest
from neomodel import db

from app.database.queries.evidence.update import (
    assign_implementation_to_year_success_indicator,
    copy_evidence_to_campuses,
)
from app.database.queries.implementation.update import retire_implementation
from app.endpoints.data_api.errors.custom_exceptions import ValidationError
from tests.conftest import TEST_ACADEMIC_YEAR_NAME
from tests.test_implementation_retirement import SENTINEL_TITLE_PREFIX, sentinel_process  # noqa: F401


def _sentinel_yse_at(year_name, campus_abbrev):
    """Get-or-create a sentinel YSE for the FIRST active indicator at the given
    campus (cleanup_yse_family removes it by year-identifier prefix)."""
    from app.database.graph_schema import (
        AcademicYear, Campus, SuccessIndicator, YearSuccessEvidence,
    )
    from app.database.identifiers import make_yse_identifier

    rows, _ = db.cypher_query(
        "MATCH (si:SuccessIndicator) WHERE si.removed = false OR si.removed IS NULL RETURN si.composite_key LIMIT 1"
    )
    composite_key = rows[0][0]
    yse_id = make_yse_identifier(year_name, composite_key, campus_abbrev)
    existing = YearSuccessEvidence.nodes.filter(year_identifier=yse_id)
    if existing:
        return existing[0]
    yse = YearSuccessEvidence(year_identifier=yse_id).save()
    yse.tracks_success_indicator.connect(SuccessIndicator.nodes.get(composite_key=composite_key))
    yse.campus.connect(Campus.nodes.get(abbreviation=campus_abbrev))
    yse.academic_year.connect(AcademicYear.nodes.get(name=year_name))
    return yse


@pytest.fixture()
def sentinel_person(neo4j_connection):
    from app.database.graph_schema import Person
    person = Person(name=f"{SENTINEL_TITLE_PREFIX}person-{uuid.uuid4().hex[:8]}").save()
    yield person
    db.cypher_query(
        "MATCH (p:Person {unique_id: $uid}) DETACH DELETE p",
        {"uid": person.unique_id},
    )


@pytest.mark.integration
def test_copy_creates_target_links_with_strength_and_people(
    sentinel_process, sentinel_person, cleanup_yse_family,
):
    src = _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "sfsu")
    _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "ssu")

    assign_implementation_to_year_success_indicator(
        src.year_identifier, "Process", sentinel_process.title, strength=2,
    )
    sentinel_person.implements_yse.connect(src)

    result = copy_evidence_to_campuses(
        "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu", ["ssu"],
    )
    assert result["ssu"] == {
        "created": 1, "already_linked": 0, "skipped_missing_indicator": 0, "people_added": 1,
    }

    rows, _ = db.cypher_query(
        """
        MATCH (p:Process {unique_id: $uid})-[r:is_evidence_for]->(yse:YearSuccessEvidence)
              -[:evidence_at_campus]->(:Campus {abbreviation: 'ssu'})
        WHERE yse.year_identifier STARTS WITH $year
        RETURN r.strength, exists((:Person {unique_id: $pid})-[:implements]->(yse))
        """,
        {"uid": sentinel_process.unique_id, "year": TEST_ACADEMIC_YEAR_NAME,
         "pid": sentinel_person.unique_id},
    )
    assert rows and rows[0][0] == 2, "strength should copy onto the new link"
    assert rows[0][1] is True, "assigned person should copy onto the target YSE"


@pytest.mark.integration
def test_copy_is_idempotent_and_respects_existing_ratings(sentinel_process, cleanup_yse_family):
    src = _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "sfsu")
    _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "ssu")
    assign_implementation_to_year_success_indicator(
        src.year_identifier, "Process", sentinel_process.title, strength=3,
    )

    first = copy_evidence_to_campuses(
        "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu", ["ssu"],
    )
    assert first["ssu"]["created"] == 1

    second = copy_evidence_to_campuses(
        "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu", ["ssu"],
    )
    assert second["ssu"] == {
        "created": 0, "already_linked": 1, "skipped_missing_indicator": 0, "people_added": 0,
    }


@pytest.mark.integration
def test_copy_without_people_and_missing_target(sentinel_process, sentinel_person, cleanup_yse_family):
    src = _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "sfsu")
    _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "ssu")
    assign_implementation_to_year_success_indicator(
        src.year_identifier, "Process", sentinel_process.title,
    )
    sentinel_person.implements_yse.connect(src)

    result = copy_evidence_to_campuses(
        "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu",
        ["ssu", "zz-no-such-campus"], include_people=False,
    )
    assert result["ssu"]["created"] == 1
    assert result["ssu"]["people_added"] == 0
    assert result["zz-no-such-campus"] == {
        "created": 0, "already_linked": 0, "skipped_missing_indicator": 1, "people_added": 0,
    }


@pytest.mark.integration
def test_copy_guards(sentinel_process, cleanup_yse_family):
    with pytest.raises(ValidationError):
        copy_evidence_to_campuses(
            "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu", [],
        )
    with pytest.raises(ValidationError):
        copy_evidence_to_campuses(
            "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu", ["sfsu", "ssu"],
        )
    retire_implementation("Process", sentinel_process.unique_id, True)
    with pytest.raises(ValidationError):
        copy_evidence_to_campuses(
            "Process", sentinel_process.unique_id, TEST_ACADEMIC_YEAR_NAME, "sfsu", ["ssu"],
        )


@pytest.mark.api
def test_endpoint_copy_evidence_to_campuses(flask_client, sentinel_process, cleanup_yse_family):
    src = _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "sfsu")
    _sentinel_yse_at(TEST_ACADEMIC_YEAR_NAME, "ssu")
    assign_implementation_to_year_success_indicator(
        src.year_identifier, "Process", sentinel_process.title, strength=1,
    )

    resp = flask_client.put("/ati/data-api/v1/implementations", json={
        "action": "copy_evidence_to_campuses",
        "implementation_type": "Process",
        "unique_id": sentinel_process.unique_id,
        "year_name": TEST_ACADEMIC_YEAR_NAME,
        "source_campus": "sfsu",
        "target_campuses": ["ssu"],
    })
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["data"]["ssu"]["created"] == 1
