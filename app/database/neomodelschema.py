import uuid
from neomodel import (StructuredNode, StringProperty,
                      IntegerProperty, RelationshipTo,
                      RelationshipFrom, UniqueIdProperty,
                      StructuredRel,Relationship, DateProperty,
                      install_all_labels, BooleanProperty, IntegerProperty)




class Department(StructuredNode):
    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipFrom('Person', 'employs')

    @property
    def serialize(self):
        return {
            'name': self.name,
            'location': self.location,
            'employs': self.employs
        }


class Person(StructuredNode):
    name = StringProperty(unique_index=True)
    title = StringProperty()
    works_for = RelationshipTo('Department', 'works_for')
    has_ati_role = RelationshipTo('ATIRole', 'has_ati_role')

    @property
    def serialize(self):
        return {
            'name': self.name,
            'title': self.title,
            'works_for': self.works_for,
            'has_ati_role': self.has_ati_role
        }


class ATIRole(StructuredNode):
    name = StringProperty(unique_index=True)
    description = StringProperty()
    participates_in = RelationshipTo('ATISubCommittee', 'participates_in')
    job_description_with_ati_responsibilities = RelationshipTo('Document', 'documents_role_responsibilities')
    implements_year_success_evidence = RelationshipTo('YearSuccessEvidence', 'implements')

    @property
    def serialize(self):
        return {
            'name': self.name,
            'description': self.description,
            'participates_in': self.participates_in,
            'job_description_with_ati_responsibilities': self.job_description_with_ati_responsibilities
        }

class ATISubCommittee(StructuredNode):
    name = StringProperty(unique_index=True)
    description = StringProperty()
    # Relationship to Goals
    goals = Relationship("Goal", "is_a_subcommittee_goal")

    @property
    def serialize(self):
        return {
            'name': self.name,
            'description': self.description,
            'goals': self.goals
        }


class Goal(StructuredNode):

    name = StringProperty(unique_index=True)
    part_of_atisubcommittee = Relationship(ATISubCommittee, "managed_by_subcommittee")
    success_indicators = RelationshipFrom("SuccessIndicator", "informs_goal")
    achieved = BooleanProperty(default=False)
    removed = BooleanProperty(default=False)
    description = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    goal_number = IntegerProperty()
    date_added = DateProperty()

    @property
    def serialize(self):
        return {
            'name': self.name,
            'part_of_atisubcommittee': self.part_of_atisubcommittee,
            'success_indicators': self.success_indicators,
            'removed': self.removed,
            'goal': self.goal,
            'notes': self.notes,
            'goal_number': self.goal_number,
            'date_added': self.date_added
        }

class SuccessIndicator(StructuredNode):

    number = IntegerProperty()
    success_indicator = StringProperty()
    composite_key = StringProperty(unique_index=True)  # Combination of goal_number and ATISubCommittee name
    removed = BooleanProperty(default=False)
    # Relationships to ATISubCommittee and YearStatus
    # Notes can be attached to goals
    notes = RelationshipTo("GenericNote", "has_note")
    date_added = DateProperty()
    guiding_laws = RelationshipFrom("Law", "guides_success_indicator")
    supporting_policies = RelationshipFrom("Policy", "supports_success_indicator")
    goals = RelationshipTo("Goal", "informs_goal")

    @property
    def serialize(self):
        return {
            'number': self.number,
            'associated_goals': self.associated_goals,
            'success_indicator': self.success_indicator,
            'composite_key': self.composite_key,
            'removed': self.removed,
            'notes': self.notes,
            'date_added': self.date_added,
            'guiding_laws': self.guiding_laws
        }


class StatusLevel(StructuredNode):

    status_level = StringProperty(unique_index=True)
    description_of_procedures = StringProperty()
    description_of_documentation = StringProperty()
    description_of_documentation_evidence = StringProperty()
    description_of_resources = StringProperty()
    status_value = StringProperty()
    ati_report_evidence_column = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")

    @property
    def serialize(self):
        return {
            'status_level': self.status_level,
            'description_of_procedures': self.description_of_procedures,
            'description_of_documentation': self.description_of_documentation,
            'description_of_documentation_evidence': self.description_of_documentation_evidence,
            'description_of_resources': self.description_of_resources,
            'status_value': self.status_value,
            'ati_report_evidence_column': self.ati_report_evidence_column,
            'notes': self.notes
        }


