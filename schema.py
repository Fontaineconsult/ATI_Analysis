from py2neo.ogm import GraphObject, Property, RelatedTo, RelatedFrom, Graph

class Department(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    location = Property()

    employs = RelatedFrom("Person", "employs")


class Person(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    title = Property()

    works_for = RelatedTo("Department", "works_for")
    has_ati_role = RelatedTo("ATIRole", "has_ati_role")


class ATIRoll(GraphObject):
    __primarykey__ = 'name'

    # expand this into other general roles that support in different ways

    name = Property()
    description = Property()
    participates_in = RelatedTo("ATISubCommittee", "participates_in")
    job_description_with_ati_responsibilities = RelatedTo("Document", "ATI_JOB_DESCRIPTION")


class ATISubCommittee(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    description = Property()

    # Relationship to Goals
    goals = RelatedFrom("Goal", "PART_OF_ATI_SUBCOMMITTEE")



class Goal(GraphObject):
    __primarykey__ = 'composite_key'

    goal_number = Property()
    name = Property()
    success_indicator = Property()
    composite_key = Property()  # Combination of goal_number and ATISubCommittee name

    # Relationships to ATISubCommittee and YearStatus
    part_of_atisubcommittee = RelatedTo("ATISubCommittee", "PART_OF_ATI_SUBCOMMITTEE")

    # Notes can be attached to goals
    notes = RelatedTo("GenericNote", "HAS_NOTE")


class StatusLevel(GraphObject):
    __primarykey__ = 'status_level'

    status_level = Property()
    description_of_procedures = Property()
    description_of_documentation = Property()
    description_of_documentation_evidence = Property()
    description_of_resources = Property()
    status_value = Property()
    ati_report_evidence_column = Property()
    notes = RelatedTo("GenericNote", "HAS_NOTE")



class YearStatus(GraphObject):
    __primarykey__ = 'id'

    id = Property()  # A unique identifier combining Year and StatusLevel
    year = RelatedTo("Year", "status_year")
    status_level = RelatedTo("StatusLevel")
    related_goal = RelatedFrom("Goal", "goal_status")

    # New properties for tracking status level details
    documentation_status = Property()
    resources_status = Property()
    implementation_plan_status = Property()


    responsibility_for = RelatedFrom("ATIRoll", "RESPONSIBILITY_FOR")

    # Relationships to different types of evidence, now within YearStatus
    has_documents = RelatedTo("Document", "HAS_DOCUMENT")
    has_webpages = RelatedTo("Webpage", "HAS_WEBPAGE")
    has_emails = RelatedTo("Email", "HAS_EMAIL")
    notes = RelatedTo("GenericNote", "HAS_NOTE")


class Plan(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    description = Property()
    implementation_year = RelatedTo("Year", "implementation_year")
    related_goal = RelatedFrom("Goal", "to_implement_goal")
    notes = RelatedTo("GenericNote", "HAS_NOTE")

class Year(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    goals = RelatedFrom("Goal", "STATUS_PER_YEAR")


class Document(GraphObject):
    __primarykey__ = 'id'

    id = Property()
    name = Property()
    file_path = Property()
    is_administrative_review_documentation = Property()
    is_milestone_and_measures_documentation = Property()

    related_goals = RelatedFrom("Goal", "HAS_DOCUMENT")
    notes = RelatedTo("GenericNote", "HAS_NOTE")


class Webpage(GraphObject):
    __primarykey__ = 'url'

    url = Property()
    title = Property()
    related_goals = RelatedFrom("Goal", "HAS_WEBPAGE")
    notes = RelatedTo("GenericNote", "HAS_NOTE")


class Email(GraphObject):
    __primarykey__ = 'id'

    id = Property()
    subject = Property()
    content = Property()
    related_goals = RelatedFrom("Goal", "HAS_EMAIL")
    notes = RelatedTo("GenericNote", "HAS_NOTE")


class GenericNote(GraphObject):
    __primarykey__ = 'id'

    id = Property()
    content = Property()
    notates = RelatedFrom(GraphObject, "NOTATES")



class Vendor(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    industry = Property()

    contracted_by = RelatedFrom("Department", "works_with")
    works_with = RelatedTo("Stakeholder", "works_with")



def get_connection():
    return Graph("neo4j://localhost:7687", auth=("neo4j", "testtest"))

