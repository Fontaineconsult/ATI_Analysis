from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api

class EvidenceAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

evidence_view = EvidenceAPI.as_view('evidence_view')
data_api.add_url_rule('/evidence', view_func=evidence_view, methods=['GET', 'POST', 'PUT', 'DELETE'])