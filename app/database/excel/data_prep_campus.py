from neomodel import db

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
        evidence_map = _fetch_evidence_summary(academic_year, abbrev)
        si_notes_map = _fetch_si_notes(academic_year, abbrev)
        wg_data = []

        for wg_name in working_groups:
            rows = _fetch_working_group_rows(wg_name, academic_year, abbrev,
                                             evidence_map, si_notes_map)
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


def _fetch_working_group_rows(working_group: str, academic_year: str,
                              campus_abbreviation: str,
                              evidence_map: dict = None,
                              si_notes_map: dict = None) -> list:
    """Fetch and format rows for a single working group filtered by campus."""
    try:
        results, meta = fetch_persons_assigned_to_yse(working_group, academic_year, campus_abbreviation)
    except Exception:
        return []

    if not results:
        return []

    evidence_map = evidence_map or {}
    si_notes_map = si_notes_map or {}

    # meta columns: goal_description, goal, goal_number, indicator, indicator_id,
    # yse, academic_year, status, implementors, organizations, campus, campus_abbreviation
    rows = []
    for row in results:
        yi = row[5] or ''
        rows.append({
            'goal_description': row[0],
            'goal': row[1],
            'indicator_id': row[4] or '',
            'indicator': row[3],
            'status': row[7],
            'implementors': row[8],
            'organizations': row[9],
            'evidence': evidence_map.get(yi, ''),
            'si_notes': si_notes_map.get(yi, ''),
        })
    return rows


def _fetch_evidence_summary(academic_year: str, campus_abbreviation: str) -> dict:
    """Fetch implementation → documentation evidence per YSE, returned as {year_identifier: formatted_string}."""
    try:
        query = """
        MATCH (yse:YearSuccessEvidence)-[:evidence_in_year]->(year:AcademicYear)
        MATCH (yse)-[:evidence_at_campus]->(campus:Campus)
        WHERE year.name = $academic_year AND campus.abbreviation = $campus_abbreviation

        OPTIONAL MATCH (impl)-[:is_evidence_for]->(yse)
        WHERE impl:Process OR impl:Project OR impl:Procedure OR impl:Service
           OR impl:Guidance OR impl:Tracking OR impl:InternalPolicy

        OPTIONAL MATCH (impl)-[docRel:is_documented_by]->(doc)
        WHERE (doc:Document OR doc:Webpage OR doc:Note OR doc:Message)
          AND ($academic_year IN docRel.included_in_years
               OR size(docRel.included_in_years) = 0)
          AND NOT $academic_year IN docRel.excluded_from_years

        WITH yse.year_identifier AS yi,
             impl, labels(impl) AS implLabels, impl.title AS implTitle,
             collect(DISTINCT {type: labels(doc)[0], name: doc.name}) AS docs

        WITH yi,
             collect(DISTINCT {
               type: CASE
                 WHEN 'Process' IN implLabels THEN 'Process'
                 WHEN 'Project' IN implLabels THEN 'Project'
                 WHEN 'Procedure' IN implLabels THEN 'Procedure'
                 WHEN 'Service' IN implLabels THEN 'Service'
                 WHEN 'Guidance' IN implLabels THEN 'Guidance'
                 WHEN 'Tracking' IN implLabels THEN 'Tracking'
                 WHEN 'InternalPolicy' IN implLabels THEN 'Policy'
                 ELSE 'Other'
               END,
               title: implTitle,
               docs: docs
             }) AS implementations

        RETURN yi, implementations
        """
        results, _ = db.cypher_query(query, {
            'academic_year': academic_year,
            'campus_abbreviation': campus_abbreviation
        })
        evidence_map = {}
        for yi, implementations in results:
            text = _format_evidence(implementations)
            if text:
                evidence_map[yi] = text
        return evidence_map
    except Exception:
        return {}


def _format_evidence(implementations: list) -> str:
    """Format implementation + documentation list into a multi-line string."""
    lines = []
    for impl in implementations:
        if not impl.get('title'):
            continue
        lines.append(f"[{impl['type']}] {impl['title']}")
        for doc in impl.get('docs', []):
            if doc.get('name'):
                dtype = (doc.get('type') or '')[:3]
                lines.append(f"  {dtype}: {doc['name']}")
    return '\n'.join(lines)


def _fetch_si_notes(academic_year: str, campus_abbreviation: str) -> dict:
    """Fetch notes directly connected to YSE nodes, returned as {year_identifier: formatted_string}."""
    try:
        query = """
        MATCH (yse:YearSuccessEvidence)-[:evidence_in_year]->(year:AcademicYear)
        MATCH (yse)-[:evidence_at_campus]->(campus:Campus)
        WHERE year.name = $academic_year AND campus.abbreviation = $campus_abbreviation
        OPTIONAL MATCH (yse)-[:has_note]->(note:Note)
        WHERE note.depreciated IS NULL OR note.depreciated = false
        WITH yse.year_identifier AS yi,
             collect(DISTINCT {name: note.name, content: note.content, date: toString(note.date_created)}) AS notes
        RETURN yi, notes
        """
        results, _ = db.cypher_query(query, {
            'academic_year': academic_year,
            'campus_abbreviation': campus_abbreviation
        })
        notes_map = {}
        for yi, notes in results:
            text = _format_si_notes(notes)
            if text:
                notes_map[yi] = text
        return notes_map
    except Exception:
        return {}


def _format_si_notes(notes: list) -> str:
    """Format YSE notes into a multi-line string with date prefixes."""
    lines = []
    for n in notes:
        if not n.get('name'):
            continue
        prefix = f"[{n['date']}] " if n.get('date') else ''
        content = n.get('content', '') or ''
        lines.append(f"{prefix}{content or n['name']}")
    return '\n'.join(lines)


def _fetch_all_persons() -> list:
    """Fetch all persons with their organization and campus for the reference sheet."""
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
