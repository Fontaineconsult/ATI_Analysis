from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt

from . import data_api_endpoints
from app.endpoints.data_api.util.response import make_response
from app.endpoints.data_api.errors.custom_exceptions import ApiError, CrudError
from app.database.queries.organizational_units.read import (
    get_all_campuses,
    get_all_departments,
    get_all_colleges,
    get_all_vendors,
    get_departments_by_campus,
    get_colleges_by_campus
)


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
            else:
                return make_response(status='error', error="Missing or invalid 'type' query parameter. Valid types: campuses, departments, colleges, vendors"), 400
        except CrudError as e:
            return make_response(status='error', error=str(e)), 500
        except Exception as e:
            raise ApiError(message=f"An unexpected error occurred: {e}")

    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

organizational_units_view = OrganizationalUnitsAPI.as_view('organizational_units_view')
data_api_endpoints.add_url_rule('/organizational-units', view_func=organizational_units_view, methods=['GET', 'POST', 'PUT', 'DELETE'])
