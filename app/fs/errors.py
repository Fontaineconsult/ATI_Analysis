"""Storage-layer exceptions — independent of the web/HTTP layer.

The HTTP endpoint (app/endpoints/data_api/files.py) translates these into status
codes; keeping them separate means the StorageController is reusable from non-HTTP
callers (scripts, the graph layer) without dragging in Flask error types.
"""


class StorageError(Exception):
    """Base for all storage failures."""


class ObjectNotFound(StorageError):
    """No stored object for the given key (-> 404)."""


class StorageValidationError(StorageError):
    """Bad input: malformed key, disallowed type, oversize (-> 400)."""


class BackendError(StorageError):
    """The backend failed to complete an operation (-> 500)."""