class YearSuccessEvidence(StructuredNode):

    year_identifier = StringProperty(unique_index=True)  # A unique identifier combining Year and SuccessIndicator name
    academic_year = RelationshipTo("AcademicYear", "status_in_year")
    status_level = RelationshipTo("StatusLevel", "status_is")
    related_success_indicator = RelationshipTo("SuccessIndicator", "success_indicator_is")
    implemented_by = RelationshipFrom("ATIRole", "implements")
    related_projects = RelationshipFrom("Project", "implements_year_success_evidence")

    # New properties for tracking status level details
    documentation_status = StringProperty()
    resources_status = StringProperty()
    implementation_plan_status = StringProperty()

    responsibility_for = RelationshipFrom("ATIRole", "has_responsibility_for")

    # Relationships to different types of evidence, now within YearStatus
    has_documents = RelationshipTo("Document", "has_document")
    has_webpages = RelationshipTo("Webpage", "has_webpage")
    has_emails = RelationshipTo("Email", "has_email")
    supporting_vendors = RelationshipTo("Vendor", "services")
    notes = RelationshipTo("GenericNote", "has_note")




    @property
    def serialize(self):
        return {

            'year_identifier': self.year_identifier,
            'academic_year': self.academic_year,
            'status_level': self.status_level,
            'related_success_indicator': self.related_success_indicator,
            'implemented_by': self.implemented_by,
            'documentation_status': self.documentation_status,
            'resources_status': self.resources_status,
            'implementation_plan_status': self.implementation_plan_status,
            'responsibility_for': self.responsibility_for,
            'has_documents': self.has_documents,
            'has_webpages': self.has_webpages,
            'has_emails': self.has_emails,
            'notes': self.notes
        }





class Project(StructuredNode):

    name = StringProperty(unique_index=True)
    description = StringProperty()
    status = StringProperty()
    implements_year_success_evidence = RelationshipTo("YearSuccessEvidence", "implements_year_success_evidence")
    implements_plan = RelationshipTo("Plan", "implements_plan")
    has_documents = RelationshipTo("Document", "has_document")
    has_webpages = RelationshipTo("Webpage", "has_webpage")
    has_emails = RelationshipTo("Email", "has_email")
    supporting_vendors = RelationshipTo("Vendor", "services")
    notes = RelationshipTo("GenericNote", "has_note")


class Accomplishment(StructuredNode):
    pass

class Plan(StructuredNode):

    name = StringProperty(unique_index=True)
    description = StringProperty()
    implementation_year = RelationshipTo("AcademicYear", "implementation_year")
    related_goal = RelationshipFrom("Goal", "to_implement_goal")
    notes = RelationshipTo("GenericNote", "has_note")
    supporting_document = RelationshipTo("Document", "has_document")
    supporting_webpage = RelationshipTo("Webpage", "supporting_webpage")
    implementing_projects = RelationshipFrom("Project", "implements_plan")

    @property
    def serialize(self):
        return {
            'name': self.name,
            'description': self.description,
            'implementation_year': self.implementation_year,
            'related_goal': self.related_goal,
            'notes': self.notes
        }



class AcademicYear(StructuredNode):

    name = StringProperty(unique_index=True)
    start_date = DateProperty()
    end_date = DateProperty()

    @property
    def serialize(self):
        return {
            'name': self.name,
            'start_date': self.start_date,
            'end_date': self.end_date
        }



