import uuid
from neomodel import (StructuredNode, StringProperty,
                      IntegerProperty, RelationshipTo,
                      RelationshipFrom, UniqueIdProperty,
                      StructuredRel,Relationship, DateProperty,
                      install_all_labels, BooleanProperty, IntegerProperty)




class Department(StructuredNode):
    """
    Class representing a department.

    Attributes:
        name (str): Unique identifier for the department.
        location (str): Location of the department.
        employs (RelationshipFrom): Relationship to Person with "employs" type.
    """
    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipFrom('Person', 'employs')





class Person(StructuredNode):
    """
    Class representing a person.

    Attributes:
        name (str): Unique identifier for the person.
        title (str): Title of the person.
        works_for (RelationshipTo): Relationship to Department with "works_for" type.
        has_ati_role (RelationshipTo): Relationship to ATIRole with "has_ati_role" type.
    """
    name = StringProperty(unique_index=True)
    title = StringProperty()
    works_for = RelationshipTo('Department', 'works_for')
    has_ati_role = RelationshipTo('ATIRole', 'has_ati_role')



class ATIRole(StructuredNode):
    """
    Class representing an ATI role.

    Attributes:
        name (str): Unique identifier for the ATI role.
        description (str): Description of the ATI role.
        participates_in (RelationshipTo): Relationship to ATISubCommittee with "participates_in" type.
        job_description_with_ati_responsibilities (RelationshipTo): Relationship to Document with "ATI_JOB_DESCRIPTION" type.
    """
    name = StringProperty(unique_index=True)
    description = StringProperty()
    participates_in = RelationshipTo('ATISubCommittee', 'participates_in')
    job_description_with_ati_responsibilities = RelationshipTo('Document', 'ATI_JOB_DESCRIPTION')


class AcademicYear(StructuredNode):
    """
    Class representing an academic year.

    Attributes:
        name (str): Unique identifier for the academic year.
        start_date (DateProperty): Start date of the academic year.
        end_date (DateProperty): End date of the academic year.
    """
    name = StringProperty(unique_index=True)
    start_date = DateProperty()
    end_date = DateProperty()


class ATISubCommittee(StructuredNode):
    """
    Class representing an ATI subcommittee.

    Attributes:
        name (str): Unique identifier for the ATI subcommittee.
        description (str): Description of the ATI subcommittee.
        goals (Relationship): Relationship to Goal with "is_a_subcommittee_goal" type.
    """
    name = StringProperty(unique_index=True)
    description = StringProperty()
    goals = Relationship("Goal", "is_a_subcommittee_goal")




class Goal(StructuredNode):
    """
    Class representing a goal.


    A specific, measurable objective that an organization aims to achieve. Goals in the context of accessibility
    are often related to improving accessibility compliance and outcomes.

    Attributes:
        name (str): Unique identifier for the goal.
        goal (str): Description of the goal.
        goal_number (int): Number associated with the goal.
        date_added (DateProperty): Date when the goal was added.
        removed (bool): Flag indicating if the goal is removed.
        part_of_atisubcommittee (Relationship): Relationship to ATISubCommittee with "managed_by_subcommittee" type.
        success_indicators (RelationshipTo): Relationship to SuccessIndicator with "is_a_success_indicator_for" type.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
    """
    name = StringProperty(unique_index=True)
    goal = StringProperty()
    goal_number = IntegerProperty()
    date_added = DateProperty()
    removed = BooleanProperty(default=False)
    part_of_atisubcommittee = Relationship(ATISubCommittee, "managed_by_subcommittee")
    success_indicators = RelationshipTo("SuccessIndicator", "is_a_success_indicator_for")
    notes = RelationshipTo("GenericNote", "has_note")



