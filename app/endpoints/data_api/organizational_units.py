from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt

from . import data_api_endpoints
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import (
    ApiError,
    CrudError,
    NotFoundError,
    ValidationError,
)
from app.database.queries.organizational_units.read import (
    get_all_campuses,
    get_all_departments,
    get_all_colleges,
    get_all_vendors,
    get_departments_by_campus,
    get_colleges_by_campus,
    get_local_org_units_overview,
)
from app.database.queries.organizational_units.create import create_org_unit
from app.database.queries.organizational_units.update import (
    assign_employee_to_org_unit,
    unassign_employee_from_org_unit,
)
from app.database.queries.organizational_units.delete import delete_org_unit


def _require(data: dict, *keys):
    """Raise ValidationError (→400) if any required key is missing/blank."""
    missing = [k for k in keys if data.get(k) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")


class OrganizationalUnitsAPI(MethodView):
    def get(self):
        unit_type = request.args.get('type', None)

        try:
            if unit_type == 'campuses':
                campuses = get_all_campuses()
                data = [{'name': c.name, 'abbreviation': c.abbreviation, 'unique_id': c.unique_id} for c in campuses]
                return make_response(status='success', data=data), 200
            elif unit_type == 'departments':
                campus = request.args.get('campus', None)
                if campus:
                    departments = get_departments_by_campus(campus)
                else:
                    departments = get_all_departments()
                data = [{'name': d.name, 'unique_id': d.unique_id} for d in departments]
                return make_response(status='success', data=data), 200
            elif unit_type == 'colleges':
                campus = request.args.get('campus', None)
                if campus:
                    colleges = get_colleges_by_campus(campus)
                else:
                    colleges = get_all_colleges()
                data = [{'name': c.name, 'unique_id': c.unique_id} for c in colleges]
                return make_response(status='success', data=data), 200
            elif unit_type == 'vendors':
                vendors = get_all_vendors()
                data = [{'name': v.name, 'unique_id': v.unique_id} for v in vendors]
                return make_response(status='success', data=data), 200
            elif unit_type == 'local-overview':
                campus = request.args.get('campus', None)
                if not campus:
                    return make_response(status='error', error="'local-overview' requires a 'campus' query parameter (abbreviation)"), 400
                data = get_local_org_units_overview(campus)
                return make_response(status='success', data=data), 200
            else:
                return make_response(status='error', error="Missing or invalid 'type' query parameter. Valid types: campuses, departments, colleges, vendors, local-overview"), 400
        except NotFoundError as e:
            return make_response(status='error', error=str(e)), 404
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            raise ApiError(message=f"An unexpected error occurred: {e}")

    def post(self):
        """
        Create a local org unit (Department / College):

            {unit_type, name, location?, campus?}

        `campus` is the abbreviation (e.g. 'sfsu'); when given, the unit is
        connected operates_under_campus so campus-scoped reads see it.
        """
        try:
            data = request.get_json() or {}
            _require(data, "unit_type", "name")
            unit = create_org_unit(
                data["unit_type"],
                data["name"],
                location=data.get("location"),
                campus_abbreviation=data.get("campus"),
            )
            return make_response(
                status="success",
                data={"unit": {"name": unit.name, "unique_id": unit.unique_id, "location": unit.location}},
                message="Organization created.",
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
        """
        Action-dispatch employs-edge management (matches vendors.py conventions):

            assign_employee     {unit_type, name, person_unique_id}
            unassign_employee   {unit_type, name, person_unique_id}

        unit_type: 'department' | 'college' | 'vendor'; name is the unit's
        unique business key; person_unique_id is Person.unique_id.
        """
        try:
            data = request.get_json() or {}
            action = data.get("action")

            if action in ("assign_employee", "unassign_employee"):
                _require(data, "unit_type", "name", "person_unique_id")
                fn = (
                    assign_employee_to_org_unit
                    if action == "assign_employee"
                    else unassign_employee_from_org_unit
                )
                fn(data["unit_type"], data["name"], data["person_unique_id"])
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
        """Delete a local org unit (Department / College): {unit_type, name}."""
        try:
            data = request.get_json() or {}
            _require(data, "unit_type", "name")
            delete_org_unit(data["unit_type"], data["name"])
            return make_response(status="success", data={"deleted": data["name"]}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            return make_response(status="error", error=f"An unexpected error occurred: {e}"), 500

organizational_units_view = OrganizationalUnitsAPI.as_view('organizational_units_view')
data_api_endpoints.add_url_rule('/organizational-units', view_func=organizational_units_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
