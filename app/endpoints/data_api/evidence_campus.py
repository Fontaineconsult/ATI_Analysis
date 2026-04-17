import json
from flask import request
from flask.views import MethodView
from app.database.queries.compound_queries.get_all_by_working_group_campus import fetch_evidence_for_working_group
from app.database.queries.evidence.read_campus import get_all_status_level_nodes, get_connected_status_levels, \
    get_evidence_trends
from app.database.queries.evidence.update import (assign_status_to_yse,
                                                   assign_approver_to_yse,
                                                   update_admin_reviewer_description,
                                                   add_admin_reviewer_note)
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
        Accepts optional ?campus=sfsu query param.
        """
        # Validate the working group
        if working_group not in working_group_names_web_query:
            return make_response(status="error", error=f"Invalid working group '{working_group}', one of {working_group_names_web_query.keys()}"), 400

        campus_abbreviation = request.args.get('campus', None)

        try:
            results = fetch_evidence_for_working_group(
                working_group_names_web_query[working_group],
                academic_year,
                campus_abbreviation=campus_abbreviation
            )
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
        """
        data = request.get_json()

        # Extract the action from the request
        action = data.get('action')

        if not action:
            return make_response(status="error", error="Missing 'action' field in request."), 400

        # Handle different actions
        if action == "create_year_success_evidence_node":
            return self.handle_create_year_success_evidence(data)
        elif action == "add_admin_reviewer_note":
            return self.handle_add_admin_reviewer_note(data)
        else:
            return make_response(status="error", error=f"Unknown action '{action}' in request."), 400

    def put(self):
        """
        Handle different actions in the PUT request.
        """
        data = request.get_json()

        # Extract the action from the request
        action = data.get('action')

        if not action:
            return make_response(status="error", error="Missing 'action' field in request."), 400

        # Handle the assign_approver action
        if action == "assign_approver":
            return self.handle_assign_approver(data)
        elif action == "update_admin_reviewer_description":
            return self.handle_update_admin_reviewer_description(data)
        elif action == "unassign_implementation":
            return self.handle_unassign_implementation(data)
        else:
            return make_response(status="error", error=f"Unknown action '{action}' in request."), 400

    def handle_assign_approver(self, data):
        """
        Assign an approver to a YearSuccessEvidence node.
        """
        yse = data.get('year_success_evidence')
        employee_id = data.get('employee_id')

        if not yse or not employee_id:
            return make_response(status="error", error="Missing 'year_success_evidence' or 'employee_id' in request."), 400

        try:
            assign_approver_to_yse(yse, employee_id)
            return make_response(status="success", data="Approver assigned successfully."), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500

    def handle_create_year_success_evidence(self, data):
        """
        Handle the creation of a YearSuccessEvidence node.
        Now requires campus_abbreviation.
        """
        academic_year = data.get('academic_year')
        success_indicator_composite_key = data.get('success_indicator_composite_key')
        status_level = data.get('status_level')
        campus_abbreviation = data.get('campus_abbreviation')

        # Validate required fields
        if not academic_year or not success_indicator_composite_key or not status_level or not campus_abbreviation:
            return make_response(status="error", error="Missing required fields: 'academic_year', 'success_indicator_composite_key', 'status_level', or 'campus_abbreviation'"), 400

        try:
            create_year_success_evidence_node(academic_year, success_indicator_composite_key, status_level, campus_abbreviation)
            return make_response(status="success", message="YearSuccessEvidence node created successfully"), 201
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500

    def handle_update_admin_reviewer_description(self, data):
        """
        Update the admin_reviewer_description field for a YSE.
        """
        yse = data.get('year_success_evidence')
        description = data.get('description')

        if not yse or description is None:
            return make_response(status="error", error="Missing 'year_success_evidence' or 'description' in request."), 400

        try:
            update_admin_reviewer_description(yse, description)
            return make_response(status="success", data="Admin reviewer description updated successfully."), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500

    def handle_add_admin_reviewer_note(self, data):
        """
        Add a new admin reviewer note to a YSE.
        """
        yse = data.get('year_success_evidence')
        note_content = data.get('note_content')
        created_by_employee_id = data.get('created_by_employee_id')

        if not yse or not note_content or not created_by_employee_id:
            return make_response(status="error", error="Missing required fields: 'year_success_evidence', 'note_content', or 'created_by_employee_id'"), 400

        try:
            note_data = add_admin_reviewer_note(yse, note_content, created_by_employee_id)
            return make_response(status="success", data=note_data), 201
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500

    def handle_unassign_implementation(self, data):
        """
        Unassign an implementation from a YearSuccessEvidence node.
        """
        from app.database.queries.evidence.delete import unassign_implementation_from_yse

        year_success_identifier = data.get('year_success_identifier')
        implementation_type = data.get('implementation_type')
        implementation_title = data.get('implementation_title')

        if not all([year_success_identifier, implementation_type, implementation_title]):
            return make_response(status="error", error="Missing required fields: 'year_success_identifier', 'implementation_type', or 'implementation_title'"), 400

        try:
            unassign_implementation_from_yse(year_success_identifier, implementation_type, implementation_title)
            return make_response(status="success", message="Implementation unassigned successfully"), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500

