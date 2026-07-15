"""
Query-level tests for get_indicator_report — the single-indicator evidence report payload.

Covers the PR2 backend additions: override_implementation_requirement on the indicator, the
seven YSE workflow props, and previous_status_level (year-over-year progression). Scoped to the
sentinel years; reuses real Campus / SuccessIndicator / StatusLevel reference data (never modified).
"""
import pytest
from neomodel import db

from app.database.graph_schema import (
    AcademicYear,
    Campus,
    StatusLevel,
    SuccessIndicator,
    YearSuccessEvidence,
)
from app.database.identifiers import make_yse_identifier
from app.database.queries.compound_queries.get_indicator_report import get_indicator_report, _supporting
from tests.conftest import TEST_ACADEMIC_YEAR_NAME, TEST_PREVIOUS_ACADEMIC_YEAR_NAME

CAMPUS_ABBREV = "sfsu"


# --- _supporting inclusion rule (year-curation-wins) --------------------------
# Pure logic, no DB: a fake neomodel manager whose .all()/.relationship() mimic a
# supporting_documents/webpages/notes edge set. Locks the rule that an item explicitly
# curated into the viewed year shows regardless of its global include_in_report flag,
# while an uncurated item still respects that flag.
class _FakeNode:
    def __init__(self, uid, include_in_report=True):
        self.unique_id = uid
        self.include_in_report = include_in_report

    def serialize(self):
        return {"unique_id": self.unique_id, "include_in_report": self.include_in_report}


class _FakeRel:
    def __init__(self, included=None, excluded=None):
        self.included_in_years = list(included or [])
        self.excluded_from_years = list(excluded or [])


class _FakeManager:
    """pairs: list of (node, rel_or_None)."""
    def __init__(self, pairs):
        self._pairs = pairs

    def all(self):
        return [n for n, _ in self._pairs]

    def relationship(self, node):
        for n, rel in self._pairs:
            if n is node:
                return rel
        return None


@pytest.mark.unit
def test_supporting_year_curation_wins_over_include_in_report():
    year = "2025-2026"
    curated_in = _FakeNode("curated_in", include_in_report=False)      # flag says hide, year says show
    curated_other = _FakeNode("curated_other", include_in_report=True)  # curated into a different year
    excluded = _FakeNode("excluded", include_in_report=True)            # explicitly excluded from this year
    uncurated_hidden = _FakeNode("uncurated_hidden", include_in_report=False)  # no year data + flag off
    uncurated_shown = _FakeNode("uncurated_shown", include_in_report=True)     # no year data + flag on
    no_rel = _FakeNode("no_rel", include_in_report=False)              # no edge at all → respect flag

    manager = _FakeManager([
        (curated_in, _FakeRel(included=[year])),
        (curated_other, _FakeRel(included=["2024-2025"])),
        (excluded, _FakeRel(included=[year], excluded=[year])),
        (uncurated_hidden, _FakeRel()),   # empty year lists == no curation
        (uncurated_shown, _FakeRel()),
        (no_rel, None),
    ])

    got = {d["unique_id"] for d in _supporting(manager, year)}
    assert got == {"curated_in", "uncurated_shown"}


def _find_web_indicator() -> SuccessIndicator:
    rows, _ = db.cypher_query(
        """
        MATCH (:ATIWorkingGroup {name: 'Web'})-[:responsible_for]->(:Goal)
              -[:supported_by]->(si:SuccessIndicator)
        WHERE si.removed = false OR si.removed IS NULL
        RETURN si LIMIT 1
        """,
    )
    if not rows:
        pytest.skip("No active Web SuccessIndicator in the graph")
    return SuccessIndicator.inflate(rows[0][0])


def _make_yse(year_name, si, *, status_level=None, **props) -> YearSuccessEvidence:
    """Create (or reuse) a sentinel-year YSE for this SI + sfsu, wired to year/campus/status."""
    yse_id = make_yse_identifier(year_name, si.composite_key, CAMPUS_ABBREV)
    yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=yse_id) or YearSuccessEvidence(year_identifier=yse_id)
    for key, value in props.items():
        setattr(yse, key, value)
    yse.save()
    yse.tracks_success_indicator.connect(si)
    yse.campus.connect(Campus.nodes.get(abbreviation=CAMPUS_ABBREV))
    yse.academic_year.connect(AcademicYear.nodes.get(name=year_name))
    if status_level:
        yse.status_level.connect(StatusLevel.nodes.get(status_level=status_level))
    return yse


@pytest.fixture
def previous_year_node(neo4j_connection):
    """Ensure the 9998-9998 previous-year sentinel AcademicYear exists (reused, never deleted)."""
    try:
        AcademicYear.nodes.get(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME)
    except AcademicYear.DoesNotExist:
        AcademicYear(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME).save()


@pytest.mark.integration
def test_report_carries_new_yse_props_and_override(sentinel_academic_year, cleanup_yse_family):
    si = _find_web_indicator()
    _make_yse(
        TEST_ACADEMIC_YEAR_NAME, si,
        status_level="Defined",
        priority_level="High",
        documentation_status="in_progress",
        resources_status="secured",
        implementation_plan_status="drafted",
        ready_for_admin_review=True,
        worked_on_in_current_year=True,
        will_work_on_next_year=False,
    )

    report = get_indicator_report(si.composite_key, TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV)

    # override_implementation_requirement now surfaces on the indicator (bool, default False).
    assert "override_implementation_requirement" in report["indicator"]
    assert isinstance(report["indicator"]["override_implementation_requirement"], bool)

    y = report["yse"]
    assert y["priority_level"] == "High"
    assert y["documentation_status"] == "in_progress"
    assert y["resources_status"] == "secured"
    assert y["implementation_plan_status"] == "drafted"
    assert y["ready_for_admin_review"] is True
    assert y["worked_on_in_current_year"] is True
    assert y["will_work_on_next_year"] is False

    assert report["status"]["status_level"] == "Defined"


@pytest.mark.integration
def test_report_surfaces_previous_year_status(sentinel_academic_year, previous_year_node, cleanup_yse_family):
    si = _find_web_indicator()
    _make_yse(TEST_ACADEMIC_YEAR_NAME, si, status_level="Defined")
    _make_yse(TEST_PREVIOUS_ACADEMIC_YEAR_NAME, si, status_level="Initiated")

    report = get_indicator_report(si.composite_key, TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV)

    assert report["status"]["status_level"] == "Defined"
    assert report["status"]["previous_status_level"] == "Initiated"


@pytest.mark.integration
def test_report_previous_status_null_without_prior_year(sentinel_academic_year, cleanup_yse_family):
    si = _find_web_indicator()
    _make_yse(TEST_ACADEMIC_YEAR_NAME, si, status_level="Defined")

    report = get_indicator_report(si.composite_key, TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV)

    assert report["status"]["status_level"] == "Defined"
    assert report["status"]["previous_status_level"] is None
