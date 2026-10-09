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
             ?campus=<abbrev>[&year=YYYY-YYYY]   TAAPs at a campus, optionally one academic year
             ?active=true                        active TAAPs only
             ?due_before=YYYY-MM-DD              active TAAPs due for review on/before
      GET    /taaps/<key>                     one TAAP (full detail); key = taap_identifier,
                                              or a title that matches exactly one plan
      POST   /taaps                           create_taap (wires covers_asset, taap_at_campus,
                                              requested_by, and taap_in_year when the year exists)
      PUT    /taaps                           action-dispatch: update / assign|unassign
                                              owner / preparer / signer / unit / reference /
                                              signed_copy / supersedes / yse
      DELETE /taaps                           delete_taap (taap_identifier in body)

    Every TAAP write names its plan with `taap_identifier`; `title` is accepted as a
    fallback key for callers that predate the composite identifier.

Both edge modifications (assign and unassign) live on PUT; DELETE is reserved for
removing the node itself — matching the governance.py convention.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.assets.create import create_asset, create_taap
from app.database.queries.assets.read import (
    get_all_assets,
    get_stewarded_ict_for_yse,
    get_asset,
    get_assets_by_scope,
    get_assets_by_campus,
    get_elevation_signal_assets,
    get_all_taaps,
    get_taap,
    get_taaps_for_asset,
    get_taaps_by_campus,
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
    assign_preparer_to_taap,
    assign_signer_to_taap,
    assign_unit_to_taap,
    add_reference_to_taap,
    attach_signed_copy_to_taap,
    set_taap_supersedes,
    connect_taap_to_yse,
)
from app.database.queries.assets.delete import (
    delete_asset,
    unassign_steward_from_asset,
    unassign_vendor_from_asset,
    unassign_asset_from_campus,
    delete_taap,
    unassign_owner_from_taap,
    unassign_preparer_from_taap,
    unassign_signer_from_taap,
    unassign_unit_from_taap,
    remove_reference_from_taap,
    detach_signed_copy_from_taap,
    clear_taap_supersedes,
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


# Fields the TAAP POST passes straight through to create_taap as form content.
# Mirrors TAAP_TEXT_FIELDS / TAAP_CHOICE_FIELDS / TAAP_ARRAY_FIELDS in
# queries/assets/create.py, which validates each against its vocabulary.
_TAAP_FORM_FIELDS = (
    "description", "template_version", "vendor_contact", "known_barriers",
    "proposed_alternative", "accessibility_statement", "misc_notes",
    "outcome", "institutional_risk", "accommodation_requirement", "taap_status",
    "affected_user_groups", "statement_elements", "distribution_actions", "requirements_met",
)


def _taap_key(data: dict) -> str:
    """The plan a TAAP write addresses: taap_identifier, or title as the legacy fallback."""
    key = data.get("taap_identifier") or data.get("title")
    if not key:
        raise ValidationError("Missing required field(s): taap_identifier")
    return key


class TAAPsAPI(MethodView):
    def get(self, key=None):
        try:
            if key:
                return make_response(status="success", data=get_taap(key)), 200

            if request.args.get("asset_identifier"):
                items = get_taaps_for_asset(request.args.get("asset_identifier"))
            elif request.args.get("campus"):
                items = get_taaps_by_campus(request.args.get("campus"), request.args.get("year"))
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
            _require(data, "title", "asset_identifier", "campus_abbrev", "requesting_unit")
            form_fields = {k: data[k] for k in _TAAP_FORM_FIELDS if k in data}
            taap = create_taap(
                title=data["title"],
                asset_identifier=data["asset_identifier"],
                campus_abbrev=data["campus_abbrev"],
                requesting_unit=data["requesting_unit"],
                creation_date=data.get("creation_date"),
                effective_date=data.get("effective_date"),
                review_due=data.get("review_due"),
                academic_year=data.get("academic_year"),
                create_missing_unit=bool(data.get("create_missing_unit", False)),
                active=data.get("active", True),
                **form_fields,
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
            key = _taap_key(data)

            if action == "update":
                fields = {k: v for k, v in data.items() if k not in ("action", "taap_identifier")}
                # A title-keyed caller is naming the plan, not renaming it.
                if "taap_identifier" not in data:
                    fields.pop("title", None)
                taap = update_taap(key, fields)
                return make_response(status="success", data={"taap": taap}, message="TAAP updated."), 200

            if action in ("assign_owner", "unassign_owner"):
                _require(data, "person_unique_id")
                fn = assign_owner_to_taap if action == "assign_owner" else unassign_owner_from_taap
                fn(key, data["person_unique_id"])
                verb = "assigned" if action == "assign_owner" else "unassigned"
                return make_response(status="success", message=f"Owner {verb}."), 200

            if action in ("assign_preparer", "unassign_preparer"):
                _require(data, "person_unique_id")
                fn = assign_preparer_to_taap if action == "assign_preparer" else unassign_preparer_from_taap
                fn(key, data["person_unique_id"])
                verb = "assigned" if action == "assign_preparer" else "unassigned"
                return make_response(status="success", message=f"Preparer {verb}."), 200

            if action == "assign_signer":
                _require(data, "person_unique_id")
                assign_signer_to_taap(key, data["person_unique_id"], data.get("role"), data.get("signed_date"))
                return make_response(status="success", message="Signer assigned."), 200

            if action == "unassign_signer":
                _require(data, "person_unique_id")
                unassign_signer_from_taap(key, data["person_unique_id"])
                return make_response(status="success", message="Signer unassigned."), 200

            if action in ("assign_unit", "unassign_unit"):
                _require(data, "capacity", "unit_unique_id")
                fn = assign_unit_to_taap if action == "assign_unit" else unassign_unit_from_taap
                fn(key, data["capacity"], data["unit_unique_id"])
                verb = "assigned" if action == "assign_unit" else "unassigned"
                return make_response(status="success", message=f"Unit {verb}."), 200

            if action == "add_reference":
                _require(data, "kind", "target_type", "target_unique_id")
                add_reference_to_taap(key, data["kind"], data["target_type"], data["target_unique_id"], data.get("note"))
                return make_response(status="success", message="Reference added."), 200

            if action == "remove_reference":
                _require(data, "target_type", "target_unique_id")
                remove_reference_from_taap(key, data["target_type"], data["target_unique_id"])
                return make_response(status="success", message="Reference removed."), 200

            if action == "attach_signed_copy":
                _require(data, "document_unique_id")
                attach_signed_copy_to_taap(key, data["document_unique_id"])
                return make_response(status="success", message="Signed copy attached."), 200

            if action == "detach_signed_copy":
                detach_signed_copy_from_taap(key)
                return make_response(status="success", message="Signed copy detached."), 200

            if action == "set_supersedes":
                _require(data, "previous_taap_identifier")
                set_taap_supersedes(key, data["previous_taap_identifier"])
                return make_response(status="success", message="Renewal recorded."), 200

            if action == "clear_supersedes":
                clear_taap_supersedes(key)
                return make_response(status="success", message="Renewal cleared."), 200

            if action == "connect_yse":
                _require(data, "yse_identifier")
                connect_taap_to_yse(key, data["yse_identifier"], data.get("strength"), data.get("control"))
                return make_response(status="success", message="Evidence connected."), 200

            if action == "disconnect_yse":
                _require(data, "yse_identifier")
                disconnect_taap_from_yse(key, data["yse_identifier"])
                return make_response(status="success", message="Evidence disconnected."), 200

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
            key = _taap_key(data)
            delete_taap(key)
            return make_response(status="success", data={"deleted": key}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


def stewarded_ict_for_yse_view(year_identifier):
    """GET the derived ICT footprint behind a YSE's internal evidence: the
    implementations' owners/participants, their employing units, and every
    asset those units/people steward under §508."""
    try:
        return make_response(status="success", data=get_stewarded_ict_for_yse(year_identifier)), 200
    except NotFoundError as e:
        return make_response(status="error", error=str(e)), 404
    except Exception as e:
        return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


data_api_endpoints.add_url_rule(
    "/assets/stewarded-for-yse/<path:year_identifier>",
    view_func=stewarded_ict_for_yse_view, methods=["GET"],
)

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
    "/taaps/<path:key>", view_func=taaps_view, methods=["GET"]
)
