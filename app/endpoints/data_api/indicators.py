import json

from flask import request, jsonify, Response
from flask.views import MethodView
from datetime import datetime as dt  # Added import

from app.database.queries.evidence.delete import delete_year_success_evidence
from app.database.queries.indicators.create import create_success_indicator, add_goal
from app.database.queries.indicators.read import fetch_success_indicators_for_working_group
from app.database.queries.indicators.update import set_removed_status_for_success_indicator, set_override_implementation_requirement

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError

from . import data_api_endpoints
from .util.response import make_response


class IndicatorsAPI(MethodView):
    def get(self, academic_year):
        """
        Handle GET requests to fetch success indicators for a specific academic year from the URL.
        """
        try:
            if not academic_year:
                return make_response(status='error', error='The "academic_year" parameter is required.'), 400

            # Fetch success indicators using the service function
            indicators_data = fetch_success_indicators_for_working_group(academic_year)

            return make_response(status='success', data=json.loads(indicators_data[0][0])), 200


        except NotFoundError as e:
            # Custom error when no data is found
            return make_response(status='error', error=str(e)), 404

        except Exception as e:
            # General exception handler
            return make_response(status='error', error=str(e)), 500

    def post(self):
        """
        Handle POST requests to create a new success indicator.
        """
        try:
            data = request.get_json()
            action = data.get('action')

            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400

            # Dynamically call the function based on the action
            if action == 'create_success_indicator':

                required_keys = ["number", "goal_number", "sub_committee", "success_indicator_text", "date_added", "removed"]
                if not all(key in data for key in required_keys):
                    return make_response(status="error", error="Missing required fields"), 400
                indicator_data = {key: data.get(key) for key in required_keys}
                if create_success_indicator(**indicator_data):
                    return make_response(status="Success Indicator created successfully."), 201

            if action == 'add_goal':

                required_keys = ["goal", "goal_number", "name", "removed", "working_group"]
                if not all(key in data for key in required_keys):
                    return make_response(status="error", error="Missing required fields"), 400
                goal_data = {key: data.get(key) for key in required_keys}
                if add_goal(**goal_data):
                    return make_response(status="Goal created successfully."), 201

            else:
                return make_response(status="error", error=f"Unknown action: {action}"), 400

        except ValidationError as e:
            return make_response(status='error', error=str(e)), 400
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            return make_response(status='error', error=f"An unexpected error occurred: {str(e)}"), 500

    def put(self):
        """
        Handle PUT requests to update data based on the action parameter.
        """
        try:
            # Get the request data
            data = request.get_json()
            action = data.get('action')

            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400

            # Dynamically handle the update based on the action
            if action == 'update_removed_status':
                # Required fields for updating removed status
                required_keys = ['composite_key', 'removed']
                if not all(key in data for key in required_keys):
                    return make_response(status="error", error="Missing required fields for updating removed status."), 400

                # Call the function to update the removed status
                if set_removed_status_for_success_indicator(data['composite_key'], data['removed']):
                    return make_response(status="success", data=f"SuccessIndicator {data['composite_key']} updated successfully."), 200

            elif action == 'update_override_implementation_requirement':
                # Toggle whether this indicator is exempt from the implementation expectation
                required_keys = ['composite_key', 'override_implementation_requirement']
                if not all(key in data for key in required_keys):
                    return make_response(status="error", error="Missing required fields for updating implementation-requirement override."), 400

                if set_override_implementation_requirement(data['composite_key'], data['override_implementation_requirement']):
                    return make_response(status="success", data=f"SuccessIndicator {data['composite_key']} updated successfully."), 200

            else:
                return make_response(status="error", error=f"Unknown action: {action}"), 400

        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {str(e)}"), 500


    def delete(self):
        """
        Handle DELETE requests to delete a YearSuccessEvidence node.
        """
        return make_response(status="error", error="Not Implemented"), 405


# Register the view with the Blueprint
indicators_view = IndicatorsAPI.as_view('indicators_api')
data_api_endpoints.add_url_rule('/indicators/<string:academic_year>', view_func=indicators_view, methods=['GET'])
data_api_endpoints.add_url_rule('/indicators', view_func=indicators_view, methods=['PUT', 'POST'])