# app/__init__.py
from flask import Flask
from jinja2 import Environment, FileSystemLoader

from app.web_config import Config
from neomodel import config, db
# from flask_debugtoolbar import DebugToolbarExtension

from urllib.parse import urlencode
def merge_query_params(*dict1):
    print(dict1)
    return urlencode(dict1)





from flask import Flask, send_from_directory
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__, static_folder='../frontend/src/build/static', template_folder='../frontend/src/build')

    # Enable CORS for handling requests from React
    CORS(app)

    # Load configuration from object
    app.config.from_object(Config)

    print(app.config['DATABASE_URL'])

    # Set up database connection
    config.DATABASE_URL = app.config['DATABASE_URL']
    app.config['SECRET_KEY'] = 'accessibility'
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    app.config['DEBUG_TB_PROFILER_ENABLED'] = True

    @app.before_request
    def initialize():
        if not hasattr(db, 'connection'):
            db.set_connection(app.config['DATABASE_URL'])

    # Import and register API Blueprints
    from app.endpoints.components import component_endpoints
    from app.endpoints.pages import page_endpoints

    app.register_blueprint(component_endpoints, url_prefix='/api/components')
    app.register_blueprint(page_endpoints, url_prefix='/api/pages')

    # Serve React App for non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')


    def serve_react_app(path):
        if path != '' and os.path.exists(f"../frontend/src/build/{path}"):
            return send_from_directory('../frontend/src/build', path)
        else:
            # Serve index.html for all non-API routes (React's SPA routing)
            return send_from_directory('../frontend/src/build', 'index.html')

    return app