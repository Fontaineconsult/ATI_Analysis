# config.py
import os

class Config:
    FLASK_APP = os.environ.get('FLASK_APP', 'application.py')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = os.environ.get('DEBUG', 'True')
    TESTING = os.environ.get('TESTING', 'True')
    FLASK_RUN_PORT = int(os.environ.get('FLASK_RUN_PORT', 5000))
    THREADED = True

    DATABASE_URL = os.environ.get('DATABASE_URL', 'bolt://neo4j:testtest@localhost:7687')