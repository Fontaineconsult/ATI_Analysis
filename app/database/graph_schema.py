import json



from neomodel import (StructuredNode, StringProperty,
                      IntegerProperty, RelationshipTo,
                      RelationshipFrom, UniqueIdProperty,
                      StructuredRel, Relationship, DateProperty,
                      BooleanProperty, IntegerProperty, JSONProperty, ArrayProperty, ZeroOrOne)
from dotenv import load_dotenv
import os

from app.data_config import (trajectory_choices, asset_classes, asset_scopes, taap_outcomes,
                             functions, component_kinds, coverage_domains, audiences, interface_provenances,
                             descriptor_kinds, query_categories, query_statuses)

# Configuration enters through the single gateway (app/config_gateway.py). Importing
# it hydrates os.environ from web.config (production) / .env.<FLASK_ENV> (development),
# so this module has DB config whether it is imported by create_app or run as a
# standalone script — and in production it reads web.config, never a .env file.
from app.config_gateway import config  # noqa: F401  (imported for its hydration side-effect)









"""
Ontology

Nodes to describe the nodes for use in ontology management and front end display. 


"""


class UniversalDescriptor(StructuredNode):

    """

    A standalone descriptor for an ontology element — a node type, a field, or a specific
    field/vocabulary value. Surfaced by the web app for help text, tooltips, and an
    ontology browser, and authored/edited from the Settings area.

    DESCRIPTORS ARE NOT EDGE-CONNECTED TO INSTANCE DATA. They are retrieved by matching
    `descriptor_handle` (exact) or by keyword-searching `search_text`, and merged onto
    query results in the application layer — fetched once per handle, never once per
    instance. Connecting them by edges would multiply repeated description text across
    result sets.

    Two descriptions per element:
      - description_full  : long-form. The complete reasoning, design rationale, and
                            thinking behind the element. Shown on demand; the institutional
                            memory of WHY the element is shaped the way it is.
      - description_short : concise. The text the application renders by default in
                            tooltips, help panels, and the ontology browser.

    descriptor_kind: node_type | field | field_value
    """
    unique_id = UniqueIdProperty()

    # The stable retrieval handle, built by a factory (identifiers.py) so two authors
    # describing the same element produce the same handle. Examples:
    #   node_type:   "node_type:Interface"
    #   field:       "field:Interface.function"
    #   field_value: "field_value:function.teaching-and-learning"
    descriptor_handle = StringProperty(unique_index=True, required=True)

    descriptor_kind = StringProperty(choices=descriptor_kinds)  # node_type | field | field_value

    # The label/field/value parts of the target, so the app can filter (e.g. "all field
    # descriptors for Interface") without parsing the handle.
    target_label = StringProperty(index=True)   # e.g. "Interface" (null for pure vocab values not tied to a label)
    target_field = StringProperty(index=True)   # e.g. "function"  (null for node_type descriptors)
    target_value = StringProperty(index=True)   # e.g. "teaching-and-learning" (only for field_value)

    title = StringProperty()                    # short human label, e.g. "Function"

    description_short = StringProperty()        # concise; rendered in the app by default
    description_full = StringProperty()         # long-form; the whole idea / rationale
    description = StringProperty()              # legacy single field, retained for back-compat

    # Lowercase concatenation of title + both descriptions + handle parts, for keyword
    # search (CONTAINS / full-text). Populated by the create/update query functions.
    search_text = StringProperty(index=True)

    include_in_report = BooleanProperty(default=False)
    last_updated = DateProperty()

    # The meta-graph anchors on descriptors: Principles that shape this ontology element
    # (backref of Principle.shapes). Type-level only; serialized `shaped_by` is assembled in the
    # read layer via Cypher. (Phase 2: Determinations' `concerned_by` will join here too.)
    shaped_by = RelationshipFrom("Principle", "shapes")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "descriptor_handle": self.descriptor_handle,
            "descriptor_kind": self.descriptor_kind,
            "target_label": self.target_label,
            "target_field": self.target_field,
            "target_value": self.target_value,
            "title": self.title,
            "description_short": self.description_short,
            "description_full": self.description_full,
            "description": self.description,
            "include_in_report": self.include_in_report,
            "last_updated": str(self.last_updated) if self.last_updated else None,
        }




"""
Meta-Scaffold (Phase 1)

The self-describing layer. Principle captures the framework's conceptual commitments; it is
grounded DOWN in Governance / IntellectualSource via `derives_from`, and shapes ACROSS to the
ontology elements it justifies via `shapes`. IntellectualSource is a non-legal grounding (a
theory / body of scholarship).

There is NO separate SchemaElement node: the ontology-element registry IS the descriptions
layer (UniversalDescriptor). A descriptor already names every type-level element (a node type,
a field, a field value, a relationship type) and holds its prose; the meta-graph points at the
SAME descriptors. These are TYPE-level edges (a few principles -> a few descriptors), so they
do NOT multiply across instance data — the descriptor's "no instance edges" invariant is intact.

Relationships:
- (Principle)-[:derives_from]->(Law|Case|Directive|ExternalPolicy|Memo|Guideline|IntellectualSource)
  HETEROGENEOUS targets, so these edges are managed in queries/principles via Cypher rather
  than a typed neomodel RelationshipTo.
- (Principle)-[:shapes]->(UniversalDescriptor)   # typed below; the descriptor is the anchor
"""


class IntellectualSource(StructuredNode):
    """
    A non-legal grounding for a Principle: a theory, framework, or body of scholarship
    (e.g. Ostrom's commons design principles). Sits alongside Governance as a `derives_from`
    target — law/policy ground a principle DOWN to mandate; intellectual sources ground it
    DOWN to theory.
    """
    unique_id = UniqueIdProperty()
    name = StringProperty(unique_index=True, required=True)
    description_short = StringProperty()
    description_full = StringProperty()

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "name": self.name,
            "description_short": self.description_short,
            "description_full": self.description_full,
        }


class Principle(StructuredNode):
    """
    A conceptual commitment of the framework (e.g. parallel duties, closest-to-capacity,
    line-vs-functional authority, second-line function, Ostrom's boundaries). Grounded DOWN
    in Governance and/or IntellectualSource via `derives_from`, and shaping ACROSS to the
    ontology elements it justifies via `shapes` -> UniversalDescriptor. An ungrounded principle
    (no `derives_from`) or an inert one (shapes nothing) is intentionally findable later —
    integrity is queryable, not enforced at save time.
    """
    unique_id = UniqueIdProperty()
    handle = StringProperty(unique_index=True, required=True)
    name = StringProperty(required=True)
    description_short = StringProperty()   # concise statement (UI default)
    description_full = StringProperty()    # full rationale (the whole idea)

    # ACROSS link to the ontology — the descriptor IS the element anchor. Single target class,
    # so a typed neomodel relationship is clean. Type-level edge (does not touch instance data).
    shapes = RelationshipTo("UniversalDescriptor", "shapes")

    # DOWN link (`derives_from`) targets Governance OR IntellectualSource — heterogeneous
    # labels, so those edges live in queries/principles (Cypher), not a typed rel here.

    def serialize(self):
        return {
            "handle": self.handle,
            "name": self.name,
            "description_short": self.description_short,
            "description_full": self.description_full,
        }







"""
Governance

Governance encompasses the formal rules, policies, directives, and guidelines that provide the framework for
ensuring accessibility within an institution. This category includes laws, policies, directives, memos,
and guidelines that establish the standards and requirements for accessibility. Governance documents
guide and inform the implementation of accessibility initiatives, ensuring that all actions comply with legal
and institutional mandates.

Relationships:

- Governance informs Indicators
- Governance is documented by Documents, Webpages, Notes, and Messages


"""



class Law(StructuredNode):

    """    Class representing a law node.

    A Law in the context of the Accessible Technology Initiative (ATI) represents a formal and
     enforceable rule established by legislative authorities to ensure equal access
      and non-discrimination for individuals with disabilities.
      These laws provide the legal framework and mandate for accessibility practices and policies within
       institutions, such as the Americans with Disabilities Act (ADA) and Section 508 of the Rehabilitation Act.

     """

    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    relevant_sections = StringProperty()
    legislative_authority = StringProperty()
    informed_goals = RelationshipTo("Goal", "informs")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")




class Case(StructuredNode):

    """    Class representing a case node.

     A legal decision or
     ruling that interprets or applies laws related to accessibility. Cases provide judicial precedents
        and clarifications on how laws such as the ADA and Section 508 should be implemented and enforced.
       These cases can influence policy-making and the development of procedures within institutions to
        ensure compliance with accessibility standards.

     """

    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    ruling = StringProperty()
    legislative_authority = StringProperty()
    informed_goals = RelationshipTo("Goal", "informs")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")


class Directive(StructuredNode):

    """    Class representing a directive node.

    An official instruction or order issued by an authority, such as an executive body or regulatory agency,
    to guide the implementation of accessibility policies and procedures. Directives provide specific guidance
    on how to achieve compliance with laws and policies, ensuring that institutions follow standardized practices
    to enhance accessibility and remove barriers for individuals with disabilities.

     """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    source_institution = StringProperty()
    informed_goals = RelationshipTo("Goal", "informs")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")


class ExternalPolicy(StructuredNode):

    """    Class representing a policy node.


    A set of principles and guidelines adopted by an organization to govern decisions and actions related
    to accessibility. Policies are designed to ensure compliance with relevant laws and directives,
    providing a framework for making technology, programs, and services accessible to all individuals,
    including those with disabilities. These policies outline the organization's commitment to accessibility
    and detail the procedures for implementing accessibility standards.

     """

    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    informed_goals = RelationshipTo("Goal", "informs")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")



class Memo(StructuredNode):

    """    Class representing a memo node.

    A written communication, typically used for internal purposes, that provides information, updates, or
    instructions related to accessibility. Memos can outline changes in policy, highlight important
    accessibility initiatives, or convey decisions made by leadership regarding the implementation of
    accessibility practices. They are essential for keeping stakeholders informed and ensuring that all
    members of the organization are aware of their roles and responsibilities in maintaining accessibility standards.

     """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    authored_date = DateProperty()
    informed_goals = RelationshipTo("Goal", "informs")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")


class Guideline(StructuredNode):

    """    Class representing a guideline node.

    A set of recommended practices and standards designed to help organizations achieve and maintain accessibility.
    Guidelines, such as the Web Content Accessibility Guidelines (WCAG), provide detailed criteria for
    making digital content accessible to individuals with disabilities. They serve as a benchmark for
    evaluating and improving accessibility across various platforms and services, ensuring consistency and
    compliance with broader accessibility laws and policies. Guidelines help institutions implement effective
    and user-friendly accessibility solutions.


     """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    informed_goals = RelationshipTo("Goal", "informs")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")


