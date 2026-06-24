# web_config.py
#
# Flask's view of the configuration. All values are sourced from the single
# config gateway (app/config_gateway.py), which resolves them from os.environ /
# web.config / .env in priority order. This module no longer reads the
# environment or loads .env files directly — importing the gateway is what
# hydrates os.environ, and the Config attributes below are just typed reads.
from neomodel import get_config

from app.config_gateway import config

# neomodel's default database name comes from the same single source.
get_config().database_name = config.get('NEO4J_DATABASE', 'neo4j')


class Config:
    FLASK_APP = config.get('FLASK_APP', 'application.py')
    FLASK_ENV = config.env_name
    # DEBUG/TESTING default to False: a production worker with no DEBUG key in
    # web.config must NOT silently run in debug. Dev opts in via .env.development.
    DEBUG = config.get_bool('DEBUG', False)
    TESTING = config.get_bool('TESTING', False)
    FLASK_RUN_PORT = config.get_int('FLASK_RUN_PORT', 5000)
    THREADED = True
    DATABASE_URL = config.get('DATABASE_URL')
    NEO4J_DATABASE = config.get('NEO4J_DATABASE')
