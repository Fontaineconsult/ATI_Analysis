import json
import uuid
from email.policy import default

from neomodel import (StructuredNode, StringProperty,
                      IntegerProperty, RelationshipTo,
                      RelationshipFrom, UniqueIdProperty,
                      StructuredRel, Relationship, DateProperty,
                      install_all_labels, BooleanProperty, IntegerProperty, JSONProperty)
from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', '.env.development')
load_dotenv(dotenv_path)

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

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'accomplishment_description': self.accomplishment_description,
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
    plan_status = StringProperty()

    completed_year = RelationshipTo("AcademicYear", "completed_in_year")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'plan_description': self.plan_description,
            'is_key_plan': self.is_key_plan,
            'is_campus_plan': self.is_campus_plan,
            'abandoned': self.abandoned,
            'abandoned_notes': self.abandoned_notes,
            'plan_status': self.plan_status,
            'description': self.description,
            "unique_id": self.unique_id
        }



class InternalPolicy(StructuredNode):

    """    Class representing an internal policy node.

    An Internal Policy in the context of the Accessible Technology Initiative (ATI) represents a set of rules,
    procedures, and guidelines developed by an organization to ensure compliance with accessibility standards.
    Internal policies are tailored to the specific needs and requirements of the institution, providing detailed
    instructions on how to implement accessibility practices and procedures. These policies help align the
    organization's activities with broader accessibility goals and ensure that all members of the institution
    are aware of their roles and responsibilities in maintaining accessibility standards.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            'effective_date': self.effective_date,
            'last_updated': self.last_updated,
            "unique_id": self.unique_id
        }



class Process(StructuredNode):

    """    Class representing a process node.

    Represents a series of actions or steps taken to achieve a specific goal or outcome related to accessibility.
    Processes are essential for systematically implementing accessibility policies, plans, and guidelines.
    These processes ensure continuous quality improvement, prioritize accessibility tasks, and document progress
    through annual reports. Each process involves collaboration among various stakeholders, adherence
    to timelines, and regular monitoring to address challenges and track achievements

     """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
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
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
        }


class Procedure(StructuredNode):

    """    Class representing a procedure node.

    Represents a detailed set of instructions or steps that must be followed to perform a specific task or achieve
    a particular objective related to accessibility. Procedures ensure consistency and compliance with accessibility
    standards by providing clear guidelines on how to implement policies and processes. These procedures help
    standardize actions across the organization, ensuring that all activities align with the ATI goals and success
    indicators. They are regularly reviewed and updated to reflect best practices and changes in technology

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
        }


class Service(StructuredNode):

    """    Class representing a service node.

    A Service in the context of the Accessible Technology Initiative (ATI) represents an ongoing support or
    assistance provided to ensure accessibility for individuals with disabilities. Services are designed to
    facilitate access to programs, activities, and resources within the institution. Services are integral to
    implementing ATI policies and goals, ensuring that accessibility is embedded in the daily operations
    and offerings of the institution.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
        }



class Guidance(StructuredNode):

    """    Class representing a Guidance node.

    Represents straightforward, practical information designed to help users navigate accessibility resources,
    understand procedures, or take necessary actions. This category includes tips, instructions, FAQs,
    and other forms of guidance that provide clear and concise directions to ensure users can effectively
    access and utilize accessibility-related services and resources. Guidance helps bridge the gap between
    complex policies and everyday practice, making it easier for individuals to comply with accessibility
    standards and best practices.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

    #serialize
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            "unique_id": self.unique_id
        }


