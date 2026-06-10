import sys
import logging

# Add paths for imports (deployed layout under C:\www\ati).
sys.path.insert(0, r"C:\www\ati")
sys.path.insert(0, r"C:\www\ati\app")

# Log to STDERR only — do NOT attach a FileHandler to C:\www\ati\wfastcgi.log here.
# wfastcgi already owns that file as WSGI_LOG and opens it for exclusive write; a second
# handle to it fails with PermissionError (sharing violation), which crashes this handler's
# import and 500s every request (the root cause we just diagnosed). wfastcgi captures
# stderr into WSGI_LOG, so logging to stderr still lands in wfastcgi.log — without the
# competing file handle.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)],
)

logger = logging.getLogger(__name__)

# Optional structured logging to a local Seq server, if one is running. Guarded so a
# missing/unreachable Seq never breaks startup.
try:
    from seqlog.structured_logging import SeqLogHandler
    seq_handler = SeqLogHandler('http://localhost:5341', api_key=None)
    seq_handler.setLevel(logging.INFO)
    logging.getLogger().addHandler(seq_handler)
except Exception as e:
    logger.warning(f"Seq logging unavailable, continuing without it: {e}")

try:
    from app import create_app
    from flask import request, has_request_context

    app = create_app()

    @app.errorhandler(Exception)
    def handle_exception(e):
        extra = {}
        if has_request_context():
            extra = {'RequestPath': request.path, 'RequestMethod': request.method}
        # exc_info=True records the full traceback into WSGI_LOG (via stderr).
        logger.error(f"Unhandled exception: {e}", exc_info=True, extra=extra)
        return "Internal Server Error", 500

    application = app
    logger.info("ATI application initialized")

except Exception as e:
    logger.error(f"Failed to start application: {e}", exc_info=True)
    raise