"""
Indicators

Indicators represent the metrics and benchmarks used to measure progress toward achieving accessibility goals.
This category includes success indicators that provide clear criteria for evaluating the effectiveness of
accessibility initiatives. Indicators help monitor performance, identify areas for improvement, and ensure
continuous progress in implementing accessibility standards and practices.

Relationships

- Goals are supported by Indicators
- Indicators direct Plans, Processes, Projects, Procedures, and Services

"""


class Goal(StructuredNode):

    """    Class representing a goal node.

    A measurable objective that an organization aims to achieve to enhance accessibility. Goals are set to drive
    improvements in accessibility practices, ensuring that the organization meets legal and policy requirements.
    Each goal is supported by success indicators and is aligned with broader strategic plans to create an inclusive
    environment for individuals with disabilities. Goals guide the implementation of accessibility initiatives
    and help track progress over time.

     """
    unique_id = UniqueIdProperty()


    name = StringProperty()
    description = StringProperty()
    status = RelationshipTo("StatusLevel", "status_is")
    supporting_success_indicators = RelationshipTo("SuccessIndicator", "supported_by")
    goal = StringProperty()
    goal_number = IntegerProperty()
    date_added = DateProperty()
    advanced_by = RelationshipFrom("Accomplishment", "advances_goal")
    furthered_by = RelationshipFrom("Plan", "furthers_goal")
    removed = BooleanProperty(default=False)

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'description': self.description,
            'goal_number': self.goal_number,
            'date_added': self.date_added,
            'removed': self.removed,
            "unique_id": self.unique_id
        }


class HasGoalRel(StructuredRel):
    pass



class SuccessIndicator(StructuredNode):

    """    Class representing a success indicator node.

    A Success Indicator in the context of the Accessible Technology Initiative (ATI) represents a specific metric
    or benchmark used to measure progress toward achieving a goal. Success indicators provide clear criteria for
    evaluating the effectiveness of accessibility initiatives and activities. They describe the processes,
    procedures, and outcomes that need to be accomplished to meet the defined goals. These indicators help
    organizations monitor their performance, identify areas for improvement, and ensure continuous progress
    in implementing accessibility standards and practices.


     """
    unique_id = UniqueIdProperty()

    number = IntegerProperty()
    success_indicator = StringProperty()
    composite_key = StringProperty(unique_index=True)  # Combination of goal_number and ATISubCommittee name
    removed = BooleanProperty(default=False)
    # When True, this indicator is exempt from the "has implementations" expectation
    # — not every SI is met through traditional implementation work, so the dashboard
    # suppresses its missing-implementation flag. Set via the SI settings area.
    override_implementation_requirement = BooleanProperty(default=False)
    notes = RelationshipTo("Note", "has_note")
    date_added = DateProperty()
    tracked_by = RelationshipFrom("SuccessIndicator", "tracks")
    directed_plans = RelationshipTo("Plan", "directs")
    directed_processes = RelationshipTo("Process", "directs")
    directed_projects = RelationshipTo("Project", "directs")
    directed_procedures = RelationshipTo("Procedure", "directs")
    directed_services = RelationshipTo("Service", "directs")

    #serialize
    def serialize(self):
        return {
            'number': self.number,
            'success_indicator': self.success_indicator,
            'composite_key': self.composite_key,
            'removed': self.removed,
            'override_implementation_requirement': self.override_implementation_requirement,
            'date_added': self.date_added,
            "unique_id": self.unique_id
        }


"""
Implementation


Implementation encompasses the specific actions, strategies, and plans developed to achieve accessibility goals.
This category includes goals, plans, processes, projects, procedures, and services that detail the steps and
resources needed to implement accessibility initiatives. Implementation elements provide a structured approach
to applying the standards and requirements outlined in governance documents, ensuring practical and effective execution.

Relationships

- Plans, Processes, Projects, Procedures, and Services are detailed by Plans
- Plans, Processes, Projects, Procedures, and Services are supported by Documents, Webpages, Notes, and Messages
- Plans, Processes, Projects, Procedures, and Services are evidenced by YearSuccessEvidence


"""


class DocumentedByRel(StructuredRel):
    """Relationship between implementations and their supporting documents/webpages"""
    included_in_years = ArrayProperty(StringProperty(), default=list)  # List of academic years like ["2022-2023", "2023-2024"]
    excluded_from_years = ArrayProperty(StringProperty(), default=list)  # List of academic years to exclude
    added_date = DateProperty()
    modified_date = DateProperty()
    added_by = StringProperty()  # unique_id of the Person who added it



class YseProgressRel(StructuredRel):
    """Relationship between Plans and YearSuccessEvidence to track progress updates"""
    update_date = DateProperty()
    update_note = StringProperty()
    updated_by = StringProperty()  # unique_id of the Person who added the update


class RoleHoldingRel(StructuredRel):
    """A person's holding of a Role, carrying whether their position description covers it."""
    in_position_description = BooleanProperty(default=False)   # is this capacity formally in their PD?
    pd_description = StringProperty()                          # free text: HOW the PD addresses it (or that it doesn't)
    added_date = DateProperty()


class ParticipationRel(StructuredRel):
    """A person's participation in an implementation, in a given role (the working team)."""
    role_handle = StringProperty()      # which Role the person acted in (e.g. "role:qa-specialist")
    note = StringProperty()             # optional: what they did
    added_date = DateProperty()


def serialize_role_holdings(person):
    """Project a Person's holds_role edges → [{handle, name, in_position_description, pd_description}]."""
    rows = []
    for role in person.holds_role.all():
        rel = person.holds_role.relationship(role)
        rows.append({
            "handle": role.handle,
            "name": role.name,
            "in_position_description": rel.in_position_description if rel else False,
            "pd_description": rel.pd_description if rel else None,
        })
    return rows


def serialize_participants(impl):
    """Project an implementation's participant edges → [{person, role_handle, note}], one
    row per `worked_on` edge.

    A person may be a participant in more than one role (multiple edges to the same impl).
    We MUST read each edge individually: neomodel's ``manager.relationship(node)`` returns a
    SINGLE relationship per node, so iterating people and looking up "the" relationship
    collapses every role for a given person to one value (the multi-role bug). A direct
    Cypher over the edges keeps them distinct.
    """
    from neomodel import db
    query = """
        MATCH (p:Person)-[w:worked_on]->(impl)
        WHERE impl.unique_id = $impl_uid
        RETURN p.unique_id AS unique_id, p.name AS name,
               w.role_handle AS role_handle, w.note AS note
        ORDER BY p.name, w.role_handle
    """
    rows, _meta = db.cypher_query(query, {"impl_uid": impl.unique_id})
    return [
        {"person": {"unique_id": unique_id, "name": name}, "role_handle": role_handle, "note": note}
        for (unique_id, name, role_handle, note) in rows
    ]


def serialize_applied_assets(impl):
    """The Assets an implementation applies to → [{asset_identifier, title, unique_id, scope,
    asset_class, reach: [...]}], deduped by asset.

    An implementation applies to an asset two ways: it remediates the asset directly
    (`remediates`), or it remediates an interface the asset presents
    (`remediates_interface` → `presented_by`). Both are read via Cypher because the
    implementation side has no forward neomodel manager for these — they live as reverse
    edges on Asset/Interface. `reach` records how each asset is reached ('direct' |
    'interface'); an asset reached both ways carries both tags.
    """
    from neomodel import db
    query = """
        MATCH (impl {unique_id: $impl_uid})
        RETURN
          [ (impl)-[:remediates]->(a:Asset)
              | a {.asset_identifier, .title, .unique_id, .scope, .asset_class, reach: 'direct'} ]
          + [ (impl)-[:remediates_interface]->(:Interface)-[:presented_by]->(a:Asset)
              | a {.asset_identifier, .title, .unique_id, .scope, .asset_class, reach: 'interface'} ]
          AS assets
    """
    rows, _meta = db.cypher_query(query, {"impl_uid": impl.unique_id})
    raw = rows[0][0] if rows and rows[0] else []

    merged = {}
    for asset in raw:
        if not asset or not asset.get("unique_id"):
            continue
        uid = asset["unique_id"]
        reach = asset.pop("reach", None)
        if uid not in merged:
            merged[uid] = {**asset, "reach": []}
        if reach and reach not in merged[uid]["reach"]:
            merged[uid]["reach"].append(reach)
    return list(merged.values())



class Accomplishment(StructuredNode):

    """    Class representing an accomplishment node.

    Represents an accomplishment node to track the progress of the implementation of the accessibility initiatives.

    """
    unique_id = UniqueIdProperty()

    name = StringProperty()
    description = StringProperty(unique_index=True, required=True)
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    academic_year = RelationshipTo("AcademicYear", "in_academic_year")
    advanced_goals = RelationshipTo("Goal", "advances_goal")
    advanced_year_success_indicators = RelationshipTo("YearSuccessEvidence", "advances_yse")
    achieved_through = RelationshipTo("Plan", "achieved_through")

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'description': self.description,  # Fixed from accomplishment_description
            "unique_id": self.unique_id
        }


class Plan(StructuredNode):

    """    Class representing a plan node.

    A Plan in the context of the Accessible Technology Initiative (ATI) represents a detailed strategy or roadmap
    outlining the specific steps (the campus plan), resources, and timelines needed to achieve accessibility goals.
    Plans include the identification of success indicators, allocation of responsibilities, and the scheduling of
    activities aimed at improving accessibility. For example, the ATI Campus Plan involves prioritizing tasks based
    on impact, integrating efforts across various committees, and securing necessary resources.
    These plans guide the implementation of policies, processes, and projects, ensuring a structured and
    systematic approach to enhancing accessibility within the organization. Plans are reviewed and updated
    regularly by the ATI Executive Sponsor and Steering Committee to reflect progress and adapt to new
    challenges or changes in technology.

    """
    unique_id = UniqueIdProperty()

    name = StringProperty()
    academic_year = RelationshipTo("AcademicYear", "in_academic_year")
    furthered_goals = RelationshipTo("Goal", "furthers_goal")
    furthered_year_success_indicators = RelationshipTo("YearSuccessEvidence", "furthers_yse")
    is_key_plan = BooleanProperty(default=False)
    is_campus_plan = BooleanProperty(default=False)
    description = StringProperty(unique_index=True, required=True)
    abandoned = BooleanProperty(default=False)
    abandoned_notes = StringProperty()
    completion_notes = StringProperty()
    plan_status = StringProperty()
    progress_updates = RelationshipTo("Note", "progress_documented_by")
    abandoned_year = RelationshipTo("AcademicYear", "abandoned_in_year")
    completed_year = RelationshipTo("AcademicYear", "completed_in_year")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")

    # Asana reconciliation: the gid of the Asana task this plan was pushed to
    # (set by the connector on first push) and the subtasks mirrored back.
    asana_task_gid = StringProperty(index=True)
    asana_subtasks = RelationshipTo("AsanaSubtask", "has_asana_subtask")

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'description': self.description,  # Fixed from plan_description
            'is_key_plan': self.is_key_plan,
            'is_campus_plan': self.is_campus_plan,
            'abandoned': self.abandoned,
            'abandoned_notes': self.abandoned_notes,
            'completion_notes': self.completion_notes,
            'plan_status': self.plan_status,
            'asana_task_gid': self.asana_task_gid,
            "unique_id": self.unique_id
        }


