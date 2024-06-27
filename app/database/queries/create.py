from app.database.graph_schema import *
import uuid



def add_person(name: str,
               email: str,
               employee_id: str,
               title: str,
               ) -> bool:
    """
    Adds a person node to the graph
    :param name:
    :param email:
    :param phone_number:
    :param title:
    :return:
    """
    try:
        new_person = Person(
            name=name,
            email=email,
            employee_id=employee_id,
            title=title
        )
        new_person.save()
        print("added person")
        return True
    except Exception as e:
        print(e)
        return False

def add_document_to_year_success_evidence(year_identifier: str,
                                          document_name: str,
                                          file_path: str,
                                          uri_path: str,
                                          document_hash: str = None,
                                          ) -> bool:
    """
    Adds a document to a year success evidence node
    :param year_identifier:
    :param document_name:
    :param file_path:
    :param uri_path:
    :return:
    """
    if not document_hash:
        document_hash = str(uuid.uuid4())

    try:
        year_status = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
        new_document = Document(
            hash=document_hash,
            name=document_name,
            file_path=file_path,
            uri_path=uri_path

        )
        new_document.save()
        year_status.has_documents.connect(new_document)

        return True
    except Exception as e:
        return False