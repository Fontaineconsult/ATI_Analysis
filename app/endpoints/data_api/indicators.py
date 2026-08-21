import json

from flask import request, jsonify, Response
from flask.views import MethodView
from datetime import datetime as dt  # Added import

from app.database.queries.evidence.delete import delete_year_success_evidence
from app.database.queries.indicators.create import create_success_indicator, add_goal, add_evidence_requirement
from app.database.queries.indicators.read import fetch_success_indicators_for_working_group
from app.database.queries.indicators.update import set_removed_status_for_success_indicator, set_override_implementation_requirement, update_success_indicator_examples, update_evidence_requirement
from app.database.queries.indicators.delete import delete_evidence_requirement

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

            # No rows is a legitimate empty selection (a year with no data) — return an empty
            # payload rather than IndexError-ing on indicators_data[0][0] (which became a 500).
            payload = (
                json.loads(indicators_data[0][0])
                if indicators_data and indicators_data[0] and indicators_data[0][0] is not None
                else []
            )
            return make_response(status='success', data=payload), 200


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
                # Optional companion-guide fields — forwarded only when present so older
                # callers keep working (create_success_indicator defaults them to []/{}).
                optional_keys = ["examples_of_evidence", "established_example", "managed_example", "optimizing_example", "introduced_in_year"]
                indicator_data.update({key: data[key] for key in optional_keys if key in data})
                if create_success_indicator(**indicator_data):
                    return make_response(status="Success Indicator created successfully."), 201

            if action == 'add_evidence_requirement':
                # One element of an indicator's companion bar. requirement + level are the
                # minimum; element/rubric_dimension/lead_in are optional because eight
                # indicators state their bar as unlabelled prose.
                required_keys = ["composite_key", "level", "requirement"]
                if not all(key in data for key in required_keys):
                    return make_response(status="error", error="Missing required fields: composite_key, level, requirement."), 400
                node = add_evidence_requirement(
                    composite_key=data["composite_key"],
                    level=data["level"],
                    requirement=data["requirement"],
                    element=data.get("element"),
                    rubric_dimension=data.get("rubric_dimension"),
                    lead_in=data.get("lead_in"),
                )
                return make_response(status="success", data=node.serialize()), 201

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
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
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

            elif action == 'update_success_indicator':
                # Edit the companion-guide fields (examples of evidence + level examples)
                # on an existing indicator. Only composite_key is required; the four
                # companion fields default to cleared when absent.
                if 'composite_key' not in data:
                    return make_response(status="error", error="Missing required field: composite_key."), 400

                if update_success_indicator_examples(
                    data['composite_key'],
                    examples_of_evidence=data.get('examples_of_evidence'),
                    established_example=data.get('established_example'),
                    managed_example=data.get('managed_example'),
                    optimizing_example=data.get('optimizing_example'),
                ):
                    return make_response(status="success", data=f"SuccessIndicator {data['composite_key']} updated successfully."), 200

            elif action == 'update_evidence_requirement':
                # Partial update — only the keys present are touched, so editing the text
                # of a requirement cannot silently clear its element.
                if 'unique_id' not in data:
                    return make_response(status="error", error="Missing required field: unique_id."), 400
                optional = {k: data[k] for k in ("element", "rubric_dimension", "lead_in") if k in data}
                node = update_evidence_requirement(
                    data['unique_id'], requirement=data.get('requirement'), **optional
                )
                return make_response(status="success", data=node.serialize()), 200

            else:
                return make_response(status="error", error=f"Unknown action: {action}"), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {str(e)}"), 500


    def delete(self):
        """
        Handle DELETE requests. Only evidence requirements are deletable here —
        indicators themselves are retired via the `removed` flag, never deleted.
        """
        try:
            data = request.get_json() or {}
            action = data.get('action')

            if action == 'delete_evidence_requirement':
                if 'unique_id' not in data:
                    return make_response(status="error", error="Missing required field: unique_id."), 400
                delete_evidence_requirement(data['unique_id'])
                return make_response(status="success", data={"deleted": data['unique_id']}), 200

            return make_response(status="error", error=f"Unknown action: {action}"), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {str(e)}"), 500


# Register the view with the Blueprint
indicators_view = IndicatorsAPI.as_view('indicators_api')
data_api_endpoints.add_url_rule('/indicators/<string:academic_year>', view_func=indicators_view, methods=['GET'])
data_api_endpoints.add_url_rule('/indicators', view_func=indicators_view, methods=['PUT', 'POST', 'DELETE'])