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
from app.database.queries.compound_queries.get_indicator_report import (
    get_indicator_report,
    _no_active_documents,
    _supporting,
    _undocumented,
)
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


# --- _no_active_documents / _undocumented -------------------------------------
# Regression: the flag read supporting_documents ONLY, so an implementation with a
# single deprecated PDF alongside live published webpages was reported as having
# "No active documentation". Three real implementations were mislabelled that way
# (CEETL Courses, Procurement Trainings, SSU Site Improve Reports — each one
# deprecated doc against 4-5 live pages). The documentation pool is documents AND
# webpages, matching implementationConfig.allDocumentsDepreciated on the frontend.

class _FakeDoc:
    def __init__(self, depreciated=False):
        self.depreciated = depreciated


class _FakePage:
    def __init__(self, depreciated=False, no_longer_exists=False):
        self.depreciated = depreciated
        self.no_longer_exists = no_longer_exists


class _FakeImpl:
    def __init__(self, docs=(), pages=()):
        self.supporting_documents = _FakeManager([(d, None) for d in docs])
        self.supporting_webpages = _FakeManager([(p, None) for p in pages])


@pytest.mark.unit
def test_no_active_documents_counts_webpages_as_documentation():
    """A live webpage keeps the flag off even when every document is deprecated."""
    impl = _FakeImpl(docs=[_FakeDoc(depreciated=True)], pages=[_FakePage()])
    assert _no_active_documents(impl) is False
    assert _undocumented(impl) is False


@pytest.mark.unit
def test_no_active_documents_when_whole_pool_is_dead():
    """Deprecated docs AND dead pages — the flag is earned."""
    impl = _FakeImpl(
        docs=[_FakeDoc(depreciated=True)],
        pages=[_FakePage(depreciated=True), _FakePage(no_longer_exists=True)],
    )
    assert _no_active_documents(impl) is True


@pytest.mark.unit
def test_no_active_documents_webpage_link_rot_is_dead():
    """no_longer_exists alone kills a page — link rot is not live documentation."""
    impl = _FakeImpl(docs=[], pages=[_FakePage(no_longer_exists=True)])
    assert _no_active_documents(impl) is True
    assert _undocumented(impl) is False, "a page is attached, so it is not undocumented"


@pytest.mark.unit
def test_no_active_documents_is_false_when_nothing_attached():
    """Zero attached items is _undocumented's job, not this flag's."""
    impl = _FakeImpl()
    assert _no_active_documents(impl) is False
    assert _undocumented(impl) is True


@pytest.mark.unit
def test_no_active_documents_live_document_alone_is_enough():
    impl = _FakeImpl(docs=[_FakeDoc()], pages=[_FakePage(no_longer_exists=True)])
    assert _no_active_documents(impl) is False


@pytest.mark.unit
def test_depreciated_accepts_legacy_string_flag():
    """Older rows stored the boolean as the string 'True'."""
    impl = _FakeImpl(docs=[_FakeDoc(depreciated="True")])
    assert _no_active_documents(impl) is True


@pytest.mark.integration
def test_retired_implementations_sort_to_the_bottom(sentinel_academic_year, cleanup_yse_family):
    """Retired evidence sinks below active evidence, with type grouping preserved.

    Ordered in get_indicator_report rather than in each renderer, so the in-app
    report, the public report page and the email export cannot drift apart.
    """
    from app.database.graph_schema import Guidance, Process

    si = _find_web_indicator()
    yse = _make_yse(TEST_ACADEMIC_YEAR_NAME, si)

    # Interleaved on purpose: a retired item inside each type group, so a passing
    # result cannot be an accident of the type-by-type build order.
    made = []
    try:
        for title, cls, retired in [
            (f"{TEST_ACADEMIC_YEAR_NAME} Process Retired", Process, True),
            (f"{TEST_ACADEMIC_YEAR_NAME} Process Active", Process, False),
            (f"{TEST_ACADEMIC_YEAR_NAME} Guidance Retired", Guidance, True),
            (f"{TEST_ACADEMIC_YEAR_NAME} Guidance Active", Guidance, False),
        ]:
            node = cls(title=title, retired=retired).save()
            node.is_evidence_for.connect(yse)
            made.append(node)

        impls = get_indicator_report(si.composite_key, TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV)["implementations"]
        mine = [im for im in impls if im["title"].startswith(TEST_ACADEMIC_YEAR_NAME)]
        assert len(mine) == 4

        flags = [bool(im["retired"]) for im in mine]
        assert flags == sorted(flags), f"retired must come last, got {flags}"
        assert flags == [False, False, True, True]

        # Stability: within each half the type-by-type build order survives.
        assert [im["type"] for im in mine] == ["Process", "Guidance", "Process", "Guidance"]
    finally:
        for node in made:
            node.delete()
