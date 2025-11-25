"""
Complete HTML Report Generator for ATI Evidence
Creates one HTML report per success indicator with ALL data from GenerateReportComponent
"""

import json
import os
from pathlib import Path
from typing import Dict, List
from datetime import datetime

from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group


def generate_indicator_html_reports(data: Dict, output_dir: str = "reports") -> List[str]:
    """
    Generate individual HTML reports for each success indicator.

    Args:
        data: The JSON data from Neo4j query
        output_dir: Directory to save HTML reports

    Returns:
        List of generated HTML file paths
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    generated_files = []
    working_group = data.get('workingGroup', 'Unknown')
    all_accomplishments = data.get('allAccomplishments', [])

    # Process each goal
    for goal_data in data.get('goals', []):
        goal = goal_data.get('goal', {})
        goal_name = goal['properties'].get('name', 'Unknown Goal')

        # Process each indicator
        for indicator_data in goal_data.get('indicators', []):
            indicator = indicator_data.get('indicator')
            if not indicator:
                continue

            # Get indicator key for filename
            composite_key = indicator['properties'].get('composite_key', 'unknown')

            # Process all evidences for this indicator
            for evidence_data in indicator_data.get('evidences', []):
                if not evidence_data.get('evidence'):
                    continue

                # Pass goal-level accomplishments and all accomplishments
                evidence_data['goal_accomplishments'] = goal_data.get('accomplishments', [])

                html_content = create_evidence_html(
                    evidence_data,
                    indicator,
                    goal,
                    working_group,
                    all_accomplishments
                )

                # Save HTML file
                filename = f"{evidence_data['evidence']['properties'].get('year_identifier', composite_key)}.html"
                filepath = output_dir / filename

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html_content)

                generated_files.append(str(filepath))
                print(f"✓ Generated: {filename}")

    # Create index file
    create_index_html(generated_files, working_group, output_dir)

    print(f"\n✓ Generated {len(generated_files)} HTML reports in {output_dir}")
    return generated_files


def create_evidence_html(evidence_data: Dict, indicator: Dict, goal: Dict, working_group: str, all_accomplishments: List = None) -> str:
    """Create HTML content for a single evidence report with ALL data"""

    # Extract key data
    evidence = evidence_data.get('evidence', {})
    evidence_props = evidence.get('properties', {})
    indicator_props = indicator.get('properties', {})
    goal_props = goal.get('properties', {})
    status_level = evidence_data.get('statusLevel', {}).get('properties', {})

    # Get academic year for filtering
    academic_year = evidence_data.get('currentAcademicYear', '2024-2025')
    if not academic_year and '-' in evidence_props.get('year_identifier', ''):
        academic_year = evidence_props.get('year_identifier', '').split('-')[0] + '-' + evidence_props.get('year_identifier', '').split('-')[1]

    # Helper function
    def should_include(item_props):
        return item_props.get('include_in_report', True) != False

    # Start building HTML
    html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>''' + evidence_props.get('year_identifier', 'Evidence Report') + '''</title>
    <style>
        body {
            font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c5282;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .meta {
            color: #666;
            font-size: 14px;
        }
        .section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h2 {
            color: #2d3748;
            font-size: 18px;
            margin-top: 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        h3 {
            color: #2d3748;
            font-size: 16px;
            margin-top: 15px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 8px;
        }
        .status-Implemented { background: #c6f6d5; color: #22543d; }
        .status-Established { background: #bee3f8; color: #2c5282; }
        .status-Initiated { background: #fef5e7; color: #783f03; }
        .status-Not.Started { background: #fed7d7; color: #742a2a; }
        .status-Managed { background: #e9d5ff; color: #6b21a8; }
        .status-Defined { background: #fed7e2; color: #9f1239; }
        .status-Completed { background: #c6f6d5; color: #22543d; }
        .status-In.Progress { background: #bee3f8; color: #2c5282; }
        .plan-item {
            padding: 10px;
            margin: 10px 0;
            border-left: 3px solid #3182ce;
            background: #f7fafc;
        }
        .note-item {
            padding: 10px;
            margin: 10px 0;
            background: #f7f1fd;
            border-left: 3px solid #9f7aea;
        }
        .message-item {
            padding: 10px;
            margin: 10px 0;
            background: #fdf5ff;
            border-left: 3px solid #d946ef;
        }
        .metric-item {
            padding: 10px;
            margin: 10px 0;
            background: #f0fdf4;
            border-left: 3px solid #22c55e;
        }
        .accomplishment-item {
            padding: 10px;
            margin: 10px 0;
            background: #faf5ff;
            border-left: 3px solid #a855f7;
        }
        .doc-link {
            color: #3182ce;
            text-decoration: none;
        }
        .doc-link:hover {
            text-decoration: underline;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        th {
            background: #f7fafc;
        }
        .person-list {
            list-style: none;
            padding-left: 20px;
        }
        .person-list li {
            margin: 5px 0;
        }
        .badge-deprecated {
            background: #fee2e2;
            color: #991b1b;
        }
        .badge-admin {
            background: #dbeafe;
            color: #1e40af;
        }
        .badge-milestone {
            background: #fef3c7;
            color: #92400e;
        }
        .badge-key {
            background: #f3e8ff;
            color: #6b21a8;
        }
        .badge-campus {
            background: #dcfce7;
            color: #166534;
        }
        .implementation-type {
            font-weight: bold;
            color: #2563eb;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .admin-review-note {
            padding: 10px;
            margin: 10px 0;
            background: #faf5ff;
            border-left: 3px solid #a855f7;
        }
        .progress-note {
            padding: 8px;
            margin: 5px 0;
            background: #f0f9ff;
            border-left: 2px solid #0284c7;
            margin-left: 20px;
        }
    </style>
</head>
<body>
'''

    # Header section
    html += '    <div class="header">\n'
    html += '        <h1>' + evidence_props.get('year_identifier', 'Evidence Report') + '</h1>\n'
    html += '        <div class="meta">\n'
    html += '            <strong>Working Group:</strong> ' + working_group + ' | \n'
    html += '            <strong>Goal:</strong> ' + goal_props.get('name', 'Unknown') + ' | \n'
    html += '            <strong>Generated:</strong> ' + datetime.now().strftime('%Y-%m-%d %H:%M') + '\n'
    html += '        </div>\n    </div>\n'

    # Success Indicator Section
    status_class = status_level.get('status_level', 'Unknown').replace(' ', '.')
    html += '    <div class="section">\n'
    html += '        <h2>Success Indicator</h2>\n'
    html += '        <p><strong>Key:</strong> ' + indicator_props.get('composite_key', 'Unknown') + '</p>\n'
    html += '        <p><strong>Description:</strong> ' + indicator_props.get('success_indicator', 'No description') + '</p>\n'
    html += '        <p><strong>Status Level:</strong> <span class="badge status-' + status_class + '">' + status_level.get('status_level', 'Unknown') + '</span></p>\n'
    if indicator_props.get('removed'):
        html += '        <p><strong>Status:</strong> <span class="badge badge-deprecated">Removed</span></p>\n'
    if indicator_props.get('date_added'):
        html += '        <p><strong>Date Added:</strong> ' + indicator_props.get('date_added') + '</p>\n'
    html += '    </div>\n'

    # Evidence Information Section
    html += '    <div class="section">\n'
    html += '        <h2>Evidence Information</h2>\n'
    html += '        <table>\n'
    html += '            <tr>\n                <th>Year Identifier</th>\n'
    html += '                <td>' + evidence_props.get('year_identifier', 'Unknown') + '</td>\n            </tr>\n'
    html += '            <tr>\n                <th>Status Level</th>\n'
    html += '                <td><span class="badge status-' + status_class + '">' + status_level.get('status_level', 'Unknown') + '</span></td>\n'
    html += '            </tr>\n'
    html += '            <tr>\n                <th>Admin Review Status</th>\n                <td>\n'

    if evidence_props.get('administrative_review_complete', False):
        html += '                    Complete'
    else:
        html += '                    Pending'

    if evidence_props.get('administrative_review_completed_date'):
        html += ' (' + evidence_props.get('administrative_review_completed_date') + ')'

    html += '\n                </td>\n            </tr>\n'

    # Add admin review description if present and not "No Review"
    if evidence_props.get('admin_reviewer_description') and evidence_props.get('admin_reviewer_description') != "No Review":
        html += '            <tr>\n                <th>Evidence Summary</th>\n'
        html += '                <td>' + evidence_props.get('admin_reviewer_description') + '</td>\n'
        html += '            </tr>\n'

    # Also check for admin_review_description (without reviewer in the name)
    elif evidence_props.get('admin_review_description') and evidence_props.get('admin_review_description') != "No Review":
        html += '            <tr>\n                <th>Evidence Summary</th>\n'
        html += '                <td>' + evidence_props.get('admin_review_description') + '</td>\n'
        html += '            </tr>\n'

    html += '        </table>\n'

    # Admin Review Notes (separate from regular notes)
    admin_review_notes = evidence_data.get('adminReviewNotes', [])
    if admin_review_notes:
        html += '        <h3>Reviewer Notes</h3>\n'
        for note_item in admin_review_notes:
            if note_item and 'note' in note_item:
                note = note_item['note'].get('properties', {})
                if should_include(note):
                    created_by = note_item.get('created_by')
                    html += '        <div class="admin-review-note">\n'
                    html += '            <strong>' + note.get("date_created", "No date") + '</strong>'
                    if created_by and created_by.get('properties', {}).get('name'):
                        html += ' - ' + created_by['properties']['name']
                    html += '\n            <p>' + note.get("content", "") + '</p>\n'
                    html += '        </div>\n'

    # Persons Involved
    persons = evidence_data.get('persons', [])
    if persons:
        html += '        <h3>Persons Involved</h3>\n        <ul class="person-list">\n'
        for person in persons:
            p = person.get('properties', {})
            html += '            <li>• ' + p.get("name", "Unknown") + ' - ' + p.get("title", "")
            if p.get("ati_role"):
                html += ' (' + p.get("ati_role") + ')'
            if p.get("email"):
                html += ' - ' + p.get("email")
            html += '</li>\n'
        html += '        </ul>\n'

    # Admin Reviewers
    admin_reviewers = evidence_data.get('adminReviewers', [])
    if admin_reviewers:
        html += '        <h3>Admin Reviewers</h3>\n        <ul class="person-list">\n'
        for reviewer in admin_reviewers:
            r = reviewer.get('properties', {})
            html += '            <li>• ' + r.get("name", "Unknown") + ' - ' + r.get("title", "") + '</li>\n'
        html += '        </ul>\n'

    html += '    </div>\n'

    # Plans and Accomplishments Section
    plans = evidence_data.get('plans', [])
    plans_with_notes = evidence_data.get('plans_with_notes', [])
    accomplishments = evidence_data.get('accomplishments', []) + evidence_data.get('goal_accomplishments', [])

    # Filter based on include_in_report
    filtered_plans = [p for p in plans if p and 'properties' in p and should_include(p['properties'])]

    # Remove duplicate accomplishments
    seen_acc_ids = set()
    filtered_accomplishments = []
    for acc_item in accomplishments:
        if not acc_item:
            continue
        acc = acc_item.get('accomplishment') or acc_item
        props = acc.get('properties', acc)
        acc_id = props.get('unique_id')
        if acc_id and acc_id in seen_acc_ids:
            continue
        if acc_id:
            seen_acc_ids.add(acc_id)
        if should_include(props):
            filtered_accomplishments.append(acc_item)

    if filtered_plans or filtered_accomplishments:
        html += '    <div class="section">\n        <h2>Plans and Accomplishments</h2>\n'

        # Plans
        if filtered_plans:
            html += '        <h3>Plans (' + str(len(filtered_plans)) + ')</h3>\n'
            for plan in filtered_plans:
                p = plan['properties']

                # Find related accomplishment
                related_acc = None
                if p.get('plan_status') == 'Completed':
                    for acc_item in filtered_accomplishments:
                        acc = acc_item.get('accomplishment') or acc_item
                        acc_props = acc.get('properties', acc)
                        plan_name = p.get('name', '')
                        if acc_props.get('name') == f"Accomplished: {plan_name}" or (plan_name and plan_name in acc_props.get('name', '')):
                            related_acc = acc_item
                            break

                # Build plan HTML
                status_text = 'Abandoned' if p.get('abandoned') else p.get('plan_status', 'Unknown')
                border_color = '#22c55e' if p.get('plan_status') == 'Completed' else '#3b82f6'

                html += '        <div class="plan-item" style="border-left-color: ' + border_color + ';">\n'
                html += '            <strong>' + p.get("name", "Unnamed") + '</strong>\n'

                # Status badge
                status_color = 'green' if p.get('plan_status') == 'Completed' else 'blue' if p.get('plan_status') == 'In Progress' else 'red' if p.get('abandoned') else 'gray'
                bg_color = '#dcfce7' if status_color == 'green' else '#dbeafe' if status_color == 'blue' else '#fee2e2' if status_color == 'red' else '#f3f4f6'
                text_color = '#166534' if status_color == 'green' else '#1e40af' if status_color == 'blue' else '#991b1b' if status_color == 'red' else '#374151'

                html += '            <span class="badge" style="background-color: ' + bg_color + '; color: ' + text_color + ';">' + status_text + '</span>\n'

                if p.get('is_key_plan'):
                    html += '            <span class="badge badge-key">Key Plan</span>\n'
                if p.get('is_campus_plan'):
                    html += '            <span class="badge badge-campus">Campus Plan</span>\n'

                html += '            <p>' + p.get("description", "") + '</p>\n'

                # Find plan progress notes from plans_with_notes
                for plan_with_notes in plans_with_notes:
                    if plan_with_notes.get('plan') and plan_with_notes['plan'].get('id') == plan.get('id'):
                        progress_notes = plan_with_notes.get('progress_notes', [])
                        if progress_notes:
                            html += '            <div style="margin-top: 10px;">\n'
                            html += '                <strong>Progress Notes:</strong>\n'
                            for progress_note_item in progress_notes:
                                if progress_note_item.get('note'):
                                    pn = progress_note_item['note'].get('properties', {})
                                    html += '                <div class="progress-note">\n'
                                    html += '                    <small>' + pn.get('date_created', 'No date')
                                    if progress_note_item.get('created_by', {}).get('properties', {}).get('name'):
                                        html += ' - ' + progress_note_item['created_by']['properties']['name']
                                    html += '</small><br>\n'
                                    html += '                    ' + pn.get('content', '') + '\n'
                                    html += '                </div>\n'
                            html += '            </div>\n'

                        # Show YSE relationships
                        furthered_yse = plan_with_notes.get('furthered_yse_identifiers', [])
                        if furthered_yse:
                            html += '            <p style="margin-top: 5px;"><small>Furthers YSE: ' + ', '.join(furthered_yse) + '</small></p>\n'
                        break

                # Completion notes
                if p.get('plan_status') == 'Completed' and p.get('completion_notes'):
                    html += '            <div style="margin-top: 10px; padding: 10px; background: #dcfce7; border-radius: 4px;">\n'
                    html += '                <strong style="color: #166534;">Completion Notes:</strong> ' + p.get("completion_notes") + '\n'
                    html += '            </div>\n'

                # Associated accomplishment
                if p.get('plan_status') == 'Completed' and related_acc:
                    acc = related_acc.get('accomplishment') or related_acc
                    acc_props = acc.get('properties', acc)
                    html += '            <div style="margin-top: 10px; padding: 10px; background: #faf5ff; border-left: 2px solid #a855f7;">\n'
                    html += '                <strong style="color: #6b21a8;">Accomplishment ✓</strong>\n'
                    if p.get('completed_year_name'):
                        html += '                <span class="badge" style="background: #f3e8ff; color: #6b21a8;">' + p.get("completed_year_name") + '</span>\n'
                    desc = acc_props.get('description', acc_props.get('name', ''))
                    html += '                <p style="margin-top: 5px;">' + desc + '</p>\n'

                    # Show YSE list for accomplishment
                    if related_acc.get('advances_yse_list'):
                        yse_list = related_acc.get('advances_yse_list', [])
                        if yse_list:
                            yse_identifiers = []
                            for yse in yse_list:
                                if yse and yse.get('properties'):
                                    yse_identifiers.append(yse['properties'].get('year_identifier', ''))
                            if yse_identifiers:
                                html += '                <p style="margin-top: 5px;"><small>Advances YSE: ' + ', '.join(filter(None, yse_identifiers)) + '</small></p>\n'

                    html += '            </div>\n'

                # Abandonment notes
                if p.get('abandoned') and p.get('abandoned_notes'):
                    html += '            <div style="margin-top: 10px; padding: 10px; background: #fee2e2; border-radius: 4px;">\n'
                    html += '                <strong style="color: #991b1b;">Abandonment Notes:</strong> ' + p.get("abandoned_notes") + '\n'
                    html += '            </div>\n'

                html += '        </div>\n'

        # Standalone Accomplishments
        standalone_accs = []
        for acc_item in filtered_accomplishments:
            acc = acc_item.get('accomplishment') or acc_item
            acc_props = acc.get('properties', acc)
            is_standalone = True
            for plan in filtered_plans:
                p = plan['properties']
                plan_name = p.get('name', '')
                if p.get('plan_status') == 'Completed' and (acc_props.get('name') == f"Accomplished: {plan_name}" or (plan_name and plan_name in acc_props.get('name', ''))):
                    is_standalone = False
                    break
            if is_standalone:
                standalone_accs.append(acc_item)

        if standalone_accs:
            html += '        <h3>Accomplishments (' + str(len(standalone_accs)) + ')</h3>\n'
            for acc_item in standalone_accs:
                acc = acc_item.get('accomplishment') or acc_item
                acc_props = acc.get('properties', acc)

                html += '        <div class="accomplishment-item">\n'
                html += '            <strong>' + acc_props.get("name", "Unnamed") + '</strong>\n'
                html += '            <p>' + acc_props.get("description", "") + '</p>\n'

                # Show advanced YSE list
                if acc_item.get('advances_yse_list'):
                    yse_list = acc_item.get('advances_yse_list', [])
                    if yse_list:
                        yse_identifiers = []
                        for yse in yse_list:
                            if yse and yse.get('properties'):
                                yse_identifiers.append(yse['properties'].get('year_identifier', ''))
                        if yse_identifiers:
                            html += '            <p><small>Advances YSE: ' + ', '.join(filter(None, yse_identifiers)) + '</small></p>\n'

                html += '        </div>\n'

        html += '    </div>\n'

    # Notes Section
    notes = evidence_data.get('has_notes', [])
    if notes:
        filtered_notes = [n for n in notes if n and 'note' in n and should_include(n['note'].get('properties', {}))]
        if filtered_notes:
            html += '    <div class="section">\n        <h2>Notes (' + str(len(filtered_notes)) + ')</h2>\n'
            for note_item in filtered_notes:
                note = note_item['note'].get('properties', {})
                created_by = note_item.get('created_by')

                html += '        <div class="note-item">\n'
                html += '            <strong>' + note.get("date_created", "No date") + '</strong>'
                if created_by and created_by.get('properties', {}).get('name'):
                    html += ' - ' + created_by['properties']['name']
                if note.get('depreciated') or note.get('deprecated'):
                    dep_date = ' (' + (note.get('depreciated_date') or note.get('deprecated_date', '')) + ')' if (note.get('depreciated_date') or note.get('deprecated_date')) else ""
                    html += ' <span class="badge badge-deprecated">Depreciated' + dep_date + '</span>'
                html += '\n            <p>' + note.get("content", "") + '</p>\n'

                if note.get('file_path') or note.get('uri_path'):
                    url = note.get('file_path') or note.get('uri_path')
                    html += '            <p><small>📎 <a href="' + url + '" class="doc-link">' + note.get("name", "Attachment") + '</a></small></p>\n'

                html += '        </div>\n'
            html += '    </div>\n'

    # Messages Section
    messages = evidence_data.get('has_messages', [])
    if messages:
        filtered_messages = [m for m in messages if m and 'message' in m and should_include(m['message'].get('properties', {}))]
        if filtered_messages:
            html += '    <div class="section">\n        <h2>Messages (' + str(len(filtered_messages)) + ')</h2>\n'
            for message_item in filtered_messages:
                message = message_item['message'].get('properties', {})
                created_by = message_item.get('created_by')

                html += '        <div class="message-item">\n'
                html += '            <strong>' + message.get("date_sent", "No date") + '</strong>'
                if created_by and created_by.get('properties', {}).get('name'):
                    html += ' - ' + created_by['properties']['name']
                if message.get('depreciated') or message.get('deprecated'):
                    dep_date = ' (' + (message.get('depreciated_date') or message.get('deprecated_date', '')) + ')' if (message.get('depreciated_date') or message.get('deprecated_date')) else ""
                    html += ' <span class="badge badge-deprecated">Depreciated' + dep_date + '</span>'
                html += '\n            <p>' + message.get("content", "") + '</p>\n'
                html += '        </div>\n'
            html += '    </div>\n'

    # Metrics Section
    metrics = evidence_data.get('has_metrics', [])
    if metrics:
        html += '    <div class="section">\n        <h2>Metrics (' + str(len(metrics)) + ')</h2>\n'
        for metric_item in metrics:
            if metric_item and 'metric' in metric_item:
                m = metric_item['metric'].get('properties', {})
                created_by = metric_item.get('created_by')
                value = m.get('value') or m.get('single_value', 'N/A')

                html += '        <div class="metric-item">\n'
                html += '            <strong>' + m.get("name", "Unknown") + ':</strong> ' + str(value)
                if created_by and created_by.get('properties', {}).get('name'):
                    html += ' (' + created_by['properties']['name'] + ')'
                html += '\n        </div>\n'
        html += '    </div>\n'

    # Implementation Evidence Section
    evidence_types = evidence_data.get('evidenceTypes', [])

    # Filter evidence types based on year
    if any(et for et in evidence_types if et.get('evidenceType')):
        html += '    <div class="section">\n        <h2>Implementation Evidence</h2>\n'

        for et in evidence_types:
            if not et.get('evidenceType'):
                continue

            et_props = et['evidenceType'].get('properties', {})

            # Filter docs/webs based on included_in_years
            filtered_docs = []
            for doc in et.get('docs', []):
                if doc and 'document' in doc:
                    # Check year filtering (do NOT check include_in_report for Implementation Evidence)
                    rel = doc.get('relationship', {})
                    included_years = rel.get('included_in_years', [])
                    excluded_years = rel.get('excluded_from_years', [])

                    # If no relationship or no included_in_years specified, include it
                    # If included_years specified, check if academic year is in it
                    # Also check if not in excluded_years
                    if not rel or not included_years:
                        # No relationship data or no included_in_years, include the doc
                        if not excluded_years or academic_year not in excluded_years:
                            filtered_docs.append(doc)
                    elif academic_year in included_years and academic_year not in excluded_years:
                        filtered_docs.append(doc)

            filtered_webs = []
            for web in et.get('webs', []):
                if web and 'webpage' in web:
                    # Check year filtering (do NOT check include_in_report for Implementation Evidence)
                    rel = web.get('relationship', {})
                    included_years = rel.get('included_in_years', [])
                    excluded_years = rel.get('excluded_from_years', [])

                    # If no relationship or no included_in_years specified, include it
                    # If included_years specified, check if academic year is in it
                    if not rel or not included_years:
                        # No relationship data or no included_in_years, include the web
                        if not excluded_years or academic_year not in excluded_years:
                            filtered_webs.append(web)
                    elif academic_year in included_years and academic_year not in excluded_years:
                        filtered_webs.append(web)

            # Filter notes/messages based on year
            filtered_impl_notes = []
            for note in et.get('notes', []):
                if note and 'note' in note:
                    # Check year filtering (do NOT check include_in_report for Implementation Evidence)
                    rel = note.get('relationship', {})
                    included_years = rel.get('included_in_years', [])
                    excluded_years = rel.get('excluded_from_years', [])

                    if not rel or not included_years:
                        # No relationship data or no included_in_years, include the note
                        if not excluded_years or academic_year not in excluded_years:
                            filtered_impl_notes.append(note)
                    elif academic_year in included_years and academic_year not in excluded_years:
                        filtered_impl_notes.append(note)

            filtered_impl_msgs = []
            for msg in et.get('msgs', []):
                if msg and 'message' in msg:
                    # Check year filtering (do NOT check include_in_report for Implementation Evidence)
                    rel = msg.get('relationship', {})
                    included_years = rel.get('included_in_years', [])
                    excluded_years = rel.get('excluded_from_years', [])

                    if not rel or not included_years:
                        # No relationship data or no included_in_years, include the message
                        if not excluded_years or academic_year not in excluded_years:
                            filtered_impl_msgs.append(msg)
                    elif academic_year in included_years and academic_year not in excluded_years:
                        filtered_impl_msgs.append(msg)

            # Filter metrics by include_in_report
            filtered_impl_metrics = []
            for metric in et.get('metrics', []):
                if metric and metric.get('properties'):
                    if should_include(metric['properties']):
                        filtered_impl_metrics.append(metric)

            # Only show implementation type if it has content after filtering
            if filtered_docs or filtered_webs or filtered_impl_notes or filtered_impl_msgs or filtered_impl_metrics:
                html += '        <div class="implementation-type">[' + et.get('type', 'Unknown Type') + '] ' + et_props.get('title', '') + '</div>\n'

                if et_props.get('description'):
                    html += '        <p style="margin-left: 20px; color: #666;">' + et_props.get('description') + '</p>\n'

                # Documents
                if filtered_docs:
                    html += '        <p style="margin-left: 20px;"><strong>Documents:</strong></p>\n'
                    html += '        <ul style="margin-left: 40px;">\n'
                    for doc in filtered_docs:
                        d = doc['document'].get('properties', {})
                        url = d.get('file_path') or d.get('uri_path', '#')
                        html += '            <li><a href="' + url + '" class="doc-link">' + d.get("name", "Unknown") + '</a>'

                        # Add badges
                        if d.get('is_administrative_review_documentation') in ['True', True]:
                            html += ' <span class="badge badge-admin">Admin Review</span>'
                        if d.get('is_milestone_and_measures_documentation') in ['True', True]:
                            html += ' <span class="badge badge-milestone">Milestones</span>'
                        if d.get('depreciated') or d.get('deprecated'):
                            dep_date = ' (' + (d.get('depreciated_date') or d.get('deprecated_date', '')) + ')' if (d.get('depreciated_date') or d.get('deprecated_date')) else ""
                            html += ' <span class="badge badge-deprecated">Depreciated' + dep_date + '</span>'

                        # Add maintained by info
                        if doc.get('maintained_by') and doc['maintained_by'].get('properties', {}).get('name'):
                            html += ' <small>(Maintained by: ' + doc['maintained_by']['properties']['name'] + ')</small>'

                        if d.get('description'):
                            html += '<br><small style="margin-left: 20px; color: #666;">' + d.get("description") + '</small>'

                        html += '</li>\n'
                    html += '        </ul>\n'

                # Webpages
                if filtered_webs:
                    html += '        <p style="margin-left: 20px;"><strong>Webpages:</strong></p>\n'
                    html += '        <ul style="margin-left: 40px;">\n'
                    for web in filtered_webs:
                        w = web['webpage'].get('properties', {})
                        html += '            <li><a href="' + w.get("url", "#") + '" class="doc-link">' + w.get("name", "Unknown") + '</a>'

                        if w.get('no_longer_exists'):
                            html += ' <span class="badge badge-deprecated">No Longer Exists</span>'
                        if w.get('depreciated') or w.get('deprecated'):
                            dep_date = ' (' + (w.get('depreciated_date') or w.get('deprecated_date', '')) + ')' if (w.get('depreciated_date') or w.get('deprecated_date')) else ""
                            html += ' <span class="badge badge-deprecated">Depreciated' + dep_date + '</span>'

                        # Add maintained by info
                        if web.get('maintained_by') and web['maintained_by'].get('properties', {}).get('name'):
                            html += ' <small>(Maintained by: ' + web['maintained_by']['properties']['name'] + ')</small>'

                        if w.get('description'):
                            html += '<br><small style="margin-left: 20px; color: #666;">' + w.get("description") + '</small>'

                        html += '</li>\n'
                    html += '        </ul>\n'

                # Implementation Notes
                if filtered_impl_notes:
                    html += '        <p style="margin-left: 20px;"><strong>Notes:</strong></p>\n'
                    html += '        <ul style="margin-left: 40px;">\n'
                    for note in filtered_impl_notes:
                        n = note['note'].get('properties', {})
                        html += '            <li>' + n.get("date_created", "No date") + ': ' + n.get("content", "")
                        if n.get('depreciated') or n.get('deprecated'):
                            dep_date = ' (' + (n.get('depreciated_date') or n.get('deprecated_date', '')) + ')' if (n.get('depreciated_date') or n.get('deprecated_date')) else ""
                            html += ' <span class="badge badge-deprecated">Depreciated' + dep_date + '</span>'
                        html += '</li>\n'
                    html += '        </ul>\n'

                # Implementation Messages
                if filtered_impl_msgs:
                    html += '        <p style="margin-left: 20px;"><strong>Messages:</strong></p>\n'
                    html += '        <ul style="margin-left: 40px;">\n'
                    for msg in filtered_impl_msgs:
                        m = msg['message'].get('properties', {})
                        html += '            <li>' + m.get("date_sent", "No date") + ': ' + m.get("content", "")
                        if m.get('depreciated') or m.get('deprecated'):
                            dep_date = ' (' + (m.get('depreciated_date') or m.get('deprecated_date', '')) + ')' if (m.get('depreciated_date') or m.get('deprecated_date')) else ""
                            html += ' <span class="badge badge-deprecated">Depreciated' + dep_date + '</span>'
                        html += '</li>\n'
                    html += '        </ul>\n'

                # Implementation Metrics
                if filtered_impl_metrics:
                    html += '        <p style="margin-left: 20px;"><strong>Metrics:</strong></p>\n'
                    html += '        <ul style="margin-left: 40px;">\n'
                    for metric in filtered_impl_metrics:
                        m = metric['properties']
                        value = m.get("value") or m.get("single_value", "N/A")
                        html += '            <li>' + m.get("name", "Unknown") + ': <strong>' + str(value) + '</strong></li>\n'
                    html += '        </ul>\n'

        html += '    </div>\n'

    html += '</body>\n</html>'

    return html


def create_index_html(report_files: List[str], working_group: str, output_dir: Path):
    """Create an index HTML file listing all reports"""

    html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
    html += '    <meta charset="UTF-8">\n'
    html += '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
    html += '    <title>' + working_group + ' - Report Index</title>\n'

    html += '''    <style>
        body {
            font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #2c5282;
        }
        .report-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .report-item {
            padding: 10px;
            margin: 5px 0;
            border-left: 3px solid #3182ce;
            background: #f7fafc;
        }
        a {
            color: #3182ce;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
'''

    html += '    <h1>' + working_group + ' - Evidence Reports</h1>\n'
    html += '    <div class="report-list">\n'
    html += '        <h2>Available Reports (' + str(len(report_files)) + ')</h2>\n'

    for filepath in sorted(report_files):
        filename = Path(filepath).name
        html += '        <div class="report-item"><a href="' + filename + '">' + filename + '</a></div>\n'

    html += '    </div>\n'
    html += '    <p style="text-align: center; color: #666; margin-top: 20px;">\n'
    html += '        Generated: ' + datetime.now().strftime("%Y-%m-%d %H:%M") + '\n'
    html += '    </p>\n'
    html += '</body>\n</html>'

    index_path = output_dir / "index.html"
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✓ Generated index: index.html")


if __name__ == "__main__":
    # Fetch data directly from Neo4j
    data = fetch_evidence_for_working_group("Instructional Materials", "2024-2025")
    generate_indicator_html_reports(data, "reports")