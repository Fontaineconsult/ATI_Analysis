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
    app.register_blueprint(data_api_endpoints, url_prefix='/data-api/v1')
    app.register_blueprint(react_pages, url_prefix='/')

    # Serve React App for non-API routes under /ati-explorer

    return app


# def register_error_handlers(app):
#     @app.errorhandler(ApiError)
#     def handle_api_error(error):
#         response = make_response(
#             status="error",
#             error=error.message
#         )
#         return response, 400  # Adjust status code as needed
#
#     @app.errorhandler(NotFoundError)
#     def handle_not_found_error(error):
#         response = make_response(
#             status="error",
#             error=error.message
#         )
#         return response, 404
#
#     @app.errorhandler(ValidationError)
#     def handle_validation_error(error):
#         response = make_response(
#             status="error",
#             error=error.message
#         )
#         return response, 400
#
#     @app.errorhandler(DatabaseError)
#     def handle_database_error(error):
#         response = make_response(
#             status="error",
#             error=error.message
#         )
#         return response, 500
#
#     @app.errorhandler(CrudError)
#     def handle_crud_error(error):
#         response = make_response(
#             status="error",
#             error=error.message
#         )
#         return response, 500
#
#     @app.errorhandler(404)
#     def handle_404_error(error):
#         response = make_response(
#             status="error",
#             error="Resource not found."
#         )
#         return response, 404
#
#     @app.errorhandler(405)
#     def handle_405_error(error):
#         response = make_response(
#             status="error",
#             error="Method not allowed."
#         )
#         return response, 405
#
#     @app.errorhandler(Exception)
#     def handle_general_error(error):
#         # Optional: Log the error details
#         # app.logger.error(f"Unhandled Exception: {error}")
#         response = make_response(
#             status="error",
#             error="An internal server error occurred."
#         )
#         return response, 500