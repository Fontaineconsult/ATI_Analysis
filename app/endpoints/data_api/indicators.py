# app/endpoints/data_api/api_endpoints.py

from flask import request, jsonify
from flask.views import MethodView
from datetime import datetime as dt  # Added import

from app.database.queries.evidence.delete import delete_year_success_evidence
from app.database.queries.indicators.create import create_success_indicator
from app.database.queries.indicators.read import fetch_success_indicators_for_working_group
from app.database.queries.indicators.update import set_removed_status_for_success_indicator

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError

from . import data_api

class IndicatorsAPI(MethodView):
    def get(self):
        """
        Handle GET requests to fetch success indicators for a specific academic year.
        """
        try:
            # Extract 'academic_year' from query parameters
            academic_year = request.args.get('academic_year')
            if not academic_year:
                return jsonify({'error': 'The "academic_year" query parameter is required.'}), 400

            # Fetch success indicators using the service function
            indicators_data = fetch_success_indicators_for_working_group(academic_year)
            return jsonify(indicators_data[0][0]), 200

        except NotFoundError as e:
            # Custom error when no data is found
            return jsonify({'error': str(e)}), 404

        except Exception as e:
            # General exception handler
            return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500

    def post(self):
        """
        Handle POST requests to create a new success indicator.
        """
        try:
            # Extract JSON data from the request body
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Invalid JSON payload.'}), 400

            # Extract required fields
            number = data.get('number')
            sub_committee = data.get('sub_committee')
            success_indicator_text = data.get('success_indicator_text')
            date_added = data.get('date_added')  # Optional
            removed = data.get('removed', False)  # Optional, defaults to False

            # Validate required fields
            if not all([number, sub_committee, success_indicator_text]):
                return jsonify({
                    'error': 'Missing required fields. "number", "sub_committee", and "success_indicator_text" are required.'
                }), 400

            # Convert 'date_added' to datetime if provided
            if date_added:
                try:
                    date_added = dt.fromisoformat(date_added)
                except ValueError:
                    return jsonify({'error': 'Invalid date format for "date_added". Use ISO format.'}), 400

            # Call the service function to create a success indicator
            create_success_indicator(
                number=number,
                sub_committee=sub_committee,
                success_indicator_text=success_indicator_text,
                date_added=date_added,
                removed=removed
            )

            return jsonify({'message': 'Success indicator created successfully.'}), 201

        except ValidationError as ve:
            # Handle validation errors
            return jsonify({'error': str(ve)}), 400

        except NotFoundError as ne:
            # Handle not found errors
            return jsonify({'error': str(ne)}), 404

        except CrudError as ce:
            # Handle CRUD operation errors
            return jsonify({'error': str(ce)}), 500

        except Exception as e:
            # Handle any other unexpected errors
            return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500

    def put(self):
        """
        Handle PUT requests to update the 'removed' status of a success indicator.
        """
        try:
            # Extract JSON data from the request body
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Invalid JSON payload.'}), 400

            composite_key = data.get('composite_key')
            removed = data.get('removed')

            # Validate required fields
            if composite_key is None or removed is None:
                return jsonify({
                    'error': 'Missing required fields. "composite_key" and "removed" are required.'
                }), 400

            # Call the service function to set removed status
            success = set_removed_status_for_success_indicator(composite_key=composite_key, removed=removed)

            if success:
                return jsonify({'message': 'Removed status updated successfully.'}), 200
            else:
                return jsonify({'error': 'Failed to update removed status.'}), 500

        except ValidationError as ve:
            return jsonify({'error': str(ve)}), 400

        except NotFoundError as ne:
            return jsonify({'error': str(ne)}), 404

        except CrudError as ce:
            return jsonify({'error': str(ce)}), 500

        except Exception as e:
            return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500

    def delete(self):
        """
        Handle DELETE requests to delete a YearSuccessEvidence node.
        """
        try:
            # Extract 'year_success_identifier' from query parameters or JSON body
            year_success_identifier = request.args.get('year_success_identifier')
            if not year_success_identifier:
                data = request.get_json()
                if not data:
                    return jsonify({'error': 'The "year_success_identifier" is required.'}), 400
                year_success_identifier = data.get('year_success_identifier')
                if not year_success_identifier:
                    return jsonify({'error': 'The "year_success_identifier" field is required.'}), 400

            # Call the service function to delete YearSuccessEvidence
            success = delete_year_success_evidence(year_success_identifier=year_success_identifier)

            if success:
                return jsonify({'message': f'YearSuccessEvidence "{year_success_identifier}" deleted successfully.'}), 200
            else:
                return jsonify({'error': 'Failed to delete YearSuccessEvidence.'}), 500

        except NotFoundError as ne:
            return jsonify({'error': str(ne)}), 404

        except CrudError as ce:
            return jsonify({'error': str(ce)}), 500

        except Exception as e:
            return jsonify({'error': 'An unexpected error occurred.', 'details': str(e)}), 500


# Register the view with the Blueprint
indicators_view = IndicatorsAPI.as_view('indicators_api')
data_api.add_url_rule('/indicators', view_func=indicators_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