class SuccessIndicator(StructuredNode):
    """
    Class representing a success indicator.

    Attributes:
        number (int): Number associated with the success indicator.
        associated_goal (RelationshipTo): Relationship to Goal with "is_a_success_indicator_of" type.
        success_indicator (str): Description of the success indicator.
        composite_key (str): Unique identifier for the success indicator, a combination of goal_number and ATISubCommittee name.
        removed (bool): Flag indicating if the success indicator is removed.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
        date_added (DateProperty): Date when the success indicator was added.
    """
    number = IntegerProperty()
    associated_goal = RelationshipTo(Goal, "is_a_success_indicator_of")
    success_indicator = StringProperty()
    composite_key = StringProperty(unique_index=True)  # Combination of goal_number and ATISubCommittee name
    removed = BooleanProperty(default=False)
    notes = RelationshipTo("GenericNote", "has_note")
    date_added = DateProperty()



class StatusLevel(StructuredNode):
    """
    Class representing the status level of a success indicator.

    Attributes:
        status_level (str): Unique identifier for the status level.
        description_of_procedures (str): Description of the procedures.
        description_of_documentation (str): Description of the documentation.
        description_of_documentation_evidence (str): Description of the documentation evidence.
        description_of_resources (str): Description of the resources.
        status_value (str): Value of the status.
        ati_report_evidence_column (str): ATI report evidence column.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
    """

    status_level = StringProperty(unique_index=True)
    description_of_procedures = StringProperty()
    description_of_documentation = StringProperty()
    description_of_documentation_evidence = StringProperty()
    description_of_resources = StringProperty()
    status_value = StringProperty()
    ati_report_evidence_column = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")




class YearSuccessEvidence(StructuredNode):
    """
    Class representing the evidence of success for a particular year.

    Attributes:
        year_identifier (str): Unique identifier combining Year and SuccessIndicator name.
        academic_year (RelationshipTo): Relationship to AcademicYear with "status_in_year" type.
        status_level (RelationshipTo): Relationship to StatusLevel with "status_is" type.
        related_success_indicator (RelationshipTo): Relationship to SuccessIndicator with "success_indicator_is" type.
        implemented_by (RelationshipTo): Relationship to Person with "implemented_by" type.
        documentation_status (str): Status of the documentation.
        resources_status (str): Status of the resources.
        implementation_plan_status (str): Status of the implementation plan.
        responsibility_for (RelationshipFrom): Relationship from ATIRole with "has_responsibility_for" type.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
    """
    year_identifier = StringProperty(unique_index=True)  # A unique identifier combining Year and SuccessIndicator name
    academic_year = RelationshipTo("AcademicYear", "status_in_year")
    status_level = RelationshipTo("StatusLevel", "status_is")
    related_success_indicator = RelationshipTo("SuccessIndicator", "success_indicator_is")
    implemented_by = RelationshipTo("Person", "implemented_by")

    # New properties for tracking status level details
    documentation_status = StringProperty()
    resources_status = StringProperty()
    implementation_plan_status = StringProperty()

    responsibility_for = RelationshipFrom("ATIRole", "has_responsibility_for")

    # Relationships to different types of evidence, now within YearStatus
    # has_documents = RelationshipTo("Document", "has_document")
    # has_webpages = RelationshipTo("Webpage", "has_webpage")
    # has_emails = RelationshipTo("Email", "has_email")
    notes = RelationshipTo("GenericNote", "has_note")



class Proceedure(StructuredNode):
    """
    Class representing a procedure.

    An established or official way of doing something. Procedures provide detailed instructions
    on how to carry out processes to ensure consistency and compliance.


    Attributes:
        name (str): Unique identifier for the procedure.
        description (str): Description of the procedure.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
        supporting_documents (RelationshipTo): Relationship to Document with "is_documented_by" type.
        supporting_webpages (RelationshipTo): Relationship to Webpage with "is_documented_by" type.
        responsible_people (RelationshipTo): Relationship to Person with "implemented_by" type.
        responsible_departments (RelationshipTo): Relationship to Department with "responsible_for" type.
    """
    name = StringProperty(unique_index=True)
    description = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    responsible_people = RelationshipTo("Person", "implemented_by")
    responsible_departments = RelationshipTo("Department", "responsible_for")


class Project(StructuredNode):

    """
    A temporary endeavor undertaken to create a unique product, service, or result. Projects in the context
    of accessibility might focus on specific initiatives such as revamping a website to meet accessibility standards.

    """
    name = StringProperty(unique_index=True)
    description = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    responsible_people = RelationshipTo("Person", "implemented_by")
    responsible_departments = RelationshipTo("Department", "responsible_for")


