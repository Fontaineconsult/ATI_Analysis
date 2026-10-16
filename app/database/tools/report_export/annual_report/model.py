"""The report model: a campus-year reduced to what the document renders.

``build_campus_year_report`` enumerates every YearSuccessEvidence for one campus and one
academic year, fetches each indicator through ``get_indicator_report`` (the query behind
the dashboard's report view, which already applies the include-in-report and year
curation rules server-side), and reduces each payload to a flat, documented shape.

The reducer is pure: ``reduce_indicator`` takes a payload dict and returns a dict, so it
is testable without a database. Only ``build_campus_year_report`` and the two ``list_*``
helpers touch Neo4j, and they do so through neomodel, which is the app's own path.

Inclusion rules, restated so the document can say them in its method note:
    - notes, messages, metrics, documents, webpages, plans: shown unless the node opts
      out with include_in_report = False (year curation on a documentation link wins);
    - retired implementations stay, marked retired, because the evidence chain is
      historical;
    - depreciated documents and dead webpages are dropped by the query layer;
    - removed indicators are skipped unless asked for.
"""
from __future__ import annotations

from datetime import date
from typing import Callable, Optional

from app.data_config import WORKING_GROUP_DEFS, status_levels

STATUS_ORDER: list[str] = list(status_levels)
WORKING_GROUP_ORDER: list[dict] = [d for d in WORKING_GROUP_DEFS if d["has_indicators"]]
_WG_BY_NAME = {d["name"]: d for d in WORKING_GROUP_ORDER}
_WG_BY_ABBREV = {d["abbrev"]: d for d in WORKING_GROUP_ORDER}


# --------------------------------------------------------------------------- #
# Small helpers                                                                #
# --------------------------------------------------------------------------- #
def _s(value) -> str:
    """A display string: None becomes empty, a list becomes its items on separate
    lines (several indicator guide fields are array properties), everything else is
    stripped text."""
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return "\n".join(s for s in (_s(v) for v in value) if s)
    return str(value).strip()


def _date(value) -> str:
    """Dates arrive as date objects, ISO strings, or None. Keep the ISO day."""
    if not value:
        return ""
    text = str(value)
    return text[:10] if len(text) >= 10 and text[4] == "-" else text


def _first(d: dict, *keys, default=""):
    for k in keys:
        if d.get(k) not in (None, ""):
            return d[k]
    return default


def indicator_sort_key(composite_key: str) -> tuple:
    """'1.11-web' sorts after '1.2-web' numerically, not lexically."""
    number = composite_key.rsplit("-", 1)[0]
    parts = []
    for piece in number.split("."):
        try:
            parts.append(int(piece))
        except ValueError:
            parts.append(0)
    return tuple(parts)


# --------------------------------------------------------------------------- #
# The reducer                                                                  #
# --------------------------------------------------------------------------- #
def _reduce_person(p: dict) -> dict:
    roles = []
    for r in p.get("roles") or []:
        if isinstance(r, dict):
            roles.append({
                "name": _s(_first(r, "name", "handle")),
                "in_position_description": bool(r.get("in_position_description")),
            })
    return {
        "name": _s(p.get("name")),
        "title": _s(p.get("title")),
        "email": _s(p.get("email")),
        "ati_role": _s(p.get("ati_role")),
        "roles": roles,
    }


def _reduce_document(d: dict) -> dict:
    file_info = d.get("file") if isinstance(d.get("file"), dict) else {}
    return {
        "kind": "document",
        "name": _s(_first(d, "name", "original_filename")),
        "url": _s(_first(d, "uri_path", "file_path")) or _s(file_info.get("download_url")),
        "administrative_review": bool(d.get("is_administrative_review_documentation")),
        "milestones_and_measures": bool(d.get("is_milestone_and_measures_documentation")),
    }


def _reduce_webpage(w: dict) -> dict:
    return {
        "kind": "webpage",
        "name": _s(_first(w, "name", "url")),
        "url": _s(w.get("url")),
        "description": _s(w.get("description")),
    }


def _reduce_note(n: dict) -> dict:
    # Note.serialize() emits the date as camelCase ``dateCreated``.
    return {
        "name": _s(n.get("name")),
        "content": _s(n.get("content")),
        "date": _date(_first(n, "dateCreated", "date_created", "date")),
    }


