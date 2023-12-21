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

    # Relationships to ATISubCommittee and different types of evidence
    part_of_atisubcommittee = RelatedTo("ATISubCommittee", "PART_OF_ATI_SUBCOMMITTEE")
    has_documents = RelatedTo("Document", "HAS_DOCUMENT")
    has_webpages = RelatedTo("Webpage", "HAS_WEBPAGE")
    has_emails = RelatedTo("Email", "HAS_EMAIL")

    # Relationship to StatusLevel for each Year
    status_per_year = RelatedTo("YearStatus", "STATUS_PER_YEAR")


class StatusLevel(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    description_of_procedures = Property()
    description_of_documentation = Property()
    description_of_documentation_evidence = Property()
    description_of_resources = Property()
    status_value = Property()
    ati_report_evidence_column = Property()


class Year(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    goals = RelatedFrom("Goal", "STATUS_PER_YEAR")


class YearStatus(GraphObject):
    __primarykey__ = 'id'

    id = Property()  # A unique identifier combining Year and StatusLevel
    year = RelatedTo("Year")
    status_level = RelatedTo("StatusLevel")
    goals = RelatedFrom("Goal", "STATUS_PER_YEAR")


class Document(GraphObject):
    __primarykey__ = 'id'

    id = Property()
    name = Property()
    file_path = Property()
    related_goals = RelatedFrom("Goal", "HAS_DOCUMENT")


class Webpage(GraphObject):
    __primarykey__ = 'url'

    url = Property()
    title = Property()
    related_goals = RelatedFrom("Goal", "HAS_WEBPAGE")


class Email(GraphObject):
    __primarykey__ = 'id'

    id = Property()
    subject = Property()
    content = Property()
    related_goals = RelatedFrom("Goal", "HAS_EMAIL")



class Vendor(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    industry = Property()

    contracted_by = RelatedFrom("Department", "works_with")
    works_with = RelatedTo("Stakeholder", "works_with")



def get_connection():
    return Graph("neo4j://localhost:7687", auth=("neo4j", "testtest"))

