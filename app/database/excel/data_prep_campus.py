from app.database.class_factory import working_groups
from app.database.queries.compound_queries.persons_assigned_to_yse import fetch_persons_assigned_to_yse
from app.database.queries.individuals.read import get_all_persons_basic
from app.database.queries.organizational_units.read import get_all_campuses
from app.database.queries.evidence.read import get_all_status_level_nodes


CAMPUS_LIST = [
    {"abbreviation": "sfsu", "label": "San Francisco State University"},
    {"abbreviation": "ssu", "label": "Sonoma State"},
    {"abbreviation": "csueb", "label": "CSU East Bay"},
]


def prepare_export_data(academic_year: str) -> dict:
    """
    Gathers all data needed for the campus-scoped Excel export.

    Returns {
        'academic_year': str,
        'campuses': [
            {
                'abbreviation': str,
                'label': str,
                'working_groups': [
                    {
                        'name': str,
                        'rows': [
                            {
                                'goal': str,
                                'indicator': str or None,
                                'yse': str or None,
                                'academic_year': str or None,
                                'implementors': str or None (comma-separated names),
                                'campus': str or None,
                                'campus_abbreviation': str or None,
                                'person_details': list of dicts
                            }
                        ]
                    }
                ]
            }
        ],
        'all_persons': [{'name': str, 'employee_id': str}],
        'all_campuses': [{'name': str}]
    }
    """
    campus_data = []

    for campus_info in CAMPUS_LIST:
        abbrev = campus_info["abbreviation"]
        wg_data = []

        for wg_name in working_groups:
            rows = _fetch_working_group_rows(wg_name, academic_year, abbrev)
            wg_data.append({
                'name': wg_name,
                'rows': rows
            })

        campus_data.append({
            'abbreviation': abbrev,
            'label': campus_info["label"],
            'working_groups': wg_data
        })

    all_persons = _fetch_all_persons()
    all_campuses = _fetch_all_campuses()
    all_status_levels = _fetch_all_status_levels()

    return {
        'academic_year': academic_year,
        'campuses': campus_data,
        'all_persons': all_persons,
        'all_campuses': all_campuses,
        'all_status_levels': all_status_levels,
    }


def _fetch_working_group_rows(working_group: str, academic_year: str, campus_abbreviation: str) -> list:
    """Fetch and format rows for a single working group filtered by campus."""
    try:
        results, meta = fetch_persons_assigned_to_yse(working_group, academic_year, campus_abbreviation)
    except Exception:
        return []

    if not results:
        return []

    # meta columns: goal_description, goal, goal_number, indicator, indicator_id,
    # yse, academic_year, status, implementors, organizations, campus, campus_abbreviation
    rows = []
    for row in results:
        rows.append({
            'goal_description': row[0],
            'goal': row[1],
            'indicator_id': row[4] or '',
            'indicator': row[3],
            'status': row[7],
            'implementors': row[8],
            'organizations': row[9],
        })
    return rows


def _fetch_all_persons() -> list:
    """Fetch all persons with their organization and campus for the reference sheet."""
    from neomodel import db
    try:
        query = """
        MATCH (p:Person)
        OPTIONAL MATCH (org)-[:employs]->(p)
          WHERE org:Department OR org:College
        OPTIONAL MATCH (org)-[:operates_under_campus]->(c:Campus)
        RETURN p.name AS name,
               p.employee_id AS employee_id,
               org.name AS organization,
               c.name AS campus
        ORDER BY p.name
        """
        results, _ = db.cypher_query(query)
        return [
            {
                'name': row[0] or '',
                'employee_id': row[1] or '',
                'organization': row[2] or '',
                'campus': row[3] or '',
            }
            for row in results
        ]
    except Exception:
        return []


def _fetch_all_campuses() -> list:
    """Fetch all campuses for the validation/dropdown sheet."""
    try:
        campuses = get_all_campuses()
        return [{'name': c.name} for c in campuses]
    except Exception:
        return []


def _fetch_all_status_levels() -> list:
    """Fetch all status levels for the reference sheet."""
    try:
        levels = get_all_status_level_nodes()
        return sorted([
            {
                'status_level': sl.status_level,
                'status_value': sl.status_value,
                'description_of_procedures': sl.description_of_procedures,
                'description_of_documentation': sl.description_of_documentation,
                'description_of_documentation_evidence': sl.description_of_documentation_evidence,
                'description_of_resources': sl.description_of_resources,
            }
            for sl in levels
        ], key=lambda x: int(x['status_value'] or 0))
    except Exception:
        return []
