from urllib.parse import urlencode


def merge_query_params(*dict1):
    print(dict1)
    return urlencode(dict1)


def create_app():
    # All project-internal imports are deferred to here.
    # Hoisting them to module scope causes a circular load: any module
    # that does `from app.X import Y` triggers app/__init__.py, which
    # would in turn import graph_schema via the Flask blueprints — and
    # if graph_schema is being run as __main__ at the same time, neomodel
    # raises NodeClassAlreadyDefined.
    import os
    from flask import Flask
    from flask_cors import CORS
    from neomodel import config, db
    from app.endpoints.data_api import data_api_endpoints
    from app.endpoints.react_endpoints import react_pages
    from app.web_config import Config

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
    # Read the Flask secret from the environment; fall back to a random
    # per-process key so a real secret is never hardcoded in source.
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', os.urandom(32).hex())
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    app.config['DEBUG_TB_PROFILER_ENABLED'] = True
    app.config["DEBUG"] = True
    app.config["PROPAGATE_EXCEPTIONS"] = True

    # Configure logging
    # log_file = "app.log"
    # handler = RotatingFileHandler(log_file, maxBytes=10000, backupCount=3)
    # handler.setLevel(logging.ERROR)  # Log only errors
    # formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    # handler.setFormatter(formatter)
    # app.logger.addHandler(handler)

    # Log an info message when the app starts
    # app.logger.info("Flask application is starting")

    @app.before_request
    def initialize():
        if not hasattr(db, 'connection'):
            db.set_connection(app.config['DATABASE_URL'])

    # Register your API blueprints
    app.register_blueprint(data_api_endpoints, url_prefix='/ati/data-api/v1')
    app.register_blueprint(react_pages, url_prefix='/ati')

    # Serve React App for non-API routes under /ati-explorer

    return app