def newest_first(entries: list[dict]) -> list[dict]:
    """Dated entries newest first; undated ones after them, in their original order."""
    dated = [e for e in entries if e.get("date")]
    undated = [e for e in entries if not e.get("date")]
    return sorted(dated, key=lambda e: e["date"], reverse=True) + undated


def _reduce_message(m: dict) -> dict:
    return {
        "name": _s(m.get("name")),
        "content": _s(m.get("content")),
        "date": _date(_first(m, "date_sent", "date_created", "date")),
        "type": _s(m.get("type")),
    }


def _reduce_metric(m: dict) -> dict:
    return {
        "name": _s(m.get("name")),
        "type": _s(m.get("metric_type")),
        "value": _s(m.get("single_value")),
        "description": _s(m.get("description")),
        "comment": _s(m.get("comment")),
        "academic_year": _s(m.get("academic_year")),
    }


def _reduce_implementation(im: dict) -> dict:
    owner = im.get("owner") if isinstance(im.get("owner"), dict) else {}
    participants = []
    for p in im.get("participants") or []:
        if isinstance(p, dict):
            person = p.get("person") if isinstance(p.get("person"), dict) else p
            participants.append({
                "name": _s(person.get("name")),
                "role": _s(_first(p, "role", "handle", "role_name")),
            })
    communities = []
    for c in im.get("accountable_communities") or []:
        communities.append(_s(c.get("name")) if isinstance(c, dict) else _s(c))
    return {
        "title": _s(im.get("title")),
        "type": _s(im.get("type")),
        "description": _s(im.get("description")),
        "owner": _s(owner.get("name")),
        "owner_title": _s(owner.get("title")),
        "strength": im.get("strength"),
        "control": _s(im.get("control")),
        "rationale": _s(im.get("rationale")),
        "satisfies": [_s(x) for x in (im.get("satisfies") or [])],
        "retired": bool(im.get("retired")),
        "retired_date": _date(im.get("retired_date")),
        "retired_note": _s(im.get("retired_note")),
        "accountable_working_group": _s(
            im["accountable_working_group"].get("name")
            if isinstance(im.get("accountable_working_group"), dict)
            else im.get("accountable_working_group")
        ),
        "accountable_communities": [c for c in communities if c],
        "dimensions": [
            _s(d.get("name") if isinstance(d, dict) else d) for d in (im.get("dimensions") or [])
        ],
        "participants": participants,
        "documents": [_reduce_document(d) for d in (im.get("documents") or []) if isinstance(d, dict)],
        "webpages": [_reduce_webpage(w) for w in (im.get("webpages") or []) if isinstance(w, dict)],
        "notes": [_reduce_note(n) for n in (im.get("notes") or []) if isinstance(n, dict)],
        "messages": [_reduce_message(m) for m in (im.get("messages") or []) if isinstance(m, dict)],
        "metrics": [_reduce_metric(m) for m in (im.get("metrics") or []) if isinstance(m, dict)],
        "undocumented": bool(im.get("undocumented")),
        "no_active_documents": bool(im.get("no_active_documents")),
        "remediates_interfaces": [
            _s(i.get("title")) for i in (im.get("remediates_interfaces") or []) if isinstance(i, dict)
        ],
    }


def _reduce_plan(p: dict) -> dict:
    return {
        "name": _s(p.get("name")),
        "description": _s(p.get("description")),
        "status": _s(p.get("plan_status")),
        "abandoned": bool(p.get("abandoned")),
        "abandoned_notes": _s(p.get("abandoned_notes")),
        "is_key_plan": bool(p.get("is_key_plan")),
        "is_campus_plan": bool(p.get("is_campus_plan")),
    }


def _reduce_recommendation(r: dict) -> dict:
    author = r.get("created_by") if isinstance(r.get("created_by"), dict) else {}
    return {
        "text": _s(r.get("recommendation")),
        "detail": _s(r.get("detail")),
        "status": _s(r.get("status")),
        "resolution": _s(r.get("resolution")),
        "date": _date(r.get("date_created")),
        "date_resolved": _date(r.get("date_resolved")),
        "author": _s(author.get("name")),
    }


