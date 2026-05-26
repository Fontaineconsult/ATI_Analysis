"""
Tests for the academic-year rollover migration helpers in
app/database/tools/create_new_ay_campus.py.

These tests focus on `propagate_documentation_years_for` — the step that fixes
the bug where documentation tagged with `included_in_years=["<old year>"]`
silently disappears from the master evidence query in subsequent years.

All test data is scoped to the sentinel academic year (`9999-9999`) — the
new Process and Document nodes are seeded with that year as a prefix in
their `title`/`name` so cleanup can match them by string prefix without
ever touching production data.
"""
import uuid

import pytest
from neomodel import db

from app.database.graph_schema import (
    AcademicYear,
    Campus,
    Document,
    Process,
    SuccessIndicator,
    YearSuccessEvidence,
)
from app.database.identifiers import make_yse_identifier
from app.database.tools.create_new_ay_campus import propagate_documentation_years_for
from tests.conftest import TEST_ACADEMIC_YEAR_NAME, TEST_PREVIOUS_ACADEMIC_YEAR_NAME


@pytest.fixture
def cleanup_propagation_fixtures(neo4j_connection):
    """
    Detach-delete test Process and Document nodes (identified by sentinel-year
    prefix on title/name). Runs in addition to cleanup_yse_family which handles
    the YSE side. Plain prefix matching — production nodes with real titles can
    never match a "9999-9999-test-…" prefix.
    """
    yield
    db.cypher_query(
        "MATCH (p:Process) WHERE p.title STARTS WITH $year DETACH DELETE p",
        {"year": TEST_ACADEMIC_YEAR_NAME},
    )
    db.cypher_query(
        "MATCH (d:Document) WHERE d.name STARTS WITH $year DETACH DELETE d",
        {"year": TEST_ACADEMIC_YEAR_NAME},
    )


def _any_active_indicator():
    rows, _ = db.cypher_query(
        """
        MATCH (si:SuccessIndicator)
        WHERE si.removed = false OR si.removed IS NULL
        RETURN si LIMIT 1
        """
    )
    if not rows:
        raise RuntimeError("No active SuccessIndicator found in DB.")
    return SuccessIndicator.inflate(rows[0][0])


def _seed_process_with_documented_year(
    indicator,
    yse_year_name,
    included_in_years,
):
    """
    Create a sentinel-prefixed Process node, wire it as evidence for a YSE in
    `yse_year_name`, then attach a Document via is_documented_by with the given
    `included_in_years` whitelist on the rel. Returns (process, document, yse).
    """
    yse_id = make_yse_identifier(yse_year_name, indicator.composite_key, "sfsu")
    existing = YearSuccessEvidence.nodes.filter(year_identifier=yse_id)
    if existing:
        yse = existing[0]
    else:
        yse = YearSuccessEvidence(year_identifier=yse_id)
        yse.save()
        yse.tracks_success_indicator.connect(indicator)
        yse.campus.connect(Campus.nodes.get(abbreviation="sfsu"))
        yse.academic_year.connect(AcademicYear.nodes.get(name=yse_year_name))

    process = Process(
        title=f"{TEST_ACADEMIC_YEAR_NAME}-test-process-{uuid.uuid4()}",
        description="propagation-test process",
    )
    process.save()
    process.is_evidence_for.connect(yse)

    document = Document(
        name=f"{TEST_ACADEMIC_YEAR_NAME}-test-doc-{uuid.uuid4()}",
        hash=str(uuid.uuid4()),
    )
    document.save()
    rel = process.supporting_documents.connect(document)
    if included_in_years is not None:
        rel.included_in_years = list(included_in_years)
        rel.save()

    return process, document, yse


@pytest.mark.integration
def test_propagate_documentation_years_appends_new_year_to_whitelisted_rels(
    sentinel_academic_year, cleanup_yse_family, cleanup_propagation_fixtures
):
    """A doc rel whitelisted only to the previous year gets the new year
    appended after propagation — and the previous year stays put."""
    # Make sure the previous-year AcademicYear node exists for the YSE wiring.
    try:
        AcademicYear.nodes.get(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME)
    except AcademicYear.DoesNotExist:
        AcademicYear(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME).save()

    si = _any_active_indicator()
    process, document, _ = _seed_process_with_documented_year(
        indicator=si,
        yse_year_name=TEST_ACADEMIC_YEAR_NAME,
        included_in_years=[TEST_PREVIOUS_ACADEMIC_YEAR_NAME],
    )

    # Sanity check pre-propagation
    rel = process.supporting_documents.relationship(document)
    assert rel.included_in_years == [TEST_PREVIOUS_ACADEMIC_YEAR_NAME]

    updated = propagate_documentation_years_for(TEST_ACADEMIC_YEAR_NAME)
    assert updated >= 1

    refreshed = process.supporting_documents.relationship(document)
    assert TEST_ACADEMIC_YEAR_NAME in refreshed.included_in_years
    # Previous year not lost.
    assert TEST_PREVIOUS_ACADEMIC_YEAR_NAME in refreshed.included_in_years


@pytest.mark.integration
def test_propagate_documentation_years_is_idempotent(
    sentinel_academic_year, cleanup_yse_family, cleanup_propagation_fixtures
):
    """Re-running propagation does not duplicate the year in the whitelist."""
    si = _any_active_indicator()
    process, document, _ = _seed_process_with_documented_year(
        indicator=si,
        yse_year_name=TEST_ACADEMIC_YEAR_NAME,
        included_in_years=[TEST_PREVIOUS_ACADEMIC_YEAR_NAME],
    )

    propagate_documentation_years_for(TEST_ACADEMIC_YEAR_NAME)
    propagate_documentation_years_for(TEST_ACADEMIC_YEAR_NAME)

    refreshed = process.supporting_documents.relationship(document)
    occurrences = [y for y in refreshed.included_in_years if y == TEST_ACADEMIC_YEAR_NAME]
    assert len(occurrences) == 1


@pytest.mark.integration
def test_propagate_documentation_years_leaves_empty_whitelist_alone(
    sentinel_academic_year, cleanup_yse_family, cleanup_propagation_fixtures
):
    """Rels with empty included_in_years already mean 'applies to all years'
    (DocumentedByRel default). Propagation must not add the new year there —
    that would convert an unrestricted rel into a restricted one."""
    si = _any_active_indicator()
    process, document, _ = _seed_process_with_documented_year(
        indicator=si,
        yse_year_name=TEST_ACADEMIC_YEAR_NAME,
        included_in_years=[],
    )

    propagate_documentation_years_for(TEST_ACADEMIC_YEAR_NAME)

    refreshed = process.supporting_documents.relationship(document)
    assert refreshed.included_in_years == []
