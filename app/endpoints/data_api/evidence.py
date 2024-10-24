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



class EvidenceAPI(MethodView):

    def get(self, working_group=None, academic_year=None):
        """
        Handles GET requests for both fetching YSE by working group and academic year,
        and for fetching all status levels.
        """
        if working_group and academic_year:
            # Handle fetching YSE by working group and academic year
            return self.get_all_yse_by_working_group(working_group, academic_year)
        else:
            # Handle fetching all status levels
            return self.get_all_status_levels()

    def get_all_yse_by_working_group(self, working_group, academic_year):
        """
        Fetches evidence for a specific working group and academic year.
        """
        if working_group not in working_group_names_web_query:
            raise ValidationError(
                message="Invalid working group: one of web, instructional-materials, procurement"
            )

        try:
            results = fetch_evidence_for_working_group(
                working_group_names_web_query[working_group],
                academic_year
            )
        except Exception as e:
            raise ApiError(
                message="Failed to fetch evidence for working group.",
                original_exception=e
            )

        if not results:
            raise NotFoundError(
                message="No data found for the specified working group and academic year."
            )

        return make_response(
            status="success",
            data=json.loads(results[0][0])
        ), 200

    def get_all_status_levels(self):
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
        Handles PUT requests to update the status level of a YearSuccessEvidence node.
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
        """
        Update the status level of a YearSuccessEvidence node.
        """
        if status_level not in status_levels:
            raise ValidationError(
                message=f"Invalid status level. Valid levels: {status_levels}"
            )

        try:
            assign_status_to_yse(yse, status_level)
            return make_response(status='success', data="Status level updated successfully"), 200
        except CrudError as e:
            raise ApiError(message=f"Error assigning status {status_level} to YSE {yse}: {e}")

# Register the view for the evidence and status levels functionality
evidence_view = EvidenceAPI.as_view('evidence_api')

# Register the URL rule for fetching evidence by working group and academic year
data_api_endpoints.add_url_rule(
    '/evidence/<string:working_group>/<string:academic_year>',
    view_func=evidence_view,
    methods=['GET']
)

# Register the URL rule for fetching and updating status levels
data_api_endpoints.add_url_rule(
    '/evidence/status-levels', view_func=evidence_view, methods=['GET', 'PUT']
)
