from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api

class OrganizationalUnitsAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

organizational_units_view = OrganizationalUnitsAPI.as_view('organizational_units_view')
data_api.add_url_rule('/organizational-units', view_func=organizational_units_view, methods=['GET', 'POST', 'PUT', 'DELETE'])