def _reduce_concern(c: dict) -> dict:
    author = c.get("raised_by") if isinstance(c.get("raised_by"), dict) else {}
    became = c.get("became") if isinstance(c.get("became"), dict) else {}
    return {
        "text": _s(c.get("concern")),
        "detail": _s(c.get("detail")),
        "status": _s(c.get("status")),
        "resolution": _s(c.get("resolution")),
        "date": _date(c.get("date_raised")),
        "author": _s(author.get("name")),
        "became": _s(f"{became.get('kind')}: {became.get('text')}") if became else "",
    }


def _reduce_coverage(cov) -> dict:
    if not isinstance(cov, dict):
        return {"total": 0, "satisfied": 0, "requirements": []}
    summary = cov.get("summary") if isinstance(cov.get("summary"), dict) else cov
    reqs = []
    for r in cov.get("requirements") or []:
        if isinstance(r, dict):
            reqs.append({
                "level": _s(r.get("level")),
                "element": _s(r.get("element")),
                "requirement": _s(r.get("requirement")),
                "dimension": _s(r.get("rubric_dimension")),
                "satisfied": bool(r.get("satisfied")),
                "satisfied_by": [
                    _s(x.get("title") if isinstance(x, dict) else x) for x in (r.get("satisfied_by") or [])
                ],
                "implementation_evidenced": r.get("implementation_evidenced", True) is not False,
            })
    return {
        "total": int(summary.get("total") or 0),
        "satisfied": int(summary.get("satisfied") or 0),
        "requirements": reqs,
    }


def reduce_indicator(payload: dict) -> dict:
    """Reduce one ``get_indicator_report`` payload to the shape the renderer consumes."""
    ind = payload.get("indicator") or {}
    status = payload.get("status") or {}
    yse = payload.get("yse") or {}
    people = payload.get("people") or {}
    reviewer = people.get("admin_review_completed_by") or {}
    wg_name = _s(ind.get("working_group"))
    wg_def = _WG_BY_NAME.get(wg_name) or _WG_BY_ABBREV.get(wg_name.lower()) or {}

    return {
        "key": _s(ind.get("composite_key")),
        # The indicator's own number is the composite key without the group suffix
        # ("1.1-ins" -> "1.1"). The node's `number` property holds the goal number.
        "number": _s(ind.get("composite_key")).rsplit("-", 1)[0],
        "text": _s(ind.get("success_indicator")),
        "removed": bool(ind.get("removed")),
        "goal_number": _s(ind.get("goal_number")),
        "goal_name": _s(ind.get("goal_name")),
        "working_group": wg_def.get("name", wg_name),
        "working_group_abbrev": wg_def.get("abbrev", ""),
        "guide": {
            "examples_of_evidence": _s(ind.get("examples_of_evidence")),
            "established_example": _s(ind.get("established_example")),
            "managed_example": _s(ind.get("managed_example")),
            "optimizing_example": _s(ind.get("optimizing_example")),
        },
        "status": {
            "current": _s(status.get("status_level")),
            "current_value": status.get("status_value"),
            "previous": _s(status.get("previous_status_level")),
        },
        "review": {
            "complete": bool(yse.get("administrative_review_complete")),
            "completed_date": _date(yse.get("administrative_review_completed_date")),
            "completed_by": _s(reviewer.get("name")),
            "summary": _s(yse.get("admin_review_description")),
            "ready": bool(yse.get("ready_for_admin_review")),
            "notes": newest_first([
                {
                    "content": _s(n.get("content")),
                    "date": _date(_first(n, "dateCreated", "date_created", "date")),
                    "author": _s((n.get("created_by") or {}).get("name")),
                }
                for n in (payload.get("admin_review_notes") or [])
                if isinstance(n, dict)
            ]),
        },
        "flags": {
            "priority_level": _s(yse.get("priority_level")),
            "worked_on_in_current_year": yse.get("worked_on_in_current_year"),
            "will_work_on_next_year": yse.get("will_work_on_next_year"),
            "documentation_status": _s(yse.get("documentation_status")),
            "resources_status": _s(yse.get("resources_status")),
            "implementation_plan_status": _s(yse.get("implementation_plan_status")),
        },
        "implementers": [_reduce_person(p) for p in (people.get("implementers") or []) if isinstance(p, dict)],
        "implementations": [
            _reduce_implementation(im) for im in (payload.get("implementations") or []) if isinstance(im, dict)
        ],
        "taaps": [
            {"title": _s(t.get("title")), "type": _s(t.get("type"))}
            for t in (payload.get("taaps") or []) if isinstance(t, dict)
        ],
        "plans": [_reduce_plan(p) for p in (payload.get("plans") or []) if isinstance(p, dict)],
        "accomplishments": [
            {"name": _s(a.get("name")), "description": _s(a.get("description"))}
            for a in (payload.get("accomplishments") or []) if isinstance(a, dict)
        ],
        "recommendations": [
            _reduce_recommendation(r) for r in (payload.get("recommendations") or []) if isinstance(r, dict)
        ],
        "concerns": [_reduce_concern(c) for c in (payload.get("concerns") or []) if isinstance(c, dict)],
        "notes": newest_first([_reduce_note(n) for n in (payload.get("notes") or []) if isinstance(n, dict)]),
        "messages": [_reduce_message(m) for m in (payload.get("messages") or []) if isinstance(m, dict)],
        "metrics": [_reduce_metric(m) for m in (payload.get("metrics") or []) if isinstance(m, dict)],
        "assets": [
            {"title": _s(a.get("title")), "scope": _s(a.get("scope")), "asset_class": _s(a.get("asset_class"))}
            for a in (payload.get("assets") or []) if isinstance(a, dict)
        ],
        "interfaces": [
            {"title": _s(i.get("title")), "function": _s(i.get("function"))}
            for i in (payload.get("interfaces") or []) if isinstance(i, dict)
        ],
        "tools": [_s(t.get("title")) for t in (payload.get("tools") or []) if isinstance(t, dict)],
        "vendors": [_s(v.get("name")) for v in (payload.get("vendors") or []) if isinstance(v, dict)],
        "stakeholders": [
            {"name": _s(c.get("name")), "note": _s(c.get("note"))}
            for c in (payload.get("community_stakeholders") or []) if isinstance(c, dict)
        ],
        "coverage": _reduce_coverage(payload.get("evidence_coverage")),
    }


