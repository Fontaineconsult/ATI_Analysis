from flask import jsonify, request
from flask.views import MethodView
from datetime import datetime as dt


from . import data_api

class DocumentsAPI(MethodView):
    def get(self):
        pass
    def post(self):
        pass
    def put(self):
        pass
    def delete(self):
        pass

documents_view = DocumentsAPI.as_view('documents_view')
data_api.add_url_rule('/documents', view_func=documents_view, methods=['GET', 'POST', 'PUT', 'DELETE'])