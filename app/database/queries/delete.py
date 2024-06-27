from app.database.graph_schema import *



def delete_person(employee_id):
    p_node = Person.nodes.get(employee_id=employee_id)
    p_node.delete()
    return True


def delete_document_by_element_id(hash):
    d_node = Document.nodes.get(hash=hash)
    d_node.delete()
    return True
