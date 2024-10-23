from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api_endpoints

class ImplementationAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

implementations_view = ImplementationAPI.as_view('implementations_view')
data_api_endpoints.add_url_rule('/implementations', view_func=implementations_view, methods=['GET', 'POST', 'PUT', 'DELETE'])