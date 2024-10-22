from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api

class IndividualsAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

individuals_view = IndividualsAPI.as_view('individuals_view')
data_api.add_url_rule('/individuals', view_func=individuals_view, methods=['GET', 'POST', 'PUT', 'DELETE'])