"""
HTTP endpoints for Query (a pending question raised under a WorkingGroupPlan).

URL surface (mounted at /ati/data-api/v1):
    GET    /queries/plan/<wgp_identifier>
    GET    /queries/working-group/<campus_abbrev>/<academic_year>/<working_group>
    GET    /queries/campus/<campus_abbrev>/<academic_year>
    GET    /queries/item/<unique_id>
    POST   /queries                                  (action-dispatch: create_query)
    PUT    /queries                                  (action-dispatch: update/settle/...)
    DELETE /queries/<unique_id>

A Query anchors to a WorkingGroupPlan, which encodes campus + academic year + working
group — so those coordinates are derivable and not passed as separate edges.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.query.create import create_query
from app.database.queries.query.read import (
    get_query,
    query_panel_for_plan,
    query_panel_for_working_group,
    list_queries_for_campus,
)
from app.database.queries.query.update import (
    update_query,
    settle_query,
    attach_evidence,
    detach_evidence,
    add_query_note,
)
from app.database.queries.query.delete import delete_query
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


class QueriesAPI(MethodView):
    def get(self, wgp_identifier=None, campus_abbrev=None, academic_year=None,
            working_group=None, unique_id=None):
        try:
            if unique_id is not None:
                return make_response(status="success", data=get_query(unique_id)), 200
            if wgp_identifier is not None:
                return make_response(status="success", data=query_panel_for_plan(wgp_identifier)), 200
            if campus_abbrev and academic_year and working_group:
                return make_response(
                    status="success",
                    data=query_panel_for_working_group(campus_abbrev, academic_year, working_group),
                ), 200
            if campus_abbrev and academic_year:
                return make_response(
                    status="success",
                    data=list_queries_for_campus(campus_abbrev, academic_year),
                ), 200
            return make_response(status="error", error="Unsupported query route."), 400
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

            if action == "create_query":
                if not data.get("question"):
                    return make_response(status="error", error="Missing required field: 'question'"), 400
                query = create_query(
                    question=data["question"],
                    working_group_plan_identifier=data.get("working_group_plan_identifier"),
                    campus_abbrev=data.get("campus_abbrev"),
                    year_name=data.get("year_name"),
                    working_group=data.get("working_group"),
                    category=data.get("category"),
                    detail=data.get("detail"),
                    raised_by_unique_id=data.get("raised_by_unique_id"),
                )
                return make_response(
                    status="success",
                    data=query.serialize(),
                    message="Query created.",
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

            if action == "update_query":
                # Pass only fields actually present, so omitted fields stay untouched.
                kwargs = {f: data[f] for f in ("question", "detail", "category", "status") if f in data}
                result = update_query(unique_id, **kwargs)
                return make_response(status="success", data=result, message="Query updated."), 200

            if action == "settle_query":
                if not data.get("answer"):
                    return make_response(status="error", error="Missing required field: 'answer'"), 400
                result = settle_query(unique_id, data["answer"], data.get("settled_by_unique_id"))
                return make_response(status="success", data=result, message="Query settled."), 200

            if action in ("attach_evidence", "detach_evidence"):
                if not data.get("yse_identifier"):
                    return make_response(status="error", error="Missing required field: 'yse_identifier'"), 400
                fn = attach_evidence if action == "attach_evidence" else detach_evidence
                result = fn(unique_id, data["yse_identifier"])
                verb = "attached" if action == "attach_evidence" else "detached"
                return make_response(status="success", data=result, message=f"Evidence {verb}."), 200

            if action == "add_query_note":
                if not data.get("content"):
                    return make_response(status="error", error="Missing required field: 'content'"), 400
                result = add_query_note(unique_id, data["content"], data.get("created_by_unique_id"))
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
            delete_query(unique_id)
            return make_response(status="success", message="Query deleted."), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


queries_view = QueriesAPI.as_view("queries_api")

# Reads
data_api_endpoints.add_url_rule(
    "/queries/plan/<string:wgp_identifier>", view_func=queries_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/queries/working-group/<string:campus_abbrev>/<string:academic_year>/<string:working_group>",
    view_func=queries_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/queries/campus/<string:campus_abbrev>/<string:academic_year>",
    view_func=queries_view, methods=["GET"],
)
data_api_endpoints.add_url_rule(
    "/queries/item/<string:unique_id>", view_func=queries_view, methods=["GET"],
)
# Writes
data_api_endpoints.add_url_rule("/queries", view_func=queries_view, methods=["POST", "PUT"])
data_api_endpoints.add_url_rule(
    "/queries/<string:unique_id>", view_func=queries_view, methods=["DELETE"],
)