class AsanaSubtask(StructuredNode):
    """
    A read-only mirror of an Asana subtask living under a Plan's Asana task.

    These nodes are owned by the Asana refresh sync: each refresh replaces a
    plan's AsanaSubtask set wholesale with what Asana currently reports
    (see queries/asana/create.replace_plan_subtasks). Do not edit them in-app —
    Asana is the source of truth and the next refresh overwrites local changes.
    """
    unique_id = UniqueIdProperty()
    asana_gid = StringProperty(unique_index=True, required=True)

    name = StringProperty()
    completed = BooleanProperty(default=False)
    completed_at = StringProperty()   # ISO timestamp from Asana, verbatim
    due_on = StringProperty()         # ISO date from Asana, verbatim
    assignee_name = StringProperty()
    permalink_url = StringProperty()
    last_synced = StringProperty()    # ISO timestamp of the refresh that wrote this

    plan = RelationshipFrom("Plan", "has_asana_subtask")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "asana_gid": self.asana_gid,
            "name": self.name,
            "completed": self.completed,
            "completed_at": self.completed_at,
            "due_on": self.due_on,
            "assignee_name": self.assignee_name,
            "permalink_url": self.permalink_url,
            "last_synced": self.last_synced,
        }

class CampusPlan(StructuredNode):

    """

    ATI plans indicate specific success indicators which will be the focus of efforts for each of the three priority areas - instructional materials, web, and procurement. When developing each ATI plan, the ATI Executive Sponsor and ATI committee will consider the following information:

        * Current progress on selected list of success indicators subject to timelines.
        * Current progress as described in the annual report, with particular attention to success indicators with a status level of “Not Started” or “Initiated.”
        * Select ATI implementation activities across all three priority areas that will result in the greatest reduction of accessibility barriers.
        * Use the ATI Prioritization Framework or a comparable process to consider factors such as impact, probability and capacity when prioritizing ATI implementation activities.
        * Adopt deliverables associated with systemwide ATI activities that would advance campus progress.
        * Collaborations that may accelerate or improve the quality of ATI activities.

    """
    unique_id = UniqueIdProperty()
    plan_identifier = StringProperty(unique_index=True)  # e.g. "2025-2026-sfsu"
    executive_summary = StringProperty()

    # academic_year + campus required for uniqueness; enforced via factory function — neomodel can't enforce required relationships at save time
    academic_year = RelationshipTo("AcademicYear", "in_academic_year")
    campus = RelationshipTo("Campus", "is_campus_plan_for")

    working_group_plans = RelationshipTo("WorkingGroupPlan", "has_working_group_plan")
    executive_sponsors = RelationshipTo("Person", "has_executive_sponsor")

    general_note = RelationshipTo("Note", "is_documented_by")

    presidents_report = RelationshipTo("Document", "has_presidents_report", cardinality=ZeroOrOne)

    def serialize(self):
        return {
            "plan_identifier": self.plan_identifier,
            "executive_summary": self.executive_summary,
            "unique_id": self.unique_id,
        }


class WorkingGroupPlan(StructuredNode):
    """
    The per-working-group child of a CampusPlan. Three exist per (campus, year):
    one for Web, one for Procurement, one for Instructional Materials.

    Carries the group-scoped concerns: prioritized indicators (homogeneous within
    the group), per-group leads, group rationales, and progress on this group's
    YearSuccessEvidence.
    """
    unique_id = UniqueIdProperty()
    plan_identifier = StringProperty(unique_index=True)  # e.g. "2025-2026-sfsu-web"

    working_group = RelationshipTo("ATIWorkingGroup", "for_working_group")

    prioritized_success_indicators = RelationshipTo("SuccessIndicator", "prioritizes_success_indicator")
    included_plans = RelationshipTo("Plan", "includes_plan")
    group_leads = RelationshipTo("Person", "has_group_lead")

    prioritization_rationales = RelationshipTo("Note", "rationale_for_prioritization")
    yse_progress_notes = RelationshipTo("YearSuccessEvidence", "yse_progress_notated_by", model=YseProgressRel)
    progress_updates = RelationshipTo("ProgressUpdate", "has_progress_update")

    # Pending questions raised under this plan (see Query). Reverse of Query.working_group_plan.
    queries = RelationshipFrom("Query", "raised_under_plan")

    # Meeting minutes recorded under this plan (see MeetingMinutes). Reverse of
    # MeetingMinutes.working_group_plan.
    meeting_minutes = RelationshipFrom("MeetingMinutes", "minutes_under_plan")

    def serialize(self):
        return {
            "plan_identifier": self.plan_identifier,
            "unique_id": self.unique_id,
        }


class ProgressUpdate(StructuredNode):
    """
    A dated progress entry for a CampusPlan, scoped to a specific YearSuccessEvidence.
    Use for append-only history that may carry attachments — distinct from the lighter
    edge-as-note pattern in YseProgressRel.
    """
    unique_id = UniqueIdProperty()
    update_date = DateProperty()
    note = StringProperty()
    trajectory = StringProperty(choices=trajectory_choices)

    author = RelationshipTo("Person", "authored_by")
    about_yse = RelationshipTo("YearSuccessEvidence", "about_yse")
    supporting_documents = RelationshipTo("Document", "is_documented_by")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "update_date": self.update_date,
            "note": self.note,
            "trajectory": self.trajectory,
        }





class InternalPolicy(StructuredNode):

    """    Class representing an internal policy node.

    Internal Policy represents formal institutional rules and requirements that mandate accessibility standards
    and practices across the organization. Policies establish the authoritative framework that defines what must
    be done to maintain compliance with accessibility laws and institutional values. They create enforceable
    obligations that govern behavior, decisions, and resource allocation related to accessibility.
    Policies provide the mandate and authority that drives all other implementation activities.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")
    classified_under = RelationshipTo("Dimension", "classified_under")  # cross-cutting AMM dimension(s) of the work


    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            'effective_date': self.effective_date,
            'last_updated': self.last_updated,
            "unique_id": self.unique_id,
            "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
        }



class Process(StructuredNode):

    """    Class representing a process node.

     Represents an ongoing, repeatable workflow that continuously ensures accessibility standards are met through
     regular activities. Processes operate indefinitely without a defined endpoint, executing systematic steps that
     maintain compliance over time. They transform inputs into consistent accessibility outcomes through established
     patterns and checkpoints. Organizations rely on processes to operationalize their accessibility commitments
    in daily operations.

     """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    process_markdown = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")
    includes_procedures = RelationshipTo("Procedure", "includes_procedure")
    remediates_interface = RelationshipTo("Interface", "remediates_interface")
    accountable_working_group = RelationshipTo("ATIWorkingGroup", "accountable_working_group")  # committee accountable for this work (distinct from owned_by Person)
    classified_under = RelationshipTo("Dimension", "classified_under")  # cross-cutting AMM dimension(s) of the work
    participants = RelationshipFrom("Person", "worked_on", model=ParticipationRel)  # the working team (people in their roles); distinct from owned_by


    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id,
            "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
            "participants": serialize_participants(self),
        }


class Project(StructuredNode):

    """    Class representing a project node.


    Represents a temporary and focused effort undertaken to create a specific product, service, or result that
    enhances accessibility. Projects are designed to implement specific aspects of the ATI, such as the development
    of new accessible websites, the procurement of accessible technology, or the creation of training programs
    for staff and faculty. Each project has defined objectives, timelines, and resources, and contributes
    to the overall goals of the ATI. Projects are managed through structured plans, and their progress
    is monitored and documented to ensure alignment with the broader accessibility initiatives and continuous
    improvement efforts outlined in the ATI Campus Plan.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")
    includes_procedures = RelationshipTo("Procedure", "includes_procedure")
    remediates_interface = RelationshipTo("Interface", "remediates_interface")
    accountable_working_group = RelationshipTo("ATIWorkingGroup", "accountable_working_group")  # committee accountable for this work (distinct from owned_by Person)
    classified_under = RelationshipTo("Dimension", "classified_under")  # cross-cutting AMM dimension(s) of the work
    participants = RelationshipFrom("Person", "worked_on", model=ParticipationRel)  # the working team (people in their roles); distinct from owned_by
    start_date = DateProperty()
    end_date = DateProperty()


    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id,
            "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
            "participants": serialize_participants(self),
        }


class Procedure(StructuredNode):

    """    Class representing a procedure node.

   Procedure represents documented step-by-step instructions that must be followed consistently to ensure accessibility
   requirements are met in specific scenarios. Procedures standardize how tasks are performed, eliminating variability
   that could compromise accessibility outcomes. They serve as the operational blueprint that staff follow when
   creating, modifying, or evaluating content and systems. Procedures transform policy requirements into actionable,
   repeatable tasks that any qualified person can execute.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    procedure_markdown = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")
    remediates_interface = RelationshipTo("Interface", "remediates_interface")
    accountable_working_group = RelationshipTo("ATIWorkingGroup", "accountable_working_group")  # committee accountable for this work (distinct from owned_by Person)
    classified_under = RelationshipTo("Dimension", "classified_under")  # cross-cutting AMM dimension(s) of the work
    participants = RelationshipFrom("Person", "worked_on", model=ParticipationRel)  # the working team (people in their roles); distinct from owned_by


    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id,
            "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
            "participants": serialize_participants(self),
        }


class Service(StructuredNode):

    """    Class representing a service node.

    Service represents an ongoing capability or function that provides accessibility support to users, systems,
     or processes on demand. Services remain continuously available as organizational resources that others can
     utilize when accessibility expertise or assistance is needed. They operate as utility functions that enable
      accessibility across the institution without being tied to specific projects or timelines.
       Services scale to meet demand while maintaining consistent quality and availability.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")
    includes_procedures = RelationshipTo("Procedure", "includes_procedure")
    remediates_interface = RelationshipTo("Interface", "remediates_interface")
    accountable_working_group = RelationshipTo("ATIWorkingGroup", "accountable_working_group")  # committee accountable for this work (distinct from owned_by Person)
    classified_under = RelationshipTo("Dimension", "classified_under")  # cross-cutting AMM dimension(s) of the work
    participants = RelationshipFrom("Person", "worked_on", model=ParticipationRel)  # the working team (people in their roles); distinct from owned_by


    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id,
            "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
            "participants": serialize_participants(self),
        }