class Tracking(StructuredNode):

    """    Class representing a tracking node.

    Represents a tracking node to track the progress of the implementation of the accessibility initiatives.

    """
    unique_id = UniqueIdProperty()

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    supporting_notes = RelationshipTo("Note", "is_documented_by")
    supporting_messages = RelationshipTo("Message", "is_documented_by")
    supporting_metrics = RelationshipTo("Metric", "has_metric")
    is_evidence_for = RelationshipTo("YearSuccessEvidence", "is_evidence_for")

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
    documentation_requirements = RelationshipTo('ResourceRequirement', 'is_a_documentation_requirement')
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

    # New properties for tracking status level details
    documentation_status = StringProperty()
    resources_status = StringProperty()
    implementation_plan_status = StringProperty()
    administrative_review_complete = BooleanProperty(default=False)
    administrative_review_completed_date = DateProperty()
    administrative_review_completed_by = RelationshipTo("Person", "admin_review_completed_by")
    notes = RelationshipTo("Note", "has_note")
    messages = RelationshipTo("Message", "has_message")
    metrics = RelationshipTo("Metric", "has_metric")
    worked_on_in_current_year = BooleanProperty(default=False)
    will_work_on_next_year = BooleanProperty(default=False)

    # Relationships from implementation nodes
    processes_that_evidence = RelationshipFrom("Process", "is_evidence_for")
    projects_that_evidence = RelationshipFrom("Project", "is_evidence_for")
    procedures_that_evidence = RelationshipFrom("Procedure", "is_evidence_for")
    services_that_evidence = RelationshipFrom("Service", "is_evidence_for")
    guidance_that_evidence = RelationshipFrom("Guidance", "is_evidence_for")
    trackings_that_evidence = RelationshipFrom("Tracking", "is_evidence_for")
    internal_policies_that_evidence = RelationshipFrom("InternalPolicy", "is_evidence_for")

    # Relationships from person nodes
    persons_that_implement = RelationshipFrom("Person", "implements")

    #serialize
    def serialize(self):
        return {
            'year_identifier': self.year_identifier,
            'documentation_status': self.documentation_status,
            'resources_status': self.resources_status,
            'implementation_plan_status': self.implementation_plan_status,
            "unique_id": self.unique_id
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
    in_ati_working_group = RelationshipTo('ATIWorkingGroup', 'participates_in')
    implements_yse = RelationshipTo("YearSuccessEvidence", "implements")

    #serialize
    def serialize(self):
        return {
            'name': self.name,
            'email': self.email,
            'employee_id': self.employee_id,
            'title': self.title,
            "can_approve_yse": self.can_approve_yse,
            "active": self.active,
            "ati_role": self.ati_role,
            "unique_id": self.unique_id
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


class Department(StructuredNode):

    """    Class representing a Department.


    A Department in the context of the Accessible Technology Initiative (ATI) represents an organizational unit
    within the institution that plays a role in implementing and supporting accessibility initiatives.
    Departments can include academic units, administrative offices, and support services,
    each contributing to various aspects of the ATI. Responsibilities may include ensuring departmental compliance
    with accessibility policies, integrating accessibility into departmental processes and services,
    and collaborating with other units and working groups to achieve ATI goals. The Department node helps
    to organize and coordinate the efforts of different parts of the institution, ensuring a comprehensive and
    unified approach to accessibility.


    """
    unique_id = UniqueIdProperty()



    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipTo("Person", "employs")
    implements_yse = RelationshipTo("YearSuccessEvidence", "implements")




class College(StructuredNode):


    """    Class representing a College.

    A College in the context of the Accessible Technology Initiative (ATI) represents a major academic division
    within the institution, typically encompassing multiple departments and programs. Each college is responsible
    for integrating accessibility into its curricula, research, and administrative practices.

    """
    unique_id = UniqueIdProperty()


    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipTo("Person", "employs")
    implements_yse = RelationshipTo("YearSuccessEvidence", "implements")


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
    depreciated = BooleanProperty() #Todo this needs to placed in an edge
    depreciated_date = DateProperty() #Todo this needs to placed in an edge
    include_in_report = BooleanProperty(default=True) #Todo this needs to placed in an edge
    notes = RelationshipTo("Note", "has_note")

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
            "unique_id": self.unique_id

        }


def update_remote():
    from neomodel import config
    print("Updating remote connection")

    # Construct path to .env.remote file
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.remote')
    print(f"Loading environment from: {dotenv_path}")

    # Load environment variables and check if file exists
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path, override=True)
        print("Environment file loaded successfully")
    else:
        print(f"Warning: Environment file not found at {dotenv_path}")

    # Get environment variables with fallback values
    neo4j_database = os.environ.get('NEO4J_DATABASE')
    database_connector = os.environ.get('DATABASE_CONNECTOR')

    print(f"NEO4J_DATABASE: {neo4j_database}")
    print(f"DATABASE_CONNECTOR: {database_connector}")

    # Ensure environment variables are set before configuring
    if not neo4j_database or not database_connector:
        raise ValueError("Required environment variables NEO4J_DATABASE and DATABASE_CONNECTOR must be set")

    config.DATABASE_NAME = neo4j_database
    config.DATABASE_URL = database_connector

    print(f"Config set - DATABASE_NAME: {config.DATABASE_NAME}, DATABASE_URL: {config.DATABASE_URL}")


def set_connection():

    from neomodel import config

    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.development')
    load_dotenv(dotenv_path)


    config.DATABASE_NAME = os.environ.get('NEO4J_DATABASE')

    config.DATABASE_URL = os.environ.get('DATABASE_CONNECTOR')


# set_connection()

if __name__=="__main__":

    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.development')
    load_dotenv(dotenv_path)
    set_connection()
    install_all_labels()