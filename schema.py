from py2neo.ogm import GraphObject, Property, RelatedTo, RelatedFrom, Graph

class Webpage(GraphObject):
    __primarykey__ = 'url'

    url = Property()
    references = RelatedTo("Webpage")


class Person(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    works_for = RelatedTo("Department")




class Stakeholder(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    industry = Property()

    goals = RelatedTo("Goal")
    status = RelatedTo("Status")




class Department(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    location = Property()

    employs = RelatedFrom(Person, "EMPLOYS")


class Goal(GraphObject):
    __primarykey__ = 'name'

    goal_number = Property()
    success_indicator = Property()
    status = Property()






class Document(GraphObject):
    __primarykey__ = 'name'

    name = Property()
    location = Property()



def get_connection():
    return Graph("neo4j://localhost:7687", auth=("neo4j", "testtest"))

