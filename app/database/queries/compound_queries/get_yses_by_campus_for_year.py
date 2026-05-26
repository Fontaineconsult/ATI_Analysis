"""
Compound read for the YSE-assignment selector used in the Implementation Explorer
(and reusable for Plans). Returns every YearSuccessEvidence node for a given
academic year, grouped by campus -> working group -> indicator.

Used by the inverse-mount of the YSE-side attach flow: from an implementation's
detail view, the user toggles which YSEs the implementation is_evidence_for. The
same shape will drive the Plan -[:furthers_yse]-> YSE selector later.
"""

from neomodel import db

from app.endpoints.data_api.errors.custom_exceptions import CrudError


def get_yses_by_campus_for_year(academic_year: str) -> dict:
    """
    Return all YSEs for `academic_year`, grouped by campus and working group.

    Result shape:
        {
            "academic_year": "2025-2026",
            "campuses": [
                {
                    "abbreviation": "sfsu",
                    "name": "San Francisco State University",
                    "working_groups": [
                        {
                            "name": "Web",
                            "yses": [
                                {
                                    "year_identifier": "...",
                                    "yse_unique_id": "...",
                                    "indicator_composite_key": "1.1-web",
                                    "indicator_number": 1,
                                    "indicator_description": "...",
                                },
                                ...
                            ]
                        },
                        ...
                    ]
                },
                ...
            ]
        }

    Indicators flagged `removed=true` are excluded.
    """
    query = """
    MATCH (year:AcademicYear {name: $academic_year})
    MATCH (yse:YearSuccessEvidence)-[:evidence_in_year]->(year)
    MATCH (yse)-[:evidence_at_campus]->(campus:Campus)
    MATCH (yse)-[:tracks]->(indicator:SuccessIndicator)
      WHERE indicator.removed IS NULL OR indicator.removed = false
    MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(:Goal)-[:supported_by]->(indicator)
    RETURN campus.abbreviation AS campus_abbreviation,
           campus.name         AS campus_name,
           wg.name             AS working_group,
           yse.year_identifier AS year_identifier,
           yse.unique_id       AS yse_unique_id,
           indicator.composite_key      AS indicator_composite_key,
           indicator.number             AS indicator_number,
           indicator.success_indicator  AS indicator_description
    ORDER BY campus.abbreviation, wg.name, indicator.composite_key
    """

    try:
        rows, _ = db.cypher_query(query, {'academic_year': academic_year})
    except Exception as exc:
        raise CrudError(f"Failed to fetch YSEs for {academic_year}: {exc}")

    campuses_by_abbrev = {}
    for (campus_abbrev, campus_name, wg_name,
         year_identifier, yse_unique_id,
         indicator_composite_key, indicator_number, indicator_description) in rows:

        campus_entry = campuses_by_abbrev.setdefault(campus_abbrev, {
            'abbreviation': campus_abbrev,
            'name': campus_name,
            '_wgs': {},
        })

        wg_entry = campus_entry['_wgs'].setdefault(wg_name, {
            'name': wg_name,
            'yses': [],
        })

        wg_entry['yses'].append({
            'year_identifier': year_identifier,
            'yse_unique_id': yse_unique_id,
            'indicator_composite_key': indicator_composite_key,
            'indicator_number': indicator_number,
            'indicator_description': indicator_description,
        })

    campuses = []
    for campus in campuses_by_abbrev.values():
        campus['working_groups'] = list(campus.pop('_wgs').values())
        campuses.append(campus)

    return {
        'academic_year': academic_year,
        'campuses': campuses,
    }
