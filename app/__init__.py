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
    # Install the 10 MB rotating file log and funnel stdout/stderr into it FIRST, before
    # anything starts printing — otherwise the app's print()/traceback.print_exc() output
    # floods the unbounded wfastcgi stdout capture (see app/logging_config.py).
    from app.logging_config import configure_logging
    configure_logging()
    from datetime import timedelta
    from flask import Flask
    from flask_cors import CORS
    from neomodel import config, db
    from app.endpoints.data_api import data_api_endpoints
    from app.endpoints.react_endpoints import react_pages
    from app.auth import auth_endpoints
    from app.auth.authz import parse_admins
    from app.auth.guard import require_login
    from app.web_config import Config

    app = Flask(__name__,
                static_folder='frontend/src/build/static',
                template_folder='frontend/src/build',
                )

    # CORS with credentials for the React dev server. A wildcard origin is
    # illegal once credentials are allowed, so the origins are an explicit
    # allowlist. (The primary dev path is the CRA proxy, which is same-origin
    # and doesn't need CORS at all — this is the fallback.)
    cors_origins = os.environ.get(
        'CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'
    ).split(',')
    CORS(app, supports_credentials=True, origins=cors_origins)

    # Load configuration from object
    app.config.from_object(Config)

    # Set up database connection
    config.DATABASE_URL = app.config['DATABASE_URL']

    is_production = os.environ.get('FLASK_ENV', 'development') == 'production'

    # Sessions are signed cookies, so the secret MUST be identical across the
    # IIS FastCGI worker processes — a per-process random key would log users
    # out whenever a different worker handled the request. Production
    # (FLASK_ENV=production) therefore requires a real, high-entropy
    # FLASK_SECRET_KEY; dev falls back to a fixed constant so sessions survive
    # reloader restarts.
    secret = os.environ.get('FLASK_SECRET_KEY')
    # A signed-cookie secret that anyone can guess defeats AUTH_ENFORCED
    # entirely: an attacker can forge an admin session cookie. Reject empty,
    # known-placeholder, and low-entropy values in production and fail closed at
    # boot, rather than running silently compromised. The web.config placeholder
    # is checked into source control, so it MUST be on this denylist.
    insecure_secrets = {
        'PASTE-GENERATED-SECRET',
        'ati-dev-only-secret-not-for-production',
        'changeme',
        'secret',
    }
    if is_production:
        if not secret or secret.strip() in insecure_secrets or len(secret.strip()) < 32:
            raise RuntimeError(
                'FLASK_SECRET_KEY is missing, a known placeholder, or too short '
                'for production. Generate one with '
                '`python -c "import secrets; print(secrets.token_hex(32))"` and set '
                'it in the deployed web.config appSettings (and app/.env.production '
                'for local prod runs).'
            )
    elif not secret:
        secret = 'ati-dev-only-secret-not-for-production'
    app.config['SECRET_KEY'] = secret

    # Session cookie hardening. SESSION_COOKIE_SECURE stays 0 until the IIS
    # site has an HTTPS binding — flipping it on over plain HTTP would make
    # the browser drop the cookie entirely.
    app.config['SESSION_COOKIE_NAME'] = 'ati_session'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = os.environ.get('SESSION_COOKIE_SECURE', '0') == '1'
    app.config['SESSION_COOKIE_PATH'] = '/ati'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(
        hours=int(os.environ.get('AUTH_SESSION_HOURS', '12'))
    )

    # Auth behavior. AUTH_ENFORCED is the global kill-switch: off (default,
    # for dev and staged rollout) makes the route guard a no-op and the
    # frontend gate transparent; deployment flips it on in web.config.
    app.config['AUTH_ENFORCED'] = os.environ.get('AUTH_ENFORCED', '0') == '1'
    app.config['AUTH_PROVIDER'] = os.environ.get('AUTH_PROVIDER', 'local')
    app.config['AUTH_ADMINS'] = parse_admins(os.environ.get('AUTH_ADMINS'))
    app.config['AUTH_ALLOWED_USERS'] = parse_admins(os.environ.get('AUTH_ALLOWED_USERS'))

    # Debug surfaces are gated on environment. In production (FLASK_ENV=production)
    # Flask debug, the debug-toolbar profiler, and exception propagation are all
    # OFF, so tracebacks and the interactive debugger never reach a browser and the
    # Exception handler registered in app/wsgi.py returns a clean 500. Dev keeps
    # them on. (Pair this with httpErrors errorMode="DetailedLocalOnly" in web.config
    # so IIS doesn't leak its own detailed error pages to remote clients either.)
    app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    app.config['DEBUG_TB_PROFILER_ENABLED'] = not is_production
    app.config["DEBUG"] = not is_production
    app.config["PROPAGATE_EXCEPTIONS"] = not is_production

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
