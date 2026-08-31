"""
Centralized vocabulary / choice constants for the ATI app.

This module holds pure string vocabularies and lookup maps. It must NOT import
from app.database.graph_schema (which would create a cycle, since graph_schema
imports from here). Class registries that map strings to neomodel classes live
in app/database/class_factory.py.
"""

# =============================================================================
# Working groups — THE single source of truth for the SET of ATI working groups.
# Everything below (the lookup maps, the evidence/report vocabulary, the campus-plan
# abbrev set, and the evidence-query gate) DERIVES from this list. Add a group here
# and it propagates; do not hand-edit the derived maps. seed_working_groups.py MERGEs
# one ATIWorkingGroup per entry (idempotent, keyed on `name`).
#   has_indicators — carries Goals/SuccessIndicators; appears in the evidence/report vocab
#     `working_groups` and in the evidence-query gate. Steering is coordination-only (False).
#   campus_plan    — gets a per-campus WorkingGroupPlan (create_campus_plan / AY rollover /
#     seed_working_groups --backfill-plans). ALL groups carry campus plans as of 2026-2027:
#     com/gov flipped True with their 2026-2027 indicator sets (existing years are NOT
#     backfilled — their WGPs first appear when a year is created after the flip);
#     Steering is True though it has no indicators.
# Order matters: the ordered derivations (`working_groups`, `working_group_abbrevs`)
# preserve registry order.
# =============================================================================
WORKING_GROUP_DEFS = [
    {"abbrev": "web", "name": "Web",                             "url_slug": "web",                     "has_indicators": True,  "campus_plan": True},
    {"abbrev": "pro", "name": "Procurement",                     "url_slug": "procurement",             "has_indicators": True,  "campus_plan": True},
    {"abbrev": "ins", "name": "Instructional Materials",         "url_slug": "instructional-materials", "has_indicators": True,  "campus_plan": True},
    {"abbrev": "com", "name": "Communication & Training",        "url_slug": "communication-training",  "has_indicators": True,  "campus_plan": True},
    {"abbrev": "gov", "name": "Governance, Planning & Policies", "url_slug": "governance",              "has_indicators": True,  "campus_plan": True},
    {"abbrev": "ste", "name": "Steering",                        "url_slug": "steering",                "has_indicators": False, "campus_plan": True},
]

# Indicator-carrying groups (evidence/report surfaces). Helper for the derivations below.
_INDICATOR_DEFS = [d for d in WORKING_GROUP_DEFS if d["has_indicators"]]

# Abbrev/name -> canonical ATIWorkingGroup.name (ALL groups; both key forms accepted).
# Derived from WORKING_GROUP_DEFS.
working_group_names = {
    **{d["abbrev"]: d["name"] for d in WORKING_GROUP_DEFS},
    **{d["name"]: d["name"] for d in WORKING_GROUP_DEFS},
}

# Abbrev/name -> 3-letter code, for building SuccessIndicator.composite_key. Only groups
# that carry indicators (Steering has none). Derived.
compsite_key_wg_names = {
    **{d["abbrev"]: d["abbrev"] for d in _INDICATOR_DEFS},
    **{d["name"]: d["abbrev"] for d in _INDICATOR_DEFS},
}

# Abbreviations that participate in per-campus WorkingGroupPlan creation (create_campus_plan,
# the AY rollover, seed_working_groups --backfill-plans). Mirrors WORKING_GROUP_ABBREVS in
# queries/committees/create.py. Derived from the `campus_plan` flag.
working_group_abbrevs = tuple(d["abbrev"] for d in WORKING_GROUP_DEFS if d["campus_plan"])

