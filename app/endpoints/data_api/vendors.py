"""
HTTP endpoints for Vendor CRUD.

A Vendor is an external supplier; assets relate to it through Asset.supplied_by
(managed from the asset side). This resource manages the vendor nodes themselves
and their `employs` (Person) edges.

URL surface (mounted at /ati/data-api/v1):

    GET    /vendors                 list (summaries)
    GET    /vendors/<name>          one vendor (detail: + supplies, + employs)
    POST   /vendors                 create_vendor  {name, location?}
    PUT    /vendors                 action-dispatch:
                                       update              {name, location?, new_name?}
                                       assign_employee     {name, person_unique_id}
                                       unassign_employee   {name, person_unique_id}
    DELETE /vendors                 delete_vendor  {name in body}

Matches the assets.py conventions: plain POST for create, action-dispatch PUT for
update + edge changes, DELETE for node removal. Vendor.name is the unique
business key.
"""
from flask import request
from flask.views import MethodView

from app.database.queries.organizational_units.create import create_vendor
from app.database.queries.organizational_units.read import (
    get_all_vendors,
    get_vendor,
    get_assets_supplied_by_vendor,
)
from app.database.queries.organizational_units.update import (
    update_vendor,
    assign_person_to_vendor,
    unassign_person_from_vendor,
)
from app.database.queries.organizational_units.delete import delete_vendor
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


def _vendor_summary(vendor) -> dict:
    return {"name": vendor.name, "location": vendor.location, "unique_id": vendor.unique_id}


def _vendor_detail(vendor) -> dict:
    data = _vendor_summary(vendor)
    data.update({
        "employs": [
            {"unique_id": p.unique_id, "name": p.name} for p in vendor.employs.all()
        ],
        "supplies": get_assets_supplied_by_vendor(vendor.name),
    })
    return data


class VendorsAPI(MethodView):
    def get(self, name=None):
        try:
            if name:
                return make_response(status="success", data=_vendor_detail(get_vendor(name))), 200
            items = [_vendor_summary(v) for v in get_all_vendors()]
            items.sort(key=lambda v: (v["name"] or "").lower())
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
            _require(data, "name")
            vendor = create_vendor(name=data["name"], location=data.get("location"))
            return make_response(
                status="success",
                data={"vendor": _vendor_summary(vendor)},
                message="Vendor created.",
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
                _require(data, "name")
                vendor = update_vendor(
                    data["name"],
                    location=data.get("location"),
                    new_name=data.get("new_name"),
                )
                return make_response(status="success", data={"vendor": _vendor_summary(vendor)}, message="Vendor updated."), 200

            if action in ("assign_employee", "unassign_employee"):
                _require(data, "name", "person_unique_id")
                fn = assign_person_to_vendor if action == "assign_employee" else unassign_person_from_vendor
                fn(data["name"], data["person_unique_id"])
                verb = "assigned" if action == "assign_employee" else "unassigned"
                return make_response(status="success", message=f"Employee {verb}."), 200

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
            _require(data, "name")
            delete_vendor(data["name"])
            return make_response(status="success", data={"deleted": data["name"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500


vendors_view = VendorsAPI.as_view("vendors_api")
data_api_endpoints.add_url_rule(
    "/vendors", view_func=vendors_view, methods=["GET", "POST", "PUT", "DELETE"]
)
data_api_endpoints.add_url_rule(
    "/vendors/<path:name>", view_func=vendors_view, methods=["GET"]
)
