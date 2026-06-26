"""
Feature: transcript annotation — attach Notes to YSE / implementations (write-gated).

The write complement to the discovery queries (``yse_catalog_for_year``, ``search_implementations``,
``search_success_indicators`` in the registry). An agent dissecting a meeting transcript resolves a
mention to a YSE ``year_identifier`` or an implementation ``(unique_id, type)``, then calls one of
these tools to record a note against it.

  annotate_yse(year_identifier, content, ...)            -> Note -[:has_note]-> attached to the YSE
  annotate_implementation(impl_id, impl_type, content,   -> Note -[:is_documented_by]-> attached to
                          academic_year, ...)                the implementation, year-scoped

Independence (same rule as ontology_write): each tool only CALLS the sanctioned queries function
``add_note`` (the very one the Flask ``POST /documents`` endpoint and the React NotesViewer use). No
CRUD logic lives here, and the queries layer never imports this package. ``add_note`` is imported
INSIDE the tool body, after ``ensure_app()``, so registration stays app-free and the warm-up /
circular-import rule is honored.

Gating: registers ONLY when ATI_MCP_ALLOW_WRITE is on (mirrors ontology_write and the write-mode
registry queries). All descriptions are prefixed [WRITE].

Unique-name guard (important): ``Note.name`` is unique-indexed and ``add_note`` reuses any existing
note with a matching name. To keep auto-annotation safe we generate a deterministic name from
``(content, target)`` — re-running the same transcript is idempotent, while the same text on a
different target stays a distinct note. Callers may override with an explicit ``name``.
"""

import hashlib
import re
from datetime import date
from typing import Optional

from ._appbootstrap import ensure_app

NAME = "notes_write"


def _slug(text: str, limit: int = 48) -> str:
    """A short, filesystem/identifier-friendly slug from arbitrary text."""
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:limit].strip("-") or "note"


def _generate_name(content: str, title: Optional[str], target_handle: str) -> str:
    """Deterministic, collision-resistant note name: slug + target + content hash.

    Same (content, target) -> same name (idempotent re-runs); the content hash keeps two
    different annotations distinct even when their titles collide, and target_handle keeps the
    same text on different targets separate.
    """
    digest = hashlib.sha1(content.encode("utf-8")).hexdigest()[:8]
    return f"{_slug(title or content)}-{target_handle}-{digest}"


def _build_note_dict(
    content: str,
    title: Optional[str],
    target_handle: str,
    date_created: Optional[str],
    name: Optional[str],
) -> dict:
    if not content or not content.strip():
        raise ValueError("content is required and cannot be empty")
    return {
        "name": name or _generate_name(content, title, target_handle),
        "content": content,
        "date_created": date_created or date.today().isoformat(),
        "include_in_report": True,
    }


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def annotate_yse(
        year_identifier: str,
        content: str,
        title: Optional[str] = None,
        date_created: Optional[str] = None,
        name: Optional[str] = None,
    ) -> dict:
        """Attach a note to a YearSuccessEvidence (via has_note). `year_identifier` is the YSE key
        from yse_catalog_for_year (e.g. '2025-2026-1.1-web-sfsu'). Idempotent for identical content."""
        ensure_app()
        from app.database.queries.documentation.create import add_note
        note_dict = _build_note_dict(content, title, f"yse:{year_identifier}", date_created, name)
        add_note(note_dict, year_success_evidence=year_identifier)
        return {"ok": True, "note_name": note_dict["name"], "attached_to": year_identifier}

    def annotate_implementation(
        implementation_id: str,
        implementation_type: str,
        content: str,
        academic_year: str,
        title: Optional[str] = None,
        include_in_year: bool = True,
        name: Optional[str] = None,
    ) -> dict:
        """Attach a note to an implementation (via is_documented_by, year-scoped). `implementation_id`
        and `implementation_type` come from search_implementations (type is e.g. 'Process'/'Project').
        `academic_year` (e.g. '2025-2026') sets the DocumentedByRel year inclusion."""
        ensure_app()
        from app.database.queries.documentation.create import add_note
        note_dict = _build_note_dict(
            content, title, f"impl:{implementation_type}:{implementation_id}", None, name
        )
        add_note(
            note_dict,
            implementation_id=implementation_id,
            implementation_type=implementation_type,
            academic_year=academic_year,
            include_in_year=include_in_year,
        )
        return {
            "ok": True,
            "note_name": note_dict["name"],
            "attached_to": {
                "implementation_id": implementation_id,
                "implementation_type": implementation_type,
                "academic_year": academic_year,
                "included": include_in_year,
            },
        }

    tools = [
        (annotate_yse, "annotate_yse",
         "Attach a note (annotation) to a YearSuccessEvidence by its year_identifier."),
        (annotate_implementation, "annotate_implementation",
         "Attach a year-scoped note (annotation) to an implementation by its unique_id + type."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description="[WRITE] " + desc)
