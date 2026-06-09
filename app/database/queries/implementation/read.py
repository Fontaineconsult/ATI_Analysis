#
# IMPLEMENTATION READ QUERIES
#
from app.data_config import working_group_names
from app.database.graph_schema import *
from neomodel import db

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError


def get_all_guidances():
    """
    Get all Guidance nodes from the graph
    :return: List of Guidance nodes
    """
    try:
        return Guidance.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch guidances: {e}")


def get_all_processes():
    """
    Get all Process nodes from the graph
    :return: List of Process nodes
    """
    try:
        return Process.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch processes: {e}")


def get_all_projects():
    """
    Get all Project nodes from the graph
    :return: List of Project nodes
    """
    try:
        return Project.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch projects: {e}")


def get_all_procedures():
    """
    Get all Procedure nodes from the graph
    :return: List of Procedure nodes
    """
    try:
        return Procedure.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch procedures: {e}")


def get_all_services():
    """
    Get all Service nodes from the graph
    :return: List of Service nodes
    """
    try:
        return Service.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch services: {e}")


def get_all_plans():
    """
    Get all Plan nodes from the graph
    :return: List of Plan nodes
    """
    try:
        return Plan.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch plans: {e}")


def get_all_trackings():
    """
    Get all Tracking nodes from the graph
    :return: List of Tracking nodes
    """
    try:
        return Tracking.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch trackings: {e}")


def get_all_internal_policies():
    """
    Get all InternalPolicy nodes from the graph
    :return: List of InternalPolicy nodes
    """
    try:
        return InternalPolicy.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch internal policies: {e}")


def get_goal_node(goal_number, working_group):
    """
    Validates the working group and retrieves the Goal node if it exists.

    :param goal_number: The goal number
    :param working_group: The working group short name (pro, web, ins)
    :return: Inflated Goal node if found, otherwise raises an error
    """
    try:
        working_group = working_group_names[working_group]
    except KeyError:
        raise ValueError('Invalid working group name. Must be one of: pro, web, ins')

    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    try:
        wg_query = """
        MATCH (wg:ATIWorkingGroup {name: $wg_name})
        RETURN wg
        """
        wg_results, _ = db.cypher_query(wg_query, params)
        if not wg_results:
            raise NotFoundError(f'ATIWorkingGroup with name "{params["wg_name"]}" does not exist.')

        working_group_node = ATIWorkingGroup.inflate(wg_results[0][0])

        goal_query = """
        MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
        RETURN goal
        """
        goal_results, _ = db.cypher_query(goal_query, params)
        if not goal_results:
            return None

        goal_node = Goal.inflate(goal_results[0][0])
        return goal_node
    except Exception as e:
        raise NotFoundError(f"Failed to retrieve goal: {e}")


def get_all_implementations_by_type(implementation_type: str) -> list:
    """
    Get all implementation nodes of a specific type.

    :param implementation_type: Type of implementation (Process, Project, etc.)
    :return: List of implementation nodes
    """
    from app.database.class_factory import implementation_classes

    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementations = implementation_class.nodes.all()

        return [{
            'unique_id': impl.unique_id,
            'title': impl.title,
            'description': impl.description,
            'type': implementation_type,
            'dimensions': [
                {'handle': d.handle, 'name': d.name} for d in impl.classified_under.all()
            ] if hasattr(impl, 'classified_under') else [],
            'participants': serialize_participants(impl) if hasattr(impl, 'participants') else [],
            'assets': serialize_applied_assets(impl) if hasattr(impl, 'remediates_interface') else [],
        } for impl in implementations]
    except Exception as e:
        raise CrudError(f"Error retrieving {implementation_type} implementations: {e}")


