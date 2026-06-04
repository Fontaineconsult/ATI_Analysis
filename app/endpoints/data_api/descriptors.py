"""
HTTP endpoints for UniversalDescriptor — the ontology descriptions layer (human-readable
descriptions of node types, fields, and field/vocabulary values), authored and edited from
the Settings area.

URL surface (mounted at /ati/data-api/v1):

    GET    /descriptions                      list (all descriptors)
    GET    /descriptions/<descriptor_handle>  one descriptor by handle
    POST   /descriptions                      create_descriptor (handle auto-built from kind + target)
    PUT    /descriptions                      action-dispatch: update
    DELETE /descriptions                      delete_descriptor (descriptor_handle in body)

Descriptors are NOT edge-connected to instance data; the handle is the unique identity and
is built deterministically from (descriptor_kind, target_*) — see queries/descriptors/create.py.
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.descriptors.create import create_descriptor
from app.database.queries.descriptors.read import get_all_descriptors, get_descriptor
from app.database.queries.descriptors.update import update_descriptor
from app.database.queries.descriptors.delete import delete_descriptor
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

from . import data_api_endpoints
from .util.response import make_response


def _require(data: dict, *keys):
    """Raise ValidationError (→400) if any required key is missing/blank."""
    missing = [k for k in keys if data.get(k) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")


class DescriptorsAPI(MethodView):
    def get(self, descriptor_handle=None):
        try:
            if descriptor_handle:
                return make_response(status="success", data=get_descriptor(descriptor_handle)), 200
            return make_response(status="success", data={"items": get_all_descriptors()}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            _require(data, "descriptor_kind")
            descriptor = create_descriptor(
                descriptor_kind=data["descriptor_kind"],
                target_label=data.get("target_label"),
                target_field=data.get("target_field"),
                target_value=data.get("target_value"),
                title=data.get("title"),
                description_short=data.get("description_short"),
                description_full=data.get("description_full"),
                include_in_report=data.get("include_in_report", False),
            )
            return make_response(
                status="success",
                data={"descriptor": descriptor.serialize()},
                message="Descriptor created.",
            ), 201
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def put(self):
        try:
            data = request.get_json() or {}
            action = data.get("action", "update")

            if action == "update":
                _require(data, "descriptor_handle")
                descriptor = update_descriptor(data["descriptor_handle"], data)
                return make_response(status="success", data={"descriptor": descriptor}, message="Descriptor updated."), 200

            return make_response(status="error", error=f"Unknown action: {action}"), 400
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def delete(self):
        try:
            data = request.get_json() or {}
            _require(data, "descriptor_handle")
            delete_descriptor(data["descriptor_handle"])
            return make_response(status="success", data={"deleted": data["descriptor_handle"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


descriptors_view = DescriptorsAPI.as_view("descriptors_api")
data_api_endpoints.add_url_rule(
    "/descriptions", view_func=descriptors_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/descriptions/<path:descriptor_handle>", view_func=descriptors_view, methods=["GET"]
)