academic_years = [
    "2019-2020",
    "2020-2021",
    "2021-2022",
    "2022-2023",
    "2023-2024",
    "2024-2025",
    "2025-2026",
    "2026-2027",
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

# URL-slug -> canonical name, for the evidence query endpoint (GET /evidence/<slug>/<ay>).
# The endpoint gate: a slug is queryable iff it's a key here. Only indicator-carrying groups
# (Steering has no evidence). Derived — registering a has_indicators group makes its slug
# queryable with no endpoint change.
working_group_names_web_query = {d["url_slug"]: d["name"] for d in _INDICATOR_DEFS}

# Flat list of indicator-carrying working-group names, in registry order — the evidence/
# report/export vocabulary iterated across the app. Derived.
working_groups = [d["name"] for d in _INDICATOR_DEFS]

# Plan lifecycle status. THE single source of truth — the write-path validator in
# queries/implementation/update.py and the frontend's planStatus.js both derive from
# this list, and nothing should re-declare it.
#
# "Completed" (not "Complete"): that is what every Plan in the graph carries, what the
# accomplishment auto-create branch in update_plan keys on, and what the campus-plan
# and Plans/Accomplishments views order by. The list said "Complete" while the
# validator said "Completed", so the Annotations-tab Plan form — which built its
# options from the wrong spelling — 500'd on every save at that status.
plan_statuses = [
    "Not Started",
    "In Progress",
    "Completed",
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
    'public-webpages':                "Public Webpages",

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
    "rel_type":    "Relationship Type",  # a relationship type in our schema (e.g. 'develops')
}


# Query category: the KIND of decision a pending question needs — framed by question
# TYPE, not subject. A Query is raised under a WorkingGroupPlan and drives campus plans
# and YSE. Stored values are dict keys; values are display labels.
query_categories = {
    "policy_decision":         "Policy Decision",
    "resource_request":        "Resource Request",
    "technical_clarification": "Technical Clarification",
    "risk_compliance":         "Risk / Compliance",
    "information_gap":          "Information Gap",
}

# Query status: lifecycle of a pending question from raised to answered. Settling is
# independent of any meeting. Stored values are dict keys; values are display labels.
query_statuses = {
    "open":        "Open",
    "in_progress": "In Progress",
    "settled":     "Settled",
}


# ---------------------------------------------------------------------------
# Recommendation lifecycle — improvements identified at the end of a review
# cycle for one YSE (graph_schema.Recommendation). Recommendations are records:
# they resolve via status + resolution prose, never deletion.
# ---------------------------------------------------------------------------
recommendation_statuses = {
    "open":      "Open",
    "addressed": "Addressed",
    "dismissed": "Dismissed",
}


# ---------------------------------------------------------------------------
# Concern lifecycle — an issue raised against one YSE for which no path to
# resolution has been defined yet (graph_schema.Concern). A concern is a
# deliberately unstable state: it exists to LEAVE, by becoming a Recommendation
# (something should change) or a Plan (someone will do something), or by being
# dismissed. Like recommendations, concerns are records — they never delete,
# and a converted concern keeps an edge to whatever it became.
# ---------------------------------------------------------------------------
concern_statuses = {
    "open":      "Open",
    "converted": "Converted",
    "dismissed": "Dismissed",
}


# ---------------------------------------------------------------------------
# Evidence strength — how strongly an implementation's is_evidence_for link
# addresses the requirements of the success indicator it evidences. Stored as
# an integer 0-3 on the relationship itself (graph_schema.IsEvidenceForRel);
# an absent value means "unrated". Ordered: higher = stronger evidence.
# ---------------------------------------------------------------------------
evidence_strength_levels = {
    0: "No Contribution",
    1: "Indirect Support",
    2: "Partial",
    3: "Full",
}

# ---------------------------------------------------------------------------
# Evidence control — who operates the practice behind an evidence link,
# RELATIVE to that evidence's owners (the same implementation can be internal
# to one campus/WG's evidence and external to another's). Absent/None =
# unspecified. External makes a dependency visible: the owners rely on a
# practice they don't directly control (another unit, SFBRN-shared, the
# Chancellor's Office, or a vendor) — maturity reviews grade their INTERFACE
# to it, not the practice itself.
# ---------------------------------------------------------------------------
evidence_control_choices = {
    "internal": "The evidence owners operate this practice themselves.",
    "external": "The owners rely on a practice they don't directly control (another unit, SFBRN, the CO, a vendor).",
}

# --- Evidence requirements ---------------------------------------------------------------
# The STRUCTURE of a companion-guide bar. The requirement TEXT itself is graph-resident
# (EvidenceRequirement nodes hanging off the SuccessIndicator) — deliberately not here,
# because it is authored content that curators edit, not a controlled vocabulary.

evidence_requirement_levels = {
    "established": "The bar a campus must clear to claim Established for this indicator.",
    "managed":     "Additional bar for Managed — tracking procedures and collected success data.",
    "optimizing":  "Additional bar for Optimizing — regular administrative review of that data.",
}

# The bar elements as the companion guides actually write them. `element` is optional on an
# EvidenceRequirement: eight indicators state their Established bar as unlabelled prose
# bullets, and an unlabelled requirement is left unlabelled rather than guessed at.
evidence_requirement_elements = {
    "Position":              "Who is responsible, and whether that responsibility is documented.",
    "Budget":                "Staff time, tooling and funding allocated to the work.",
    "Procedures":            "The documented process that makes the work repeatable.",
    "Output":                "The records or artifacts the practice leaves behind.",
    "Metrics":               "What is measured to manage the practice (Managed level).",
    "Administrative Review": "Regular review of the collected data (Optimizing level).",
}

# Which rubric dimension each element grades against, so an EvidenceRequirement can roll up
# to the same three dimensions the generic Status Level rubric uses.
evidence_requirement_rubric_dimensions = {
    "Position":              "resources",
    "Budget":                "resources",
    "Procedures":            "procedures",
    "Output":                "documentation_evidence",
    "Metrics":               "documentation_evidence",
    "Administrative Review": "procedures",
}


evidence_strength_descriptions = {
    0: "Does not address any requirement of the success indicator — review whether the link belongs at all.",
    1: "Supports the success indicator indirectly — enabling or adjacent work that does not itself address the indicator's requirements.",
    2: "Directly addresses some, but not all, of the success indicator's requirements.",
    3: "Directly and completely addresses the success indicator's requirements.",
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
    "evidence_strength_levels":       evidence_strength_levels,
    "evidence_strength_descriptions": evidence_strength_descriptions,
    "evidence_control_choices":       evidence_control_choices,
    "evidence_requirement_levels":    evidence_requirement_levels,
    "evidence_requirement_elements":  evidence_requirement_elements,
    "working_groups":        working_groups,
    "message_types":         message_types,
    "metric_types":          metric_types,
    "academic_years":        academic_years,
    # ontology descriptions
    "descriptor_kinds":      descriptor_kinds,
    # queries (pending questions)
    "query_categories":      query_categories,
    "query_statuses":        query_statuses,
    "recommendation_statuses": recommendation_statuses,
    "concern_statuses":        concern_statuses,
}

yse_priority_level = {
    "top": "Top",
    "high": "High",
    "neutral": "Neutral",
    "low": "Low",

}