# --------------------------------------------------------------------------- #
# Assembly                                                                     #
# --------------------------------------------------------------------------- #
def group_indicators(indicators: list[dict]) -> list[dict]:
    """Working groups in registry order, goals by number, indicators by number."""
    by_wg: dict[str, dict] = {}
    for ind in indicators:
        wg = by_wg.setdefault(ind["working_group"], {
            "name": ind["working_group"],
            "abbrev": ind["working_group_abbrev"],
            "goals": {},
        })
        goal = wg["goals"].setdefault(ind["goal_number"], {
            "number": ind["goal_number"],
            "name": ind["goal_name"],
            "indicators": [],
        })
        goal["indicators"].append(ind)

    def goal_key(g):
        try:
            return (0, int(g["number"]))
        except (TypeError, ValueError):
            return (1, str(g["number"]))

    order = {d["name"]: i for i, d in enumerate(WORKING_GROUP_ORDER)}
    result = []
    for wg in sorted(by_wg.values(), key=lambda w: order.get(w["name"], 99)):
        goals = sorted(wg["goals"].values(), key=goal_key)
        for g in goals:
            g["indicators"].sort(key=lambda i: indicator_sort_key(i["key"]))
        result.append({"name": wg["name"], "abbrev": wg["abbrev"], "goals": goals})
    return result


def summarize(indicators: list[dict], working_groups: list[dict]) -> dict:
    """Counts the executive summary renders. Every number here is derived from the
    indicators list, so the summary can never disagree with the body."""
    dist: dict[str, dict[str, int]] = {}
    for wg in working_groups:
        counts = {lvl: 0 for lvl in STATUS_ORDER}
        counts["Unset"] = 0
        for g in wg["goals"]:
            for ind in g["indicators"]:
                lvl = ind["status"]["current"] or "Unset"
                counts[lvl] = counts.get(lvl, 0) + 1
        dist[wg["name"]] = counts

    established_or_above = {"Established", "Managed", "Optimizing"}
    return {
        "indicators": len(indicators),
        "working_groups": len(working_groups),
        "goals": sum(len(wg["goals"]) for wg in working_groups),
        "established_or_above": sum(
            1 for i in indicators if i["status"]["current"] in established_or_above
        ),
        "reviewed": sum(1 for i in indicators if i["review"]["complete"]),
        "with_summary": sum(1 for i in indicators if i["review"]["summary"]),
        "evidence_items": sum(len(i["implementations"]) for i in indicators),
        "active_evidence_items": sum(
            1 for i in indicators for im in i["implementations"] if not im["retired"]
        ),
        "plans": sum(len(i["plans"]) for i in indicators),
        "accomplishments": sum(len(i["accomplishments"]) for i in indicators),
        "open_recommendations": sum(
            1 for i in indicators for r in i["recommendations"]
            if r["status"].lower() not in ("addressed", "dismissed", "resolved", "closed")
        ),
        "open_concerns": sum(
            1 for i in indicators for c in i["concerns"]
            if c["status"].lower() not in ("addressed", "dismissed", "resolved", "closed", "converted")
        ),
        "status_distribution": dist,
        "status_order": STATUS_ORDER + ["Unset"],
    }


