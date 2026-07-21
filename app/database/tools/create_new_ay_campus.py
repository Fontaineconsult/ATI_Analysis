"""
Campus-aware academic year migration script.

Creates a new AcademicYear node (if needed), then for each campus:
1. Duplicates all YSE nodes from the old year to the new year
2. Copies all relationships (tracks, status_is, evidence_at_campus, implements, etc.)
   except evidence_in_year (which gets pointed to the new year)
3. Resets admin review fields on the new year's YSE nodes
4. Creates stub YSE nodes for any campuses that don't have YSE in the old year

Run with: python -m app.database.tools.create_new_ay_campus
"""
from app.database.graph_schema import set_connection, AcademicYear, Campus, SuccessIndicator, YearSuccessEvidence, StatusLevel, CampusPlan
from app.database.identifiers import make_yse_identifier, YEAR_PREFIX_LENGTH, make_campus_plan_identifier
from app.database.queries.committees.create import create_campus_plan
from app.endpoints.data_api.errors.custom_exceptions import ValidationError
from neomodel import db


ALL_CAMPUSES = ["sfsu", "ssu", "csueb"]
DEFAULT_STATUS = "Not Started"


def ensure_academic_year(year_name):
    """Create the AcademicYear node if it doesn't already exist."""
    try:
        ay = AcademicYear.nodes.get(name=year_name)
        print(f"AcademicYear '{year_name}' already exists.")
        return ay
    except AcademicYear.DoesNotExist:
        ay = AcademicYear(name=year_name)
        ay.save()
        print(f"Created AcademicYear '{year_name}'.")
        return AcademicYear.nodes.get(name=year_name)


def duplicate_year_success_evidence(old_year, new_year):
    """
    Duplicate all YSE nodes from old_year to new_year.
    Copies all relationships except evidence_in_year.
    This handles all campuses automatically since evidence_at_campus is copied.
    """
    print(f"\nDuplicating YSE nodes from {old_year} to {new_year}...")

    # Inspect properties first
    inspect_query = """
        MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(oldYear:AcademicYear {name: $old_year})
        WITH e LIMIT 1
        RETURN keys(e) AS properties
    """
    results, _ = db.cypher_query(inspect_query, {'old_year': old_year})
    if results:
        print(f"  YSE properties: {results[0][0]}")

    query = """
        MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(oldYear:AcademicYear {name: $old_year})
        WITH e, $new_year + substring(e.year_identifier, $year_prefix_length) AS new_year_identifier

        // Skip if already exists
        OPTIONAL MATCH (existing:YearSuccessEvidence {year_identifier: new_year_identifier})
        WITH e, new_year_identifier, existing
        WHERE existing IS NULL

        // Create new node
        CREATE (e2:YearSuccessEvidence)
        SET e2.year_identifier = new_year_identifier
        SET e2.unique_id = randomUUID()

        // Copy optional properties
        FOREACH (ignoreMe IN CASE WHEN e.description IS NOT NULL THEN [1] ELSE [] END |
            SET e2.description = e.description)
        FOREACH (ignoreMe IN CASE WHEN e.status IS NOT NULL THEN [1] ELSE [] END |
            SET e2.status = e.status)
        FOREACH (ignoreMe IN CASE WHEN e.created_at IS NOT NULL THEN [1] ELSE [] END |
            SET e2.created_at = e.created_at)
        FOREACH (ignoreMe IN CASE WHEN e.updated_at IS NOT NULL THEN [1] ELSE [] END |
            SET e2.updated_at = e.updated_at)

        WITH e, e2

        // Copy outgoing relationships (except evidence_in_year)
        CALL {
            WITH e, e2
            MATCH (e)-[rel_out]->(n)
            WHERE type(rel_out) <> 'evidence_in_year'
            WITH e2, type(rel_out) AS relType, properties(rel_out) AS relProps, n
            CALL apoc.create.relationship(e2, relType, relProps, n) YIELD rel
            RETURN count(*) AS outgoingRelCount
        }
        WITH e, e2

        // Copy incoming relationships (except evidence_in_year). Retired
        // implementations do NOT carry forward: their is_evidence_for edge
        // stays on the old year's YSE (history intact) but is not copied to
        // the new year.
        CALL {
            WITH e, e2
            MATCH (n)-[rel_in]->(e)
            WHERE type(rel_in) <> 'evidence_in_year'
              AND NOT (type(rel_in) = 'is_evidence_for' AND coalesce(n.retired, false))
            WITH e2, type(rel_in) AS relType, properties(rel_in) AS relProps, n
            CALL apoc.create.relationship(n, relType, relProps, e2) YIELD rel
            RETURN count(*) AS incomingRelCount
        }
        WITH e2

        // Connect to the new academic year
        MATCH (newYear:AcademicYear {name: $new_year})
        MERGE (e2)-[:evidence_in_year]->(newYear)
        RETURN e2.year_identifier AS created_identifier
    """

    results, _ = db.cypher_query(query, {'old_year': old_year, 'new_year': new_year, 'year_prefix_length': YEAR_PREFIX_LENGTH})
    print(f"  Duplicated {len(results)} YSE nodes from {old_year} to {new_year}")
    if results:
        print("  Sample:")
        for row in results[:5]:
            print(f"    {row[0]}")

    return results


