"""Content addressing — SHA-256 over a binary stream.

Same algorithm as app/database/tools/support_functions.get_file_hash, but over an
already-open stream (an upload) rather than a path on disk.
"""
import hashlib

_CHUNK = 65536


def sha256_of_stream(stream):
    """Read ``stream`` to EOF; return ``(hexdigest, total_size)``.

    Does not seek — the caller rewinds (``stream.seek(0)``) before re-reading it to
    write the bytes out.
    """
    h = hashlib.sha256()
    size = 0
    for chunk in iter(lambda: stream.read(_CHUNK), b""):
        h.update(chunk)
        size += len(chunk)
    return h.hexdigest(), size