class Guidance(StructuredNode):

    """    Class representing a Guidance node.

   Guidance represents advisory documentation that provides recommendations, best practices, and educational
   resources to help stakeholders understand and implement accessibility effectively. Guidance translates
   complex technical requirements into practical advice that non-specialists can understand and apply.
   It supplements mandatory requirements with helpful context, examples, and strategies that improve accessibility
   outcomes. Guidance empowers individuals to make informed decisions about accessibility without prescribing
   specific actions.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")
    references_procedure = RelationshipTo("Procedure", "references_procedure")
    references_process = RelationshipTo("Process", "references_process")
    references_service = RelationshipTo("Service", "references_service")
    references_project = RelationshipTo("Project", "references_project")
    classified_under = RelationshipTo("Dimension", "classified_under")  # cross-cutting AMM dimension(s) of the work




    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id,
            "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
        }


class Tracking(StructuredNode):

    """    Class representing a tracking node.

    Represents a tracking node to track the progress of the implementation of the accessibility initiatives.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    owned_by = RelationshipTo("Person", "owned_by")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
        }


"""
Evidence


Evidence consists of the documented proof and records that demonstrate progress and compliance with accessibility
initiatives. This category includes documents, webpages, notes, messages, and other records that provide
verifiable information about the implementation and effectiveness of accessibility efforts.
Evidence supports audits, assessments, and reporting, ensuring transparency and accountability.

Relationships

- YearSuccessEvidence is tracked yearly by AcademicYear
- YearSuccessEvidence is tracked by StatusLevel


"""

class AcademicYear(StructuredNode):

    """    Class representing an academic year node.

    An Academic Year in the context of the Accessible Technology Initiative (ATI) represents the annual cycle
    of academic instruction and administrative operations within an institution. It includes specific start
    and end dates that define the period during which academic activities, such as classes, evaluations,
    and progress tracking, occur.

    """
    unique_id = UniqueIdProperty()

    name = StringProperty(unique_index=True, required=True)
    start_date = DateProperty()
    end_date = DateProperty()
    year_success_evidences = RelationshipFrom("YearSuccessEvidence", "evidence_in_year")

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'start_date': self.start_date,
            'end_date': self.end_date,
            "unique_id": self.unique_id
        }


class StatusLevel(StructuredNode):

    """    Class representing a status level node.

    Represents a specific stage or degree of progress made towards achieving accessibility goals and success indicators.
    Status levels provide a standardized way to evaluate and report the implementation and effectiveness of
    accessibility initiatives. They are used to document and audit the current state of compliance with
    accessibility standards, as outlined in the ATI plans. Examples of status levels include "Not Started,"
    "Initiated," "Defined," "Established," "Managed," and "Optimized." Each status level has specific criteria
     and evidence requirements that must be met to accurately reflect the institution's progress and ongoing efforts
    to remove accessibility barriers

    Not Started: 0
    Initiated: 1
    Defined: 2
    Established: 3
    Managed: 4
    Optimized: 5

    Require evidence.

    """
    unique_id = UniqueIdProperty()

    status_level = StringProperty(unique_index=True)
    description_of_procedures = StringProperty()
    description_of_documentation = StringProperty()
    description_of_documentation_evidence = StringProperty()
    description_of_resources = StringProperty()
    status_value = StringProperty()
    ati_report_evidence_column = StringProperty()
    procedure_descriptions = RelationshipTo('ProcedureDescription', 'is_a_procedure_description')
    procedure_requirements = RelationshipTo('ProcedureRequirement', 'is_a_procedure_requirement')
    resource_descriptions = RelationshipTo('ResourceDescription', 'is_a_resource_description')
    resource_requirements = RelationshipTo('ResourceRequirement', 'is_a_resource_requirement')
    documentation_descriptions = RelationshipTo('DocumentationDescription', 'is_a_documentation_description')
    documentation_requirements = RelationshipTo('DocumentationRequirement', 'is_a_documentation_requirement')
    documentation_evidence_descriptions = RelationshipTo('DocumentationEvidenceDescription', 'is_a_documentation_evidence_description')
    documentation_evidence_requirements = RelationshipTo('DocumentationEvidenceRequirement', 'is_a_documentation_evidence_requirement')
    notes = RelationshipTo("Note", "has_note")

    def serialize(self):
        return {
            'status_level': self.status_level,
            'description_of_procedures': self.description_of_procedures,
            'description_of_documentation': self.description_of_documentation,
            'description_of_documentation_evidence': self.description_of_documentation_evidence,
            'description_of_resources': self.description_of_resources,
            'status_value': self.status_value,
            'ati_report_evidence_column': self.ati_report_evidence_column,
            "unique_id": self.unique_id

        }


class ProcedureDescription(StructuredNode):
    unique_id = UniqueIdProperty()
    description = StringProperty(unique_index=True)
    display_name = StringProperty(default="Description of Procedures")


class ProcedureRequirement(StructuredNode):
    unique_id = UniqueIdProperty()
    requirement_description = StringProperty(unique_index=True)


class ResourceDescription(StructuredNode):
    unique_id = UniqueIdProperty()
    description = StringProperty(unique_index=True)
    display_name = StringProperty(default="Description of Resources")


class ResourceRequirement(StructuredNode):
    unique_id = UniqueIdProperty()
    requirement_description = StringProperty(unique_index=True)


class DocumentationDescription(StructuredNode):
    unique_id = UniqueIdProperty()
    description = StringProperty(unique_index=True)
    display_name = StringProperty(default="Description of Documentation")


class DocumentationRequirement(StructuredNode):
    unique_id = UniqueIdProperty()
    requirement_description = StringProperty(unique_index=True)


class DocumentationEvidenceDescription(StructuredNode):
    unique_id = UniqueIdProperty()
    description = StringProperty(unique_index=True)
    display_name = StringProperty(default="Description of Documentation Evidence")


class DocumentationEvidenceRequirement(StructuredNode):
    unique_id = UniqueIdProperty()
    requirement_description = StringProperty(unique_index=True)


class YearSuccessEvidence(StructuredNode):

    """    Class representing a year success evidence node.

    Represents the documented proof of progress and achievements related to accessibility goals and success indicators
    for a specific academic year. This evidence includes data and reports on the implementation of accessibility
    initiatives, the status of success indicators, and any improvements made during the year. It is used to assess
    the effectiveness of ATI activities, ensure accountability, and support audits by providing verifiable
    information. Year Success Evidence helps track annual progress, identify areas for improvement, and plan
    future actions to enhance accessibility across the institution.

    Implementation nodes point to YSE nodes, which in turn point to the success indicator nodes. Evidence is generated
    by working backward from YSE nodes through evidence nodes to retrieve their evidence documents.

    """
    unique_id = UniqueIdProperty()


    year_identifier = StringProperty(unique_index=True)  # A unique identifier combining Year and SuccessIndicator name
    academic_year = RelationshipTo("AcademicYear", "evidence_in_year")
    status_level = RelationshipTo("StatusLevel", "status_is")
    tracks_success_indicator = RelationshipTo("SuccessIndicator", "tracks")
    priority_level = StringProperty() # connect this to data_config

    # New properties for tracking status level details
    documentation_status = StringProperty()
    resources_status = StringProperty()
    implementation_plan_status = StringProperty()
    administrative_review_complete = BooleanProperty(default=False)
    administrative_review_completed_date = DateProperty()
    administrative_review_completed_by = RelationshipTo("Person", "admin_review_completed_by")
    assigned_reviewers = RelationshipTo("Person", "can_be_reviewed_by")
    admin_review_description = StringProperty()
    admin_reviewer_note = RelationshipTo("Note", "admin_review_note")
    ready_for_admin_review = BooleanProperty(default=False)


    notes = RelationshipTo("Note", "has_note")
    messages = RelationshipTo("Message", "has_message")
    metrics = RelationshipTo("Metric", "has_metric")
    worked_on_in_current_year = BooleanProperty(default=False)
    will_work_on_next_year = BooleanProperty(default=False)

    # Campus relationship
    campus = RelationshipTo("Campus", "evidence_at_campus")

    # Relationships from implementation nodes
    processes_that_evidence = RelationshipFrom("Process", "is_evidence_for")
    projects_that_evidence = RelationshipFrom("Project", "is_evidence_for")
    procedures_that_evidence = RelationshipFrom("Procedure", "is_evidence_for")
    services_that_evidence = RelationshipFrom("Service", "is_evidence_for")
    guidance_that_evidence = RelationshipFrom("Guidance", "is_evidence_for")
    trackings_that_evidence = RelationshipFrom("Tracking", "is_evidence_for")
    internal_policies_that_evidence = RelationshipFrom("InternalPolicy", "is_evidence_for")
    taaps_that_evidence = RelationshipFrom("TAAP", "is_evidence_for")

    # Assets are NOT evidence: an asset's accessibility status reaches YSE through the
    # implementation that remediates it (Process/Project/Procedure/Service.is_evidence_for)
    # and through any covering TAAP — there is no direct Asset -> YSE edge.

    # Relationships from person nodes
    persons_that_implement = RelationshipFrom("Person", "implements")

    # Pending questions that address this evidence (see Query). Reverse of Query.addresses_evidence.
    addressed_by_queries = RelationshipFrom("Query", "addresses_evidence")

    #serialize
    def serialize(self):
        return {
            'year_identifier': self.year_identifier,
            'documentation_status': self.documentation_status,
            'resources_status': self.resources_status,
            'implementation_plan_status': self.implementation_plan_status,
            "unique_id": self.unique_id
        }