def create_stub_yse_for_missing_campuses(new_year):
    """
    For any campus that has no YSE nodes in the new year, create stubs
    for every active indicator. This covers campuses that were added after
    the old year was set up.
    """
    print(f"\nChecking for campuses missing YSE in {new_year}...")

    status_node = StatusLevel.nodes.get(status_level=DEFAULT_STATUS)
    year_node = AcademicYear.nodes.get(name=new_year)

    indicators = SuccessIndicator.nodes.all()
    active_indicators = [i for i in indicators if not i.removed]

    created = 0
    for abbrev in ALL_CAMPUSES:
        campus_node = Campus.nodes.get(abbreviation=abbrev)

        # Check how many YSE this campus already has for this year
        query = """
        MATCH (yse:YearSuccessEvidence)-[:evidence_at_campus]->(c:Campus {abbreviation: $abbrev})
        MATCH (yse)-[:evidence_in_year]->(y:AcademicYear {name: $year})
        RETURN count(yse) AS count
        """
        results, _ = db.cypher_query(query, {'abbrev': abbrev, 'year': new_year})
        existing_count = results[0][0] if results else 0

        if existing_count >= len(active_indicators):
            print(f"  {abbrev}: already has {existing_count} YSE nodes, skipping.")
            continue

        print(f"  {abbrev}: has {existing_count} YSE nodes, creating stubs for missing indicators...")

        for indicator in active_indicators:
            year_identifier = make_yse_identifier(new_year, indicator.composite_key, abbrev)

            existing = YearSuccessEvidence.nodes.filter(year_identifier=year_identifier)
            if existing:
                continue

            yse = YearSuccessEvidence(year_identifier=year_identifier)
            yse.save()

            yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
            yse_node.academic_year.connect(year_node)
            yse_node.tracks_success_indicator.connect(indicator)
            yse_node.status_level.connect(status_node)
            yse_node.campus.connect(campus_node)

            created += 1

    print(f"  Created {created} stub YSE nodes.")


def reset_admin_review_for_year(year):
    """Reset admin review fields on all YSE nodes for the given year."""
    print(f"\nResetting admin review for {year}...")

    query = """
        MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(year:AcademicYear {name: $year})

        SET e.administrative_review_complete = false
        REMOVE e.administrative_review_completed_date

        WITH e, year

        OPTIONAL MATCH (e)-[rel:admin_review_completed_by]->(person:Person)
        DELETE rel

        WITH e, year, person
        RETURN count(DISTINCT e) AS nodes_reset,
               count(DISTINCT person) AS relationships_removed,
               year.name AS year_name
    """

    results, _ = db.cypher_query(query, {'year': year})

    if results:
        print(f"  {results[0][0]} YSE nodes reset")
        print(f"  {results[0][1]} admin_review_completed_by relationships removed")
    else:
        print(f"  No YSE nodes found for {year}")


