import json
from flask import request
from flask.views import MethodView
from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group
from app.database.queries.evidence.read import get_all_status_level_nodes
from app.database.queries.evidence.update import assign_status_to_yse
from . import data_api_endpoints
from ...database.class_factory import working_group_names_web_query, status_levels
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import (
    ApiError,
    NotFoundError,
    ValidationError,
    CrudError
)
from ...database.queries.evidence.create import create_year_success_evidence_node


class EvidenceAPI(MethodView):

    def get(self, working_group, academic_year):
        """
        Fetches evidence for a specific working group and academic year.
        """

        try:
            results = fetch_evidence_for_working_group(working_group_names_web_query[working_group], academic_year)
            return make_response(status="success", data=results), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except ApiError as e:
            return make_response(status="error", error="Failed to fetch evidence", data=str(e)), 500

    def post(self):
        """
        Handle different actions in the POST request.
        Example POST body:
        {
            "action": "create_year_success_evidence_node",
            "academic_year": "2023-2024",
            "success_indicator_composite_key": "1.2-ins",
            "status_level": "InProgress"
        }
        """
        data = request.get_json()

        # Extract the action from the request
        action = data.get('action')

        if not action:
            return make_response(status="error", error="Missing 'action' field in request."), 400

        # Handle different actions
        if action == "create_year_success_evidence_node":
            return self.handle_create_year_success_evidence(data)
        else:
            return make_response(status="error", error=f"Unknown action '{action}' in request."), 400

    def handle_create_year_success_evidence(self, data):
        """
        Handle the creation of a YearSuccessEvidence node.
        """
        academic_year = data.get('academic_year')
        success_indicator_composite_key = data.get('success_indicator_composite_key')
        status_level = data.get('status_level')

        # Validate required fields
        if not academic_year or not success_indicator_composite_key or not status_level:
            return make_response(status="error", error="Missing required fields: 'academic_year', 'success_indicator_composite_key', or 'status_level'"), 400

        try:
            # Call the function to create a new YearSuccessEvidence node
            create_year_success_evidence_node(academic_year, success_indicator_composite_key, status_level)
            return make_response(status="success", message="YearSuccessEvidence node created successfully"), 201
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500

# Separate MethodView for handling status levels API
class StatusLevelAPI(MethodView):

    def get(self):
        """
        Fetch all status levels from the database.
        """
        try:
            all_nodes = get_all_status_level_nodes()
            serialized = [node.serialize() for node in all_nodes]
            return make_response(status='success', data=serialized), 200
        except CrudError as e:
            raise ApiError(message=f"Error retrieving status levels: {e}")

    def put(self):
        """
        Updates the status level of a YearSuccessEvidence node.
        """
        data = request.get_json()
        yse = data.get('yse')
        status_level = data.get('status_level')

        if not yse or not status_level:
            raise ValidationError(
                message="Missing 'yse' or 'status_level' in the request."
            )

        return self.update_status_level(yse, status_level)

    def update_status_level(self, yse, status_level):
        if status_level not in status_levels:
            raise ValidationError(
                message=f"Invalid status level. Valid levels: {status_levels}"
            )

        try:
            assign_status_to_yse(yse, status_level)
            return make_response(status='success', data="Status level updated successfully"), 200
        except CrudError as e:
            raise ApiError(message=f"Error assigning status {status_level} to YSE {yse}: {e}")


# Register the view for the working group evidence functionality
evidence_view = EvidenceAPI.as_view('evidence_api')

# Register the URL rule for fetching evidence by working group and academic year
data_api_endpoints.add_url_rule(
    '/evidence/<string:working_group>/<string:academic_year>',
    view_func=evidence_view,
    methods=['GET', 'POST']
)

data_api_endpoints.add_url_rule(
    '/evidence',
    view_func=evidence_view,
    methods=['POST']
)


# Register the view for the status level functionality
status_level_view = StatusLevelAPI.as_view('status_level_api')

# Register the URL rule for fetching and updating status levels
data_api_endpoints.add_url_rule(
    '/evidence/status-levels', view_func=status_level_view, methods=['GET', 'PUT']
)