class Query(StructuredNode):
    """
    A pending question raised under a WorkingGroupPlan — a decision a working group needs
    to make that drives campus plans and Year Success Evidence. Holds its own answer once
    settled.

    The WorkingGroupPlan anchor (raised_under_plan) encodes campus + academic year +
    working group, so a Query is naturally year-scoped and those coordinates are derivable
    from the one required edge — there are no separate Campus / AcademicYear /
    ATIWorkingGroup edges. Identity is the auto unique_id: multiple distinct open questions
    per plan are valid, so the entity has no composite identifier.
    """
    unique_id = UniqueIdProperty()

    question = StringProperty(required=True)             # the question itself
    detail = StringProperty()                            # background / context
    category = StringProperty(choices=query_categories)  # framed by question type
    status = StringProperty(choices=query_statuses, default="open")
    answer = StringProperty()                            # the settled answer
    date_raised = DateProperty()                         # set in create_query
    date_settled = DateProperty()                        # set in settle_query

    # Required anchor — encodes campus + academic year + working group. Enforced in
    # queries/query/create.py (neomodel can't require edges at save time).
    working_group_plan = RelationshipTo("WorkingGroupPlan", "raised_under_plan")

    # Optional links.
    addresses_evidence = RelationshipTo("YearSuccessEvidence", "addresses_evidence")
    query_raised_by = RelationshipTo("Person", "query_raised_by")
    query_settled_by = RelationshipTo("Person", "query_settled_by")
    notes = RelationshipTo("Note", "has_note")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "question": self.question,
            "detail": self.detail,
            "category": self.category,
            "status": self.status,
            "answer": self.answer,
            "date_raised": self.date_raised.isoformat() if self.date_raised else None,
            "date_settled": self.date_settled.isoformat() if self.date_settled else None,
        }


class MeetingMinutes(StructuredNode):
    """
    A working-group meeting record: pasted (often auto-generated) minutes kept for the
    record, assigned to a WorkingGroupPlan. The plan anchor (minutes_under_plan) encodes
    campus + academic year + working group, so a meeting record is naturally year-organized
    and those coordinates are derivable from the one required edge. `content` holds the
    minutes body as Markdown (Neo4j has no rich-text type; it's a plain string rendered on
    the frontend). May link to supporting Documents/Webpages via the shared is_documented_by
    / DocumentedByRel edge model. Identity is the auto unique_id (many meetings per plan).
    """
    unique_id    = UniqueIdProperty()
    title        = StringProperty(required=True)
    meeting_date = DateProperty()
    content      = StringProperty()          # the minutes body, as Markdown
    date_created = DateProperty()            # set in create_meeting_minutes

    # Required anchor — encodes campus + academic year + working group. Enforced in
    # queries/meeting_minutes/create.py (neomodel can't require edges at save time).
    working_group_plan = RelationshipTo("WorkingGroupPlan", "minutes_under_plan")

    # Optional links.
    recorded_by          = RelationshipTo("Person", "minutes_recorded_by")
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages  = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    notes                = RelationshipTo("Note", "has_note")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "title": self.title,
            "meeting_date": self.meeting_date.isoformat() if self.meeting_date else None,
            "content": self.content,
            "date_created": self.date_created.isoformat() if self.date_created else None,
        }



"""
Committees

Committees are specialized groups responsible for overseeing and guiding the implementation of accessibility
initiatives. This category includes ATI Working Groups and other committees that focus on specific aspects
of the ATI, such as web accessibility, instructional materials, and procurement. Committees ensure coordinated
efforts, collaboration, and effective decision-making across the institution.

Relationships

- Committees are responsible for Goals
- Committees implement Processes, Projects, Procedures, and Services


"""

class ATIWorkingGroup(StructuredNode):

    """    Class representing an ATI Working Group node. One of Web, Instructional Materials, or Procurement.

    An ATI Working Group in the context of the Accessible Technology Initiative (ATI) represents a specialized team
    responsible for overseeing and implementing specific aspects of the ATI within an institution.
    These working groups focus on key priority areas such as web accessibility, instructional materials,
    and procurement. Each working group is comprised of members with relevant expertise and experience,
    and they work collaboratively to achieve the ATI goals and success indicators. The ATI Working Group is
    instrumental in developing and executing detailed plans, conducting regular meetings, monitoring progress,
    and ensuring that all accessibility initiatives are effectively implemented and aligned with the overall
    ATI strategy

    """
    unique_id = UniqueIdProperty()

    name = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    responsible_for = RelationshipTo("Goal", "responsible_for", model=HasGoalRel)
    # implements_process = RelationshipTo("Process", "implements")
    # implements_project = RelationshipTo("Project", "implements")
    # implements_procedure = RelationshipTo("Procedure", "implements")
    # implements_service = RelationshipTo("Service", "implements")


class Dimension(StructuredNode):
    """
    A W3C Accessibility Maturity Model (AMM) dimension — one of the seven areas of
    organizational accessibility practice (Communications, Governance & Oversight,
    ICT Development Lifecycle, Knowledge & Skills, Personnel, Procurement, Support).

    A cross-cutting classification of the WORK: implementation nodes
    (Process/Project/Procedure/Service/InternalPolicy/Guidance) are classified_under
    one or more Dimensions.
    Orthogonal to the Interface signature and to ATIWorkingGroup — Dimension answers
    "what kind of accessibility activity is this," where working group answers "who is
    accountable." Sits in the same structural position as ATIWorkingGroup: a shared
    node the work points at.

    Fixed controlled set of seven (the AMM's); not a user-grown list. Carries the AMM
    definition so the node is self-describing. Classification anchor only — no
    first-order operational data lives here.

    Grounded in the W3C Accessibility Maturity Model (https://w3c.github.io/maturity-model/).
    """
    unique_id = UniqueIdProperty()

    handle = StringProperty(unique_index=True, required=True)  # e.g. "dimension:communications"
    name = StringProperty(unique_index=True, required=True)    # e.g. "Communications"
    description = StringProperty()                              # the AMM definition (seeded)

    # Reverse side of Implementation.classified_under; the four variants share one
    # rel-type so (:Process|Project|Procedure|Service)-[:classified_under]->(:Dimension)
    # traverses uniformly.
    classifies_processes         = RelationshipFrom("Process",        "classified_under")
    classifies_projects          = RelationshipFrom("Project",        "classified_under")
    classifies_procedures        = RelationshipFrom("Procedure",      "classified_under")
    classifies_services          = RelationshipFrom("Service",        "classified_under")
    classifies_internal_policies = RelationshipFrom("InternalPolicy", "classified_under")
    classifies_guidances         = RelationshipFrom("Guidance",       "classified_under")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "handle": self.handle,
            "name": self.name,
            "description": self.description,
        }


class Role(StructuredNode):
    """
    A capacity a person provides to accessibility work — what a person DOES
    (QA specialist, procurement reviewer, designer, developer, captioner, etc.).
    The active "verb" side, complementary to Dimension (the categorical "noun" of
    the work). A person holds one or more Roles (Person.holds_role; the holding edge
    carries position-description tracking), and a Role is the capacity a person
    participates in the Implementations they actually work on (the worked_on
    participant edge, where the role is recorded as ParticipationRel.role_handle) —
    distinct from owned_by, which is custodial (who maintains the evidence record).

    Seeded from the applicable W3C Accessibility Maturity Model role-categories, kept
    general rather than projecting institution-specific titles. A shared node;
    relationship anchor only — no first-order operational data lives here. The
    role↔dimension relationship is deliberately NOT modeled — it emerges from people
    in roles participating in dimension-classified work.
    """
    unique_id = UniqueIdProperty()

    handle = StringProperty(unique_index=True, required=True)  # e.g. "role:qa-specialist"
    name = StringProperty(unique_index=True, required=True)    # e.g. "QA Specialist"
    description = StringProperty()                              # general capacity description (seeded)

    # Reverse of Person.holds_role; the holding edge carries the PD tracking (RoleHoldingRel).
    held_by = RelationshipFrom("Person", "holds_role", model=RoleHoldingRel)

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "handle": self.handle,
            "name": self.name,
            "description": self.description,
        }


"""
Individuals

Individuals represent the people involved in the implementation and support of accessibility initiatives.
This category includes all roles such as ATI Executive Sponsors, members of ATI Working Groups,
faculty, staff, and students. Individuals are crucial for executing plans, providing expertise, and ensuring
compliance with accessibility standards.

Relationships

- Individuals participate in ATI Working Groups
- Individuals implement Processes, Projects, Procedures, and Services

"""

class Person(StructuredNode):

    """    Class representing a person.

    Represents an individual involved in the implementation and support of accessibility initiatives within the
    institution. This includes roles such as ATI Executive Sponsors, members of ATI Working Groups, faculty, staff,
    and students. Each person may have specific responsibilities, such as participating in accessibility planning,
    providing technical support, or ensuring compliance with accessibility policies and procedures.
    The Person node helps track the involvement and contributions of individuals to ATI-related activities,
    fostering collaboration and accountability within the initiative
    """
    unique_id = UniqueIdProperty()

    name = StringProperty(unique_index=True, required=True)
    email = StringProperty()
    employee_id = StringProperty()
    title = StringProperty()
    active = BooleanProperty(default=True)
    can_approve_yse = BooleanProperty(default=False)
    ati_role = StringProperty()
    non_committee_member_active = BooleanProperty(default=False) # For people who are not in a committee but are active in the ATI in various capacities
    in_ati_working_group = RelationshipTo('ATIWorkingGroup', 'participates_in')
    implements_yse = RelationshipTo("YearSuccessEvidence", "implements")
    host_campus = RelationshipTo("Campus", "works_at_campus", cardinality=ZeroOrOne)
    holds_role = RelationshipTo("Role", "holds_role", model=RoleHoldingRel)  # capacities the person provides (PD tracking lives on the edge)
    # Participatory "working team" edges to the four doing-implementations — the role
    # acted in is a property on the edge (ParticipationRel.role_handle); distinct from
    # owned_by (custodial). One shared rel-type "worked_on" across the four.
    worked_on_processes  = RelationshipTo("Process",   "worked_on", model=ParticipationRel)
    worked_on_projects   = RelationshipTo("Project",   "worked_on", model=ParticipationRel)
    worked_on_procedures = RelationshipTo("Procedure", "worked_on", model=ParticipationRel)
    worked_on_services   = RelationshipTo("Service",   "worked_on", model=ParticipationRel)

    #serialize
    def serialize(self):
        host_campus_node = self.host_campus.single()
        return {
            'name': self.name,
            'email': self.email,
            'employee_id': self.employee_id,
            'title': self.title,
            "can_approve_yse": self.can_approve_yse,
            "active": self.active,
            "ati_role": self.ati_role,
            "unique_id": self.unique_id,
            "non_committee_member_active": self.non_committee_member_active,
            "host_campus": host_campus_node.abbreviation if host_campus_node else None,
            "roles": serialize_role_holdings(self),
        }



