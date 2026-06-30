"""Graph queries for managed files (StoredFile nodes).

StoredFile is the graph-side registration of a blob held by the app/fs storage
subsystem (content-addressed by SHA-256). Records that have an uploaded file
(Document / Message / Metric) point at a StoredFile via `has_file`.
"""
