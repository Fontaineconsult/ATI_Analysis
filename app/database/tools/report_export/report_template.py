"""
Report data processor for ATI Evidence Reports
Handles all filtering and data preparation logic before template rendering
"""

def filter_by_include_in_report(items, property_path='properties'):
    """
    Filter items based on include_in_report flag.

    Args:
        items: List of items to filter
        property_path: Dot-notation path to properties (e.g., 'note.properties')

    Returns:
        Filtered list of items where include_in_report is not False
    """
    if not items:
        return []

    filtered = []
    for item in items:
        if not item:
            continue

        # Handle nested property access
        if '.' in property_path:
            keys = property_path.split('.')
            value = item
            for key in keys:
                value = value.get(key) if value else None
                if not value:
                    break

            if value and value.get('include_in_report', True) != False:
                filtered.append(item)
        else:
            # Direct property access
            props = item.get(property_path)
            if props and props.get('include_in_report', True) != False:
                filtered.append(item)

    return filtered


def filter_accomplishments(accomplishments):
    """
    Filter accomplishments considering their nested structure.
    """
    if not accomplishments:
        return []

    filtered = []
    for item in accomplishments:
        if not item:
            continue

        # Handle nested accomplishment structure
        acc = item.get('accomplishment', item)
        props = acc.get('properties', acc)

        # Check include_in_report flag (default to True if not specified)
        if props.get('include_in_report', True) != False:
            filtered.append(item)

    return filtered


def filter_evidence_types_by_year(evidence_types, academic_year):
    """
    Filter evidence types and their related documents/webpages by academic year.

    Args:
        evidence_types: List of evidence type objects
        academic_year: The academic year to filter by (e.g., "2024-2025")

    Returns:
        Filtered list of evidence types with year-filtered content
    """
    if not evidence_types:
        return []

    filtered_types = []

    for etype in evidence_types:
        if not etype:
            continue

        filtered_etype = dict(etype)  # Create a copy

        # Filter docs based on included_in_years
        docs = etype.get('docs', [])
        filtered_docs = []
        for doc in docs:
            if not doc:
                continue
            relationship = doc.get('relationship', {})
            included_years = relationship.get('included_in_years')

            # Include if no year restriction or if current year is included
            if not included_years or academic_year in included_years:
                filtered_docs.append(doc)

        filtered_etype['docs'] = filtered_docs

        # Filter webs based on included_in_years
        webs = etype.get('webs', [])
        filtered_webs = []
        for web in webs:
            if not web:
                continue
            relationship = web.get('relationship', {})
            included_years = relationship.get('included_in_years')

            # Include if no year restriction or if current year is included
            if not included_years or academic_year in included_years:
                filtered_webs.append(web)

        filtered_etype['webs'] = filtered_webs

        # Filter notes with year logic
        notes = etype.get('notes', [])
        filtered_notes = []
        for note in notes:
            if not note or not note.get('note'):
                continue
            relationship = note.get('relationship', {})
            included_years = relationship.get('included_in_years')

            if not included_years or academic_year in included_years:
                filtered_notes.append(note)

        filtered_etype['notes'] = filtered_notes

        # Filter messages with year logic
        msgs = etype.get('msgs', [])
        filtered_msgs = []
        for msg in msgs:
            if not msg or not msg.get('message'):
                continue
            relationship = msg.get('relationship', {})
            included_years = relationship.get('included_in_years')

            if not included_years or academic_year in included_years:
                filtered_msgs.append(msg)

        filtered_etype['msgs'] = filtered_msgs

        # Filter metrics by include_in_report
        filtered_etype['metrics'] = filter_by_include_in_report(
            etype.get('metrics', []),
            'properties'
        )

        # Only include evidence type if it has content
        has_content = (
                filtered_docs or
                filtered_webs or
                filtered_notes or
                filtered_msgs or
                filtered_etype['metrics']
        )

        if has_content:
            filtered_types.append(filtered_etype)

    return filtered_types


def find_related_accomplishment(plan, accomplishments):
    """
    Find accomplishment related to a completed plan.
    """
    if not plan.get('properties', {}).get('plan_status') == 'Completed':
        return None

    plan_name = plan.get('properties', {}).get('name', '')
    plan_desc = plan.get('properties', {}).get('description', '')

    for acc_data in accomplishments:
        acc = acc_data.get('accomplishment', acc_data)
        acc_props = acc.get('properties', acc)

        acc_name = acc_props.get('name', '')
        acc_desc = acc_props.get('description', '')

        # Check various matching patterns
        if (acc_name == f"Accomplished: {plan_name}" or
                plan_name in acc_name or
                plan_name in acc_desc or
                plan_desc in acc_desc):
            return acc_data

    return None


def get_status_color(status_level):
    """
    Map status level to color for styling.
    """
    status_colors = {
        'Implemented': 'green',
        'Alternative': 'blue',
        'Planning': 'yellow',
        'Not Implemented': 'red',
        'Unknown': 'gray'
    }
    return status_colors.get(status_level, 'gray')


def process_evidence_data(evidence_item):
    """
    Main processing function to prepare evidence data for template.

    Args:
        evidence_item: The raw evidence data object

    Returns:
        Dictionary with processed and filtered data ready for template
    """
    # Get academic year
    academic_year = evidence_item.get('currentAcademicYear', '2024-2025')

    # Process main items with filtering
    filtered_plans = filter_by_include_in_report(
        evidence_item.get('plans', []),
        'properties'
    )

    filtered_accomplishments = filter_accomplishments(
        evidence_item.get('accomplishments', [])
    )

    filtered_notes = filter_by_include_in_report(
        evidence_item.get('has_notes', []),
        'note.properties'
    )

    filtered_messages = filter_by_include_in_report(
        evidence_item.get('has_messages', []),
        'message.properties'
    )

    filtered_metrics = filter_by_include_in_report(
        evidence_item.get('has_metrics', []),
        'metric.properties'
    )

    # Process evidence types with year-based filtering
    filtered_evidence_types = filter_evidence_types_by_year(
        evidence_item.get('evidenceTypes', []),
        academic_year
    )

    # Add related accomplishments to plans
    for plan in filtered_plans:
        plan['related_accomplishment'] = find_related_accomplishment(
            plan,
            filtered_accomplishments
        )

    return {
        'academic_year': academic_year,
        'indicator': evidence_item.get('indicator'),
        'evidence': evidence_item.get('evidence'),
        'status_level': evidence_item.get('statusLevel'),
        'admin_review_notes': evidence_item.get('adminReviewNotes', []),
        'persons': evidence_item.get('persons', []),
        'admin_reviewers': evidence_item.get('adminReviewers', []),
        'plans': filtered_plans,
        'accomplishments': filtered_accomplishments,
        'notes': filtered_notes,
        'messages': filtered_messages,
        'metrics': filtered_metrics,
        'evidence_types': filtered_evidence_types,
        'get_status_color': get_status_color
    }


