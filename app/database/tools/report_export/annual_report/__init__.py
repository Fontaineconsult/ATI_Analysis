"""Annual status report: one campus, one academic year, every indicator, as a Word document.

Three layers, each usable on its own:

    model.py          builds the report model from the graph (the only layer that reads Neo4j)
    theme.py          the visual system: palette, type, spacing, status scale
    docx_renderer.py  turns a model into a .docx with python-docx

Run:
    python -m app.database.tools.report_export.annual_report --year 2025-2026 [--campus sfsu] [--out DIR]

This is an app admin tool under app/database/tools/, the sanctioned Python path for a
read of this size. It uses the app's own connection and the same single-indicator query
the dashboard report view renders, so the document and the screen agree. Read-only.
"""
