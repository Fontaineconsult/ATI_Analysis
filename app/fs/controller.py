"""The storage controller — the single facade the application connects through.

Picks a StorageBackend by ``FS_PROVIDER`` (read from the config gateway, so it works
outside a Flask request context too — scripts, the graph layer), computes
content-addressed keys (SHA-256), validates keys against path traversal, and delegates
the actual I/O to the backend. Use the module-level ``storage`` singleton::

    from app.fs import storage
    stat = storage.save(file_stream, content_type="application/pdf")
    with storage.open(stat.key) as fh:
        ...
"""
import re
from pathlib import Path

from app.config_gateway import config

from .errors import StorageValidationError
from .hashing import sha256_of_stream

# A valid key is exactly a lowercase-hex SHA-256 digest. Anything else (especially
# path separators / '..') is rejected before it can reach a backend.
_KEY_RE = re.compile(r"^[0-9a-f]{64}$")


class StorageController:
    def __init__(self):
        self._backend = None

    @property
    def backend(self):
        if self._backend is None:
            self._backend = self._make_backend(config.get("FS_PROVIDER", "local"))
        return self._backend

    def _make_backend(self, name):
        if name == "local":
            from .backends.local import LocalFileSystemBackend
            root = config.get("FS_LOCAL_ROOT", self._dev_default_root())
            return LocalFileSystemBackend(root)
        raise StorageValidationError(f"unknown FS_PROVIDER: {name!r}")

    @staticmethod
    def _dev_default_root():
        # app/data/files (gitignored) — mirrors the in-repo dev default of the auth store.
        return str(Path(__file__).resolve().parent.parent / "data" / "files")

    # --- the API the app connects through ---

    def save(self, stream, *, content_type=None):
        """Store the bytes from ``stream`` and return their ObjectStat. The key is the
        content's SHA-256, so identical bytes dedupe to one stored object."""
        key, _size = sha256_of_stream(stream)
        try:
            stream.seek(0)
        except (OSError, ValueError):
            raise StorageValidationError("upload stream is not rewindable")
        if self.backend.exists(key):
            return self.backend.stat(key)   # dedup
        return self.backend.save(key, stream, content_type=content_type)

    def open(self, key):
        return self.backend.open(self._validate(key))

    def stat(self, key):
        return self.backend.stat(self._validate(key))

    def exists(self, key):
        return self.backend.exists(self._validate(key))

    def delete(self, key):
        self.backend.delete(self._validate(key))

    def iter_keys(self):
        """Yield the key of every stored blob (for GC / reconciliation)."""
        return self.backend.iter_keys()

    @staticmethod
    def _validate(key):
        if not (isinstance(key, str) and _KEY_RE.match(key)):
            raise StorageValidationError("invalid storage key")
        return key


# The singleton the app connects through.
storage = StorageController()