"""
Organizational Units

Organizational Units refer to the various divisions and departments within an institution that play a role in
implementing and supporting accessibility initiatives. This category includes departments, colleges,
and vendors. Organizational units are responsible for integrating accessibility into their operations,
collaborating with other units, and contributing to the overall goals of the ATI.

Relationships

- Departments, Colleges, and Vendors employ Individuals
- Departments, Colleges, and Vendors implement Processes, Projects, Procedures, and Services

"""


class OrgUnit(StructuredNode):

    """    Shared supertype for internal organizational units (Department, College).

    An OrgUnit is an internal division of the institution that can employ people and
    steward ICT assets. It exists so that an Asset's §508 stewardship edges
    (procure / develop / maintain / use) can target a *unit* — not only a Person —
    for cases where capacity sits at the org level and no individual is named
    (e.g. "ITS maintains this", "the Library procures this").

    Vendor is deliberately NOT an OrgUnit: a vendor is external and relates to an
    Asset through `supplied_by`, not through institutional stewardship.

    Non-destructive note: Department and College now inherit from OrgUnit. Existing
    :Department / :College nodes keep working via their own labels; a back-label
    migration (adding :OrgUnit to those existing nodes) is what lets OrgUnit-label
    traversal find them, and is deferred.
    """
    unique_id = UniqueIdProperty()

    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipTo("Person", "employs")
    implements_yse = RelationshipTo("YearSuccessEvidence", "implements")
    operates_under_campus = RelationshipTo("Campus", "operates_under_campus")


class Department(OrgUnit):

    """    Class representing a Department.


    A Department in the context of the Accessible Technology Initiative (ATI) represents an organizational unit
    within the institution that plays a role in implementing and supporting accessibility initiatives.
    Departments can include academic units, administrative offices, and support services,
    each contributing to various aspects of the ATI. Responsibilities may include ensuring departmental compliance
    with accessibility policies, integrating accessibility into departmental processes and services,
    and collaborating with other units and working groups to achieve ATI goals. The Department node helps
    to organize and coordinate the efforts of different parts of the institution, ensuring a comprehensive and
    unified approach to accessibility.

    Inherits name / location / employs / implements_yse / operates_under_campus from OrgUnit.
    """
    pass


class College(OrgUnit):


    """    Class representing a College.

    A College in the context of the Accessible Technology Initiative (ATI) represents a major academic division
    within the institution, typically encompassing multiple departments and programs. Each college is responsible
    for integrating accessibility into its curricula, research, and administrative practices.

    Inherits name / location / employs / implements_yse / operates_under_campus from OrgUnit.
    """
    pass


class Campus(StructuredNode):

    unique_id = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    abbreviation = StringProperty(unique_index=True)



class Vendor(StructuredNode):

    """    Class representing a Vendor.

    A Vendor in the context of the Accessible Technology Initiative (ATI) represents an external organization or
    company that provides goods, services, or technology to the institution. Vendors play a crucial role in the
    procurement of accessible products and services, ensuring that any purchased technology meets the accessibility
    standards and requirements outlined by the ATI. The Vendor node helps track and manage relationships with external
    suppliers, ensuring that they comply with accessibility criteria and contribute to the institution's overall
    accessibility goals. This includes working with vendors to improve product accessibility and ensuring that
    all procurement processes adhere to Section 508 requirements

    """
    unique_id = UniqueIdProperty()


    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipTo("Person", "employs")
    sales_contact_name = StringProperty()
    technical_contact_name = StringProperty()
    sales_contact_email = StringProperty()
    technical_contact_email = StringProperty()
    implements_yse = RelationshipTo("YearSuccessEvidence", "implements")


"""
Documentation
"""

class Document(StructuredNode):

    """    Class representing a Document node.

    A Document in the context of the Accessible Technology Initiative (ATI) represents any written or electronic
    record that provides information, evidence, or support related to accessibility initiatives. Documents can
    include policies, guidelines, reports, plans, meeting minutes, instructional materials, and any other
    relevant files. These documents are crucial for demonstrating compliance with accessibility standards,
    recording progress towards goals, and providing guidance for implementing accessibility practices. The Document
     node helps organize and link various types of documents within the ATI framework, ensuring that all
    necessary information is readily accessible and systematically maintained.

    """
    unique_id = UniqueIdProperty()

    hash = StringProperty(unique_index=True)
    name = StringProperty()
    file_path = StringProperty()
    uri_path = StringProperty()
    description = StringProperty()
    is_administrative_review_documentation = StringProperty()
    is_milestone_and_measures_documentation = StringProperty()
    depreciated = BooleanProperty()
    depreciated_date = DateProperty()
    include_in_report = BooleanProperty(default=True)
    maintained_by = RelationshipTo("Person", "maintained_by")
    notes = RelationshipTo("Note", "has_note")
    has_file = RelationshipTo("StoredFile", "has_file", cardinality=ZeroOrOne)  # managed (uploaded) blob; alternative to file_path/uri_path



    def serialize(self):
        """
        Serializes the Document object to a dictionary format, making it suitable for JSON representation,
        storage, or API response.
        """
        return {
            "hash": self.hash,
            "name": self.name,
            "file_path": self.file_path,
            "uri_path": self.uri_path,
            "depreciated": self.depreciated,
            "depreciated_date": self.depreciated_date,
            "include_in_report": self.include_in_report,
            "is_administrative_review_documentation": self.is_administrative_review_documentation,
            "is_milestone_and_measures_documentation": self.is_milestone_and_measures_documentation,
            "maintained_by": [{"unique_id": p.unique_id, "name": p.name} for p in self.maintained_by.all()],
            "file": serialize_has_file(self),
            "unique_id": self.unique_id

        }


class Webpage(StructuredNode):

    """    Class representing a Webpage node.

    A Webpage in the context of the Accessible Technology Initiative (ATI) represents an individual online page
    that provides information, resources, or support related to accessibility initiatives. Webpages can include
    sections of the institution's website, instructional content, digital services, and other online materials.

    """
    unique_id = UniqueIdProperty()

    url = StringProperty(unique_index=True)
    name = StringProperty()
    description = StringProperty()
    no_longer_exists = BooleanProperty()
    depreciated = BooleanProperty()
    depreciated_date = DateProperty()
    include_in_report = BooleanProperty(default=True)
    maintained_by = RelationshipTo("Person", "maintained_by")
    notes = RelationshipTo("Note", "has_note")

    def serialize(self):
        """
        Serializes the Webpage object to a dictionary format, making it suitable for JSON representation,
        storage, or API response.
        """
        return {

            "url": self.url,
            "name": self.name,
            "description": self.description,
            "no_longer_exists": self.no_longer_exists,
            "depreciated": self.depreciated,
            "depreciated_date": self.depreciated_date,
            "unique_id": self.unique_id,
            "maintained_by": [{"unique_id": p.unique_id, "name": p.name} for p in self.maintained_by.all()],
            "include_in_report": self.include_in_report

        }


class Note(StructuredNode):

    """    Class representing a Note node.

    A Note in the context of the Accessible Technology Initiative (ATI) represents an annotation or comment that
    provides additional information, insights, or clarifications related to various aspects of the ATI.
    Notes can be used to document observations, feedback, meeting highlights, or important points that support
    the understanding and implementation of accessibility initiatives. They help in recording informal yet
    valuable information that might not be captured in formal documents or reports. The Note node helps to
    organize and contextualize these annotations, ensuring that they are accessible and linked to relevant
    documents, guidelines, and activities within the ATI framework.


    """
    unique_id = UniqueIdProperty()

    name = StringProperty(unique_index=True)
    date_created = DateProperty()
    content = StringProperty()
    depreciated = BooleanProperty()
    depreciated_date = DateProperty()
    created_by = RelationshipTo("Person", "created_by")
    include_in_report = BooleanProperty(default=True)

    def serialize(self):
        """
        Serializes the Message object to a dictionary format, making it suitable for JSON representation,
        storage, or API response.
        """
        return {

            "name": self.name,
            "content": self.content,
            "dateCreated": self.date_created,
            "depreciated": self.depreciated,
            "depreciated_date": self.depreciated_date,
            "include_in_report": self.include_in_report,
            "unique_id": self.unique_id

        }


class Message(StructuredNode):

    """    Class representing a Message node.

    A Message in the context of the Accessible Technology Initiative (ATI) represents a communication,
    such as an email, memo, or announcement, that conveys information related to accessibility initiatives.
    Messages are used to inform stakeholders about updates, changes, instructions, or decisions regarding the
    implementation of ATI policies and procedures. They can include directives from leadership, reminders of
    compliance requirements, or notifications of upcoming events and training sessions. The Message node helps
    track and manage these communications, ensuring that all relevant parties are kept informed and that the
    information is documented and accessible within the ATI framework


    """
    unique_id = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    content = StringProperty()
    file_path = StringProperty()
    uri_path = StringProperty()
    date_created = DateProperty()
    type = StringProperty()
    depreciated = BooleanProperty()
    depreciated_date = DateProperty()
    created_by = RelationshipTo("Person", "created_by")
    include_in_report = BooleanProperty(default=True)
    has_file = RelationshipTo("StoredFile", "has_file", cardinality=ZeroOrOne)  # managed (uploaded) blob


    def serialize(self):
        """
        Serializes the Message object to a dictionary format, making it suitable for JSON representation,
        storage, or API response.
        """
        return {

                "name": self.name,
                "content": self.content,
                "file_path": self.file_path,
                "uri_path": self.uri_path,
                "date_created": self.date_created,
                "type": self.type,
                "depreciated": self.depreciated,
                "include_in_report": self.include_in_report,
                "file": serialize_has_file(self),
                "unique_id": self.unique_id

        }


