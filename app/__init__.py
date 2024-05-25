# app/__init__.py
from flask import Flask
from jinja2 import Environment, FileSystemLoader

from app.config import Config
from neomodel import config, db
# from flask_debugtoolbar import DebugToolbarExtension

from urllib.parse import urlencode
def merge_query_params(*dict1):
    print(dict1)
    return urlencode(dict1)





def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # env = Environment(loader=FileSystemLoader('templates'))
    app.jinja_env.filters['merge_query_params'] = merge_query_params


    # Set up database connection
    config.DATABASE_URL = app.config['DATABASE_URL']
    app.config['SECRET_KEY'] = 'accessibility'
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    app.config['DEBUG_TB_PROFILER_ENABLED'] = True
    # toolbar = DebugToolbarExtension(app)

    @app.before_request
    def initialize():
        if not hasattr(db, 'connection'):
            db.set_connection(app.config['DATABASE_URL'])

    # Import and register Blueprints
    from app.endpoints.components import component_endpoints
    from app.endpoints.pages import page_endpoints

    app.register_blueprint(component_endpoints)
    app.register_blueprint(page_endpoints)

    return app