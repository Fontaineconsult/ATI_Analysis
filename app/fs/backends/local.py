"""Local-filesystem backend.

Stores content-addressed blobs on the server's disk (the Windows/IIS host's writable
data dir, ``FS_LOCAL_ROOT``). Writes are atomic: stream to a temp file under
``<root>/.tmp`` then ``os.replace`` onto the final path on the same volume. A sidecar
``<key>.meta.json`` holds content_type/size/created so the backend is self-contained
for downloads (no graph dependency in this phase).
"""
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from ..base import ObjectStat, StorageBackend
from ..errors import BackendError, ObjectNotFound

_CHUNK = 65536


class LocalFileSystemBackend(StorageBackend):
    def __init__(self, root):
        self.root = Path(root)
        self._tmp = self.root / ".tmp"
        try:
            self._tmp.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            raise BackendError(f"cannot create storage root {self.root}: {e}")

    # Blobs are sharded by the first two byte-pairs of the key so no directory grows
    # unbounded: <root>/ab/cd/<key>.
    def _blob(self, key):
        return self.root / key[:2] / key[2:4] / key

    def _meta(self, key):
        blob = self._blob(key)
        return blob.parent / (blob.name + ".meta.json")

    def save(self, key, stream, *, content_type=None) -> ObjectStat:
        dest = self._blob(key)
        if dest.exists():
            # Content-addressed: identical bytes are already stored.
            return self.stat(key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._tmp / f"{key}.{uuid.uuid4().hex}.part"
        size = 0
        try:
            with open(tmp, "wb") as fh:
                for chunk in iter(lambda: stream.read(_CHUNK), b""):
                    fh.write(chunk)
                    size += len(chunk)
            os.replace(tmp, dest)   # atomic on the same volume
        except OSError as e:
            try:
                os.remove(tmp)
            except OSError:
                pass
            raise BackendError(f"failed to write object {key}: {e}")

        created = datetime.now(timezone.utc).isoformat()
        try:
            with open(self._meta(key), "w", encoding="utf-8") as m:
                json.dump({"content_type": content_type, "size": size, "created": created}, m)
        except OSError:
            pass   # sidecar is best-effort; stat() falls back to os.stat for size
        return ObjectStat(key=key, size=size, content_type=content_type, created=created)

    def open(self, key):
        try:
            return open(self._blob(key), "rb")
        except FileNotFoundError:
            raise ObjectNotFound(key)

    def exists(self, key) -> bool:
        return self._blob(key).exists()

    def stat(self, key) -> ObjectStat:
        blob = self._blob(key)
        if not blob.exists():
            raise ObjectNotFound(key)
        meta = {}
        meta_path = self._meta(key)
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                meta = {}
        size = meta.get("size")
        if size is None:
            size = blob.stat().st_size
        return ObjectStat(
            key=key,
            size=size,
            content_type=meta.get("content_type"),
            created=meta.get("created"),
        )

    def delete(self, key) -> None:
        for path in (self._blob(key), self._meta(key)):
            try:
                path.unlink()
            except FileNotFoundError:
                pass
            except OSError as e:
                raise BackendError(f"failed to delete object {key}: {e}")

    def iter_keys(self):
        # Walk the two-level shard tree <root>/<ab>/<cd>/<key>, yielding blob names
        # (64-hex). Skips the .tmp staging dir and the .meta.json sidecars.
        import re
        key_re = re.compile(r"^[0-9a-f]{64}$")
        if not self.root.is_dir():
            return
        for shard1 in self.root.iterdir():
            if not shard1.is_dir() or shard1.name == ".tmp":
                continue
            for shard2 in shard1.iterdir():
                if not shard2.is_dir():
                    continue
                for blob in shard2.iterdir():
                    if blob.is_file() and key_re.match(blob.name):
                        yield blob.name