class Document(StructuredNode):

    hash = StringProperty(unique_index=True)
    name = StringProperty()
    file_path = StringProperty()
    uri_path = StringProperty()
    is_administrative_review_documentation = StringProperty()
    is_milestone_and_measures_documentation = StringProperty()

    related_goals = RelationshipFrom("Goal", "HAS_DOCUMENT")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")

    @property
    def serialize(self):
        return {
            'hash': self.hash,
            'name': self.name,
            'file_path': self.file_path,
            'uri_path': self.uri_path,
            'is_administrative_review_documentation': self.is_administrative_review_documentation,
            'is_milestone_and_measures_documentation': self.is_milestone_and_measures_documentation,
            'related_goals': self.related_goals,
            'notes': self.notes
        }

class Webpage(StructuredNode):

    url = StringProperty(unique_index=True)
    title = StringProperty()
    related_goals = RelationshipFrom("Goal", "HAS_WEBPAGE")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")

    @property
    def serialize(self):
        return {
            'url': self.url,
            'title': self.title,
            'related_goals': self.related_goals,
            'notes': self.notes
        }


class Email(StructuredNode):

    uuid = StringProperty(unique_index=True)
    subject = StringProperty()
    content = StringProperty()
    related_goals = RelationshipFrom("Goal", "HAS_EMAIL")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")

    @property
    def serialize(self):
        return {
            'uuid': self.uuid,
            'subject': self.subject,
            'content': self.content,
            'related_goals': self.related_goals,
            'notes': self.notes
        }

class GenericNote(StructuredNode):
    __primarykey__ = 'id'

    uuid = StringProperty()
    content = StringProperty()
    notates = RelationshipFrom(StructuredNode, "NOTATES")

    @property
    def serialize(self):
        return {
            'uuid': self.uuid,
            'content': self.content,
            'notates': self.notates
        }


class Law(StructuredNode):
    __primarykey__ = 'title'
    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    relevant_sections = StringProperty()
    compliance_requirements = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    guides_success_indicator = RelationshipTo("SuccessIndicator", "guides_success_indicator")
    supporting_documents = RelationshipTo("Document", "has_document")
    supporting_websites = RelationshipTo("Webpage", "has_website")


    @property
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            'effective_date': self.effective_date,
            'last_updated': self.last_updated,
            'relevant_sections': self.relevant_sections,
            'compliance_requirements': self.compliance_requirements,
            'notes': self.notes,
            'directs_success_indicator': self.directs_success_indicator
        }


class Policy(StructuredNode):
    __primarykey__ = 'title'
    title = StringProperty(unique_index=True, required=True)
    description = StringProperty()
    effective_date = DateProperty()
    last_updated = DateProperty()
    supporting_documents = RelationshipTo("Document", "has_document")
    supporting_websites = RelationshipTo("Webpage", "has_website")
    supports_success_indicator = RelationshipTo("SuccessIndicator", "supports_success_indicator")
    notes = RelationshipTo("GenericNote", "has_note")


    @property
    def serialize(self):
        return {
            'title': self.title,
            'description': self.description,
            'effective_date': self.effective_date,
            'last_updated': self.last_updated,
            'supporting_documents': self.supporting_documents,
            'supporting_websites': self.supporting_websites,
            'supports_success_indicator': self.supports_success_indicator,
            'directs_success_indicator': self.directs_success_indicator,
            'notes': self.notes
        }



class Vendor(StructuredNode):
    __primarykey__ = 'name'

    name = StringProperty()
    industry = StringProperty()
    contact_person  = StringProperty()
    contracted_by = RelationshipFrom("Department", "works_with")
    works_with = RelationshipTo("Stakeholder", "works_with")
    supporting_year_success_evidence = RelationshipTo("YearSuccessEvidence", "supports_year_success_evidence")
    notes = RelationshipTo("GenericNote", "has_note")


    @property
    def serialize(self):
        return {
            'name': self.name,
            'industry': self.industry,
            'contracted_by': self.contracted_by,
            'works_with': self.works_with
        }


def set_connection():

    from neomodel import config

    config.DATABASE_URL = 'bolt://neo4j:testtest@localhost:7687'
    config.DATABASE_USERNAME = 'neo4j'
    config.DATABASE_PASSWORD = 'testtest'


if __name__=="__main__":
 set_connection()
 install_all_labels()