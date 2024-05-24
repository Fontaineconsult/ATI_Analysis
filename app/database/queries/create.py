from app.database.neomodelschema import YearSuccessEvidence, Document


def add_document_to_year_success_evidence(year_identifier: str, document_name: str, file_path: str, uri_path: str) -> bool:
    """
    Adds a document to a year success evidence node
    :param year_identifier:
    :param document_name:
    :param file_path:
    :param uri_path:
    :return:
    """
    try:
        year_status = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
        new_document = Document(
            name=document_name,
            file_path=file_path,
            uri_path=uri_path

        )
        new_document.save()
        year_status.has_documents.connect(new_document)

        return True
    except Exception as e:
        return False