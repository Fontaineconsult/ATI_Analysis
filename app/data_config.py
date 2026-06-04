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

# Asset class: what kind of ICT the asset is — shorthand for which §508 stewardship
# capacities typically attach and to whom. Stored values are dict keys.
asset_classes = {
    "institutional_system": "Institutional System",
    "employee_content":     "Employee-Authored Content",
    "third_party_service":  "Third-Party Service",
    "infrastructure":       "Infrastructure",
}

# Asset scope: the level at which the asset is deployed/owned. Scope is part of asset
# identity (the same nominal system can resolve into assets at different scopes).
asset_scopes = {
    "systemwide": "Systemwide",
    "regional":   "Regional",
    "campus":     "Campus",
    "vendor":     "Vendor-Controlled",
}

# TAAP outcome: the equivalent-facilitation result when full conformance isn't achievable
# (Title II §35.205). Stored values are dict keys.
taap_outcomes = {
    "equally_effective":     "Equally Effective",
    "non_equal_alternative": "Non-Equal Alternative",
    "referral":              "Referral",
}

# Interface function: the institutional purpose a surface serves — what it is FOR.
# Identity-bearing (one of the four coordinates of the interface signature) and
# single-valued per interface. Program-shaped: aligns with how §504/Title II frame the
# institution's programs/activities. Kept small and uncontestable to minimize false
# splits. Stored values are dict keys; changing a key re-identifies interfaces, so the
# keys are stable.
functions = {
    "teaching-and-learning":            "Teaching & Learning",
    "information-and-communication":    "Information & Communication",
    "service-and-self-administration":  "Service & Self-Administration",
    "internal-operations":              "Internal Operations",
}

# Component kind: the functional role of a WCAG-grain element, defined by what kind of
# thing it is to interact with — NOT by the substrate behind it. A standalone PDF and a
# Canvas course file can be the same kind because they play the same role. Kind lives on
# the Component (where it is homogeneous and where WCAG attaches), NOT on the Interface
# (a single interface is kind-heterogeneous). Stored values are dict keys (neomodel
# `choices=` requires a dict; the labels are what an app surfaces).
component_kinds = {
    "web-surface":           "Web Surface",            # page or web/mobile application rendered in a browser/web runtime
    "structured-document":   "Structured Document",    # PDF, word-processor, presentation, spreadsheet — read/rendered docs
    "time-based-media":      "Time-Based Media",       # video, audio
    "interactive-component": "Interactive Component",   # forms, widgets, embedded tools (LTIs)
    "static-non-text":       "Static Non-Text",        # standalone image or graphic
}

# Coverage domain: the declared "what we track" — institution-chosen domains of ATI
# attention. Orthogonal to function (purpose) and provenance (how it became known).
coverage_domains = {
    "library-assets":               "Library Assets",
    "social-media":                 "Social Media",
    "marketing-communications":     "Marketing & Communications",
    "publisher-content":            "Publisher Content",
    "course-content":               "Course Content",
    "emerging-instructional-tech":  "Emerging Instructional Tech",
    "administrative-systems":        "Administrative Systems",
    "academic-services":              "Academic Services",
    'human-resource-services':        "Human Resource Services",
    'campus-map':                    "Campus Map",

}

# Audience: who encounters the interface. The label carries the governing legal basis,
# because the duty and its accommodation population differ by audience.
audiences = {
    "students":                  "Students",                   # enrolled students — §504 + Title II (DPRC accommodation population)
    "employees":                 "Employees",                  # faculty & staff — Title I + §504 (HR accommodation population; FEHA in CA)
    "applicants-for-employment": "Applicants for Employment",  # job applicants — Title I reaches hiring
    "prospective-students":      "Prospective Students",       # recruitment/admissions audience — Title II + §504
    "general-public":            "General Public",             # community, visitors, non-affiliated users — Title II + §504
}

# Provenance: how an interface became known to the ATI. The declared-vs-enacted gap is
# diagnostic (it is NOT meant to be eliminated): declared = the ATI named it up front;
# enacted = it emerged from where remediation actually clustered; both = surfaced both ways.
interface_provenances = {
    "declared": "Declared",
    "enacted":  "Enacted",
    "both":     "Both",
}


# Descriptor kind: what flavor of ontology element a UniversalDescriptor describes. Drives
# which factory helper builds its handle (make_node_type_handle / make_field_handle /
# make_field_value_handle in identifiers.py) and which target_* coordinates are required.
# Stored values are dict keys.
descriptor_kinds = {
    "node_type":   "Node Type",
    "field":       "Field",
    "field_value": "Field Value",
}


# Schema-element kind: which type-level element of our own schema a SchemaElement handle
# anchors — a node label, a relationship type, or a field. Drives the meta-scaffold list
# grouping, the add picker, and which identifiers.py helper builds the handle. Stored as keys.
schema_element_kinds = {
    "node_label": "Node Label",
    "rel_type":   "Relationship Type",
    "field":      "Field",
}


# ---------------------------------------------------------------------------
# Public vocabularies surfaced to the frontend (read-only).
#
# This is the single source of truth: the frontend fetches these over
# GET /ati/data-api/v1/settings (see endpoints/data_api/settings.py) instead of
# hardcoding its own copies. To expose a NEW vocabulary, define it above and add
# one line here — that is the only file to edit.
#
# Only display vocabularies belong here. The structural maps that drive dispatch
# logic (implementor_classes, documentation_relationships, working_group_names,
# implementation_types, documentation_types, compsite_key_wg_names,
# working_group_names_web_query, evidence_descriptions) are deliberately NOT
# exposed — they are code, not settings.
# ---------------------------------------------------------------------------
PUBLIC_VOCABULARIES = {
    # interfaces
    "functions":             functions,
    "coverage_domains":      coverage_domains,
    "audiences":             audiences,
    "interface_provenances": interface_provenances,
    # components
    "component_kinds":       component_kinds,
    # assets / TAAPs
    "asset_classes":         asset_classes,
    "asset_scopes":          asset_scopes,
    "taap_outcomes":         taap_outcomes,
    # plans / progress
    "trajectory_choices":    trajectory_choices,
    "plan_statuses":         plan_statuses,
    # evidence / indicators / reference
    "status_levels":         status_levels,
    "working_groups":        working_groups,
    "message_types":         message_types,
    "metric_types":          metric_types,
    "academic_years":        academic_years,
    # ontology descriptions
    "descriptor_kinds":      descriptor_kinds,
    # meta-scaffold
    "schema_element_kinds":  schema_element_kinds,
}

yse_priority_level = {
    "top": "Top",
    "high": "High",
    "neutral": "Neutral",
    "low": "Low",

}