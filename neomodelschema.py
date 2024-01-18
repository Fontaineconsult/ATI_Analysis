from neomodel import (StructuredNode, StringProperty,
                      IntegerProperty, RelationshipTo,
                      RelationshipFrom, UniqueIdProperty,
                      StructuredRel,Relationship, DateProperty,
                      install_all_labels, BooleanProperty, IntegerProperty)




# Example Conversion for Department Class
class Department(StructuredNode):
    name = StringProperty(unique_index=True)
    location = StringProperty()
    employs = RelationshipFrom('Person', 'employs')

# Convert other classes similarly...

# Conversion for Person Class
class Person(StructuredNode):
    name = StringProperty(unique_index=True)
    title = StringProperty()
    works_for = RelationshipTo('Department', 'works_for')
    has_ati_role = RelationshipTo('ATIRole', 'has_ati_role')

# Conversion for ATIRole Class
class ATIRole(StructuredNode):
    name = StringProperty(unique_index=True)
    description = StringProperty()
    participates_in = RelationshipTo('ATISubCommittee', 'participates_in')
    job_description_with_ati_responsibilities = RelationshipTo('Document', 'ATI_JOB_DESCRIPTION')

class ATISubCommittee(StructuredNode):
    name = StringProperty(unique_index=True)
    description = StringProperty()

    # Relationship to Goals
    goals = Relationship("Goal", "is_a_subcommittee_goal")


class Goal(StructuredNode):

    name = StringProperty(unique_index=True)
    part_of_atisubcommittee = Relationship(ATISubCommittee, "managed_by_subcommittee")
    success_indicators = RelationshipTo("SuccessIndicator", "is_a_success_indicator_for")
    removed = BooleanProperty(default=False)
    goal = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")
    goal_number = IntegerProperty()
    date_added = DateProperty()

class SuccessIndicator(StructuredNode):

    number = IntegerProperty()
    associated_goal = RelationshipTo(Goal, "is_a_success_indicator_of")
    success_indicator = StringProperty()
    composite_key = StringProperty(unique_index=True)  # Combination of goal_number and ATISubCommittee name
    removed = BooleanProperty(default=False)
    # Relationships to ATISubCommittee and YearStatus
    # Notes can be attached to goals
    notes = RelationshipTo("GenericNote", "has_note")
    date_added = DateProperty()

class StatusLevel(StructuredNode):

    status_level = StringProperty(unique_index=True)
    description_of_procedures = StringProperty()
    description_of_documentation = StringProperty()
    description_of_documentation_evidence = StringProperty()
    description_of_resources = StringProperty()
    status_value = StringProperty()
    ati_report_evidence_column = StringProperty()
    notes = RelationshipTo("GenericNote", "has_note")


class YearSuccessEvidence(StructuredNode):

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
    has_documents = RelationshipTo("Document", "has_document")
    has_webpages = RelationshipTo("Webpage", "has_webpage")
    has_emails = RelationshipTo("Email", "has_email")
    notes = RelationshipTo("GenericNote", "has_note")


class Accomplishment(StructuredNode):
    pass

class Plan(StructuredNode):

    name = StringProperty(unique_index=True)
    description = StringProperty()
    implementation_year = RelationshipTo("AcademicYear", "implementation_year")
    related_goal = RelationshipFrom("Goal", "to_implement_goal")
    notes = RelationshipTo("GenericNote", "has_note")

class AcademicYear(StructuredNode):

    name = StringProperty(unique_index=True)
    start_date = DateProperty()
    end_date = DateProperty()



class Document(StructuredNode):


    uuid = StringProperty(unique_index=True)
    name = StringProperty()
    file_path = StringProperty()
    is_administrative_review_documentation = StringProperty()
    is_milestone_and_measures_documentation = StringProperty()

    related_goals = RelationshipFrom("Goal", "HAS_DOCUMENT")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")

class Webpage(StructuredNode):

    url = StringProperty(unique_index=True)
    title = StringProperty()
    related_goals = RelationshipFrom("Goal", "HAS_WEBPAGE")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")


class Email(StructuredNode):

    uuid = StringProperty(unique_index=True)
    subject = StringProperty()
    content = StringProperty()
    related_goals = RelationshipFrom("Goal", "HAS_EMAIL")
    notes = RelationshipTo("GenericNote", "HAS_NOTE")

class GenericNote(StructuredNode):
    __primarykey__ = 'id'

    uuid = StringProperty()
    content = StringProperty()
    notates = RelationshipFrom(StructuredNode, "NOTATES")


class Vendor(StructuredNode):
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