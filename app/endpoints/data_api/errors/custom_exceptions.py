# Custom Exceptions
#
# Every error raised across the CRUD / database / API layers funnels through one
# of the classes below. Rather than add a logging call to each of the 600+ raise
# sites, the exceptions log THEMSELVES on construction. This guarantees uniform
# coverage no matter who raises them — endpoint, query module, one-off script, or
# MCP tool — and regardless of whether the caller later catches and swallows them.
#
# Levels reflect intent, not just severity:
#   * CrudError / ApiError / DatabaseError  -> ERROR  (server faults / bugs)
#   * NotFoundError / ValidationError       -> INFO   (expected 404 / 400 client
#                                                       outcomes, not server bugs)
#
# A full traceback is attached only when the exception is constructed inside an
# active `except` block (e.g. `except Exception: raise CrudError(...)`), so the
# root cause's stack is captured. Raised outside one (e.g. `raise NotFoundError`
# on an empty result), it logs just the message — no misleading "NoneType: None".
import logging
import sys

_logger = logging.getLogger("ati.errors")


def _log_exception(exc, message, level):
    """Emit a single log record for a custom exception at construction time."""
    has_active_exc = sys.exc_info()[0] is not None
    _logger.log(level, "%s: %s", type(exc).__name__, message, exc_info=has_active_exc)


class DatabaseError(Exception):
    """Base class for errors raised during database operations."""
    _log_level = logging.ERROR

    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception
        _log_exception(self, message, self._log_level)


class NotFoundError(DatabaseError):
    """Raised when a requested resource is not found in the database."""
    _log_level = logging.INFO  # expected client outcome (404), not a server fault


class ValidationError(DatabaseError):
    """Raised when invalid data is provided for a database operation."""
    _log_level = logging.INFO  # expected client outcome (400), not a server fault


class CrudError(Exception):
    """Raised in the CRUD layer when database operations fail."""
    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception
        _log_exception(self, message, logging.ERROR)


class ApiError(Exception):
    """Raised in the API layer when handling requests."""
    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception
        _log_exception(self, message, logging.ERROR)
