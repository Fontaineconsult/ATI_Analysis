"""
HTTP endpoints for Asset and TAAP (Temporary Alternate Access Plan).

URL surface (mounted at /ati/data-api/v1):

    Assets
      GET    /assets                          list (summaries)
             ?scope=<scope>                      filter by scope
             ?campus=<abbrev>                    filter by campus anchor
             ?elevation_signal=true              stewarded-but-unremediated assets (detail)
      GET    /assets/<asset_identifier>       one asset (full detail)
      POST   /assets                          create_asset
      PUT    /assets                          action-dispatch: update / assign|unassign
                                              steward / vendor / campus
      DELETE /assets                          delete_asset (asset_identifier in body)

    TAAPs
      GET    /taaps                           list (summaries)
             ?asset_identifier=<id>              TAAPs covering an asset
             ?active=true                        active TAAPs only
             ?due_before=YYYY-MM-DD              active TAAPs due for review on/before
      GET    /taaps/<title>                   one TAAP (full detail)
      POST   /taaps                           create_taap (wires required covers_asset)
      PUT    /taaps                           action-dispatch: update / assign|unassign
                                              owner / signer / yse
      DELETE /taaps                           delete_taap (title in body)

Both edge modifications (assign and unassign) live on PUT; DELETE is reserved for
removing the node itself — matching the governance.py convention.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.assets.create import create_asset, create_taap
from app.database.queries.assets.read import (
    get_all_assets,
    get_asset,
    get_assets_by_scope,
    get_assets_by_campus,
    get_elevation_signal_assets,
    get_all_taaps,
    get_taap,
    get_taaps_for_asset,
    get_active_taaps,
    get_taaps_due_for_review,
)
from app.database.queries.assets.update import (
    update_asset,
    assign_steward_to_asset,
    assign_vendor_to_asset,
    assign_asset_to_campus,
    update_taap,
    assign_owner_to_taap,
    assign_signer_to_taap,
    connect_taap_to_yse,
)
from app.database.queries.assets.delete import (
    delete_asset,
    unassign_steward_from_asset,
    unassign_vendor_from_asset,
    unassign_asset_from_campus,
    delete_taap,
    unassign_owner_from_taap,
    unassign_signer_from_taap,
    disconnect_taap_from_yse,
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


class AssetsAPI(MethodView):
    def get(self, asset_identifier=None):
        try:
            if asset_identifier:
                return make_response(status="success", data=get_asset(asset_identifier)), 200

            if _truthy(request.args.get("elevation_signal")):
                items = get_elevation_signal_assets()
            elif request.args.get("scope"):
                items = get_assets_by_scope(request.args.get("scope"))
            elif request.args.get("campus"):
                items = get_assets_by_campus(request.args.get("campus"))
            else:
                items = get_all_assets()
            return make_response(status="success", data={"items": items}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            _require(data, "title", "scope", "locus")
            asset = create_asset(
                title=data["title"],
                scope=data["scope"],
                locus=data["locus"],
                asset_class=data.get("asset_class"),
                version=data.get("version"),
                description=data.get("description"),
            )
            return make_response(
                status="success",
                data={"asset": asset.serialize()},
                message="Asset created.",
            ), 201
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
            action = data.get("action", "update")

            if action == "update":
                _require(data, "asset_identifier")
                asset = update_asset(data["asset_identifier"], data)
                return make_response(status="success", data={"asset": asset}, message="Asset updated."), 200

            if action in ("assign_steward", "unassign_steward"):
                _require(data, "asset_identifier", "capacity", "holder_type", "holder_unique_id")
                fn = assign_steward_to_asset if action == "assign_steward" else unassign_steward_from_asset
                fn(data["asset_identifier"], data["capacity"], data["holder_type"], data["holder_unique_id"])
                verb = "assigned" if action == "assign_steward" else "unassigned"
                return make_response(status="success", message=f"Steward {verb}."), 200

            if action in ("assign_vendor", "unassign_vendor"):
                _require(data, "asset_identifier", "vendor_name")
                fn = assign_vendor_to_asset if action == "assign_vendor" else unassign_vendor_from_asset
                fn(data["asset_identifier"], data["vendor_name"])
                verb = "assigned" if action == "assign_vendor" else "unassigned"
                return make_response(status="success", message=f"Vendor {verb}."), 200

            if action in ("assign_campus", "unassign_campus"):
                _require(data, "asset_identifier", "campus_abbrev")
                fn = assign_asset_to_campus if action == "assign_campus" else unassign_asset_from_campus
                fn(data["asset_identifier"], data["campus_abbrev"])
                verb = "assigned" if action == "assign_campus" else "unassigned"
                return make_response(status="success", message=f"Campus anchor {verb}."), 200

            return make_response(status="error", error=f"Unknown action: {action}"), 400
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def delete(self):
        try:
            data = request.get_json() or {}
            _require(data, "asset_identifier")
            delete_asset(data["asset_identifier"])
            return make_response(status="success", data={"deleted": data["asset_identifier"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


class TAAPsAPI(MethodView):
    def get(self, title=None):
        try:
            if title:
                return make_response(status="success", data=get_taap(title)), 200

            if request.args.get("asset_identifier"):
                items = get_taaps_for_asset(request.args.get("asset_identifier"))
            elif request.args.get("due_before"):
                items = get_taaps_due_for_review(request.args.get("due_before"))
            elif _truthy(request.args.get("active")):
                items = get_active_taaps()
            else:
                items = get_all_taaps()
            return make_response(status="success", data={"items": items}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json() or {}
            _require(data, "title", "asset_identifier")
            taap = create_taap(
                title=data["title"],
                asset_identifier=data["asset_identifier"],
                outcome=data.get("outcome"),
                description=data.get("description"),
                effective_date=data.get("effective_date"),
                review_due=data.get("review_due"),
                active=data.get("active", True),
            )
            return make_response(
                status="success",
                data={"taap": taap.serialize()},
                message="TAAP created.",
            ), 201
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
            action = data.get("action", "update")

            if action == "update":
                _require(data, "title")
                taap = update_taap(data["title"], data)
                return make_response(status="success", data={"taap": taap}, message="TAAP updated."), 200

            if action in ("assign_owner", "unassign_owner"):
                _require(data, "title", "person_unique_id")
                fn = assign_owner_to_taap if action == "assign_owner" else unassign_owner_from_taap
                fn(data["title"], data["person_unique_id"])
                verb = "assigned" if action == "assign_owner" else "unassigned"
                return make_response(status="success", message=f"Owner {verb}."), 200

            if action in ("assign_signer", "unassign_signer"):
                _require(data, "title", "person_unique_id")
                fn = assign_signer_to_taap if action == "assign_signer" else unassign_signer_from_taap
                fn(data["title"], data["person_unique_id"])
                verb = "assigned" if action == "assign_signer" else "unassigned"
                return make_response(status="success", message=f"Signer {verb}."), 200

            if action in ("connect_yse", "disconnect_yse"):
                _require(data, "title", "yse_identifier")
                fn = connect_taap_to_yse if action == "connect_yse" else disconnect_taap_from_yse
                fn(data["title"], data["yse_identifier"])
                verb = "connected" if action == "connect_yse" else "disconnected"
                return make_response(status="success", message=f"Evidence {verb}."), 200

            return make_response(status="error", error=f"Unknown action: {action}"), 400
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

    def delete(self):
        try:
            data = request.get_json() or {}
            _require(data, "title")
            delete_taap(data["title"])
            return make_response(status="success", data={"deleted": data["title"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


assets_view = AssetsAPI.as_view("assets_api")
data_api_endpoints.add_url_rule(
    "/assets", view_func=assets_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/assets/<string:asset_identifier>", view_func=assets_view, methods=["GET"]
)

taaps_view = TAAPsAPI.as_view("taaps_api")
data_api_endpoints.add_url_rule(
    "/taaps", view_func=taaps_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/taaps/<path:title>", view_func=taaps_view, methods=["GET"]
)
