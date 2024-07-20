# config.py
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', '.env')
load_dotenv(dotenv_path)


class Config:
    FLASK_APP = os.environ.get('FLASK_APP', 'application.py')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = os.environ.get('DEBUG', 'True')
    TESTING = os.environ.get('TESTING', 'True')
    FLASK_RUN_PORT = int(os.environ.get('FLASK_RUN_PORT', 5000))
    THREADED = True
    DATABASE_URL = os.environ.get('database_url')