#
# DOCUMENTATION DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def delete_document_by_element_id(hash):
    try:
        d_node = Document.nodes.get(hash=hash)
        d_node.delete()
        return True
    except Document.DoesNotExist:
        raise NotFoundError(f"Document with hash '{hash}' not found.")
    except Exception as e:
        raise CrudError(f"Error deleting document: {str(e)}")