class Metric(StructuredNode):

    """
    A Metric in the context of the Accessible Technology Initiative (ATI) represents a specific quantitative measurement
    or benchmark used to evaluate the performance, progress, or success of accessibility-related activities.
    Metrics provide concrete data points that support the evaluation of success indicators and goals, offering a
    standardized way to track progress over time.

    Metrics are often derived from processes, procedures, and projects, and they serve as evidence of implementation
     and effectiveness. For example, a metric might include the number of accessible websites launched, the percentage
     of compliance with Web Content Accessibility Guidelines (WCAG), or the response time to accessibility requests.

    These metrics are documented and referenced in reports to ensure accountability, support decision-making, and
    guide continuous improvement in accessibility efforts. Metrics play a crucial role in ensuring that institutions
    meet their accessibility goals by providing measurable criteria that can be regularly monitored and analyzed.

    """
    unique_id = UniqueIdProperty()
    name = StringProperty()
    composite_key = StringProperty(unique_index=True)
    metric_type = StringProperty()
    file_path = StringProperty()
    uri_path = StringProperty()
    description = StringProperty()
    single_value = StringProperty()
    value_dict = JSONProperty()
    comment = StringProperty()
    created_by = RelationshipTo("Person", "created_by")
    notes = RelationshipTo("Note", "has_note")
    academic_year = RelationshipTo("AcademicYear", "measured_in_year")
    include_in_report = BooleanProperty(default=True)
    has_file = RelationshipTo("StoredFile", "has_file", cardinality=ZeroOrOne)  # managed (uploaded) blob


    @staticmethod
    def set_data(self, data):
        self.value_dict = json.dumps(data)

    def get_data(self):
        return json.loads(self.value_dict)

    def serialize(self):
        """
        Serializes the Message object to a dictionary format, making it suitable for JSON representation,
        storage, or API response.
        """
        return {

            "name": self.name,
            "composite_key": self.composite_key,
            "metric_type": self.metric_type,
            "file_path": self.file_path,
            "uri_path": self.uri_path,
            "description": self.description,
            "single_value": self.single_value,
            "comment": self.comment,
            "data": self.get_data() if self.value_dict else None,
            "include_in_report": self.include_in_report,
            "unique_id": self.unique_id,
            "file": serialize_has_file(self),
            "academic_year": [{"unique_id": ay.unique_id, "name": ay.name} for ay in self.academic_year.all()]

        }


def serialize_has_file(node):
    """The node's managed StoredFile (via has_file) -> dict, or None when it has no
    uploaded file (it may instead carry an external file_path/uri_path/url)."""
    sf = node.has_file.single()
    return sf.serialize() if sf else None


class StoredFile(StructuredNode):
    """A managed file whose bytes live in the app/fs blob store.

    Content-addressed: ``storage_key`` is the SHA-256 the bytes are stored under (the
    app/fs key), so there is one StoredFile per unique content — registering the same
    bytes again MERGEs onto the existing node. Records that have an uploaded file point
    at it via ``has_file`` (Document / Message / Metric). The blob itself is NOT deleted
    when a node is removed (blobs can be shared); orphans are reclaimed by
    app/database/tools/gc_orphan_files.py.
    """
    unique_id = UniqueIdProperty()

    storage_key = StringProperty(unique_index=True, required=True)   # the app/fs key (sha256 hex)
    original_filename = StringProperty()
    content_type = StringProperty()
    size = IntegerProperty()
    uploaded_date = DateProperty()

    uploaded_by = RelationshipTo("Person", "uploaded_by")

    # Reverse refs — who registered this file.
    documents = RelationshipFrom("Document", "has_file")
    messages = RelationshipFrom("Message", "has_file")
    metrics = RelationshipFrom("Metric", "has_file")

    def serialize(self):
        from urllib.parse import quote
        url = f"/ati/data-api/v1/files/{self.storage_key}"
        if self.original_filename:
            url += f"?name={quote(self.original_filename)}"
        return {
            "unique_id": self.unique_id,
            "storage_key": self.storage_key,
            "original_filename": self.original_filename,
            "content_type": self.content_type,
            "size": self.size,
            "uploaded_date": str(self.uploaded_date) if self.uploaded_date else None,
            "download_url": url,
        }




class Asset(StructuredNode):

    """    Class representing an ICT Asset node.

    An Asset is a logged unit of information-and-communications technology — the thing
    whose accessibility must be maintained. It is the unit at which remediation authority
    is coherent; where authority splits, the asset splits. Defined from the remediation
    side (who can fix it), not the statutory side.

    The Asset records WHAT the thing is (identity, class, scope, vendor/product) and WHO
    stewards it under §508 — the parties that procure / develop / maintain / use it, each
    a Person OR an OrgUnit. It does NOT carry remediation accountability: HOW accessibility
    is maintained, and who is accountable, lives on the Implementation nodes that
    *remediate* the asset (those carry owned_by). Stewardship and remediation strongly
    overlap but are distinct. An asset that is stewarded yet has no remediating
    implementation is the modeled signal that responsibility has elevated to the
    institution (Title II §35.205 / the responsibility heuristic).

    asset_class: institutional_system | employee_content | third_party_service | infrastructure
    scope:       systemwide | regional | campus | vendor

    Identity is composite: scope is part of identity, so the same nominal system
    (CSU-wide Canvas) resolves into distinct assets where remediation authority sits at
    different scopes. The unique index is on `asset_identifier` (built by
    identifiers.make_asset_identifier()); `title` is descriptive and indexed but NOT
    unique. This mirrors CampusPlan.plan_identifier / YearSuccessEvidence.year_identifier.
    """
    unique_id = UniqueIdProperty()

    asset_identifier = StringProperty(unique_index=True)  # e.g. "canvas-sfsu", "canvas-systemwide"
    title = StringProperty(index=True, required=True)
    version = StringProperty()
    description = StringProperty()
    asset_class = StringProperty(choices=asset_classes)
    scope = StringProperty(choices=asset_scopes)

    # §508 stewardship — who procures / develops / maintains / uses the asset.
    # Each capacity can be held by a Person OR an OrgUnit; the two variants share a
    # rel-type so ad-hoc Cypher (e.g. (:Asset)-[:maintained_by]->(holder)) catches both.
    procured_by        = RelationshipTo("Person",  "procured_by")
    procured_by_unit   = RelationshipTo("OrgUnit", "procured_by")
    developed_by       = RelationshipTo("Person",  "developed_by")
    developed_by_unit  = RelationshipTo("OrgUnit", "developed_by")
    maintained_by      = RelationshipTo("Person",  "maintained_by")
    maintained_by_unit = RelationshipTo("OrgUnit", "maintained_by")
    used_by            = RelationshipTo("Person",  "used_by")
    used_by_unit       = RelationshipTo("OrgUnit", "used_by")

    # Vendor / product provenance (external; not stewardship)
    supplied_by = RelationshipTo("Vendor", "supplied_by")

    # Scope anchor (campus / regional; empty for systemwide — scope property carries it)
    at_campus = RelationshipTo("Campus", "asset_at_campus")

    # Remediation accountability flows through implementations (reverse of
    # Implementation.remediates / .uses_tool). An asset is remediated by the work that
    # keeps it accessible; that work may also use another asset as a tool (PopeTech).
    remediated_by_processes    = RelationshipFrom("Process",   "remediates")
    remediated_by_projects     = RelationshipFrom("Project",   "remediates")
    remediated_by_procedures   = RelationshipFrom("Procedure", "remediates")
    remediated_by_services     = RelationshipFrom("Service",   "remediates")
    used_as_tool_by_processes  = RelationshipFrom("Process",   "uses_tool")
    used_as_tool_by_projects   = RelationshipFrom("Project",   "uses_tool")
    used_as_tool_by_procedures = RelationshipFrom("Procedure", "uses_tool")
    used_as_tool_by_services   = RelationshipFrom("Service",   "uses_tool")

    # Interim non-conformance coverage (a TAAP is itself evidence; the asset is not)
    covered_by_taap = RelationshipFrom("TAAP", "covers_asset")

    # Documentation ABOUT the asset (VPAT / ACR / spec / product page) — descriptive,
    # NOT year-scoped evidence, so plain edges (no DocumentedByRel) under a distinct
    # rel-type that won't be swept up by is_documented_by evidence queries.
    described_by = RelationshipTo("Document", "describes_asset")
    described_on = RelationshipTo("Webpage", "describes_asset")
    notes = RelationshipTo("Note", "has_note")

    #serialize
    def serialize(self):
        return {
            'asset_identifier': self.asset_identifier,
            'title': self.title,
            'version': self.version,
            'description': self.description,
            'asset_class': self.asset_class,
            'scope': self.scope,
            "unique_id": self.unique_id
        }



