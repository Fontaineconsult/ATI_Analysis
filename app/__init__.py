import logging
from logging.handlers import RotatingFileHandler

from app.endpoints.data_api import data_api_endpoints
from app.endpoints.react_endpoints import react_pages
from app.web_config import Config
from neomodel import config, db
from urllib.parse import urlencode
from app.endpoints.data_api.util.response import make_response

from app.endpoints.data_api.errors.custom_exceptions import (
    DatabaseError,
    NotFoundError,
    ValidationError,
    CrudError,
    ApiError
)



def merge_query_params(*dict1):
    print(dict1)
    return urlencode(dict1)

from flask import Flask, send_from_directory
from flask_cors import CORS


def create_app():
    app = Flask(__name__,
                static_folder='frontend/src/build/static',
                template_folder='frontend/src/build',
                )

    # Enable CORS for handling requests from React
    CORS(app)

    # Load configuration from object
    app.config.from_object(Config)

    # Set up database connection
    config.DATABASE_URL = app.config['DATABASE_URL']
    app.config['SECRET_KEY'] = 'accessibility'
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    app.config['DEBUG_TB_PROFILER_ENABLED'] = True
    app.config["DEBUG"] = True
    app.config["PROPAGATE_EXCEPTIONS"] = True

    # Configure logging
    log_file = "app.log"
    handler = RotatingFileHandler(log_file, maxBytes=10000, backupCount=3)
    handler.setLevel(logging.ERROR)  # Log only errors
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)

    # Log an info message when the app starts
    app.logger.info("Flask application is starting")

    @app.before_request
    def initialize():
        if not hasattr(db, 'connection'):
            db.set_connection(app.config['DATABASE_URL'])

    # Register your API blueprints
    app.register_blueprint(data_api_endpoints, url_prefix='/ati/data-api/v1')
    app.register_blueprint(react_pages, url_prefix='/ati')

    # Serve React App for non-API routes under /ati-explorer

    return app
