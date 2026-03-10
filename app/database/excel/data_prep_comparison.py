from neomodel import db

from app.database.class_factory import working_groups
from app.database.queries.compound_queries.persons_assigned_to_yse import fetch_persons_assigned_to_yse
from app.database.excel.data_prep_campus import (
    CAMPUS_LIST,
    _fetch_evidence_summary,
    _fetch_si_notes,
    _fetch_all_persons,
    _fetch_all_status_levels,
)

CAMPUS_ORDER = [c["abbreviation"] for c in CAMPUS_LIST]


def prepare_comparison_data(academic_year: str) -> dict:
    """
    Gather all data for the campus comparison Excel export.

    Returns {
        'academic_year': str,
        'all_persons': [...],
        'all_status_levels': [...],
        'working_groups': [
            {
                'name': str,
                'goals': [
                    {
                        'goal_name': str,
                        'goal_number': int,
                        'indicators': [
                            {
                                'indicator_id': str,
                                'indicator_name': str,
                                'campuses': {
                                    'ssu':  {'status': str, 'impl_and_notes': str, 'people_and_orgs': str},
                                    'sfsu': {'status': str, 'impl_and_notes': str, 'people_and_orgs': str},
                                    'csueb': {'status': str, 'impl_and_notes': str, 'people_and_orgs': str},
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
    """
    all_persons = _fetch_all_persons()
    all_status_levels = _fetch_all_status_levels()
    all_documents = _fetch_all_documents(academic_year)

    wg_list = []
    for wg_name in working_groups:
        goals = _build_comparison_for_working_group(wg_name, academic_year)
        wg_list.append({"name": wg_name, "goals": goals})

    return {
        "academic_year": academic_year,
        "all_persons": all_persons,
        "all_status_levels": all_status_levels,
        "all_documents": all_documents,
        "working_groups": wg_list,
    }


def _build_comparison_for_working_group(wg_name: str, academic_year: str) -> list:
    """
    For one working group, fetch data for all 3 campuses and pivot into
    goal -> indicator -> {campus: data} structure.
    """
    indicator_map = {}
    goal_info = {}

    for campus_info in CAMPUS_LIST:
        abbrev = campus_info["abbreviation"]
        evidence_map = _fetch_evidence_summary(academic_year, abbrev)
        si_notes_map = _fetch_si_notes(academic_year, abbrev)

        try:
            results, meta = fetch_persons_assigned_to_yse(wg_name, academic_year, abbrev)
        except Exception:
            results = []

        for row in (results or []):
            goal_name      = row[1] or ""
            goal_number    = row[2] or 0
            indicator_name = row[3] or ""
            indicator_id   = row[4] or ""
            yi             = row[5] or ""
            status         = row[7] or ""
            implementors   = row[8] or ""
            organizations  = row[9] or ""

            key = (goal_number, indicator_id)

            if key not in indicator_map:
                indicator_map[key] = {
                    "indicator_id": indicator_id,
                    "indicator_name": indicator_name,
                    "goal_name": goal_name,
                    "goal_number": goal_number,
                    "campuses": {
                        a: {"status": "", "impl_and_notes": "", "people_and_orgs": ""}
                        for a in CAMPUS_ORDER
                    },
                }

            evidence_str = evidence_map.get(yi, "")
            notes_str = si_notes_map.get(yi, "")
            impl_and_notes = _combine_impl_notes(evidence_str, notes_str)
            people_and_orgs = _combine_people_orgs(implementors, organizations)

            indicator_map[key]["campuses"][abbrev] = {
                "status": status,
                "impl_and_notes": impl_and_notes,
                "people_and_orgs": people_and_orgs,
            }

            if goal_number not in goal_info:
                goal_info[goal_number] = goal_name

    # Group indicators by goal, sorted
    goals_dict = {}
    for key in sorted(indicator_map.keys()):
        gn = key[0]
        if gn not in goals_dict:
            goals_dict[gn] = []
        goals_dict[gn].append(indicator_map[key])

    return [
        {
            "goal_name": goal_info.get(gn, f"Goal {gn}"),
            "goal_number": gn,
            "indicators": goals_dict[gn],
        }
        for gn in sorted(goals_dict.keys())
    ]


def _combine_impl_notes(evidence_str: str, notes_str: str) -> str:
    """Combine evidence summary and SI notes into a single formatted string."""
    parts = []
    if evidence_str:
        parts.append(evidence_str)
    if notes_str:
        parts.append(notes_str)
    return "\n\n".join(parts)


