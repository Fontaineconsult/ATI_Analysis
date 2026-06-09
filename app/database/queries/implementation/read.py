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
        } for impl in implementations]
    except Exception as e:
        raise CrudError(f"Error retrieving {implementation_type} implementations: {e}")


def get_all_implementations() -> dict:
    """
    Get all implementation nodes across all types with their relationships.

    :return: Dictionary with implementation types as keys and lists of implementations as values
    """
    from app.database.class_factory import implementation_classes

    try:
        all_implementations = {}

        for implementation_type, implementation_class in implementation_classes.items():
            implementations = implementation_class.nodes.all()
            all_implementations[implementation_type] = []

            for impl in implementations:
                impl_data = {
                    'unique_id': impl.unique_id,
                    'title': impl.title,
                    'description': impl.description,
                    'type': implementation_type,
                    'supporting_documents': [],
                    'supporting_webpages': [],
                    'supporting_notes': [],
                    'supporting_messages': [],
                    'supporting_metrics': [],
                    'is_evidence_for': [],
                    'owned_by': [],
                }

                # People who own this implementation (owned_by edge)
                for person in impl.owned_by.all():
                    impl_data['owned_by'].append({
                        'unique_id': person.unique_id,
                        'name': person.name,
                        'title': person.title,
                        'email': person.email,
                        'employee_id': person.employee_id,
                    })

                # Process supporting documents with relationship data
                for doc in impl.supporting_documents.all():
                    rel = impl.supporting_documents.relationship(doc)
                    doc_data = {
                        'unique_id': doc.unique_id,
                        'name': doc.name,
                        'hash': doc.hash,
                        'file_path': doc.file_path,
                        'uri_path': doc.uri_path,
                        'description': doc.description,
                        'depreciated': doc.depreciated,
                        'depreciated_date': doc.depreciated_date.isoformat() if doc.depreciated_date else None,
                        'include_in_report': doc.include_in_report,
                        'is_administrative_review_documentation': doc.is_administrative_review_documentation,
                        'is_milestone_and_measures_documentation': doc.is_milestone_and_measures_documentation,
                        'maintained_by': {
                            'unique_id': maintainer.unique_id,
                            'name': maintainer.name,
                            'email': maintainer.email,
                            'employee_id': maintainer.employee_id,
                            'title': maintainer.title
                        } if (maintainer := doc.maintained_by.single()) else None,
                        # Add relationship data - ArrayProperty handles lists directly
                        'relationship': {
                            'included_in_years': rel.included_in_years if rel else [],
                            'excluded_from_years': rel.excluded_from_years if rel else [],
                            'added_date': rel.added_date.isoformat() if rel and rel.added_date else None,
                            'modified_date': rel.modified_date.isoformat() if rel and rel.modified_date else None,
                            'added_by': rel.added_by if rel else None
                        }
                    }
                    impl_data['supporting_documents'].append(doc_data)

                # Process supporting webpages with relationship data
                for wp in impl.supporting_webpages.all():
                    rel = impl.supporting_webpages.relationship(wp)
                    wp_data = {
                        'unique_id': wp.unique_id,
                        'url': wp.url,
                        'name': wp.name,
                        'description': wp.description,
                        'no_longer_exists': wp.no_longer_exists,
                        'depreciated': wp.depreciated,
                        'depreciated_date': wp.depreciated_date.isoformat() if wp.depreciated_date else None,
                        'include_in_report': wp.include_in_report,
                        'maintained_by': {
                            'unique_id': maintainer.unique_id,
                            'name': maintainer.name,
                            'email': maintainer.email,
                            'employee_id': maintainer.employee_id,
                            'title': maintainer.title
                        } if (maintainer := wp.maintained_by.single()) else None,
                        # Add relationship data - ArrayProperty handles lists directly
                        'relationship': {
                            'included_in_years': rel.included_in_years if rel else [],
                            'excluded_from_years': rel.excluded_from_years if rel else [],
                            'added_date': rel.added_date.isoformat() if rel and rel.added_date else None,
                            'modified_date': rel.modified_date.isoformat() if rel and rel.modified_date else None,
                            'added_by': rel.added_by if rel else None
                        }
                    }
                    impl_data['supporting_webpages'].append(wp_data)

                # Process supporting notes with relationship data
                for note in impl.supporting_notes.all():
                    rel = impl.supporting_notes.relationship(note)
                    note_data = {
                        'unique_id': note.unique_id,
                        'name': note.name,
                        'content': note.content,
                        'date_created': note.date_created.isoformat() if note.date_created else None,
                        'depreciated': note.depreciated,
                        'depreciated_date': note.depreciated_date.isoformat() if note.depreciated_date else None,
                        'include_in_report': note.include_in_report,
                        'created_by': {
                            'unique_id': creator.unique_id,
                            'name': creator.name,
                            'email': creator.email,
                            'employee_id': creator.employee_id,
                            'title': creator.title
                        } if (creator := note.created_by.single()) else None,
                        # Add relationship data - ArrayProperty handles lists directly
                        'relationship': {
                            'included_in_years': rel.included_in_years if rel else [],
                            'excluded_from_years': rel.excluded_from_years if rel else [],
                            'added_date': rel.added_date.isoformat() if rel and rel.added_date else None,
                            'modified_date': rel.modified_date.isoformat() if rel and rel.modified_date else None,
                            'added_by': rel.added_by if rel else None
                        }
                    }
                    impl_data['supporting_notes'].append(note_data)

                # Process supporting messages with relationship data
                for msg in impl.supporting_messages.all():
                    rel = impl.supporting_messages.relationship(msg)
                    msg_data = {
                        'unique_id': msg.unique_id,
                        'name': msg.name,
                        'content': msg.content,
                        'file_path': msg.file_path,
                        'uri_path': msg.uri_path,
                        'date_created': msg.date_created.isoformat() if msg.date_created else None,
                        'type': msg.type,
                        'depreciated': msg.depreciated,
                        'depreciated_date': msg.depreciated_date.isoformat() if msg.depreciated_date else None,
                        'include_in_report': msg.include_in_report,
                        'created_by': {
                            'unique_id': creator.unique_id,
                            'name': creator.name,
                            'email': creator.email,
                            'employee_id': creator.employee_id,
                            'title': creator.title
                        } if (creator := msg.created_by.single()) else None,
                        # Add relationship data - ArrayProperty handles lists directly
                        'relationship': {
                            'included_in_years': rel.included_in_years if rel else [],
                            'excluded_from_years': rel.excluded_from_years if rel else [],
                            'added_date': rel.added_date.isoformat() if rel and rel.added_date else None,
                            'modified_date': rel.modified_date.isoformat() if rel and rel.modified_date else None,
                            'added_by': rel.added_by if rel else None
                        }
                    }
                    impl_data['supporting_messages'].append(msg_data)

                # Supporting metrics (no DocumentedByRel for metrics currently)
                for metric in impl.supporting_metrics.all():
                    metric_data = {
                        'unique_id': metric.unique_id,
                        'name': metric.name,
                        'composite_key': metric.composite_key,
                        'metric_type': metric.metric_type,
                        'file_path': metric.file_path,
                        'uri_path': metric.uri_path,
                        'description': metric.description,
                        'single_value': metric.single_value,
                        'comment': metric.comment,
                        'include_in_report': metric.include_in_report,
                        'created_by': {
                            'unique_id': creator.unique_id,
                            'name': creator.name,
                            'email': creator.email,
                            'employee_id': creator.employee_id,
                            'title': creator.title
                        } if (creator := metric.created_by.single()) else None
                    }
                    impl_data['supporting_metrics'].append(metric_data)

                # Process YSE relationships
                for yse in impl.is_evidence_for.all():
                    yse_data = {
                        'year_identifier': yse.year_identifier,
                        'unique_id': yse.unique_id,
                        'success_indicator': None,
                        'indicator_number': None,
                        'indicator_composite_key': None,
                        'campus': None,
                    }

                    success_indicators = yse.tracks_success_indicator.all()
                    if success_indicators:
                        indicator = success_indicators[0]
                        yse_data['success_indicator'] = indicator.success_indicator
                        yse_data['indicator_number'] = indicator.number
                        yse_data['indicator_composite_key'] = indicator.composite_key

                    yse_campus = yse.campus.single()
                    if yse_campus:
                        yse_data['campus'] = {
                            'unique_id': yse_campus.unique_id,
                            'name': yse_campus.name,
                            'abbreviation': yse_campus.abbreviation,
                        }

                    impl_data['is_evidence_for'].append(yse_data)

                # Deduped, sorted list of campus abbreviations across this impl's YSEs
                impl_data['campuses'] = sorted({
                    yse['campus']['abbreviation']
                    for yse in impl_data['is_evidence_for']
                    if yse.get('campus') and yse['campus'].get('abbreviation')
                })

                # AMM dimensions classify only the four doing-implementations
                # (Process/Project/Procedure/Service); other types have no such edge.
                impl_data['dimensions'] = [
                    {'handle': d.handle, 'name': d.name} for d in impl.classified_under.all()
                ] if hasattr(impl, 'classified_under') else []

                # Participants (the working team — people in their roles), distinct from owned_by.
                impl_data['participants'] = serialize_participants(impl) if hasattr(impl, 'participants') else []

                all_implementations[implementation_type].append(impl_data)

        return all_implementations
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