# One batched projection per implementation type, replacing the per-node N+1. Pattern
# comprehensions compute each nested collection independently per impl node (no cartesian
# explosion), and apoc.convert.toJson returns the whole type's payload as a single string —
# so the entire implementations read is 7 round-trips instead of thousands. The shape mirrors
# _get_all_implementations_legacy field-for-field; the only Python post-processing is the two
# derived fields (campuses, deduped assets) the legacy loop also computed.
#
# The `is_documented_by` rel-type is shared by documents/webpages/notes/messages, so each is
# disambiguated by the TARGET label (:Document / :Webpage / :Note / :Message). The doing-only
# collections (participants / assets / dimensions) naturally yield [] for the reference types
# that lack those edges — matching the legacy hasattr guards.
_IMPL_PROJECTION = """
    MATCH (impl:%(label)s)
    RETURN apoc.convert.toJson(collect({
      unique_id: impl.unique_id,
      title: impl.title,
      description: impl.description,
      type: $type_name,
      owned_by: [ (impl)-[:owned_by]->(p:Person) |
        { unique_id: p.unique_id, name: p.name, title: p.title, email: p.email, employee_id: p.employee_id } ],
      supporting_documents: [ (impl)-[r:is_documented_by]->(d:Document) | {
        unique_id: d.unique_id, name: d.name, hash: d.hash, file_path: d.file_path, uri_path: d.uri_path,
        description: d.description, depreciated: d.depreciated, depreciated_date: d.depreciated_date,
        include_in_report: coalesce(d.include_in_report, true),
        is_administrative_review_documentation: d.is_administrative_review_documentation,
        is_milestone_and_measures_documentation: d.is_milestone_and_measures_documentation,
        maintained_by: head([ (d)-[:maintained_by]->(m:Person) |
          { unique_id: m.unique_id, name: m.name, email: m.email, employee_id: m.employee_id, title: m.title } ]),
        relationship: {
          included_in_years: coalesce(r.included_in_years, []),
          excluded_from_years: coalesce(r.excluded_from_years, []),
          added_date: r.added_date, modified_date: r.modified_date, added_by: r.added_by
        }
      } ],
      supporting_webpages: [ (impl)-[r:is_documented_by]->(w:Webpage) | {
        unique_id: w.unique_id, url: w.url, name: w.name, description: w.description,
        no_longer_exists: w.no_longer_exists, depreciated: w.depreciated, depreciated_date: w.depreciated_date,
        include_in_report: coalesce(w.include_in_report, true),
        maintained_by: head([ (w)-[:maintained_by]->(m:Person) |
          { unique_id: m.unique_id, name: m.name, email: m.email, employee_id: m.employee_id, title: m.title } ]),
        relationship: {
          included_in_years: coalesce(r.included_in_years, []),
          excluded_from_years: coalesce(r.excluded_from_years, []),
          added_date: r.added_date, modified_date: r.modified_date, added_by: r.added_by
        }
      } ],
      supporting_notes: [ (impl)-[r:is_documented_by]->(n:Note) | {
        unique_id: n.unique_id, name: n.name, content: n.content, date_created: n.date_created,
        depreciated: n.depreciated, depreciated_date: n.depreciated_date, include_in_report: coalesce(n.include_in_report, true),
        created_by: head([ (n)-[:created_by]->(c:Person) |
          { unique_id: c.unique_id, name: c.name, email: c.email, employee_id: c.employee_id, title: c.title } ]),
        relationship: {
          included_in_years: coalesce(r.included_in_years, []),
          excluded_from_years: coalesce(r.excluded_from_years, []),
          added_date: r.added_date, modified_date: r.modified_date, added_by: r.added_by
        }
      } ],
      supporting_messages: [ (impl)-[r:is_documented_by]->(msg:Message) | {
        unique_id: msg.unique_id, name: msg.name, content: msg.content, file_path: msg.file_path,
        uri_path: msg.uri_path, date_created: msg.date_created, type: msg.type, depreciated: msg.depreciated,
        depreciated_date: msg.depreciated_date, include_in_report: coalesce(msg.include_in_report, true),
        created_by: head([ (msg)-[:created_by]->(c:Person) |
          { unique_id: c.unique_id, name: c.name, email: c.email, employee_id: c.employee_id, title: c.title } ]),
        relationship: {
          included_in_years: coalesce(r.included_in_years, []),
          excluded_from_years: coalesce(r.excluded_from_years, []),
          added_date: r.added_date, modified_date: r.modified_date, added_by: r.added_by
        }
      } ],
      supporting_metrics: [ (impl)-[:has_metric]->(mt:Metric) | {
        unique_id: mt.unique_id, name: mt.name, composite_key: mt.composite_key, metric_type: mt.metric_type,
        file_path: mt.file_path, uri_path: mt.uri_path, description: mt.description, single_value: mt.single_value,
        comment: mt.comment, include_in_report: coalesce(mt.include_in_report, true),
        created_by: head([ (mt)-[:created_by]->(c:Person) |
          { unique_id: c.unique_id, name: c.name, email: c.email, employee_id: c.employee_id, title: c.title } ])
      } ],
      is_evidence_for: [ (impl)-[:is_evidence_for]->(yse:YearSuccessEvidence) | {
        year_identifier: yse.year_identifier, unique_id: yse.unique_id,
        success_indicator: head([ (yse)-[:tracks]->(si:SuccessIndicator) | si.success_indicator ]),
        indicator_number: head([ (yse)-[:tracks]->(si:SuccessIndicator) | si.number ]),
        indicator_composite_key: head([ (yse)-[:tracks]->(si:SuccessIndicator) | si.composite_key ]),
        campus: head([ (yse)-[:evidence_at_campus]->(c:Campus) |
          { unique_id: c.unique_id, name: c.name, abbreviation: c.abbreviation } ])
      } ],
      dimensions: [ (impl)-[:classified_under]->(dim:Dimension) | { handle: dim.handle, name: dim.name } ],
      participants: [ (impl)<-[w:worked_on]-(p:Person) |
        { person: { unique_id: p.unique_id, name: p.name }, role_handle: w.role_handle, note: w.note } ],
      assets_raw:
        [ (impl)-[:remediates]->(a:Asset) |
          a { .asset_identifier, .title, .unique_id, .scope, .asset_class, reach: 'direct' } ]
        + [ (impl)-[:remediates_interface]->(:Interface)-[:presented_by]->(a:Asset) |
          a { .asset_identifier, .title, .unique_id, .scope, .asset_class, reach: 'interface' } ]
    })) AS j
"""


