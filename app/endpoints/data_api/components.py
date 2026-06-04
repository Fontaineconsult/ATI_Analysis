"""
HTTP endpoints for Component — the WCAG-grain element of an Interface where a success
criterion or a VPAT line item attaches. `kind` lives here (on the component), NOT on the
Interface. A Component is composition, not identity, and is NOT a remediation target.

URL surface (mounted at /ati/data-api/v1):

    GET    /components                         list (summaries)
           ?interface=<interface_identifier>     components that are part_of an interface
           ?kind=<component_kind>                filter by kind
    GET    /components/<component_identifier>  one component (full detail: parent + guidelines)
    POST   /components                         create_component (optionally wires part_of)
    PUT    /components                         action-dispatch: update / assign|unassign guideline /
                                               assign|unassign parent interface
    DELETE /components                         delete_component (component_identifier in body)

Edge modifications (assign and unassign the parent interface / WCAG guideline) live on PUT;
DELETE is reserved for removing the node itself — matching the assets.py / interfaces.py
convention.
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.components.create import create_component
from app.database.queries.components.read import (
    get_all_components,
    get_component,
    get_components_for_interface,
    get_components_by_kind,
)
from app.database.queries.components.update import (
    update_component,
    assign_guideline_to_component,
    assign_parent_interface_to_component,
)
from app.database.queries.components.delete import (
    delete_component,
    unassign_guideline_from_component,
    unassign_parent_interface_from_component,
)
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


class ComponentsAPI(MethodView):
    def get(self, component_identifier=None):
        try:
            if component_identifier:
                return make_response(status="success", data=get_component(component_identifier)), 200

            if request.args.get("interface"):
                items = get_components_for_interface(request.args.get("interface"))
            elif request.args.get("kind"):
                items = get_components_by_kind(request.args.get("kind"))
            else:
                items = get_all_components()
            return make_response(status="success", data={"items": items}), 200
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
            _require(data, "title")
            component = create_component(
                title=data["title"],
                interface_identifier=data.get("interface_identifier"),
                component_kind=data.get("component_kind"),
                description=data.get("description"),
            )
            return make_response(
                status="success",
                data={"component": component.serialize()},
                message="Component created.",
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
                _require(data, "component_identifier")
                component = update_component(data["component_identifier"], data)
                return make_response(status="success", data={"component": component}, message="Component updated."), 200

            if action in ("assign_guideline", "unassign_guideline"):
                _require(data, "component_identifier", "guideline_unique_id")
                fn = assign_guideline_to_component if action == "assign_guideline" else unassign_guideline_from_component
                fn(data["component_identifier"], data["guideline_unique_id"])
                verb = "assigned" if action == "assign_guideline" else "unassigned"
                return make_response(status="success", message=f"Guideline {verb}."), 200

            if action in ("assign_parent", "unassign_parent"):
                _require(data, "component_identifier", "interface_identifier")
                fn = assign_parent_interface_to_component if action == "assign_parent" else unassign_parent_interface_from_component
                fn(data["component_identifier"], data["interface_identifier"])
                verb = "assigned" if action == "assign_parent" else "unassigned"
                return make_response(status="success", message=f"Parent interface {verb}."), 200

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
            _require(data, "component_identifier")
            delete_component(data["component_identifier"])
            return make_response(status="success", data={"deleted": data["component_identifier"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


components_view = ComponentsAPI.as_view("components_api")
data_api_endpoints.add_url_rule(
    "/components", view_func=components_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/components/<string:component_identifier>", view_func=components_view, methods=["GET"]
)
