"""
Seeding script to create stub YSE nodes for SSU and CSUEB campuses.

Creates YearSuccessEvidence nodes for every (non-removed) SuccessIndicator
for academic year 2024-2025, connected to ssu and csueb campuses.
Status is set to "Not Started". No implementation evidence is attached.

Run with: python -m app.database.tools.seed_campus_yse_stubs
"""
from app.database.graph_schema import (
    set_connection, SuccessIndicator, AcademicYear, Campus, StatusLevel, YearSuccessEvidence
)
from neomodel import db


CAMPUSES = ["ssu", "csueb"]
ACADEMIC_YEARS = ["2024-2025"]
DEFAULT_STATUS = "Not Started"


def seed_yse_stubs():
    # Look up shared nodes
    status_node = StatusLevel.nodes.get(status_level=DEFAULT_STATUS)
    print(f"Status level: {status_node.status_level}")

    campus_nodes = {}
    for abbrev in CAMPUSES:
        campus_nodes[abbrev] = Campus.nodes.get(abbreviation=abbrev)
        print(f"Campus: {campus_nodes[abbrev].name} ({abbrev})")

    year_nodes = {}
    for year_name in ACADEMIC_YEARS:
        year_nodes[year_name] = AcademicYear.nodes.get(name=year_name)
        print(f"Academic year: {year_nodes[year_name].name}")

    # Get all non-removed indicators
    indicators = SuccessIndicator.nodes.all()
    active_indicators = [i for i in indicators if not i.removed]
    print(f"\nActive indicators: {len(active_indicators)}")

    created = 0
    skipped = 0

    for indicator in active_indicators:
        for year_name in ACADEMIC_YEARS:
            for abbrev in CAMPUSES:
                year_identifier = f"{year_name}-{indicator.composite_key}-{abbrev}"

                # Check if already exists
                existing = YearSuccessEvidence.nodes.filter(year_identifier=year_identifier)
                if existing:
                    skipped += 1
                    continue

                # Create the stub YSE
                yse = YearSuccessEvidence(year_identifier=year_identifier)
                yse.save()

                # Fetch fresh to connect relationships
                yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
                yse_node.academic_year.connect(year_nodes[year_name])
                yse_node.tracks_success_indicator.connect(indicator)
                yse_node.status_level.connect(status_node)
                yse_node.campus.connect(campus_nodes[abbrev])

                created += 1
                print(f"  Created: {year_identifier}")

    print(f"\nDone. Created: {created}, Skipped (already existed): {skipped}")


def verify():
    print("\n" + "=" * 60)
    print("Verification")
    print("=" * 60)

    query = """
    MATCH (yse:YearSuccessEvidence)-[:evidence_at_campus]->(c:Campus)
    WHERE c.abbreviation IN $campuses
    OPTIONAL MATCH (yse)-[:evidence_in_year]->(y:AcademicYear)
    RETURN c.abbreviation AS campus, y.name AS year, count(yse) AS count
    ORDER BY campus, year
    """
    results, _ = db.cypher_query(query, {'campuses': CAMPUSES})

    for row in results:
        print(f"  {row[0]} / {row[1]}: {row[2]} YSE nodes")

    # Check a sample
    query = """
    MATCH (yse:YearSuccessEvidence)-[:evidence_at_campus]->(c:Campus)
    WHERE c.abbreviation IN $campuses
    MATCH (yse)-[:status_is]->(sl:StatusLevel)
    RETURN yse.year_identifier AS id, c.abbreviation AS campus, sl.status_level AS status
    LIMIT 5
    """
    results, _ = db.cypher_query(query, {'campuses': CAMPUSES})
    print("\nSample stubs:")
    for row in results:
        print(f"  {row[0]}  campus={row[1]}  status={row[2]}")


if __name__ == "__main__":
    set_connection()

    print("=" * 60)
    print("Seed Campus YSE Stubs (ssu, csueb)")
    print("=" * 60 + "\n")

    seed_yse_stubs()
    verify()
