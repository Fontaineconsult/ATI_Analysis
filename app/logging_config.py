"""
Rotating file logging for the ATI app.

WHY: in production the app runs under IIS FastCGI (wfastcgi), which captures the
process's stdout/stderr into a single WSGI_LOG file (web.config). With WSGI_DEBUG=1 that
file recorded every request AND every print()/traceback.print_exc(); a recurring 500
dumping a full traceback per request ballooned it to ~800 MB with no rotation.

This installs a size-rotating file handler (default 10 MB × 5 backups) on the root logger
so anything sent through Python `logging` rotates. Two deliberate non-goals keep it safe:

  * It does NOT reassign sys.stdout / sys.stderr. Under FastCGI those streams are part of
    how wfastcgi talks to IIS and how WSGI errors are reported; swapping them for a shim
    breaks request handling (500s) and hides the error. Bare print()/traceback.print_exc()
    therefore still go to the wfastcgi log — which is fine now that WSGI_DEBUG=0 keeps that
    file small and readable. (Migrating those call sites to `logging` is a separate cleanup.)
  * It never raises. Logging setup must not take down app boot.

IIS FastCGI runs several worker processes and RotatingFileHandler is NOT multiprocess-safe,
so each process writes its own PID-named file: app-<pid>.log, app-<pid>.log.1, …

Tunables (env vars): ATI_LOG_DIR, ATI_LOG_BASENAME, ATI_LOG_MAX_BYTES, ATI_LOG_BACKUPS,
ATI_LOG_LEVEL.
"""
import logging
import os
import sys
from logging.handlers import RotatingFileHandler


def configure_logging():
    """Install the 10 MB rotating file handler on the root logger.

    OPT-IN: by default this is a no-op, so the app uses wfastcgi's built-in WSGI_LOG
    (web.config) as its single, reliable log — which is the right tool under FastCGI. Set
    ATI_ROTATING_LOG=1 to ALSO write a bounded, rotating app-<pid>.log and route
    traceback.print_exc() into it (useful once you want WSGI_LOG kept small).

    Idempotent (safe across repeated create_app() calls). A no-op under pytest so test
    output capture is untouched. Never raises — and never reassigns sys.stdout/stderr.
    """
    if "pytest" in sys.modules:
        return

    # Default: stay out of the way and let WSGI_LOG be the single source of truth.
    if os.environ.get("ATI_ROTATING_LOG") != "1":
        return

    root = logging.getLogger()
    if getattr(root, "_ati_logging_configured", False):
        return

    try:
        log_dir = os.environ.get("ATI_LOG_DIR") or os.path.dirname(os.path.dirname(__file__))
        basename = os.environ.get("ATI_LOG_BASENAME", "app.log")
        stem, ext = os.path.splitext(basename)
        log_path = os.path.join(log_dir, f"{stem}-{os.getpid()}{ext or '.log'}")
        max_bytes = int(os.environ.get("ATI_LOG_MAX_BYTES", 10 * 1024 * 1024))  # 10 MB
        backup_count = int(os.environ.get("ATI_LOG_BACKUPS", 5))
        level = getattr(logging, os.environ.get("ATI_LOG_LEVEL", "INFO").upper(), logging.INFO)

        os.makedirs(log_dir, exist_ok=True)
        root.setLevel(level)

        formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s [pid %(process)d]: %(message)s")
        file_handler = RotatingFileHandler(
            log_path, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8", delay=True
        )
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)

        # Tame chatty libraries so the rotating file isn't dominated by them.
        logging.getLogger("neo4j").setLevel(logging.WARNING)
        logging.getLogger("neobolt").setLevel(logging.WARNING)
        logging.getLogger("werkzeug").setLevel(logging.WARNING)

        # The endpoints diagnose 500s with bare `traceback.print_exc()`, which writes to
        # stdout -> the unbounded wfastcgi capture. Route those into the rotating log
        # instead (one contained shim, vs. editing every endpoint), so 500 tracebacks are
        # bounded and readable. This touches only the diagnostic helper, never sys.stdout,
        # so it is safe under FastCGI.
        import traceback as _traceback
        _exc_logger = logging.getLogger("traceback")

        def _print_exc_to_log(*_args, **_kwargs):
            _exc_logger.error("Exception:\n%s", _traceback.format_exc())

        _traceback.print_exc = _print_exc_to_log

        root._ati_logging_configured = True
        logging.getLogger("ati").info(
            "Rotating log configured: %s (maxBytes=%d, backups=%d, level=%s)",
            log_path, max_bytes, backup_count, logging.getLevelName(level),
        )
    except Exception as e:  # never let logging setup crash the app
        try:
            sys.stderr.write(f"WARNING: rotating-log setup failed, continuing without it: {e}\n")
        except Exception:
            pass
