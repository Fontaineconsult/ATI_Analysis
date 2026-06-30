"""File-storage subsystem.

A single controller the app connects through (``storage``), with pluggable backends
selected by ``FS_PROVIDER``. Files are content-addressed (SHA-256). See
``app/fs/controller.py`` and ``app/fs/base.py``.
"""
from .base import ObjectStat, StorageBackend
from .controller import StorageController, storage
from .errors import (
    BackendError,
    ObjectNotFound,
    StorageError,
    StorageValidationError,
)

__all__ = [
    "storage",
    "StorageController",
    "StorageBackend",
    "ObjectStat",
    "StorageError",
    "ObjectNotFound",
    "StorageValidationError",
    "BackendError",
]
