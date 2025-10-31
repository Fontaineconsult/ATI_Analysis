import os
import sys
import logging
import traceback
from datetime import datetime

# Add paths for imports
sys.path.insert(0, r"C:\www\ati")
sys.path.insert(0, r"C:\www\ati\app")

# Setup logging with IIS compatibility
app_dir = os.path.dirname(os.path.abspath(__file__))
log_dir = os.path.join(app_dir, 'logs')

# Try to create logs directory with fallback
try:
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    log_file = os.path.join(log_dir, f'wfastcgi.log')
except Exception:
    # Fallback to same directory as wfastcgi.log
    log_dir = r"C:\www\ati"
    log_file = os.path.join(log_dir, f'wfastcgi.log')

# Configure logging - ERROR level only
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a')
    ]
)

logger = logging.getLogger(__name__)

try:
    from app import create_app
    app = create_app()

    @app.errorhandler(Exception)
    def handle_exception(e):
        error_msg = f"Unhandled exception: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)

        # Return detailed error in debug mode
        if app.config.get('DEBUG'):
            return f"<pre>{error_msg}</pre>", 500
        return "Internal Server Error", 500

    # Remove the @app.before_request logger since it uses debug level

    # CRITICAL FOR IIS: This is what wfastcgi imports
    application = app

except Exception as e:
    error_msg = f"Failed to start application: {str(e)}\n{traceback.format_exc()}"
    logger.error(error_msg)  # This WILL be logged (it's ERROR level)

    # Also write to startup_error.txt for visibility
    try:
        with open(r"C:\www\ati\startup_error.txt", 'w') as f:
            f.write(error_msg)
    except:
        pass

    raise

# This won't run under IIS, only for direct testing
if __name__ == '__main__':
    try:
        app.run(host="127.0.0.1",
                port=app.config.get('FLASK_RUN_PORT', 5000),
                threaded=app.config.get('THREADED', True),
                debug=True)
    except Exception as e:
        logger.error(f"Failed to run Flask app: {str(e)}\n{traceback.format_exc()}")
        raise