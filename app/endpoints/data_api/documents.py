from flask import jsonify, request
from flask.views import MethodView

from . import data_api_endpoints
from app.database.queries.documentation.create import add_note, add_message, add_document, add_webpage
from app.database.queries.documentation.read import get_all_notes, get_all_messages, get_all_metrics, get_all_documents, get_all_webpages
from app.endpoints.data_api.util.response import make_response
from .errors.custom_exceptions import NotFoundError, CrudError, ValidationError


class DocumentsAPI(MethodView):

    def get(self, document_type):
        """
        Handle GET requests to fetch documents based on document type (e.g., note, message, metric, document, webpage).
        """
        try:
            if not document_type:
                return make_response(status='error', error='The "document_type" parameter is required.'), 400

            # Fetch the appropriate documents based on the document_type
            if document_type == 'notes':
                documents = get_all_notes()
            elif document_type == 'messages':
                documents = get_all_messages()
            elif document_type == 'metrics':
                documents = get_all_metrics()
            elif document_type == 'documents':
                documents = get_all_documents()
            elif document_type == 'webpages':
                documents = get_all_webpages()
            else:
                return make_response(status='error', error=f'Unknown document_type: {document_type}'), 400

            # Serialize documents if they exist
            serialized_docs = [doc.serialize() for doc in documents]
            return make_response(status='success', data=serialized_docs), 200

        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500

    def post(self):
        """
        Handle POST requests to create documents based on document type.
        """
        try:
            data = request.get_json()

            action = data.get('action')
            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400

            # Dynamically call the appropriate function based on the action
            if action == 'add_note':
                required_fields = ['year_success_evidence', 'note_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for note creation."), 400
                if add_note(data['year_success_evidence'], data['note_dict']):
                    return make_response(status="success", data="Note created successfully."), 201

            elif action == 'add_message':
                required_fields = ['year_success_evidence', 'message_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for message creation."), 400
                if add_message(data['year_success_evidence'], data['message_dict']):
                    return make_response(status="success", data="Message created successfully."), 201

            elif action == 'add_document':
                required_fields = ['name']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for document creation."), 400
                if add_document(**data):
                    return make_response(status="success", data="Document created successfully."), 201

            elif action == 'add_webpage':
                required_fields = ['url', 'name', 'no_longer_exists', 'depreciated', 'depreciated_year', 'description']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for webpage creation."), 400
                if add_webpage(**data):
                    return make_response(status="success", data="Webpage created successfully."), 201

            else:
                return make_response(status="error", error=f'Unknown action: {action}'), 400

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500

    def put(self, document_type):
        """
        Handles PUT requests to update documents based on the document type.
        """
        return make_response(status="error", error="Not Implemented"), 405

    def delete(self, document_type):
        """
        Handles DELETE requests to delete documents based on the document type.
        """
        return make_response(status="error", error="Not Implemented"), 405


# Register the view for different document types
documents_view = DocumentsAPI.as_view('documents_api')
data_api_endpoints.add_url_rule('/documents/<string:document_type>', view_func=documents_view, methods=['GET'])
data_api_endpoints.add_url_rule('/documents', view_func=documents_view, methods=['POST', 'PUT'])
