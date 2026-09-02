"""
reset_campus_admin_review — campus + year scoped full reset of the admin-review
field family on YearSuccessEvidence.

Isolation: YSEs are created under the sentinel year (9999-9999) at two REAL
campuses (shared reference data, only edges from sentinel nodes touch them).
Person / Note fixtures carry the sentinel name prefix; cleanup filters on it.
"""
import pytest
from neomodel import db

from tests.conftest import TEST_ACADEMIC_YEAR_NAME as SENTINEL

YSE_A = f"{SENTINEL}_reset-test-a"
YSE_B = f"{SENTINEL}_reset-test-b"
PERSON_NAME = f"{SENTINEL} Test Reviewer"
NOTE_NAME = f"{SENTINEL} Test Reviewer Note"

pytestmark = [pytest.mark.integration]


@pytest.fixture
def cleanup_review_fixtures(neo4j_connection):
    yield
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (n:Note) WHERE n.name STARTS WITH $prefix DETACH DELETE n",
        {"prefix": SENTINEL},
    )


@pytest.fixture
def two_campuses(neo4j_connection):
    rows, _ = db.cypher_query("MATCH (c:Campus) RETURN c.abbreviation ORDER BY c.abbreviation LIMIT 2")
    if len(rows) < 2:
        pytest.skip("needs at least two Campus nodes")
    return rows[0][0], rows[1][0]


@pytest.fixture
def reviewed_yses(sentinel_academic_year, cleanup_yse_family, cleanup_review_fixtures, two_campuses):
    """Two sentinel YSEs with full review state — one per campus; a note on A."""
    campus_a, campus_b = two_campuses
    db.cypher_query(
        """
        MATCH (year:AcademicYear {name: $year})
        MATCH (ca:Campus {abbreviation: $campus_a})
        MATCH (cb:Campus {abbreviation: $campus_b})
        CREATE (p:Person {name: $person_name, employee_id: $person_name})
        CREATE (n:Note {name: $note_name, description: 'reviewer feedback'})
        CREATE (a:YearSuccessEvidence {
            year_identifier: $yse_a,
            administrative_review_complete: true,
            ready_for_admin_review: true,
            administrative_review_completed_date: date('2026-01-15'),
            admin_review_description: 'looks complete'
        })
        CREATE (b:YearSuccessEvidence {
            year_identifier: $yse_b,
            administrative_review_complete: true,
            ready_for_admin_review: true,
            admin_review_description: 'other campus'
        })
        CREATE (a)-[:evidence_in_year]->(year)
        CREATE (b)-[:evidence_in_year]->(year)
        CREATE (a)-[:evidence_at_campus]->(ca)
        CREATE (b)-[:evidence_at_campus]->(cb)
        CREATE (a)-[:admin_review_completed_by]->(p)
        CREATE (b)-[:admin_review_completed_by]->(p)
        CREATE (a)-[:admin_review_note]->(n)
        """,
        {
            "year": SENTINEL, "campus_a": campus_a, "campus_b": campus_b,
            "person_name": PERSON_NAME, "note_name": NOTE_NAME,
            "yse_a": YSE_A, "yse_b": YSE_B,
        },
    )
    return campus_a, campus_b


def _review_state(year_identifier):
    rows, _ = db.cypher_query(
        """
        MATCH (e:YearSuccessEvidence {year_identifier: $yid})
        OPTIONAL MATCH (e)-[rel:admin_review_completed_by]->(:Person)
        OPTIONAL MATCH (e)-[:admin_review_note]->(n:Note)
        RETURN e.administrative_review_complete, e.ready_for_admin_review,
               e.administrative_review_completed_date, e.admin_review_description,
               count(DISTINCT rel), count(DISTINCT n)
        """,
        {"yid": year_identifier},
    )
    complete, ready, completed_date, description, approvers, notes = rows[0]
    return {
        "complete": complete, "ready": ready, "date": completed_date,
        "description": description, "approvers": approvers, "notes": notes,
    }


def test_dry_run_counts_without_writing(reviewed_yses):
    from app.database.tools.reset_campus_admin_review import reset_campus_admin_review

    campus_a, _ = reviewed_yses
    counts = reset_campus_admin_review(SENTINEL, campus_a, dry_run=True)

    assert counts["yses_in_scope"] == 1
    assert counts["yses_with_review_state"] == 1
    assert counts["approver_links"] == 1
    assert counts["reviewer_notes"] == 1
    assert counts["yses_reset"] == 0

    state = _review_state(YSE_A)
    assert state["complete"] is True and state["approvers"] == 1


def test_reset_scopes_to_campus_and_keeps_notes(reviewed_yses):
    from app.database.tools.reset_campus_admin_review import reset_campus_admin_review

    campus_a, _ = reviewed_yses
    counts = reset_campus_admin_review(SENTINEL, campus_a)
    assert counts["yses_reset"] == 1
    assert counts["approver_links_removed"] == 1
    assert counts["notes_deleted"] == 0

    a = _review_state(YSE_A)
    assert a["complete"] is False
    assert a["ready"] is False
    assert a["date"] is None
    assert a["description"] is None
    assert a["approvers"] == 0
    assert a["notes"] == 1  # reviewer notes survive without --include-notes

    # The other campus's YSE is untouched.
    b = _review_state(YSE_B)
    assert b["complete"] is True and b["ready"] is True and b["approvers"] == 1

    # Re-running is an idempotent no-op.
    again = reset_campus_admin_review(SENTINEL, campus_a)
    assert again["yses_with_review_state"] == 0
    assert again["approver_links_removed"] == 0


def test_include_notes_deletes_reviewer_notes(reviewed_yses):
    from app.database.tools.reset_campus_admin_review import reset_campus_admin_review

    campus_a, _ = reviewed_yses
    counts = reset_campus_admin_review(SENTINEL, campus_a, include_notes=True)
    assert counts["notes_deleted"] == 1
    assert _review_state(YSE_A)["notes"] == 0


def test_unknown_scope_fails_loudly(neo4j_connection):
    from app.database.tools.reset_campus_admin_review import reset_campus_admin_review

    with pytest.raises(SystemExit, match="AcademicYear"):
        reset_campus_admin_review("0000-0000", "sfsu")
    with pytest.raises(SystemExit, match="Campus"):
        reset_campus_admin_review(SENTINEL, "not-a-campus")
