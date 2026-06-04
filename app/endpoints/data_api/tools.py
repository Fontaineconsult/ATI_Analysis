"""
HTTP endpoints for Tool — an instrument an Implementation uses to remediate Interfaces
(Pope Tech, Equidox, an OCR engine). Distinct from Asset (a thing kept accessible);
reached from the work side via Implementation.uses_tool.

URL surface (mounted at /ati/data-api/v1):

    GET    /tools                       list (summaries)
           ?asset=<asset_identifier>      tools whose parent asset is this asset
    GET    /tools/<tool_identifier>     one tool (full detail)
    POST   /tools                       create_tool (optionally wires supplier / parent asset)
    PUT    /tools                       action-dispatch: update / assign|unassign vendor /
                                        assign|unassign asset / assign|unassign usage
                                        (an Implementation that uses the tool)
    DELETE /tools                       delete_tool (tool_identifier in body)

Edge modifications (assign and unassign) live on PUT; DELETE is reserved for removing the
node itself — matching the interfaces.py / assets.py convention.
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.tools.create import create_tool
from app.database.queries.tools.read import (
    get_all_tools,
    get_tool,
    get_tools_for_asset,
)
from app.database.queries.tools.update import (
    update_tool,
    assign_vendor_to_tool,
    assign_asset_to_tool,
    assign_usage_to_tool,
)
from app.database.queries.tools.delete import (
    delete_tool,
    unassign_vendor_from_tool,
    unassign_asset_from_tool,
    unassign_usage_from_tool,
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


class ToolsAPI(MethodView):
    def get(self, tool_identifier=None):
        try:
            if tool_identifier:
                return make_response(status="success", data=get_tool(tool_identifier)), 200

            if request.args.get("asset"):
                items = get_tools_for_asset(request.args.get("asset"))
            else:
                items = get_all_tools()
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
            tool = create_tool(
                title=data["title"],
                description=data.get("description"),
                supplied_by=data.get("supplied_by"),
                parent_asset=data.get("parent_asset"),
            )
            return make_response(
                status="success",
                data={"tool": tool.serialize()},
                message="Tool created.",
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
                _require(data, "tool_identifier")
                tool = update_tool(data["tool_identifier"], data)
                return make_response(status="success", data={"tool": tool}, message="Tool updated."), 200

            if action in ("assign_vendor", "unassign_vendor"):
                _require(data, "tool_identifier", "vendor_name")
                fn = assign_vendor_to_tool if action == "assign_vendor" else unassign_vendor_from_tool
                fn(data["tool_identifier"], data["vendor_name"])
                verb = "assigned" if action == "assign_vendor" else "unassigned"
                return make_response(status="success", message=f"Vendor {verb}."), 200

            if action in ("assign_asset", "unassign_asset"):
                _require(data, "tool_identifier", "asset_identifier")
                fn = assign_asset_to_tool if action == "assign_asset" else unassign_asset_from_tool
                fn(data["tool_identifier"], data["asset_identifier"])
                verb = "assigned" if action == "assign_asset" else "unassigned"
                return make_response(status="success", message=f"Parent asset {verb}."), 200

            if action in ("assign_usage", "unassign_usage"):
                _require(data, "tool_identifier", "implementation_type", "implementation_unique_id")
                fn = assign_usage_to_tool if action == "assign_usage" else unassign_usage_from_tool
                fn(data["tool_identifier"], data["implementation_type"], data["implementation_unique_id"])
                verb = "assigned" if action == "assign_usage" else "unassigned"
                return make_response(status="success", message=f"Usage {verb}."), 200

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
            _require(data, "tool_identifier")
            delete_tool(data["tool_identifier"])
            return make_response(status="success", data={"deleted": data["tool_identifier"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()  # surface the full stack to the server console (do not suppress 500s)
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


tools_view = ToolsAPI.as_view("tools_api")
data_api_endpoints.add_url_rule(
    "/tools", view_func=tools_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/tools/<string:tool_identifier>", view_func=tools_view, methods=["GET"]
)
