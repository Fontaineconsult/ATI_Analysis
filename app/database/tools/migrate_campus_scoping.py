"""
One-time migration script to add campus scoping to YearSuccessEvidence.

1. Sets abbreviations on existing Campus nodes
2. Connects all existing YSE nodes to sfsu (default campus)
3. Appends '-sfsu' to all existing year_identifier values

Run with: python -m app.database.tools.migrate_campus_scoping
"""
from app.database.graph_schema import set_connection, Campus, YearSuccessEvidence
from neomodel import db


CAMPUS_ABBREVIATIONS = {
    "San Francisco State University": "sfsu",
    "Sonoma State": "ssu",
    "CSU East Bay": "csueb",
}


def step_1_set_campus_abbreviations():
    """Set abbreviation property on existing Campus nodes."""
    print("Step 1: Setting campus abbreviations...")

    for name, abbrev in CAMPUS_ABBREVIATIONS.items():
        try:
            campus = Campus.nodes.get(name=name)
            campus.abbreviation = abbrev
            campus.save()
            print(f"  {name} -> {abbrev}")
        except Campus.DoesNotExist:
            print(f"  WARNING: Campus '{name}' not found, skipping.")
        except Exception as e:
            print(f"  ERROR setting abbreviation for '{name}': {e}")
            raise

    print("  Done.\n")


def step_2_connect_yse_to_sfsu():
    """Connect all existing YSE nodes (without a campus) to sfsu."""
    print("Step 2: Connecting existing YSE nodes to sfsu campus...")

    query = """
    MATCH (c:Campus {abbreviation: 'sfsu'})
    MATCH (yse:YearSuccessEvidence)
    WHERE NOT (yse)-[:evidence_at_campus]->(:Campus)
    MERGE (yse)-[:evidence_at_campus]->(c)
    RETURN count(yse) AS updated_count
    """

    results, _ = db.cypher_query(query)
    count = results[0][0] if results else 0
    print(f"  Connected {count} YSE nodes to sfsu.")
    print("  Done.\n")


def step_3_append_campus_to_year_identifiers():
    """Append '-sfsu' to all existing year_identifier values that don't already have a campus suffix."""
    print("Step 3: Appending '-sfsu' to existing year_identifiers...")

    # Only update identifiers that don't already end with a campus abbreviation
    all_abbrevs = list(CAMPUS_ABBREVIATIONS.values())

    query = """
    MATCH (yse:YearSuccessEvidence)
    WHERE NONE(abbrev IN $abbreviations WHERE yse.year_identifier ENDS WITH ('-' + abbrev))
    SET yse.year_identifier = yse.year_identifier + '-sfsu'
    RETURN count(yse) AS updated_count
    """

    results, _ = db.cypher_query(query, {'abbreviations': all_abbrevs})
    count = results[0][0] if results else 0
    print(f"  Updated {count} year_identifiers.")
    print("  Done.\n")


def verify():
    """Verify the migration results."""
    print("Verification:")

    # Check campus abbreviations
    for name, abbrev in CAMPUS_ABBREVIATIONS.items():
        try:
            campus = Campus.nodes.get(abbreviation=abbrev)
            print(f"  Campus '{campus.name}' has abbreviation '{campus.abbreviation}'")
        except Campus.DoesNotExist:
            print(f"  FAIL: No campus with abbreviation '{abbrev}'")

    # Check YSE -> Campus connections
    query = """
    MATCH (yse:YearSuccessEvidence)
    OPTIONAL MATCH (yse)-[:evidence_at_campus]->(c:Campus)
    RETURN c.abbreviation AS campus, count(yse) AS count
    ORDER BY campus
    """
    results, _ = db.cypher_query(query)
    print("\n  YSE nodes by campus:")
    for row in results:
        campus = row[0] if row[0] else "NO CAMPUS"
        print(f"    {campus}: {row[1]} nodes")

    # Sample year_identifiers
    query = """
    MATCH (yse:YearSuccessEvidence)
    RETURN yse.year_identifier AS id
    LIMIT 5
    """
    results, _ = db.cypher_query(query)
    print("\n  Sample year_identifiers:")
    for row in results:
        print(f"    {row[0]}")

    print("\nMigration verification complete.")


if __name__ == "__main__":
    set_connection()

    print("=" * 60)
    print("Campus Scoping Migration")
    print("=" * 60 + "\n")

    step_1_set_campus_abbreviations()
    step_2_connect_yse_to_sfsu()
    step_3_append_campus_to_year_identifiers()
    verify()