def _all_implementations_of_type(label):
    """Batched projection of every node of one implementation type — a single apoc query that
    reproduces the legacy per-impl dict (plus light post-processing for the two derived fields:
    `campuses` and the deduped `assets`)."""
    import json

    rows, _meta = db.cypher_query(_IMPL_PROJECTION % {"label": label}, {"type_name": label})
    impls = json.loads(rows[0][0]) if rows and rows[0] and rows[0][0] else []

    for impl in impls:
        # Deduped, sorted campus abbreviations across this impl's YSEs (legacy: read.py campuses).
        impl["campuses"] = sorted({
            yse["campus"]["abbreviation"]
            for yse in impl.get("is_evidence_for", [])
            if yse.get("campus") and yse["campus"].get("abbreviation")
        })

        # Dedupe applied assets by unique_id, merging the reach tags (legacy: serialize_applied_assets).
        merged = {}
        for asset in impl.pop("assets_raw", []):
            uid = asset.get("unique_id")
            if not uid:
                continue
            reach = asset.pop("reach", None)
            if uid not in merged:
                merged[uid] = {**asset, "reach": []}
            if reach and reach not in merged[uid]["reach"]:
                merged[uid]["reach"].append(reach)
        impl["assets"] = list(merged.values())

    return impls


def get_all_implementations() -> dict:
    """
    Get all implementation nodes across all types with their relationships.

    One batched apoc query per implementation type (7 round-trips total) instead of the legacy
    per-node N+1 (~40 round-trips × every node). The returned shape is identical to the legacy
    function — see _all_implementations_of_type / _IMPL_PROJECTION.

    :return: Dictionary with implementation types as keys and lists of implementations as values
    """
    from app.database.class_factory import implementation_classes

    try:
        return {
            implementation_type: _all_implementations_of_type(implementation_type)
            for implementation_type in implementation_classes
        }
    except Exception as e:
        raise CrudError(f"Error retrieving all implementations: {e}")


def get_documents_for_year(
        implementation_id: str,
        implementation_type: str,
        academic_year: str,
        document_type: str = "all"
) -> dict:
    """
    Get all documents included for a specific academic year for a given implementation.

    Parameters:
    - implementation_id: unique_id of the implementation
    - implementation_type: type of implementation (Process, Project, etc.)
    - academic_year: academic year like "2024-2025"
    - document_type: "all", "document", "webpage", "note", or "message"

    Returns:
    - Dictionary with lists of documents by type
    """
    from app.database.class_factory import implementation_classes

    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementation = implementation_class.nodes.get(unique_id=implementation_id)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No {implementation_type} found with id: {implementation_id}")

    result = {
        'documents': [],
        'webpages': [],
        'notes': [],
        'messages': []
    }

    # Helper to check if doc should be included
    def should_include_for_year(rel):
        if not rel:
            return True  # Default to include if no relationship data

        included = rel.included_in_years or []
        excluded = rel.excluded_from_years or []

        # If no year-specific data, include by default
        if not included and not excluded:
            return True

        # Check explicit inclusion/exclusion
        return academic_year in included and academic_year not in excluded

    try:
        if document_type in ["all", "document"]:
            for doc in implementation.supporting_documents.all():
                rel = implementation.supporting_documents.relationship(doc)
                if should_include_for_year(rel) and doc.include_in_report:
                    result['documents'].append(doc.serialize())

        if document_type in ["all", "webpage"]:
            for webpage in implementation.supporting_webpages.all():
                rel = implementation.supporting_webpages.relationship(webpage)
                if should_include_for_year(rel) and webpage.include_in_report:
                    result['webpages'].append(webpage.serialize())

        if document_type in ["all", "note"]:
            for note in implementation.supporting_notes.all():
                rel = implementation.supporting_notes.relationship(note)
                if should_include_for_year(rel) and note.include_in_report:
                    result['notes'].append(note.serialize())

        if document_type in ["all", "message"]:
            for message in implementation.supporting_messages.all():
                rel = implementation.supporting_messages.relationship(message)
                if should_include_for_year(rel) and message.include_in_report:
                    result['messages'].append(message.serialize())

    except Exception as e:
        raise CrudError(f"Failed to retrieve documents for year: {e}")

    return result