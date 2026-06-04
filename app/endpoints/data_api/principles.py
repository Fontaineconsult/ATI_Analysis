"""
HTTP endpoints for Principle — the framework's conceptual commitments, grounded DOWN in
Governance / IntellectualSource (`derives_from`) and shaping ACROSS to SchemaElements (`shapes`).

URL surface (mounted at /ati/data-api/v1):

    GET    /principles                 list (each with grounded_in + shapes)
    GET    /principles/<handle>        one
    POST   /principles                 create (handle + name required)
    PUT    /principles                 action-dispatch:
                                         update                         (handle + fields)
                                         attach_grounding/detach_grounding:
                                           source_kind='governance'         (governance_type + governance_unique_id)
                                           source_kind='intellectual_source'(source_unique_id)
                                         attach_shape/detach_shape       (schema_element_handle)
    DELETE /principles                 delete (handle in body)
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.principles.create import create_principle
from app.database.queries.principles.read import get_all_principles, get_principle
from app.database.queries.principles.update import (
    update_principle,
    attach_governance_grounding,
    detach_governance_grounding,
    attach_source_grounding,
    detach_source_grounding,
    attach_shape,
    detach_shape,
)
from app.database.queries.principles.delete import delete_principle
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


def _require(data: dict, *keys):
    missing = [k for k in keys if data.get(k) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")


def _grounding(data, attach: bool):
    """Dispatch attach/detach grounding by source_kind."""
    source_kind = data.get("source_kind")
    handle = data["principle_handle"]
    if source_kind == "governance":
        _require(data, "governance_type", "governance_unique_id")
        fn = attach_governance_grounding if attach else detach_governance_grounding
        return fn(handle, data["governance_type"], data["governance_unique_id"])
    if source_kind == "intellectual_source":
        _require(data, "source_unique_id")
        fn = attach_source_grounding if attach else detach_source_grounding
        return fn(handle, data["source_unique_id"])
    raise ValidationError("source_kind must be 'governance' or 'intellectual_source'")


class PrinciplesAPI(MethodView):
    def get(self, handle=None):
        try:
            if handle:
                return make_response(status="success", data=get_principle(handle)), 200
            return make_response(status="success", data={"items": get_all_principles()}), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            _require(data, "handle", "name")
            principle = create_principle(data)
            return make_response(
                status="success",
                data={"item": principle.serialize()},
                message="Principle created.",
            ), 201
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def put(self):
        try:
            data = request.get_json() or {}
            action = data.get("action", "update")

            if action == "update":
                _require(data, "handle")
                item = update_principle(data["handle"], data)
                return make_response(status="success", data={"item": item}, message="Principle updated."), 200

            if action in ("attach_grounding", "detach_grounding"):
                _require(data, "principle_handle")
                item = _grounding(data, attach=(action == "attach_grounding"))
                verb = "attached" if action == "attach_grounding" else "detached"
                return make_response(status="success", data={"item": item}, message=f"Grounding {verb}."), 200

            if action in ("attach_shape", "detach_shape"):
                _require(data, "principle_handle", "schema_element_handle")
                fn = attach_shape if action == "attach_shape" else detach_shape
                item = fn(data["principle_handle"], data["schema_element_handle"])
                verb = "attached" if action == "attach_shape" else "detached"
                return make_response(status="success", data={"item": item}, message=f"Shape {verb}."), 200

            return make_response(status="error", error=f"Unknown action: {action}"), 400
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def delete(self):
        try:
            data = request.get_json() or {}
            _require(data, "handle")
            delete_principle(data["handle"])
            return make_response(status="success", data={"deleted": data["handle"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


principles_view = PrinciplesAPI.as_view("principles_api")
data_api_endpoints.add_url_rule(
    "/principles", view_func=principles_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/principles/<path:handle>", view_func=principles_view, methods=["GET"]
)