def assemble(academic_year: str, campus: dict, indicators: list[dict], rubric: list[dict]) -> dict:
    """Pure assembly from already-reduced indicators. Used by the builder and by tests."""
    working_groups = group_indicators(indicators)
    return {
        "academic_year": academic_year,
        "campus": {"abbreviation": _s(campus.get("abbreviation")), "name": _s(campus.get("name"))},
        "generated": date.today().isoformat(),
        "summary": summarize(indicators, working_groups),
        "working_groups": working_groups,
        "rubric": rubric,
    }


# --------------------------------------------------------------------------- #
# Graph access (neomodel; the app's own connection)                            #
# --------------------------------------------------------------------------- #
def list_campuses() -> list[dict]:
    from neomodel import db
    rows, _ = db.cypher_query(
        "MATCH (c:Campus) RETURN c.abbreviation AS abbreviation, c.name AS name ORDER BY abbreviation"
    )
    return [{"abbreviation": r[0], "name": r[1]} for r in rows]


def list_indicator_keys(academic_year: str, campus_abbreviation: str, include_removed: bool = False) -> list[str]:
    from neomodel import db
    rows, _ = db.cypher_query(
        """
        MATCH (si:SuccessIndicator)<-[:tracks]-(y:YearSuccessEvidence)
              -[:evidence_in_year]->(:AcademicYear {name: $year}),
              (y)-[:evidence_at_campus]->(:Campus {abbreviation: $campus})
        WHERE $include_removed OR coalesce(si.removed, false) = false
        RETURN DISTINCT si.composite_key AS key
        """,
        {"year": academic_year, "campus": campus_abbreviation, "include_removed": include_removed},
    )
    return sorted((r[0] for r in rows), key=indicator_sort_key)


def load_rubric() -> list[dict]:
    """The Status Level definitions, for the appendix. Read from the graph so the
    document quotes the same text the dashboard shows."""
    from neomodel import db
    rows, _ = db.cypher_query(
        """
        MATCH (s:StatusLevel)
        RETURN s.status_value AS value, s.status_level AS level,
               s.description_of_procedures AS procedures,
               s.description_of_resources AS resources,
               s.description_of_documentation AS documentation
        ORDER BY toInteger(s.status_value)
        """
    )
    return [
        {"value": _s(r[0]), "level": _s(r[1]), "procedures": _s(r[2]),
         "resources": _s(r[3]), "documentation": _s(r[4])}
        for r in rows
    ]


def build_campus_year_report(
    academic_year: str,
    campus_abbreviation: str,
    *,
    include_removed: bool = False,
    progress: Optional[Callable[[int, int, str], None]] = None,
) -> dict:
    """Build the full model for one campus and year. Raises ValueError when the campus
    is unknown or the year has no evidence there."""
    from app.database.queries.compound_queries.get_indicator_report import get_indicator_report

    campuses = {c["abbreviation"]: c for c in list_campuses()}
    campus = campuses.get(campus_abbreviation)
    if not campus:
        raise ValueError(f"Unknown campus '{campus_abbreviation}'. Known: {', '.join(sorted(campuses))}")

    keys = list_indicator_keys(academic_year, campus_abbreviation, include_removed)
    if not keys:
        raise ValueError(f"No evidence for {campus_abbreviation} in {academic_year}.")

    indicators = []
    for n, key in enumerate(keys, 1):
        if progress:
            progress(n, len(keys), key)
        payload = get_indicator_report(key, academic_year, campus_abbreviation)
        indicators.append(reduce_indicator(payload))

    return assemble(academic_year, campus, indicators, load_rubric())
