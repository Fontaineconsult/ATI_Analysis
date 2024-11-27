from flask import jsonify, request
from flask.views import MethodView

from . import data_api_endpoints
from app.database.queries.documentation.create import add_note, add_message, add_document, add_webpage, add_metric
from app.database.queries.documentation.update import update_note, update_message, update_metric, update_document, \
    update_webpage
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
        Handle POST requests to create documents or metrics based on the action.
        """
        try:
            data = request.get_json()

            action = data.get('action')
            if not action:
                return make_response({"status": "error", "error": "The 'action' field is required."}), 400

            # Dynamically call the appropriate function based on the action
            if action == 'add_note':
                required_fields = ['note_dict']
                if not all(field in data for field in required_fields):
                    return make_response({"status": "error", "error": "Missing 'note_dict' field for note creation."}), 400

                # Optional fields
                year_success_evidence = data.get('year_success_evidence')
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')

                if not (year_success_evidence or (implementation_id and implementation_type)):
                    return make_response({"status": "error", "error": "Either 'year_success_evidence' or both 'implementation_id' and 'implementation_type' must be provided."}), 400

                if add_note(
                        note_dict=data['note_dict'],
                        year_success_evidence=year_success_evidence,
                        implementation_id=implementation_id,
                        implementation_type=implementation_type
                ):
                    return make_response({"status": "success", "message": "Note created successfully."}), 201

            elif action == 'add_message':
                required_fields = ['message_dict']
                if not all(field in data for field in required_fields):
                    return make_response({"status": "error", "error": "Missing 'message_dict' field for message creation."}), 400

                # Optional fields
                year_success_evidence = data.get('year_success_evidence')
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')

                if not (year_success_evidence or (implementation_id and implementation_type)):
                    return make_response({"status": "error", "error": "Either 'year_success_evidence' or both 'implementation_id' and 'implementation_type' must be provided."}), 400

                if add_message(
                        message_dict=data['message_dict'],
                        year_success_evidence=year_success_evidence,
                        implementation_id=implementation_id,
                        implementation_type=implementation_type
                ):
                    return make_response({"status": "success", "message": "Message created successfully."}), 201

            elif action == 'add_document':
                required_fields = ['document_dict']
                print(data)
                if not all(field in data for field in required_fields):
                    return make_response({"status": "error", "error": "Missing 'document_dict' field for document creation."}), 400

                document_dict = data['document_dict']

                # Optional fields
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')

                # Extract fields from document_dict
                name = document_dict.get('name')
                file_path = document_dict.get('file_path')
                uri_path = document_dict.get('uri_path')
                depreciated = document_dict.get('depreciated', False)
                depreciated_date = document_dict.get('depreciated_date')
                is_administrative_review_documentation = document_dict.get('is_administrative_review_documentation', False)
                is_milestone_and_measures_documentation = document_dict.get('is_milestone_and_measures_documentation', False)
                include_in_report = document_dict.get('include_in_report', True)
                created_by = data.get('created_by')

                # Now call add_document with the correct parameters
                if add_document(
                        name=name,
                        file_path=file_path,
                        uri_path=uri_path,
                        depreciated=depreciated,
                        depreciated_date=depreciated_date,
                        is_administrative_review_documentation=is_administrative_review_documentation,
                        is_milestone_and_measures_documentation=is_milestone_and_measures_documentation,

                        implementation_id=implementation_id,
                        implementation_type=implementation_type,

                ):
                    return make_response({"status": "success", "message": "Document created successfully."}), 201

            elif action == 'add_webpage':
                required_fields = ['webpage_dict']
                if not all(field in data for field in required_fields):
                    return make_response({"status": "error", "error": "Missing required fields for webpage creation."}), 400

                website_dict = data['webpage_dict']


                # Optional fields
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')
                created_by = website_dict.get('created_by')

                # Extract fields from website_dict
                url = website_dict.get('url')
                name = website_dict.get('name')
                no_longer_exists = website_dict.get('no_longer_exists', False)
                depreciated = website_dict.get('depreciated', False)
                depreciated_date = website_dict.get('depreciated_date')
                description = website_dict.get('description', '')
                include_in_report = website_dict.get('include_in_report', True)

                # Now call add_webpage with the correct parameters
                if add_webpage(
                        url=url,
                        name=name,
                        no_longer_exists=no_longer_exists,
                        depreciated=depreciated,
                        depreciated_date=depreciated_date,
                        description=description,
                        include_in_report=include_in_report,
                        implementation_id=implementation_id,
                        implementation_type=implementation_type,
                        created_by=created_by
                ):
                    return make_response(status="success", message="Webpage created successfully"), 201

            elif action == 'add_metric':
                required_fields = ['metric_dict']
                if not all(field in data for field in required_fields):
                    return make_response({"status": "error", "error": "Missing 'metric_dict' field for metric creation."}), 400

                # Optional fields
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')

                if not (implementation_id and implementation_type):
                    return make_response({"status": "error", "error": "Both 'implementation_id' and 'implementation_type' must be provided for metric assignment."}), 400

                if add_metric(
                        metric_dict=data['metric_dict'],
                        implementation_id=implementation_id,
                        implementation_type=implementation_type
                ):
                    return make_response({"status": "success", "message": "Metric created successfully."}), 201

            else:
                return make_response({"status": "error", "error": f"Unknown action: {action}"}), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=str(e)), 500


    def put(self, document_type):
        """
        Handle PUT requests to update documents based on the document type.
        """
        try:
            data = request.get_json()

            action = data.get('action')
            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400

            # Dynamically call the appropriate function based on the action
            if action == 'update_note':
                required_fields = ['year_success_evidence', 'note_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for note update."), 400

                note_dict = data['note_dict']
                if 'unique_id' not in note_dict:
                    return make_response(status="error", error="The 'unique_id' field is required in 'note_dict'."), 400

                if update_note(note_dict, data['year_success_evidence'], note_dict.get('created_by')):
                    return make_response(status="success", data="Note updated successfully."), 200
                else:
                    return make_response(status="error", error="Failed to update note."), 500

            elif action == 'update_message':
                required_fields = ['year_success_evidence', 'message_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for message update."), 400

                message_dict = data['message_dict']
                if 'unique_id' not in message_dict:
                    return make_response(status="error", error="The 'unique_id' field is required in 'message_dict'."), 400

                if update_message(message_dict, data['year_success_evidence'], message_dict.get('created_by')):
                    return make_response(status="success", data="Message updated successfully."), 200
                else:
                    return make_response(status="error", error="Failed to update message."), 500

            elif action == 'update_metric':
                required_fields = ['year_success_evidence', 'metric_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for metric update."), 400

                metric_dict = data['metric_dict']
                if 'unique_id' not in metric_dict:
                    return make_response(status="error", error="The 'unique_id' field is required in 'metric_dict'."), 400

                if update_metric(metric_dict, data['year_success_evidence'], metric_dict.get('created_by')):
                    return make_response(status="success", data="Metric updated successfully."), 200
                else:
                    return make_response(status="error", error="Failed to update metric."), 500

            elif action == 'update_document':
                required_fields = ['document_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for document update."), 400

                document_dict = data['document_dict']
                if 'unique_id' not in document_dict:
                    return make_response(status="error", error="The 'unique_id' field is required in 'document_dict'."), 400

                # Extract optional parameters
                year_success_evidence = data.get('year_success_evidence')
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')
                created_by = data.get('created_by')

                try:
                    if update_document(
                            document_dict=document_dict,
                            year_success_evidence=year_success_evidence,
                            implementation_id=implementation_id,
                            implementation_type=implementation_type,
                            # created_by=created_by #Todo add to schema
                    ):
                        return make_response(status="success",data="Document updated successfully."), 200
                    else:
                        return make_response(status="error", error="Failed to update document."), 500
                except ValidationError as e:
                    return make_response(status="error", error=str(e)), 400
                except NotFoundError as e:
                    return make_response(status="error", error=str(e)), 404
                except Exception as e:
                    print(f"Unexpected error: {e}")
                    return make_response(status="error", error="An unexpected error occurred."), 500


            elif action == 'update_webpage':
                required_fields = ['webpage_dict']
                if not all(field in data for field in required_fields):
                    return make_response(status="error", error="Missing required fields for webpage update."), 400

                webpage_dict = data['webpage_dict']
                if 'unique_id' not in webpage_dict:
                    return make_response(status="error", error="The 'unique_id' field is required in 'webpage_dict'"), 400

                # Extract optional parameters
                year_success_evidence = data.get('year_success_evidence')
                implementation_id = data.get('implementation_id')
                implementation_type = data.get('implementation_type')


                try:
                    if update_webpage(
                            webpage_dict=webpage_dict,
                            year_success_evidence=year_success_evidence,
                            implementation_id=implementation_id,
                            implementation_type=implementation_type,
                    ):
                        return make_response(status="success", message="Webpage updated successfully."), 200
                    else:
                        return make_response(status="error", error="Failed to update webpage."), 500
                except ValidationError as e:
                    return make_response(status="error", error=str(e)), 400
                except NotFoundError as e:
                    return make_response(status="error", error=str(e)), 404
                except Exception as e:
                    print(f"Error during webpage update: {e}")
                    return make_response(status="error", error="An unexpected error occurred"), 500


        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500


    def delete(self):
        """
        Handles DELETE requests to delete documents based on the document type.
        """
        return make_response(status="error", error="Not Implemented"), 405


# Register the view for different document types
documents_view = DocumentsAPI.as_view('documents_api')
data_api_endpoints.add_url_rule('/documents/<string:document_type>', view_func=documents_view, methods=['GET', 'PUT', 'POST'])
data_api_endpoints.add_url_rule('/documents', view_func=documents_view, methods=['POST', 'PUT'])
