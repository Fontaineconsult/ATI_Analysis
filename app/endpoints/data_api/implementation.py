from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api_endpoints
from ...database.queries.implementation.update import update_plan


class ImplementationAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass


import json
from flask import request
from flask.views import MethodView
from app.database.queries.implementation.create import add_plan
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import ApiError, ValidationError, CrudError, NotFoundError


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
        Handle PUT requests to update an existing implementation plan.
        The expected payload should be in the following format:
        {
            "unique_id": "UUID of the plan",
            "name": "Updated Plan Name",
            "description": "Updated plan description",
            "academic_year_name": "2023-2024",
            "is_key_plan": true,
            "is_campus_plan": false,
            "plan_status": "Completed",
            "abandoned": false,
            "abandoned_notes": "Optional notes",
            "completed_year_name": "2023-2024",
            "furthered_goal_number": 1,
            "furthered_working_group": "Working Group Name",
            "furthered_yse_identifier": "2023-2024-1.2-web"
        }
        """
        try:
            # Extract JSON data from the request
            data = request.get_json()

            # Ensure required fields are present
            if 'unique_id' not in data:
                raise ValidationError("Missing required field: 'unique_id'")

            # Call the update_plan function with the received data
            update_plan(data)

            # Return a success response
            return make_response(status="success", message="Plan updated successfully"), 200

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error="Failed to update plan"), 500



class ImplementationAccomplishmentAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

implementations_view = ImplementationAPI.as_view('implementations_view')
plans_view = ImplementationPlanAPI.as_view('plans_view')
accomplishments_view = ImplementationAccomplishmentAPI.as_view('accomplishments_view')
data_api_endpoints.add_url_rule('/implementations', view_func=implementations_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
data_api_endpoints.add_url_rule('/implementations/plans', view_func=plans_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
data_api_endpoints.add_url_rule('/implementations/accomplishments', view_func=accomplishments_view, methods=['GET', 'POST', 'PUT', 'DELETE'])