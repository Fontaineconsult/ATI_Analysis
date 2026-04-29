"""
Centralized vocabulary / choice constants for the ATI app.

This module holds pure string vocabularies and lookup maps. It must NOT import
from app.database.graph_schema (which would create a cycle, since graph_schema
imports from here). Class registries that map strings to neomodel classes live
in app/database/class_factory.py.
"""

working_group_names = {
    'pro': 'Procurement',
    'web': 'Web',
    'ins': 'Instructional Materials',
    'Procurement': 'Procurement',
    'Web': 'Web',
    'Instructional Materials': 'Instructional Materials'
}

compsite_key_wg_names = {
    'pro': 'pro',
    'web': 'web',
    'ins': 'ins',
    'Procurement': 'pro',
    'Web': 'web',
    'Instructional Materials': 'ins'
}

academic_years = [
    "2019-2020",
    "2020-2021",
    "2021-2022",
    "2022-2023",
    "2023-2024",
    "2024-2025",
    "2025-2026",
]

implementation_types = [
    "Process",
    "Project",
    "Procedure",
    "Service",
    "Guidance",
    "Tracking",
    "InternalPolicy",
]

documentation_types = [
    "document",
    "webpage",
    "message",
    "note",
    "metric",
]

documentation_relationships = {
    "document": "supporting_documents",
    "webpage": "supporting_webpages",
    "message": "supporting_messages",
    "note": "supporting_notes",
    "Note": "supporting_notes",
    "metric": "supporting_metrics",
}

implementor_classes = {
    "Process": "implements_process",
    "Project": "implements_project",
    "Procedure": "implements_procedure",
    "Service": "implements_service",
    "Guidance": "implements_guidance",
    "Tracking": "implements_tracking",
}

status_levels = [
    "Not Started",
    "Initiated",
    "Defined",
    "Established",
    "Managed",
    "Optimizing",
]

message_types = [
    "e-mail",
    "voice mail",
    "text message",
    "letter",
    "memo",
    "report",
    "meeting minutes",
    "presentation",
]

metric_types = [
    "tabular",
    "graphical",
    "descriptive",
]

working_group_names_web_query = {
    "web": "Web",
    "instructional-materials": "Instructional Materials",
    "procurement": "Procurement",
}

working_groups = ["Web", "Procurement", "Instructional Materials"]

plan_statuses = [
    "Not Started",
    "In Progress",
    "Complete",
    "On Hold",
    "Abandoned",
]

evidence_descriptions = [
    "procedure",
    "resource",
    "documentation",
    "documentation_evidence",
]

# Trajectory: direction of travel on a ProgressUpdate, orthogonal to absolute StatusLevel.
# Stored values are dict keys; dict values are human-readable display labels.
trajectory_choices = {
    "improving": "Improving",
    "on_track":  "On Track",
    "stagnant":  "Stagnant",
    "at_risk":   "At Risk",
    "failing":   "Failing",
}
