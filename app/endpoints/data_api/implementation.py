from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt

from . import data_api_endpoints
from ...database.queries.implementation.delete import unassign_person_as_implementor
from ...database.queries.implementation.update import update_plan, assign_person_as_implementor
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import ApiError, ValidationError, CrudError, NotFoundError

class ImplementationAPI(MethodView):
    def get(self):
        pass

    def post(self):
        pass

    def put(self):
        """
        Handle PUT requests for different actions based on the "action" key in the payload.

        Example payloads:

        For assigning a person as implementor:
        {
            "action": "assign_person_as_implementor",
            "employee_name": "John Doe",
            "year_identifier": "2023-2024-1.2-web"
        }

        For unassigning a person as implementor:
        {
            "action": "unassign_person_as_implementor",
            "employee_name": "John Doe",
            "year_identifier": "2023-2024-1.2-web"
        }
        """
        try:
            data = request.get_json()
            action = data.get('action')
            if not action:
                return make_response(status="error", error="Missing 'action' field in request."), 400

            if action == "assign_person_as_implementor":
                return self.handle_assign_person_as_implementor(data)
            elif action == "unassign_person_as_implementor":
                return self.handle_unassign_person_as_implementor(data)
            else:
                return make_response(status="error", error=f"Unknown action '{action}' in request."), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error="Failed to process request"), 500

    def delete(self):
        pass

    def handle_assign_person_as_implementor(self, data):
        if 'unique_id' not in data or 'year_success_evidence' not in data:
            raise ValidationError("Missing required fields: 'unique_id' or 'year_success_evidence'")

        assign_person_as_implementor(data['unique_id'], data['year_success_evidence'])
        return make_response(status="success", message="Person assigned as implementor successfully"), 200

    def handle_unassign_person_as_implementor(self, data):
        """
        Handle the unassign_person_as_implementor action.
        """
        if 'unique_id' not in data or 'year_success_evidence' not in data:
            raise ValidationError("Missing required fields: 'unique_id' or 'year_success_evidence'")

        unassign_person_as_implementor(data['unique_id'], data['year_success_evidence'])
        return make_response(status="success", message="Person unassigned as implementor successfully"), 200


import json
from flask import request
from flask.views import MethodView
from app.database.queries.implementation.create import add_plan
from app.endpoints.data_api.util.response import make_response


class ImplementationPlanAPI(MethodView):

    def post(self):
        """
        Handle POST requests to create a new implementation plan.
        The expected payload should be in the following format:
        {
            "name": "Plan Name",
            "description": "Plan description",
            "academic_year_name": "2023-2024",
            "is_key_plan": true,
            "is_campus_plan": false,
            "plan_status": "In Progress",
            "abandoned": false,
            "abandoned_notes": "Optional notes",
            "completed_year_name": "Optional completed year",
            "furthered_goal_number": 1,
            "furthered_working_group": "Working Group Name",
            "furthered_yse_identifier": "2023-2024-1.2-web"
        }
        """
        try:
            # Extract JSON data from the request
            data = request.get_json()

            # Ensure required fields are present
            required_fields = ['name', 'description', 'academic_year_name']
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"Missing required field: '{field}'")

            # Call the add_plan function with the received data
            add_plan(data)

            # Return a success response
            return make_response(status="success", message="Plan added successfully"), 201

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error="Failed to add plan"), 500

    def put(self):
        """
        Handle PUT requests for different actions based on the "action" key in the payload.

        Example payloads:

        For updating a plan:
        {
            "action": "update_plan",
            "unique_id": "UUID of the plan",
            "name": "Updated Plan Name",
            "description": "Updated plan description",
            ...
        }
        """
        try:
            # Extract JSON data from the request
            data = request.get_json()

            # Retrieve action from data
            action = data.get('action')
            if not action:
                return make_response(status="error", error="Missing 'action' field in request."), 400

            # Handle different actions
            if action == "update_plan":
                return self.handle_update_plan(data)
            else:
                return make_response(status="error", error=f"Unknown action '{action}' in request."), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error="Failed to process request"), 500

    def handle_update_plan(self, data):
        """
        Handle the update_plan action.
        """
        # Ensure required field 'unique_id' is present
        if 'unique_id' not in data:
            raise ValidationError("Missing required field: 'unique_id'")

        # Call the update_plan function
        update_plan(data)

        return make_response(status="success", message="Plan updated successfully"), 200


class ImplementationAccomplishmentAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass


# Register the views
implementations_view = ImplementationAPI.as_view('implementations_view')
plans_view = ImplementationPlanAPI.as_view('plans_view')
accomplishments_view = ImplementationAccomplishmentAPI.as_view('accomplishments_view')
data_api_endpoints.add_url_rule('/implementations', view_func=implementations_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
data_api_endpoints.add_url_rule('/implementations/plans', view_func=plans_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
data_api_endpoints.add_url_rule('/implementations/accomplishments', view_func=accomplishments_view, methods=['GET', 'POST', 'PUT', 'DELETE'])