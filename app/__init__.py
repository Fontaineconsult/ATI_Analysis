from urllib.parse import urlencode


def merge_query_params(*dict1):
    print(dict1)
    return urlencode(dict1)


def _finalize_secret(app, is_production):
    """Resolve the signing secret: production fails closed on a missing/placeholder/
    short key; development falls back to a fixed constant so sessions survive reloads.
    This is factory logic (not a config-class value) because it raises and mutates.
    The secret MUST be identical across IIS FastCGI workers — a per-process random key
    would log users out whenever a different worker served the request."""
    secret = app.config.get('SECRET_KEY')
    insecure_secrets = {
        'PASTE-GENERATED-SECRET',
        'ati-dev-only-secret-not-for-production',
        'changeme',
        'secret',
    }
    if is_production:
        if not secret or secret.strip() in insecure_secrets or len(secret.strip()) < 32:
            raise RuntimeError(
                'FLASK_SECRET_KEY is missing, a known placeholder, or too short for '
                'production. Generate one with '
                '`python -c "import secrets; print(secrets.token_hex(32))"` and set it '
                'in the deployed web.config appSettings.'
            )
    elif not secret:
        app.config['SECRET_KEY'] = 'ati-dev-only-secret-not-for-production'


def create_app(config_object=None):
    # All project-internal imports are deferred to here.
    # Hoisting them to module scope causes a circular load: any module
    # that does `from app.X import Y` triggers app/__init__.py, which
    # would in turn import graph_schema via the Flask blueprints — and
    # if graph_schema is being run as __main__ at the same time, neomodel
    # raises NodeClassAlreadyDefined.
    # Bootstrap configuration FIRST: importing the gateway resolves settings from
    # web.config (production) / .env (development) and hydrates os.environ, so
    # everything below — logging, the secret check, auth — reads one source.
    from app.config_gateway import config
    # Install the 10 MB rotating file log and funnel stdout/stderr into it before
    # anything starts printing — otherwise the app's print()/traceback.print_exc() output
    # floods the unbounded wfastcgi stdout capture (see app/logging_config.py).
    from app.logging_config import configure_logging
    configure_logging()
    from flask import Flask
    from flask_cors import CORS
    from neomodel import get_config, db
    from app.endpoints.data_api import data_api_endpoints
    from app.endpoints.react_endpoints import react_pages
    from app.auth import auth_endpoints
    from app.auth.authz import parse_admins
    from app.auth.guard import require_login
    from app.web_config import select_config

    app = Flask(__name__,
                static_folder='frontend/src/build/static',
                template_folder='frontend/src/build',
                )

    # Load configuration: pick this environment's config class (Production/Development)
    # and let Flask load its UPPERCASE attributes. Every value is declared in
    # web_config.py; the gateway is their source. Loaded FIRST so extensions (CORS)
    # read from app.config. Pass config_object to override (e.g. TestingConfig) in tests.
    app.config.from_object(config_object or select_config())

    # Finalize the two things that are logic, not declarative values:
    #  - the signing secret (dev fallback + production fail-closed validation), and
    #  - the auth lists (raw comma string -> frozenset). Parsed here, not in
    #    web_config.py, to avoid importing app.auth there (circular-import trap).
    _finalize_secret(app, config.is_production)
    app.config['AUTH_ADMINS'] = parse_admins(app.config['AUTH_ADMINS'])
    app.config['AUTH_ALLOWED_USERS'] = parse_admins(app.config['AUTH_ALLOWED_USERS'])

    # neomodel connection config, driven by app.config (set once per worker; the
    # @before_request guard below opens the actual connection).
    get_config().database_name = app.config['NEO4J_DATABASE']
    get_config().database_url = app.config['DATABASE_URL']

    # CORS with credentials for the React dev server. A wildcard origin is illegal
    # once credentials are allowed, so origins are an explicit allowlist (resolved in
    # config). The primary dev path is the same-origin CRA proxy; this is the fallback.
    CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'])

    # Logging (10 MB rotating file + stdout/stderr funnel) is configured at the top of
    # create_app() via app.logging_config.configure_logging().

    @app.before_request
    def initialize():
        if not hasattr(db, 'connection'):
            db.set_connection(app.config['DATABASE_URL'])

    # Route protection: every data-api request passes through the auth guard
    # (a no-op while AUTH_ENFORCED is off). Attached here rather than in
    # data_api/__init__.py to keep that module a bare blueprint declaration
    # (see the circular-import note in CLAUDE.md). Must be attached BEFORE
    # register_blueprint, and exactly once — create_app() runs repeatedly in
    # tests against this module-level blueprint singleton. The react_pages
    # catch-all stays public — the login page has to render from somewhere.
    if not getattr(data_api_endpoints, '_auth_guard_attached', False):
        data_api_endpoints.before_request(require_login)
        data_api_endpoints._auth_guard_attached = True

    # Register your API blueprints
    app.register_blueprint(auth_endpoints, url_prefix='/ati/auth/v1')
    app.register_blueprint(data_api_endpoints, url_prefix='/ati/data-api/v1')
    app.register_blueprint(react_pages, url_prefix='/ati')

    # Serve React App for non-API routes under /ati-explorer

    return app
