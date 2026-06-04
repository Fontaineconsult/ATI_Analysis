"""
HTTP endpoints for Interface — the salient point of interaction with ICT where the
accessibility duty lands and what remediation targets.

URL surface (mounted at /ati/data-api/v1):

    GET    /interfaces                         list (summaries)
           ?uncovered=true                       interfaces with no remediation coverage (detail)
           ?function=<function>                  filter by institutional function (identity coordinate)
           ?audience=<audience>                  filter by audience (multi-valued membership)
           ?coverage_domain=<domain>             filter by coverage domain (multi-valued membership)
           ?asset=<asset_identifier>             interfaces presented by an asset
    GET    /interfaces/<interface_identifier>  one interface (full detail + coverage flags)
    POST   /interfaces                         create_interface (requires title/locus/function; optionally wires presented_by)
    PUT    /interfaces                         action-dispatch: update / assign|unassign asset /
                                               assign|unassign remediation / assign|unassign working group
    DELETE /interfaces                         delete_interface (interface_identifier in body)

Edge modifications (assign and unassign the backing asset / remediating implementation)
live on PUT; DELETE is reserved for removing the node itself — matching the assets.py /
governance.py convention.
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.interfaces.create import create_interface
from app.database.queries.interfaces.read import (
    get_all_interfaces,
    get_interface,
    get_interfaces_by_function,
    get_interfaces_by_audience,
    get_interfaces_by_coverage_domain,
    get_interfaces_for_asset,
    get_uncovered_interfaces,
)
from app.database.queries.interfaces.update import (
    update_interface,
    assign_asset_to_interface,
    assign_remediation_to_interface,
    assign_working_group_to_interface,
)
from app.database.queries.interfaces.delete import (
    delete_interface,
    unassign_asset_from_interface,
    unassign_remediation_from_interface,
    unassign_working_group_from_interface,
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


def _truthy(value) -> bool:
    return str(value).lower() in ("true", "1", "yes")


class InterfacesAPI(MethodView):
    def get(self, interface_identifier=None):
        try:
            if interface_identifier:
                return make_response(status="success", data=get_interface(interface_identifier)), 200

            if _truthy(request.args.get("uncovered")):
                items = get_uncovered_interfaces()
            elif request.args.get("function"):
                items = get_interfaces_by_function(request.args.get("function"))
            elif request.args.get("audience"):
                items = get_interfaces_by_audience(request.args.get("audience"))
            elif request.args.get("coverage_domain"):
                items = get_interfaces_by_coverage_domain(request.args.get("coverage_domain"))
            elif request.args.get("asset"):
                items = get_interfaces_for_asset(request.args.get("asset"))
            else:
                items = get_all_interfaces()
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
            _require(data, "title", "locus", "function")
            interface = create_interface(
                title=data["title"],
                locus=data["locus"],
                function=data["function"],
                presented_by=data.get("presented_by"),
                coverage_domains=data.get("coverage_domains"),
                audience=data.get("audience"),
                provenance=data.get("provenance"),
                description=data.get("description"),
            )
            return make_response(
                status="success",
                data={"interface": interface.serialize()},
                message="Interface created.",
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
                _require(data, "interface_identifier")
                interface = update_interface(data["interface_identifier"], data)
                return make_response(status="success", data={"interface": interface}, message="Interface updated."), 200

            if action in ("assign_asset", "unassign_asset"):
                _require(data, "interface_identifier", "asset_identifier")
                fn = assign_asset_to_interface if action == "assign_asset" else unassign_asset_from_interface
                fn(data["interface_identifier"], data["asset_identifier"])
                verb = "assigned" if action == "assign_asset" else "unassigned"
                return make_response(status="success", message=f"Backing asset {verb}."), 200

            if action in ("assign_remediation", "unassign_remediation"):
                _require(data, "interface_identifier", "implementation_type", "implementation_unique_id")
                fn = assign_remediation_to_interface if action == "assign_remediation" else unassign_remediation_from_interface
                fn(data["interface_identifier"], data["implementation_type"], data["implementation_unique_id"])
                verb = "assigned" if action == "assign_remediation" else "unassigned"
                return make_response(status="success", message=f"Remediation {verb}."), 200

            if action in ("assign_working_group", "unassign_working_group"):
                _require(data, "interface_identifier", "working_group")
                fn = assign_working_group_to_interface if action == "assign_working_group" else unassign_working_group_from_interface
                fn(data["interface_identifier"], data["working_group"])
                verb = "assigned" if action == "assign_working_group" else "unassigned"
                return make_response(status="success", message=f"Accountable working group {verb}."), 200

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
            _require(data, "interface_identifier")
            delete_interface(data["interface_identifier"])
            return make_response(status="success", data={"deleted": data["interface_identifier"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


interfaces_view = InterfacesAPI.as_view("interfaces_api")
data_api_endpoints.add_url_rule(
    "/interfaces", view_func=interfaces_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/interfaces/<string:interface_identifier>", view_func=interfaces_view, methods=["GET"]
)
