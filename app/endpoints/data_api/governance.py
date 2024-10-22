from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api

class GovernanceAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass


governance_view = GovernanceAPI.as_view('governance_view')
data_api.add_url_rule('/governance', view_func=governance_view, methods=['GET', 'POST', 'PUT', 'DELETE'])