class Process(StructuredNode):
    """
    Class representing a process.


    A series of actions or steps taken to achieve a particular end.
    In the context of accessibility, processes are established to ensure consistent and effective implementation
    of accessibility requirements.

    Attributes:
        name (str): Unique identifier for the process.
        description (str): Description of the process.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
        supporting_documents (RelationshipTo): Relationship to Document with "is_documented_by" type.
        supporting_webpages (RelationshipTo): Relationship to Webpage with "is_documented_by" type.
        responsible_people (RelationshipTo): Relationship to Person with "implemented_by" type.
        responsible_departments (RelationshipTo): Relationship to Department with "responsible_for" type.
    """
    name = StringProperty(unique_index=True)
    description = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpages = RelationshipTo("Webpage", "is_documented_by")
    responsible_people = RelationshipTo("Person", "implemented_by")
    responsible_departments = RelationshipTo("Department", "responsible_for")





class Accomplishment(StructuredNode):
    pass


class Plan(StructuredNode):
    """
    Class representing a plan.

    A detailed proposal or strategy for achieving a set of goals. Plans outline the steps, resources,
    and timeline required to implement accessibility initiatives.

    Attributes:
        name (str): Unique identifier for the plan.
        description (str): Description of the plan.
        implementation_year (RelationshipTo): Relationship to AcademicYear with "implementation_year" type.
        related_goal (RelationshipFrom): Relationship from Goal with "to_implement_goal" type.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
        supporting_documents (RelationshipTo): Relationship to Document with "is_documented_by" type.
        supporting_webpage (RelationshipTo): Relationship to Webpage with "is_documented_by" type.
    """
    name = StringProperty(unique_index=True)
    description = StringProperty()
    implementation_year = RelationshipTo("AcademicYear", "implementation_year")
    related_goal = RelationshipFrom("Goal", "to_implement_goal")
    notes = RelationshipTo("GenericNote", "has_note")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_webpage = RelationshipTo("Webpage", "is_documented_by")







class Document(StructuredNode):
    """
    Class representing a document.

    Attributes:
        hash (str): Unique hash for the document.
        name (str): Name of the document.
        file_path (str): File path of the document.
        uri_path (str): URI path of the document.
        is_administrative_review_documentation (str): Flag indicating if the document is for administrative review.
        is_milestone_and_measures_documentation (str): Flag indicating if the document is for milestone and measures.
        related_goals (RelationshipFrom): Relationship from Goal with "has_document" type.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
    """
    hash = StringProperty(unique_index=True)
    name = StringProperty()
    file_path = StringProperty()
    uri_path = StringProperty()
    is_administrative_review_documentation = StringProperty()
    is_milestone_and_measures_documentation = StringProperty()
    related_goals = RelationshipFrom("Goal", "has_document")
    notes = RelationshipTo("GenericNote", "has_note")


class Webpage(StructuredNode):
    """
    Class representing a webpage.

    Attributes:
        url (str): Unique URL for the webpage.
        title (str): Title of the webpage.
        related_goals (RelationshipFrom): Relationship from Goal with "HAS_WEBPAGE" type.
        notes (RelationshipTo): Relationship to GenericNote with "HAS_NOTE" type.
    """
    url = StringProperty(unique_index=True)
    title = StringProperty()
    related_goals = RelationshipFrom("Goal", "HAS_WEBPAGE")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")



class Email(StructuredNode):
    """
    Class representing an email.

    Attributes:
        uuid (str): Unique identifier for the email.
        subject (str): Subject of the email.
        content (str): Content of the email.
        related_goals (RelationshipFrom): Relationship from Goal with "HAS_EMAIL" type.
        notes (RelationshipTo): Relationship to GenericNote with "HAS_NOTE" type.
    """
    uuid = StringProperty(unique_index=True)
    subject = StringProperty()
    content = StringProperty()
    related_goals = RelationshipFrom("Goal", "HAS_EMAIL")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")



