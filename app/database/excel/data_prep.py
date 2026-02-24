from app.database.class_factory import working_groups
from app.database.queries.compound_queries.persons_assigned_to_yse import fetch_persons_assigned_to_yse
from app.database.queries.individuals.read import get_all_persons_basic
from app.database.queries.organizational_units.read import get_all_campuses


def prepare_export_data(academic_year: str) -> dict:
    """
    Gathers all data needed for the Excel export across every working group.

    Returns {
        'academic_year': str,
        'working_groups': [
            {
                'name': str,
                'rows': [
                    {
                        'goal': str,
                        'indicator': str or None,
                        'yse': str or None,
                        'academic_year': str or None,
                        'implementor': str or None,
                        'employee_id': str or None,
                        'org_type': str or None,
                        'organization': str or None,
                        'campus': str or None
                    }
                ]
            }
        ],
        'all_persons': [{'name': str, 'employee_id': str}],
        'all_campuses': [{'name': str}]
    }
    """
    wg_data = []

    for wg_name in working_groups:
        rows = _fetch_working_group_rows(wg_name, academic_year)
        wg_data.append({
            'name': wg_name,
            'rows': rows
        })

    all_persons = _fetch_all_persons()
    all_campuses = _fetch_all_campuses()

    return {
        'academic_year': academic_year,
        'working_groups': wg_data,
        'all_persons': all_persons,
        'all_campuses': all_campuses
    }


def _fetch_working_group_rows(working_group: str, academic_year: str) -> list:
    """Fetch and format rows for a single working group."""
    try:
        results, meta = fetch_persons_assigned_to_yse(working_group, academic_year)
    except Exception:
        return []

    if not results:
        return []

    # meta contains column names: goal, indicator, yse, academic_year,
    # implementor, employee_id, org_type, organization, campus
    rows = []
    for row in results:
        rows.append({
            'goal': row[0],
            'indicator': row[1],
            'yse': row[2],
            'academic_year': row[3],
            'implementor': row[4],
            'employee_id': row[5],
            'org_type': row[6],
            'organization': row[7],
            'campus': row[8]
        })
    return rows


def _fetch_all_persons() -> list:
    """Fetch all persons for the validation/dropdown sheet."""
    try:
        persons = get_all_persons_basic()
        return [
            {'name': p.name, 'employee_id': p.employee_id}
            for p in persons
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
