#!/usr/bin/env python3
"""
Seed node-type UniversalDescriptors from the curated glossary text.

The About → Glossary used to hold these descriptions inline (frontend
context/definitions.js + GlossaryTab EXTRA_TERMS). The glossary now reads from the
ontology (UniversalDescriptor), so this one-time migration moves that curated text INTO
the ontology — the single source of truth. After it runs, the glossary, tooltips, and the
Ontology Browser all show the same prose.

Upsert semantics (idempotent): create a node_type descriptor where missing; otherwise set
its `description_short` (and `title`) to the curated text. `description_full` is never
touched, so any long-form rationale already authored survives.

Run from the repo root (configures neomodel + warms data_api itself):
    python -m app.database.tools.seed_glossary_descriptors          # apply
    python -m app.database.tools.seed_glossary_descriptors --dry-run # report only
"""
import argparse
import sys

# Warm up data_api first so the queries-layer imports don't trip the circular load,
# then configure the neomodel connection (this script is an entry point).
import app.endpoints.data_api  # noqa: F401
from app.database.graph_schema import set_connection, UniversalDescriptor
from app.database.identifiers import make_node_type_handle


# label -> (title, description_short). Transcribed verbatim from the prior glossary
# sources (context/definitions.js + GlossaryTab EXTRA_TERMS). Only true node types are
# here; derived/vocabulary concepts (Elevation signal, Trajectory) are NOT node types and
# stay out of the ontology.
NODE_TYPE_DESCRIPTIONS = {
    # --- Governance ---
    "Law": ("Law", "A formal and enforceable rule established by legislative authorities to ensure equal access and non-discrimination for individuals with disabilities. These laws provide the legal framework and mandate for accessibility practices and policies within institutions, such as the Americans with Disabilities Act (ADA) and Section 508 of the Rehabilitation Act."),
    "Case": ("Case", "A legal decision or ruling that interprets or applies laws related to accessibility. Cases provide judicial precedents and clarifications on how laws such as the ADA and Section 508 should be implemented and enforced. These cases can influence policy-making and the development of procedures within institutions to ensure compliance with accessibility standards."),
    "Directive": ("Directive", "An official instruction or order issued by an authority, such as an executive body or regulatory agency, to guide the implementation of accessibility policies and procedures. Directives provide specific guidance on how to achieve compliance with laws and policies, ensuring that institutions follow standardized practices to enhance accessibility and remove barriers for individuals with disabilities."),
    "ExternalPolicy": ("External Policy", "A set of principles and guidelines adopted by an organization to govern decisions and actions related to accessibility. Policies are designed to ensure compliance with relevant laws and directives, providing a framework for making technology, programs, and services accessible to all individuals, including those with disabilities."),
    "Memo": ("Memo", "A written communication, typically used for internal purposes, that provides information, updates, or instructions related to accessibility. Memos can outline changes in policy, highlight important accessibility initiatives, or convey decisions made by leadership regarding the implementation of accessibility practices."),
    "Guideline": ("Guideline", "A set of recommended practices and standards designed to help organizations achieve and maintain accessibility. Guidelines, such as the Web Content Accessibility Guidelines (WCAG), provide detailed criteria for making digital content accessible to individuals with disabilities."),

    # --- Goals, Indicators & Evidence ---
    "Goal": ("Goal", "A measurable objective that an organization aims to achieve to enhance accessibility. Goals are set to drive improvements in accessibility practices, ensuring that the organization meets legal and policy requirements."),
    "SuccessIndicator": ("Success Indicator", "A specific metric or benchmark used to measure progress toward achieving a goal. Success indicators provide clear criteria for evaluating the effectiveness of accessibility initiatives and activities."),
    "YearSuccessEvidence": ("Year Success Evidence", "Documented proof of progress and achievements related to accessibility goals and success indicators for a specific academic year. This evidence includes data and reports on the implementation of accessibility initiatives, the status of success indicators, and any improvements made during the year."),
    "StatusLevel": ("Status Level", "A specific stage or degree of progress made towards achieving accessibility goals and success indicators. Status levels provide a standardized way to evaluate and report the implementation and effectiveness of accessibility initiatives."),
    "AcademicYear": ("Academic Year", "The annual cycle of academic instruction and administrative operations within an institution. It includes specific start and end dates that define the period during which academic activities, such as classes, evaluations, and progress tracking, occur."),
    "Accomplishment": ("Accomplishment", "A documented achievement that represents progress in the implementation of accessibility initiatives, demonstrating successful completion of specific goals or milestones."),

    # --- Implementations ---
    "Process": ("Process", "A series of actions or steps taken to achieve a specific goal or outcome related to accessibility. Processes are essential for systematically implementing accessibility policies, plans, and guidelines. These processes ensure continuous quality improvement, prioritize accessibility tasks, and document progress through annual reports."),
    "Project": ("Project", "A temporary and focused effort undertaken to create a specific product, service, or result that enhances accessibility. Projects are designed to implement specific aspects of the ATI, such as the development of new accessible websites, the procurement of accessible technology, or the creation of training programs for staff and faculty."),
    "Procedure": ("Procedure", "A detailed set of instructions or steps that must be followed to perform a specific task or achieve a particular objective related to accessibility. Procedures ensure consistency and compliance with accessibility standards by providing clear guidelines on how to implement policies and processes."),
    "Service": ("Service", "An ongoing support or assistance provided to ensure accessibility for individuals with disabilities. Services are designed to facilitate access to programs, activities, and resources within the institution. Services are integral to implementing ATI policies and goals, ensuring that accessibility is embedded in the daily operations and offerings of the institution."),
    "Guidance": ("Guidance", "Straightforward, practical information designed to help users navigate accessibility resources, understand procedures, or take necessary actions. This category includes tips, instructions, FAQs, and other forms of guidance that provide clear and concise directions to ensure users can effectively access and utilize accessibility-related services and resources."),
    "Tracking": ("Tracking", "A system or method to track the progress of the implementation of the accessibility initiatives, monitoring performance and documenting achievements over time."),
    "InternalPolicy": ("Internal Policy", "A set of rules, procedures, and guidelines developed by an organization to ensure compliance with accessibility standards. Internal policies are tailored to the specific needs and requirements of the institution, providing detailed instructions on how to implement accessibility practices and procedures."),
    "Plan": ("Plan", "A detailed strategy or roadmap outlining the specific steps, resources, and timelines needed to achieve accessibility goals. Plans include the identification of success indicators, allocation of responsibilities, and the scheduling of activities aimed at improving accessibility."),

    # --- Documentation ---
    "Document": ("Document", "Any written or electronic record that provides information, evidence, or support related to accessibility initiatives. Documents can include policies, guidelines, reports, plans, meeting minutes, instructional materials, and any other relevant files."),
    "Webpage": ("Webpage", "An individual online page that provides information, resources, or support related to accessibility initiatives. Webpages can include sections of the institution's website, instructional content, digital services, and other online materials."),
    "Note": ("Note", "An annotation or comment that provides additional information, insights, or clarifications related to various aspects of the ATI. Notes can be used to document observations, feedback, meeting highlights, or important points that support the understanding and implementation of accessibility initiatives."),
    "Message": ("Message", "A communication, such as an email, memo, or announcement, that conveys information related to accessibility initiatives. Messages are used to inform stakeholders about updates, changes, instructions, or decisions regarding the implementation of ATI policies and procedures."),
    "Metric": ("Metric", "A specific quantitative measurement or benchmark used to evaluate the performance, progress, or success of accessibility-related activities. Metrics provide concrete data points that support the evaluation of success indicators and goals."),

    # --- People & Organizations ---
    "ATIWorkingGroup": ("ATI Working Group", "A specialized team responsible for overseeing and implementing specific aspects of the ATI within an institution. These working groups focus on key priority areas such as web accessibility, instructional materials, and procurement."),
    "Person": ("Person", "An individual involved in the implementation and support of accessibility initiatives within the institution. This includes roles such as ATI Executive Sponsors, members of ATI Working Groups, faculty, staff, and students."),
    "Department": ("Department", "An organizational unit within the institution that plays a role in implementing and supporting accessibility initiatives. Departments can include academic units, administrative offices, and support services, each contributing to various aspects of the ATI."),
    "College": ("College", "A major academic division within the institution, typically encompassing multiple departments and programs. Each college is responsible for integrating accessibility into its curricula, research, and administrative practices."),
    "Vendor": ("Vendor", "An external organization or company that provides goods, services, or technology to the institution. Vendors play a crucial role in the procurement of accessible products and services, ensuring that any purchased technology meets the accessibility standards and requirements outlined by the ATI."),

    # --- Assets & Interfaces ---
    "Asset": ("Asset", "A unit of ICT whose accessibility the institution must maintain — identified by title plus deployment scope, with up to four §508 stewardship capacities (procured / developed / maintained / used by a person or org unit)."),
    "Interface": ("Interface", "A salient point of interaction identified by a four-coordinate signature (backing asset, locus, function, title). The unit that remediation work targets."),
    "Component": ("Component", "A WCAG-grain element of an interface (video player, form, data table) carrying a kind and links to the guidelines it must satisfy."),
    "TAAP": ("TAAP", "Temporary Alternate Access Plan — the time-bound, asset-scoped plan for equivalent access when full conformance is not yet achievable. Reviewed annually; itself usable as evidence."),
    "Tool": ("Tool", "An instrument of remediation work (scanner, captioning service, OCR engine) used by implementations to keep assets accessible."),

    # --- Planning ---
    "CampusPlan": ("CampusPlan", "The one-per-campus, one-per-year planning document: executive summary, executive sponsor, and three working-group plans."),
    "WorkingGroupPlan": ("WorkingGroupPlan", "A campus plan's per-committee child: prioritized indicators with rationale, a group lead, and the constituent plan work-items."),
    "ProgressUpdate": ("ProgressUpdate", "A dated, append-only progress entry about a piece of evidence, carrying a note, an author, and a trajectory."),

    # --- Classification & Ontology ---
    "Dimension": ("Dimension", "One of the seven W3C Accessibility Maturity Model dimensions (Communications, Governance & Oversight, ICT Development Lifecycle, Knowledge & Skills, Personnel, Procurement, Support) used to classify implementations."),
    "Role": ("Role", "A capacity a person provides (QA specialist, captioner, developer, …), recorded with whether it appears in their position description."),
    "Principle": ("Principle", "A conceptual commitment of the framework (e.g. responsibility sits closest to remediation capacity), grounded in law or scholarship and linked to the schema elements it shapes."),
    "UniversalDescriptor": ("UniversalDescriptor", "A self-describing record for an element of the data model itself — a node type, field, field value, or relationship — powering tooltips and this documentation."),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed node-type descriptors from the glossary text.")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()

    # Imported after warm-up so the circular load is already resolved.
    from app.database.queries.descriptors.create import create_descriptor
    from app.database.queries.descriptors.update import update_descriptor

    created, updated, unchanged = [], [], []
    for label, (title, short) in NODE_TYPE_DESCRIPTIONS.items():
        handle = make_node_type_handle(label)
        existing = UniversalDescriptor.nodes.get_or_none(descriptor_handle=handle)

        if existing is None:
            if not args.dry_run:
                create_descriptor(descriptor_kind="node_type", target_label=label,
                                  title=title, description_short=short)
            created.append(label)
        elif (existing.description_short or "") == short and (existing.title or "") == title:
            unchanged.append(label)
        else:
            if not args.dry_run:
                update_descriptor(handle, {"title": title, "description_short": short})
            updated.append(label)

    verb = "WOULD " if args.dry_run else ""
    print(f"[seed-glossary] {verb}created {len(created)}, {verb}updated {len(updated)}, "
          f"unchanged {len(unchanged)} (of {len(NODE_TYPE_DESCRIPTIONS)} node types)")
    if created:
        print("  created:   " + ", ".join(sorted(created)))
    if updated:
        print("  updated:   " + ", ".join(sorted(updated)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
