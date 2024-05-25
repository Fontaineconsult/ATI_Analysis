from app.database.neomodelschema import *

def delete_document_by_element_id(hash):
    d_node = Document.nodes.get(hash=hash)
    d_node.delete()
    return True