# Separate MethodView for handling status levels API
class StatusLevelAPI(MethodView):

    def get(self):
        """
        Fetch all status levels, or fetch all sub-nodes of a given category.
        Use ?category=procedure_descriptions to fetch all nodes of that type.
        """
        category = request.args.get('category', None)

        if category:
            from app.database.queries.evidence.create import get_all_sub_nodes
            try:
                result = get_all_sub_nodes(category)
                return make_response(status='success', data=result), 200
            except CrudError as e:
                return make_response(status='error', error=str(e)), 400
            except Exception as e:
                raise ApiError(message=f"An unexpected error occurred: {e}")

        try:
            status_levels_data = get_connected_status_levels()
            return make_response(status='success', data=status_levels_data), 200
        except CrudError as e:
            raise ApiError(message=f"Error retrieving connected status levels: {e}")
        except Exception as e:
            raise ApiError(message=f"An unexpected error occurred: {e}")

    def post(self):
        """
        Handle POST actions for status levels.
        """
        data = request.get_json()
        action = data.get('action')

        if action == "create_status_level":
            from app.database.queries.evidence.create import create_status_level
            try:
                result = create_status_level(data)
                return make_response(status='success', data=result), 201
            except CrudError as e:
                return make_response(status='error', error=str(e)), 400
            except Exception as e:
                raise ApiError(message=f"An unexpected error occurred: {e}")

        elif action == "add_sub_node":
            from app.database.queries.evidence.create import add_status_level_sub_node
            status_level_unique_id = data.get('status_level_unique_id')
            category = data.get('category')
            text = data.get('text')

            if not all([status_level_unique_id, category, text]):
                return make_response(status="error", error="Missing required fields: 'status_level_unique_id', 'category', 'text'"), 400

            try:
                result = add_status_level_sub_node(status_level_unique_id, category, text)
                return make_response(status='success', data=result), 201
            except (CrudError, NotFoundError) as e:
                return make_response(status='error', error=str(e)), 400
            except Exception as e:
                raise ApiError(message=f"An unexpected error occurred: {e}")

        elif action == "connect_sub_node":
            from app.database.queries.evidence.create import connect_sub_node_to_status_level
            status_level_unique_id = data.get('status_level_unique_id')
            category = data.get('category')
            sub_node_unique_id = data.get('sub_node_unique_id')

            if not all([status_level_unique_id, category, sub_node_unique_id]):
                return make_response(status="error", error="Missing required fields: 'status_level_unique_id', 'category', 'sub_node_unique_id'"), 400

            try:
                result = connect_sub_node_to_status_level(status_level_unique_id, category, sub_node_unique_id)
                return make_response(status='success', data=result), 201
            except (CrudError, NotFoundError) as e:
                return make_response(status='error', error=str(e)), 400
            except Exception as e:
                raise ApiError(message=f"An unexpected error occurred: {e}")

        else:
            return make_response(status="error", error=f"Unknown action '{action}'."), 400

    def put(self):
        """
        Handle PUT actions for status levels.
        """
        data = request.get_json()
        action = data.get('action')

        if not action:
            return make_response(status="error", error="Missing 'action' field in request."), 400

        if action == "update_status_level":
            yse = data.get('yse')
            status_level = data.get('status_level')

            if not yse or not status_level:
                raise ValidationError(
                    message="Missing 'yse' or 'status_level' in the request."
                )
            return self._update_yse_status(yse, status_level)

        elif action == "update_status_level_node":
            return self._update_status_level_node(data)

        elif action == "remove_sub_node":
            return self._remove_sub_node(data)

        else:
            return make_response(status="error", error=f"Unknown action '{action}'."), 400

    def _update_yse_status(self, yse, status_level):
        """
        Helper method to update the status level of the given YearSuccessEvidence node.
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

    def _update_status_level_node(self, data):
        """
        Update properties of a StatusLevel node.
        """
        from app.database.queries.evidence.update import update_status_level_node

        unique_id = data.get('unique_id')
        if not unique_id:
            return make_response(status="error", error="Missing 'unique_id' in request."), 400

        try:
            result = update_status_level_node(unique_id, data)
            return make_response(status='success', data=result), 200
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500

    def _remove_sub_node(self, data):
        """
        Disconnect a sub-node from a StatusLevel (node is preserved for other levels).
        """
        from app.database.queries.evidence.delete import disconnect_sub_node_from_status_level

        status_level_unique_id = data.get('status_level_unique_id')
        category = data.get('category')
        sub_node_unique_id = data.get('sub_node_unique_id')

        if not all([status_level_unique_id, category, sub_node_unique_id]):
            return make_response(status="error", error="Missing required fields: 'status_level_unique_id', 'category', 'sub_node_unique_id'"), 400

        try:
            disconnect_sub_node_from_status_level(status_level_unique_id, category, sub_node_unique_id)
            return make_response(status='success', data="Sub-node disconnected successfully"), 200
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500


class TrendsAPI(MethodView):

    def get(self):
        """
        Fetch evidence trends. Accepts optional ?campus=sfsu query param.
        """
        try:
            previous_year = request.args.get('previous_year')
            current_year = request.args.get('current_year')
            campus_abbreviation = request.args.get('campus', None)

            trends = get_evidence_trends(previous_year, current_year, campus_abbreviation=campus_abbreviation)

            return make_response(status='success', data=trends), 200
        except CrudError as e:
            raise ApiError(message=f"Error retrieving evidence trends: {e}")
        except Exception as e:
            raise ApiError(message=f"An unexpected error occurred: {e}")


# Register the view for the working group evidence functionality
evidence_view = EvidenceAPI.as_view('evidence_api')
trends_view = TrendsAPI.as_view('trends_api')

data_api_endpoints.add_url_rule(
    '/evidence/<string:working_group>/<string:academic_year>',
    view_func=evidence_view,
    methods=['GET', 'POST']
)

data_api_endpoints.add_url_rule(
    '/evidence',
    view_func=evidence_view,
    methods=['POST', 'PUT']
)

data_api_endpoints.add_url_rule(
    '/evidence/trends',
    view_func=trends_view,
    methods=['GET']
)

# Register the view for the status level functionality
status_level_view = StatusLevelAPI.as_view('status_level_api')

data_api_endpoints.add_url_rule(
    '/evidence/status-levels', view_func=status_level_view, methods=['GET', 'POST', 'PUT']
)
