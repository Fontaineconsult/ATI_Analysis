# web_config.py
#
# Flask configuration as the idiomatic class hierarchy: a BaseConfig holding the
# values shared across environments, and ProductionConfig / DevelopmentConfig /
# TestingConfig carrying only the per-environment deltas. create_app() selects one
# with app.config.from_object(...) — Flask loads only UPPERCASE attributes.
#
# Values are SOURCED from the single config gateway (app/config_gateway.py), which
# resolves each key from os.environ -> web.config -> .env -> default. This module only
# declares them; the gateway decides where they come from.
from datetime import timedelta

from app.config_gateway import config


class BaseConfig:
    # --- static, environment-independent ---
    THREADED = True
    SESSION_COOKIE_NAME = 'ati_session'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_PATH = '/ati'

    # --- sourced from the gateway (same resolution in every environment) ---
    # SECRET_KEY is finalized in create_app (_finalize_secret): production fails closed
    # on a missing/placeholder/short key; dev falls back to a fixed constant.
    SECRET_KEY = config.get('FLASK_SECRET_KEY')
    SESSION_COOKIE_SECURE = config.get_bool('SESSION_COOKIE_SECURE', False)
    PERMANENT_SESSION_LIFETIME = timedelta(hours=config.get_int('AUTH_SESSION_HOURS', 12))

    DATABASE_URL = config.get('DATABASE_URL')
    NEO4J_DATABASE = config.get('NEO4J_DATABASE', 'neo4j')
    FLASK_RUN_PORT = config.get_int('FLASK_RUN_PORT', 5000)

    CORS_ORIGINS = config.get_list('CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000'])

    AUTH_ENFORCED = config.get_bool('AUTH_ENFORCED', False)
    AUTH_PROVIDER = config.get('AUTH_PROVIDER', 'local')
    # Raw comma-separated strings; create_app parses them to frozensets (parse_admins).
    # Parsing lives in the factory, not here, to avoid importing app.auth into this
    # module (the circular-import trap — see CLAUDE.md).
    AUTH_ADMINS = config.get('AUTH_ADMINS')
    AUTH_ALLOWED_USERS = config.get('AUTH_ALLOWED_USERS')


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False
    # Explicit so deployment/wsgi.py's handler returns a clean 500 (Flask would also
    # derive False here, since DEBUG/TESTING are off).
    PROPAGATE_EXCEPTIONS = False


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False
    PROPAGATE_EXCEPTIONS = True


class TestingConfig(BaseConfig):
    # For explicit use via create_app(TestingConfig). The existing test suite instead
    # calls create_app() and overrides TESTING / AUTH_* on app.config after creation.
    DEBUG = False
    TESTING = True
    PROPAGATE_EXCEPTIONS = True


def select_config():
    """The config class for the current environment (production vs development),
    decided by the gateway. Pass an explicit class to create_app() to override."""
    return ProductionConfig if config.is_production else DevelopmentConfig