def _combine_people_orgs(implementors: str, organizations: str) -> str:
    """Combine implementors and organizations into a formatted string."""
    parts = []
    if implementors:
        parts.append(f"People: {implementors}")
    if organizations:
        parts.append(f"Orgs: {organizations}")
    return "\n".join(parts)


def _fetch_all_documents(academic_year: str) -> list:
    """Fetch all documents and webpages linked to implementations for the given academic year.

    Groups by document so each doc appears once, with indicator IDs collected
    into a comma-separated string (e.g. "1.2, 1.3, 1.5").

    Returns a list of dicts:
        type, name, url, implementation_type, implementation_title, campus, indicators
    """
    try:
        query = """
        MATCH (yse:YearSuccessEvidence)-[:evidence_in_year]->(year:AcademicYear)
        WHERE year.name = $academic_year
        MATCH (yse)-[:evidence_at_campus]->(campus:Campus)

        MATCH (impl)-[:is_evidence_for]->(yse)
        WHERE impl:Process OR impl:Project OR impl:Procedure OR impl:Service
           OR impl:Guidance OR impl:Tracking OR impl:InternalPolicy

        MATCH (impl)-[docRel:is_documented_by]->(doc)
        WHERE (doc:Document OR doc:Webpage)
          AND ($academic_year IN docRel.included_in_years
               OR size(docRel.included_in_years) = 0)
          AND NOT $academic_year IN docRel.excluded_from_years

        OPTIONAL MATCH (yse)-[:tracks]->(si:SuccessIndicator)

        WITH doc, labels(doc) AS docLabels,
             impl, labels(impl) AS implLabels,
             campus,
             collect(DISTINCT
                 CASE WHEN si IS NOT NULL THEN split(si.composite_key, '-')[0]
                      ELSE null END
             ) AS indicator_ids

        WITH doc, docLabels, impl, implLabels, campus,
             [id IN indicator_ids WHERE id IS NOT NULL] AS indicator_ids

        RETURN DISTINCT
            CASE WHEN 'Document' IN docLabels THEN 'Document'
                 WHEN 'Webpage' IN docLabels THEN 'Webpage'
                 ELSE 'Other' END AS doc_type,
            doc.name AS doc_name,
            CASE WHEN 'Document' IN docLabels THEN doc.uri_path
                 WHEN 'Webpage' IN docLabels THEN doc.url
                 ELSE null END AS doc_url,
            CASE
                WHEN 'Process' IN implLabels THEN 'Process'
                WHEN 'Project' IN implLabels THEN 'Project'
                WHEN 'Procedure' IN implLabels THEN 'Procedure'
                WHEN 'Service' IN implLabels THEN 'Service'
                WHEN 'Guidance' IN implLabels THEN 'Guidance'
                WHEN 'Tracking' IN implLabels THEN 'Tracking'
                WHEN 'InternalPolicy' IN implLabels THEN 'Policy'
                ELSE 'Other'
            END AS impl_type,
            impl.title AS impl_title,
            campus.abbreviation AS campus_abbrev,
            indicator_ids
        ORDER BY doc_type, doc_name
        """
        results, _ = db.cypher_query(query, {'academic_year': academic_year})

        # Further deduplicate in Python: group by (doc_name, doc_url, impl_title, campus)
        # to merge indicator lists across YSE nodes
        doc_key_map = {}
        for row in results:
            name = row[1] or ''
            if not name:
                continue
            url = row[2] or ''
            impl_title = row[4] or ''
            campus = row[5] or ''
            key = (name, url, impl_title, campus)

            if key not in doc_key_map:
                doc_key_map[key] = {
                    'type': row[0] or '',
                    'name': name,
                    'url': url,
                    'implementation_type': row[3] or '',
                    'implementation_title': impl_title,
                    'campus': campus,
                    'indicator_ids': set(),
                }
            for ind_id in (row[6] or []):
                if ind_id:
                    doc_key_map[key]['indicator_ids'].add(ind_id)

        return [
            {
                **{k: v for k, v in entry.items() if k != 'indicator_ids'},
                'indicators': ', '.join(sorted(entry['indicator_ids'])),
            }
            for entry in doc_key_map.values()
        ]
    except Exception:
        return []
