# web_config.py
import os
from dotenv import load_dotenv

# Determine the base directory
base_dir = os.path.dirname(__file__)
print(base_dir)
# Get the environment name (default to 'development')
env_name = os.environ.get('FLASK_ENV', 'development')

# Construct the path to the .env file
dotenv_path = os.path.join(base_dir, f'.env.{env_name}')

# Load the .env file
load_dotenv(dotenv_path)
print(os.environ.get('DATABASE_URL'))
class Config:
    FLASK_APP = os.environ.get('FLASK_APP', 'application.py')
    FLASK_ENV = env_name
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'
    TESTING = os.environ.get('TESTING', 'True') == 'True'
    FLASK_RUN_PORT = int(os.environ.get('FLASK_RUN_PORT', 5000))
    THREADED = True
    DATABASE_URL = os.environ.get('DATABASE_URL')
