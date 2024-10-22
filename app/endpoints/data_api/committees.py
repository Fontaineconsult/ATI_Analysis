from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api

class CommitteesAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

committees_view = CommitteesAPI.as_view('committees')
data_api.add_url_rule('/committees', view_func=committees_view, methods=['GET', 'POST', 'PUT', 'DELETE'])