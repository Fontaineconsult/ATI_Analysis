"""
HTTP endpoints for MeetingMinutes (a working-group meeting record raised under a WorkingGroupPlan).

URL surface (mounted at /ati/data-api/v1):
    GET    /meeting-minutes/plan/<wgp_identifier>
    GET    /meeting-minutes/working-group/<campus_abbrev>/<academic_year>/<working_group>
    GET    /meeting-minutes/item/<unique_id>
    POST   /meeting-minutes                          (action-dispatch: create_meeting_minutes)
    PUT    /meeting-minutes                          (action-dispatch: update / attach / detach / note)
    DELETE /meeting-minutes/<unique_id>

A record anchors to a WorkingGroupPlan, which encodes campus + academic year + working group.
The `content` is Markdown (rendered readably on the frontend).
"""
from flask import request
from flask.views import MethodView

from app.database.queries.meeting_minutes.create import create_meeting_minutes
from app.database.queries.meeting_minutes.read import (
    get_meeting_minutes,
    minutes_panel_for_plan,
    minutes_panel_for_working_group,
)
from app.database.queries.meeting_minutes.update import (
    update_meeting_minutes,
    attach_document,
    attach_webpage,
    detach_document,
    detach_webpage,
    add_minutes_note,
)
from app.database.queries.meeting_minutes.delete import delete_meeting_minutes
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


class MeetingMinutesAPI(MethodView):
    def get(self, wgp_identifier=None, campus_abbrev=None, academic_year=None,
            working_group=None, unique_id=None):
        try:
            if unique_id is not None:
                return make_response(status="success", data=get_meeting_minutes(unique_id)), 200
            if wgp_identifier is not None:
                return make_response(status="success", data=minutes_panel_for_plan(wgp_identifier)), 200
            if campus_abbrev and academic_year and working_group:
                return make_response(
                    status="success",
                    data=minutes_panel_for_working_group(campus_abbrev, academic_year, working_group),
                ), 200
            return make_response(status="error", error="Unsupported meeting-minutes route."), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            action = data.get("action")

            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400

            if action == "create_meeting_minutes":
                if not data.get("title"):
                    return make_response(status="error", error="Missing required field: 'title'"), 400
                m = create_meeting_minutes(
                    title=data["title"],
                    content=data.get("content"),
                    working_group_plan_identifier=data.get("working_group_plan_identifier"),
                    campus_abbrev=data.get("campus_abbrev"),
                    year_name=data.get("year_name"),
                    working_group=data.get("working_group"),
                    meeting_date=data.get("meeting_date"),
                    recorded_by_unique_id=data.get("recorded_by_unique_id"),
                )
                return make_response(status="success", data=m.serialize(), message="Meeting minutes created."), 201

            return make_response(status="error", error=f"Unknown action: {action}"), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def put(self):
        try:
            data = request.get_json() or {}
            action = data.get("action")

            if not action:
                return make_response(status="error", error="The 'action' field is required."), 400
            if "unique_id" not in data:
                return make_response(status="error", error="Missing required field: 'unique_id'"), 400
            unique_id = data["unique_id"]

            if action == "update_meeting_minutes":
                kwargs = {f: data[f] for f in ("title", "content", "meeting_date") if f in data}
                result = update_meeting_minutes(unique_id, **kwargs)
                return make_response(status="success", data=result, message="Meeting minutes updated."), 200

            if action == "attach_document":
                if not data.get("name"):
                    return make_response(status="error", error="Missing required field: 'name'"), 400
                result = attach_document(unique_id, data["name"], data.get("uri_path"), data.get("file_path"))
                return make_response(status="success", data=result, message="Document attached."), 201

            if action == "attach_webpage":
                if not data.get("url"):
                    return make_response(status="error", error="Missing required field: 'url'"), 400
                result = attach_webpage(unique_id, data.get("name"), data["url"])
                return make_response(status="success", data=result, message="Webpage attached."), 201

            if action == "detach_document":
                if not data.get("document_unique_id"):
                    return make_response(status="error", error="Missing required field: 'document_unique_id'"), 400
                result = detach_document(unique_id, data["document_unique_id"])
                return make_response(status="success", data=result, message="Document detached."), 200

            if action == "detach_webpage":
                if not data.get("webpage_unique_id"):
                    return make_response(status="error", error="Missing required field: 'webpage_unique_id'"), 400
                result = detach_webpage(unique_id, data["webpage_unique_id"])
                return make_response(status="success", data=result, message="Webpage detached."), 200

            if action == "add_minutes_note":
                if not data.get("content"):
                    return make_response(status="error", error="Missing required field: 'content'"), 400
                result = add_minutes_note(unique_id, data["content"], data.get("created_by_unique_id"))
                return make_response(status="success", data=result, message="Note added."), 201

            return make_response(status="error", error=f"Unknown action: {action}"), 400

        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def delete(self, unique_id):
        try:
            delete_meeting_minutes(unique_id)
            return make_response(status="success", message="Meeting minutes deleted."), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


meeting_minutes_view = MeetingMinutesAPI.as_view("meeting_minutes_api")

# Reads
data_api_endpoints.add_url_rule(
    "/meeting-minutes/plan/<string:wgp_identifier>", view_func=meeting_minutes_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/meeting-minutes/working-group/<string:campus_abbrev>/<string:academic_year>/<string:working_group>",
    view_func=meeting_minutes_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/meeting-minutes/item/<string:unique_id>", view_func=meeting_minutes_view, methods=["GET"],
)
# Writes
data_api_endpoints.add_url_rule("/meeting-minutes", view_func=meeting_minutes_view, methods=["POST", "PUT"])
data_api_endpoints.add_url_rule(
    "/meeting-minutes/<string:unique_id>", view_func=meeting_minutes_view, methods=["DELETE"],
)
