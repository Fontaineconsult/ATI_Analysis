"""The storage interface.

One ``StorageBackend`` subclass per kind of file system the app connects to — local
Windows disk today, a UNC/SMB share, S3/Azure Blob, or a remote HTTP store later. The
StorageController picks one by ``FS_PROVIDER`` and delegates all I/O to it.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import BinaryIO, Optional


@dataclass(frozen=True)
class ObjectStat:
    """Metadata about a stored object."""
    key: str
    size: int
    content_type: Optional[str] = None
    created: Optional[str] = None   # ISO-8601 UTC, or None


class StorageBackend(ABC):
    """A pluggable file-system backend.

    Keys reaching a backend are opaque, already-validated identifiers (the controller
    guarantees a 64-char lowercase-hex SHA-256), so backends never handle raw user
    input and never need to defend against path traversal themselves.
    """

    @abstractmethod
    def save(self, key: str, stream: BinaryIO, *, content_type: Optional[str] = None) -> ObjectStat:
        """Persist the bytes from ``stream`` under ``key`` and return its stat.
        Content-addressed, so re-saving an existing key is a no-op (same key == same
        bytes)."""

    @abstractmethod
    def open(self, key: str) -> BinaryIO:
        """Open the object for streaming reads (caller closes). Raises ObjectNotFound."""

    @abstractmethod
    def exists(self, key: str) -> bool:
        ...

    @abstractmethod
    def stat(self, key: str) -> ObjectStat:
        """Return metadata. Raises ObjectNotFound if absent."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Remove the object. Idempotent — deleting a missing key is not an error."""

    @abstractmethod
    def iter_keys(self):
        """Yield the key of every stored object (used to reconcile disk against the
        graph during garbage collection)."""
