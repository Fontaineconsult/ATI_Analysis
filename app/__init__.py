

from app.endpoints.data_api import data_api
from app.endpoints.react_endpoints import react_pages
from app.web_config import Config
from neomodel import config, db

from urllib.parse import urlencode
def merge_query_params(*dict1):
    print(dict1)
    return urlencode(dict1)

from flask import Flask, send_from_directory
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__, static_folder='frontend/src/build/static', template_folder='frontend/src/build')

    # Enable CORS for handling requests from React
    CORS(app)

    # Load configuration from object
    app.config.from_object(Config)

    # Set up database connection
    config.DATABASE_URL = app.config['DATABASE_URL']
    app.config['SECRET_KEY'] = 'accessibility'
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    app.config['DEBUG_TB_PROFILER_ENABLED'] = True

    @app.before_request
    def initialize():
        if not hasattr(db, 'connection'):
            db.set_connection(app.config['DATABASE_URL'])

    # Register your API blueprints
    app.register_blueprint(data_api, url_prefix='/data-api/v1')
    app.register_blueprint(react_pages, url_prefix='/')

    # Serve React App for non-API routes under /ati-explorer

    return app