def verify(new_year):
    print("\n" + "=" * 60)
    print("Verification")
    print("=" * 60)

    query = """
    MATCH (yse:YearSuccessEvidence)-[:evidence_in_year]->(y:AcademicYear {name: $year})
    OPTIONAL MATCH (yse)-[:evidence_at_campus]->(c:Campus)
    RETURN COALESCE(c.abbreviation, 'NO CAMPUS') AS campus, count(yse) AS count
    ORDER BY campus
    """
    results, _ = db.cypher_query(query, {'year': new_year})

    print(f"\nYSE nodes for {new_year} by campus:")
    total = 0
    for row in results:
        print(f"  {row[0]}: {row[1]}")
        total += row[1]
    print(f"  TOTAL: {total}")


def propagate_documentation_years_for(new_year):
    """
    For every implementation that has YearSuccessEvidence in `new_year`, find
    its `is_documented_by` rels whose `included_in_years` is non-empty AND
    missing `new_year`, and append `new_year` to that list.

    Empty `included_in_years` lists are intentionally left alone: they already
    mean "applies to all years" per DocumentedByRel's default. We only act on
    rels whose curators populated the whitelist in a prior year — those edges
    silently drop out of the master query for the new year unless the new
    year is added to the whitelist.

    Idempotent: re-running adds no duplicates because of `NOT $new_year IN ...`.
    Safe to backfill prior years too — pass any year that's been rolled over.
    """
    print(f"\nPropagating documentation years to {new_year}...")

    # WITH DISTINCT r is critical: an implementation that's evidence for many
    # YSEs in the same year will surface here once per (impl, yse) pair, and
    # without dedup the SET would append $new_year to the same rel multiple
    # times, accumulating duplicate entries in included_in_years.
    query = """
        MATCH (impl)-[:is_evidence_for]->(yse:YearSuccessEvidence)
                      -[:evidence_in_year]->(:AcademicYear {name: $new_year})
        WHERE impl:Process OR impl:Project OR impl:Procedure OR impl:Service
           OR impl:Guidance OR impl:Tracking OR impl:InternalPolicy
        MATCH (impl)-[r:is_documented_by]->()
        WHERE size(r.included_in_years) > 0
          AND NOT $new_year IN r.included_in_years
        WITH DISTINCT r
        SET r.included_in_years = r.included_in_years + $new_year
        RETURN count(r) AS updated
    """
    results, _ = db.cypher_query(query, {"new_year": new_year})
    updated = results[0][0] if results else 0
    print(f"  Appended {new_year!r} to {updated} is_documented_by rel(s).")
    return updated


def create_campus_plans_for_year(year_name):
    """
    For each campus in ALL_CAMPUSES, ensure a CampusPlan + its three
    WorkingGroupPlans exist for the given year. Idempotent: skips any
    campus that already has a CampusPlan with the canonical identifier.
    """
    print(f"\nCreating CampusPlans for {year_name}...")

    created = 0
    skipped = 0
    for abbrev in ALL_CAMPUSES:
        plan_identifier = make_campus_plan_identifier(year_name, abbrev)
        if CampusPlan.nodes.filter(plan_identifier=plan_identifier):
            print(f"  {abbrev}: CampusPlan {plan_identifier!r} already exists, skipping.")
            skipped += 1
            continue

        try:
            create_campus_plan(abbrev, year_name)
            print(f"  {abbrev}: created CampusPlan {plan_identifier!r} + 3 WorkingGroupPlans")
            created += 1
        except ValidationError as e:
            # Race against the existence check above, or a partial run leaving
            # children behind. Surface and continue.
            print(f"  {abbrev}: skipped — {e}")
            skipped += 1

    print(f"  Created {created} CampusPlans, skipped {skipped}.")


def run_migration(old_year, new_year):
    print("=" * 60)
    print(f"Academic Year Migration: {old_year} -> {new_year}")
    print("=" * 60)

    ensure_academic_year(new_year)
    duplicate_year_success_evidence(old_year, new_year)
    create_stub_yse_for_missing_campuses(new_year)
    reset_admin_review_for_year(new_year)
    propagate_documentation_years_for(new_year)
    create_campus_plans_for_year(new_year)
    verify(new_year)

    print("\nMigration complete.")


if __name__ == "__main__":
    set_connection()

    OLD_YEAR = "2024-2025"
    NEW_YEAR = "2025-2026"

    run_migration(OLD_YEAR, NEW_YEAR)