class GenericNote(StructuredNode):
    """
    Class representing a generic note.

    Attributes:
        uuid (str): Unique identifier for the note.
        content (str): Content of the note.
        notates (RelationshipFrom): Relationship from StructuredNode with "NOTATES" type.
    """
    uuid = StringProperty(unique_index=True)
    content = StringProperty()
    notates = RelationshipFrom(StructuredNode, "NOTATES")



class Law(StructuredNode):
    """
    Class representing a law.

     formal rule or set of rules established by a governing authority to regulate behavior within a society.
     Laws related to accessibility may include statutes such as the Americans with Disabilities Act (ADA)
     and Section 508 of the Rehabilitation Act.

    Attributes:
        title (str): Unique title for the law.
        description (str): Description of the law.
        effective_date (DateProperty): Effective date of the law.
        last_updated (DateProperty): Last updated date of the law.
        relevant_sections (str): Relevant sections of the law.
        compliance_requirements (str): Compliance requirements of the law.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
        directs_success_indicator (RelationshipTo): Relationship to SuccessIndicator with "directs_success_indicator" type.
        supporting_documents (RelationshipTo): Relationship to Document with "is_documented_by" type.
        supporting_websites (RelationshipTo): Relationship to Webpage with "supporting_website" type.
    """
    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    relevant_sections = StringProperty()
    compliance_requirements = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    directs_success_indicator = RelationshipTo("SuccessIndicator", "directs_success_indicator")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "supporting_website")


class Directive(StructuredNode):


    """
    An official instruction or order issued by an authority.
    Directives are often used to guide the implementation of policies and laws within an organization.


    """

    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    relevant_sections = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    directs_success_indicator = RelationshipTo("SuccessIndicator", "directs_success_indicator")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "supporting_website")


class Memorandum(StructuredNode):

    """
    A written message, typically used for internal communication within an organization, that provides information,
    makes requests, or outlines policies and procedures. Memos related to accessibility often provide updates,
    instructions, or reminders.
    """


    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    relevant_sections = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    directs_success_indicator = RelationshipTo("SuccessIndicator", "directs_success_indicator")
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "supporting_website")


class Policy(StructuredNode):
    """
    Class representing a policy.

    A set of principles and guidelines formulated or adopted by an organization to influence and determine
    decisions and actions. Policies related to accessibility ensure that the organization's operations
    comply with relevant laws and standards.


    Attributes:
        title (str): Unique title for the policy.
        description (str): Description of the policy.
        effective_date (DateProperty): Effective date of the policy.
        last_updated (DateProperty): Last updated date of the policy.
        supporting_documents (RelationshipTo): Relationship to Document with "is_documented_by" type.
        supporting_websites (RelationshipTo): Relationship to Webpage with "supporting_website" type.
        supports_success_indicator (RelationshipTo): Relationship to SuccessIndicator with "supports_success_indicator" type.
        notes (RelationshipTo): Relationship to GenericNote with "has_note" type.
    """
    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    supporting_documents = RelationshipTo("Document", "is_documented_by")
    supporting_websites = RelationshipTo("Webpage", "supporting_website")
    supports_success_indicator = RelationshipTo("SuccessIndicator", "supports_success_indicator")
    notes = RelationshipTo("GenericNote", "has_note")





class Vendor(StructuredNode):
    """
    Class representing a vendor.

    Attributes:
        name (str): Unique name for the vendor.
        industry (str): Industry of the vendor.
        contracted_by (RelationshipFrom): Relationship from Department with "works_with" type.
        works_with (RelationshipTo): Relationship to Stakeholder with "works_with" type.
    """
    __primarykey__ = 'name'

    name = StringProperty()
    industry = StringProperty()

    contracted_by = RelationshipFrom("Department", "works_with")
    works_with = RelationshipTo("Stakeholder", "works_with")



def set_connection():

    from neomodel import config

    config.DATABASE_URL = 'bolt://neo4j:testtest@localhost:7687'
    config.DATABASE_USERNAME = 'neo4j'
    config.DATABASE_PASSWORD = 'testtest'


if __name__=="__main__":
 set_connection()
 install_all_labels()