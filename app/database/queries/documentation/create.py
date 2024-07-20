#
# DOCUMENTATION CREATE QUERIES
#
from app.database.graph_schema import *
from app.database.tools.support_functions import get_file_hash


def add_document(name, file_path=None, uri_path=None, is_administrative_review_documentation=False, is_milestone_and_measures_documentation=False) -> bool:
    """
    Adds a document node to the graph.

    :param hash: Unique hash of the document.
    :param name: Name of the document.
    :param file_path: File path of the document.
    :param uri_path: URI path of the document.
    :param is_administrative_review_documentation: Indicates if it's administrative review documentation.
    :param is_milestone_and_measures_documentation: Indicates if it's milestone and measures documentation.
    :return: True if the document node is added successfully, False otherwise.
    """
    if file_path is None and uri_path is None:
        raise ValueError("Either file path or URI path must be provided.")


    hash = get_file_hash(file_path)

    existing_document = Document.nodes.get_or_none(hash=hash)
    if existing_document:
        print("A document with the same hash already exists.")
        return False

    try:
        new_document = Document(
            hash=hash,
            name=name,
            file_path=file_path,
            uri_path=uri_path,
            is_administrative_review_documentation=is_administrative_review_documentation,
            is_milestone_and_measures_documentation=is_milestone_and_measures_documentation
        )
        new_document.save()
        print("Document added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add document: {e}")
        return False












# def add_document_to_year_success_evidence(year_identifier: str,
#                                           document_name: str,
#                                           file_path: str,
#                                           uri_path: str,
#                                           document_hash: str = None,
#                                           ) -> bool:
#     """
#     Adds a document to a year success evidence node
#     :param year_identifier:
#     :param document_name:
#     :param file_path:
#     :param uri_path:
#     :return:
#     """
#     if not document_hash:
#         document_hash = str(uuid.uuid4())
#
#     try:
#         year_status = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
#         new_document = Document(
#             hash=document_hash,
#             name=document_name,
#             file_path=file_path,
#             uri_path=uri_path
#
#         )
#         new_document.save()
#         year_status.has_documents.connect(new_document)
#
#         return True
#     except Exception as e:
#         return False