class Interface(StructuredNode):

    """    Class representing an Interface node.

    An Interface is a salient point of interaction with ICT, identified by the
    accessibility function because it can present an access barrier. It is where the
    accessibility duty lands and what remediation targets, and it exists whether or not
    it sits on top of an owned Asset.

    Defined by functional role, not substrate: a standalone PDF and a Canvas course view
    are the same kind of thing because they play the same role. Defined by the ATI's
    judgment of salience, not by enumerating an asset's surfaces. This is WCAG's actual
    unit of conformance (the perceivable page/document/view a claim is scoped to), and
    POUR are predicates of an interaction, not properties of an artifact. It is also the
    point where ICT is either ready-to-hand or breaks down into a barrier for a
    particular body; the duty attaches to the encounter, not the Asset behind it.

    Duty and remediation live here; ownership lives on the Asset. §508 stewardship is NOT
    duplicated: for an asset-backed interface, derive the steward via `presented_by`; a
    standalone interface may have no steward, which is correct, not a gap. Conformance is
    NOT stored — both senses of "accessible" (conformant, usable) are derived via Metric.

    Coverage is layered and many-to-many: specific (an implementation targeting this
    instance; Rule 1) and general (an institution-level implementation sweeping this
    interface's kind; Rule 2). An interface is UNCOVERED — the Title II §35.205 elevation
    signal — only when neither reaches it. `provenance` records how it became known:
    declared (ATI named it), enacted (it emerged from where remediation clustered), or
    both. The declared-vs-enacted gap is diagnostic and not meant to be eliminated.

    Identity is a four-coordinate SIGNATURE, built into `interface_identifier`
    (unique_index) by identifiers.make_interface_identifier():

        backing -- locus -- function -- title-slug

      - backing  : the backing Asset.asset_identifier (via `presented_by`), or the
                   literal 'standalone' when no owned asset sits behind it.
      - locus    : the named structural zone within the backing ('course-shells');
                   governed free text.
      - function : the institutional purpose the interface serves
                   ('teaching-and-learning'); an identity-bearing controlled-vocab key.
      - title    : the human title is part of identity (it is in the key).

    All four are identity, hence IMMUTABLE: changing one is a different interface
    (delete + re-create), exactly as Asset.asset_identifier is immutable.

    What is deliberately NOT identity:
      - `kind` is gone from Interface entirely — it lives on Component, where it is
        homogeneous and where WCAG attaches (a single interface is kind-heterogeneous).
      - the component set is composition, not identity (Ship of Theseus): folding it
        into the key would re-identify the interface every time a component is
        added/removed and break year-over-year tracking.
      - working-group accountability is an EDGE (`accountable_working_groups` here,
        `accountable_working_group` on the remediating implementations), never identity.
        Keeping function in the key but accountability as an edge is what makes the
        diagnostic queryable: interfaces whose `function` is 'teaching-and-learning' but
        whose remediating work is accountable to the Web group — i.e. surfaces where
        purpose and accountability diverge. Mirrors the stewardship-vs-remediation split.
      - `audience`, `coverage_domains`, `provenance` are descriptive only.
    """

    unique_id = UniqueIdProperty()

    interface_identifier = StringProperty(unique_index=True)  # e.g. "canvas-sfsu--course-shells--teaching-and-learning--canvas-course-shells"
    title = StringProperty(index=True, required=True)         # identity coordinate (in the key)
    description = StringProperty()

    # Identity coordinates (besides backing, which is the presented_by asset).
    locus = StringProperty(required=True)                     # structural zone within the backing; governed free text
    function = StringProperty(choices=functions, required=True)  # institutional purpose; single-valued, identity-bearing

    # Descriptive only (NOT in the identity signature).
    coverage_domains = ArrayProperty(StringProperty(choices=coverage_domains), default=list)  # multi-valued: institution-chosen domains of attention
    audience = ArrayProperty(StringProperty(choices=audiences), default=list)  # multi-valued: any of students | employees | applicants-for-employment | prospective-students | general-public
    provenance = StringProperty(choices=interface_provenances)  # how it entered the graph: declared (ATI named it) | enacted (emerged from remediation work) | both

    # Optional backing asset (absent for a standalone interface; 0..many for a surface
    # crossing several systems). Steward of an asset-backed interface is derived upward.
    # This is also the `backing` coordinate of the identity signature.
    presented_by = RelationshipTo("Asset", "presented_by")

    # Working-group accountability (committee responsible), optional and multi-valued — a
    # single interface (e.g. a library database surface) can have several groups touching
    # it across its life. NOT identity. Distinct from the remediating implementations'
    # own `accountable_working_group`; this lets an interface carry accountability directly
    # before it is decomposed into implementations.
    accountable_working_groups = RelationshipTo("ATIWorkingGroup", "accountable_working_group")

    # Remediation flows through implementations (reverse of Implementation.remediates_interface).
    remediated_by_processes  = RelationshipFrom("Process",   "remediates_interface")
    remediated_by_projects   = RelationshipFrom("Project",   "remediates_interface")
    remediated_by_procedures = RelationshipFrom("Procedure", "remediates_interface")
    remediated_by_services   = RelationshipFrom("Service",   "remediates_interface")

    # WCAG-grain elements this interface is made of.
    has_components = RelationshipTo("Component", "has_component")


    # Documentation ABOUT the interface — distinct rel-type, off the evidence backbone.
    described_by = RelationshipTo("Document", "describes_interface")
    described_on = RelationshipTo("Webpage", "describes_interface")
    notes = RelationshipTo("Note", "has_note")

    #serialize
    def serialize(self):
        return {
            'interface_identifier': self.interface_identifier,
            'title': self.title,
            'description': self.description,
            'locus': self.locus,
            'function': self.function,
            'coverage_domains': self.coverage_domains,
            'audience': self.audience,
            'provenance': self.provenance,
            "unique_id": self.unique_id
        }


class Component(StructuredNode):

    """    Class representing a Component node.

    A Component is a piece of an Interface at the grain where a WCAG success criterion or
    a VPAT line item attaches — the element specifically called out when conformance is
    evaluated (e.g. a video player, a data table, a form field, a navigation menu). It is
    the WCAG attachment point: where the standard's criteria are actually satisfied or
    failed, one tier below the Interface that contains it.

    Defined by the standard, not by the institution or the ATI: components are individuated
    the way WCAG / a VPAT individuates them. Conformance is NOT stored here — whether a
    component meets its criteria is derived via the Metric layer, like everything else.

    `kind` lives HERE (not on the Interface): a component is kind-homogeneous, and kind
    is exactly the grain at which WCAG / a VPAT individuates. Components are composition,
    NOT identity — the interface's component set evolves, so it must never be folded into
    the interface's identity key (Ship of Theseus). A Component is NOT a remediation target
    in this iteration; remediation stays at the Interface grain.

    Identity is composite on `component_identifier` (built by
    identifiers.make_component_identifier from the parent interface + a title slug).
    """
    unique_id = UniqueIdProperty()

    component_identifier = StringProperty(unique_index=True)  # e.g. "<interface_identifier>--video-player"
    title = StringProperty(index=True, required=True)
    description = StringProperty()
    component_kind = StringProperty(choices=component_kinds)  # functional role at WCAG grain (web-surface, time-based-media, …)

    # The Interface this component is part of.
    part_of = RelationshipTo("Interface", "part_of", cardinality=ZeroOrOne)

    # The WCAG criteria this component must satisfy (Guideline holds WCAG).
    must_satisfy = RelationshipTo("Guideline", "must_satisfy")

    # Documentation about the component (VPAT line items, etc.) — off the evidence backbone.
    described_by = RelationshipTo("Document", "describes_component")
    notes = RelationshipTo("Note", "has_note")

    #serialize
    def serialize(self):
        return {
            'component_identifier': self.component_identifier,
            'title': self.title,
            'description': self.description,
            'component_kind': self.component_kind,
            "unique_id": self.unique_id
        }


class Tool(StructuredNode):

    """    Class representing a Tool node.

    A Tool is something an Implementation USES to remediate Interfaces — the instruments
    of remediation work (e.g. Pope Tech, Equidox, a captioning service, an OCR engine).
    Distinct from an Asset, which is a thing the institution must keep accessible: a Tool
    is a thing the institution uses to DO the keeping. The same product can be both (a
    tool the campus operates may also be an asset it stewards), which is why a Tool may
    have a parent Asset — but it is not required, since many tools are used without being
    tracked as institutional assets in their own right.

    A Tool may have a Vendor (its supplier) and may have a parent Asset (when the tool is
    also a stewarded institutional system), neither required. It is reached from the work
    side via Implementation.uses_tool.
    """
    unique_id = UniqueIdProperty()

    tool_identifier = StringProperty(unique_index=True)  # e.g. "pope-tech", "equidox"
    title = StringProperty(index=True, required=True)
    description = StringProperty()

    # Supplier of the tool (optional).
    supplied_by = RelationshipTo("Vendor", "supplied_by")

    # Optional parent Asset(s) — present when the tool is also a stewarded institutional
    # system. Multi-valued: the same product can map to several stewarded assets (e.g. the
    # same tool tracked at different scopes/campuses).
    parent_asset = RelationshipTo("Asset", "tool_of_asset")

    # Used by the work that remediates interfaces (reverse of Implementation.uses_tool).
    used_by_processes  = RelationshipFrom("Process",   "uses_tool")
    used_by_projects   = RelationshipFrom("Project",   "uses_tool")
    used_by_procedures = RelationshipFrom("Procedure", "uses_tool")
    used_by_services   = RelationshipFrom("Service",   "uses_tool")

    # Documentation about the tool — off the evidence backbone.
    described_by = RelationshipTo("Document", "describes_tool")
    notes = RelationshipTo("Note", "has_note")

    #serialize
    def serialize(self):
        return {
            'tool_identifier': self.tool_identifier,
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
        }



class TAAP(StructuredNode):

    """    Class representing a Temporary Alternate Access Plan node.

    A TAAP is the institution's required response when full conformance is not achievable at procurement or
    operation. It is asset-scoped, time-bound, reviewed annually, and is itself evidence — so it both covers an
    Asset and feeds YearSuccessEvidence the same way other implementation nodes do. Anchored in Title II 35.205.
    Replaces the older EEAAP.

    outcome: equally_effective | non_equal_alternative | referral
    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    outcome = StringProperty(choices=taap_outcomes)
    effective_date = DateProperty()
    review_due = DateProperty()
    active = BooleanProperty(default=True)

    covers_asset = RelationshipTo("Asset", "covers_asset")
    owned_by = RelationshipTo("Person", "owned_by")
    signed_by = RelationshipTo("Person", "signed_by")

    # Evidence + documentation (standard pattern)
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")
    supporting_documents = RelationshipTo("Document", "is_documented_by", model=DocumentedByRel)
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by", model=DocumentedByRel)
    supporting_notes = RelationshipTo("Note", "is_documented_by", model=DocumentedByRel)
    supporting_messages = RelationshipTo("Message", "is_documented_by", model=DocumentedByRel)

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            'outcome': self.outcome,
            'effective_date': self.effective_date,
            'review_due': self.review_due,
            'active': self.active,
            "unique_id": self.unique_id
        }



def update_remote():
    from neomodel import get_config, db
    print("Updating remote connection")

    # Construct path to .env.remote file
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.development')
    print(f"Loading environment from: {dotenv_path}")

    # Load environment variables and check if file exists
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path, override=True)
        print("Environment file loaded successfully")
    else:
        print(f"Warning: Environment file not found at {dotenv_path}")

    # Get environment variables with fallback values
    neo4j_database = os.environ.get('NEO4J_DATABASE', 'neo4j')
    database_url = os.environ.get('DATABASE_URL')

    print(f"NEO4J_DATABASE: {neo4j_database}")
    print(f"DATABASE_URL: {database_url}")

    # Ensure environment variables are set before configuring
    if not database_url:
        raise ValueError("Required environment variable DATABASE_URL must be set")

    get_config().database_name = neo4j_database
    get_config().database_url = database_url
    db.install_all_labels()

    print(f"Config set - DATABASE_NAME: {get_config().database_name}, DATABASE_URL: {get_config().database_url}")


def set_connection():
    """Configure neomodel's connection for standalone script use.

    Sources DB config from the single gateway (web.config in production, .env in
    dev), so a host script reads the same place the web app does. The Flask app
    does NOT use this — create_app() sets the connection from app.config and the
    per-request guard calls neomodel's db.set_connection().
    """
    from neomodel import get_config
    from app.config_gateway import config

    get_config().database_name = config.get('NEO4J_DATABASE', 'ati')
    get_config().database_url = config.get('DATABASE_URL')


# set_connection()

if __name__=="__main__":

    env_name = os.environ.get('FLASK_ENV', 'development')
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), f'.env.{env_name}')
    load_dotenv(dotenv_path)
    set_connection()
    from neomodel import db
    db.install_all_labels()


