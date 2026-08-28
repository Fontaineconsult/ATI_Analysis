"""
HTTP endpoints for InterviewGuide (a stakeholder-interview prep document — the
upstream twin of MeetingMinutes: the plan for a conversation, where minutes are
the record of one).

URL surface (mounted at /ati/data-api/v1):
    GET    /interview-guides/item/<unique_id>
    GET    /interview-guides/campus/<campus_abbrev>/<academic_year>
    GET    /interview-guides/community/<community_unique_id>
    POST   /interview-guides                     (action-dispatch: create_interview_guide)
    PUT    /interview-guides                     (action-dispatch: update / set_* / resulted_in)
    DELETE /interview-guides/<unique_id>

Anchored to Campus + AcademicYear directly (guides span working groups); the
working-group footprint in payloads derives from the targets' YSEs.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.interview_guides.create import create_interview_guide
from app.database.queries.interview_guides.read import (
    get_interview_guide,
    guides_for_community,
    guides_panel_for_campus_year,
)
from app.database.queries.interview_guides.update import (
    set_guide_communities,
    set_guide_people,
    set_guide_resulted_in,
    set_guide_targets,
    update_interview_guide,
)
from app.database.queries.interview_guides.delete import delete_interview_guide
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


class InterviewGuidesAPI(MethodView):
    def get(self, unique_id=None, campus_abbrev=None, academic_year=None, community_unique_id=None):
        try:
            if unique_id is not None:
                return make_response(status="success", data=get_interview_guide(unique_id)), 200
            if campus_abbrev and academic_year:
                return make_response(
                    status="success",
                    data=guides_panel_for_campus_year(campus_abbrev, academic_year),
                ), 200
            if community_unique_id is not None:
                return make_response(
                    status="success",
                    data={"guides": guides_for_community(community_unique_id)},
                ), 200
            return make_response(status="error", error="Unsupported interview-guides route."), 400
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

            if action == "create_interview_guide":
                for field in ("title", "campus_abbrev", "year_name"):
                    if not data.get(field):
                        return make_response(status="error", error=f"Missing required field: '{field}'"), 400
                g = create_interview_guide(
                    title=data["title"],
                    campus_abbrev=data["campus_abbrev"],
                    year_name=data["year_name"],
                    content=data.get("content"),
                    meeting_date=data.get("meeting_date"),
                    source_path=data.get("source_path"),
                    prepared_for_unique_ids=data.get("prepared_for_unique_ids"),
                    target_year_identifiers=data.get("target_year_identifiers"),
                    pertains_to_community_unique_ids=data.get("pertains_to_community_unique_ids"),
                )
                # Full projection so the edges come back on the 201.
                return make_response(
                    status="success", data=get_interview_guide(g.unique_id),
                    message="Interview guide created.",
                ), 201

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

            if action == "update_interview_guide":
                kwargs = {f: data[f] for f in ("title", "content", "meeting_date", "source_path") if f in data}
                result = update_interview_guide(unique_id, **kwargs)
                return make_response(status="success", data=result, message="Interview guide updated."), 200

            # Full-replace list setters: the complete list every call; [] clears.
            if action == "set_prepared_for":
                if not isinstance(data.get("person_unique_ids"), list):
                    return make_response(status="error", error="'person_unique_ids' must be a list."), 400
                result = set_guide_people(unique_id, data["person_unique_ids"])
                return make_response(status="success", data=result, message="Interviewees updated."), 200

            if action == "set_targets":
                if not isinstance(data.get("target_year_identifiers"), list):
                    return make_response(status="error", error="'target_year_identifiers' must be a list."), 400
                result = set_guide_targets(unique_id, data["target_year_identifiers"])
                return make_response(status="success", data=result, message="Targets updated."), 200

            if action == "set_pertains_to":
                if not isinstance(data.get("community_unique_ids"), list):
                    return make_response(status="error", error="'community_unique_ids' must be a list."), 400
                result = set_guide_communities(unique_id, data["community_unique_ids"])
                return make_response(status="success", data=result, message="Pertinent communities updated."), 200

            if action == "set_resulted_in":
                # minutes_unique_id may be null to clear the closure edge.
                result = set_guide_resulted_in(unique_id, data.get("minutes_unique_id"))
                return make_response(status="success", data=result, message="Closure updated."), 200

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
            delete_interview_guide(unique_id)
            return make_response(status="success", message="Interview guide deleted."), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


interview_guides_view = InterviewGuidesAPI.as_view("interview_guides_api")

# Reads
data_api_endpoints.add_url_rule(
    "/interview-guides/item/<string:unique_id>", view_func=interview_guides_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/interview-guides/campus/<string:campus_abbrev>/<string:academic_year>",
    view_func=interview_guides_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/interview-guides/community/<string:community_unique_id>",
    view_func=interview_guides_view, methods=["GET"],
)
# Writes
data_api_endpoints.add_url_rule("/interview-guides", view_func=interview_guides_view, methods=["POST", "PUT"])
data_api_endpoints.add_url_rule(
    "/interview-guides/<string:unique_id>", view_func=interview_guides_view, methods=["DELETE"],
)
