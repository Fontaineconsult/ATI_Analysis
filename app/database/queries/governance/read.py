#
# GOVERNANCE READ QUERIES
#
import json

from app.data_config import WORKING_GROUP_DEFS
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from neomodel import db

# Canonical working-group order, derived from the single source of truth in
# data_config (mirrored on the frontend by styles/workingGroupIdentity.js). Sorting
# by this rather than alphabetically keeps the picker's group order matching every
# other working-group surface in the app.
_WG_ORDER = {d["name"]: i for i, d in enumerate(WORKING_GROUP_DEFS)}


def _framework_sort_key(row: dict):
    """Order framework rows by working group, then goal, then indicator."""
    wg = row.get("working_group")
    return (
        _WG_ORDER.get(wg, len(_WG_ORDER)),
        wg or "",
        row.get("goal_number") or 0,
        row.get("goal_name") or "",
        row.get("composite_key") or "",
    )


# API "type" key  ->  neomodel node class. Single source of truth for the
# governance type dispatch across read / create / update / delete.
GOVERNANCE_TYPE_TO_CLASS = {
    "law": Law,
    "case": Case,
    "directive": Directive,
    "external_policy": ExternalPolicy,
    "memo": Memo,
    "guideline": Guideline,
}

# Neo4j label -> API "type" key. Derived from the map above so the two cannot drift.
# Needed wherever governance is reached by a heterogeneous Cypher match (labels come
# back as strings) but must be handed to the type-dispatched write API.
_LABEL_TO_GOV_TYPE = {cls.__name__: key for key, cls in GOVERNANCE_TYPE_TO_CLASS.items()}


def get_all_governance_items() -> list:
    """
    Return every governance node across all 6 types, projected into a uniform
    JSON-friendly shape. Type-specific fields appear as null on nodes that
    don't carry them, which keeps the frontend rendering logic simple.
    """
    query = """
        CALL {
          MATCH (n:Law) RETURN n, 'law' AS type
          UNION ALL
          MATCH (n:Case) RETURN n, 'case' AS type
          UNION ALL
          MATCH (n:Directive) RETURN n, 'directive' AS type
          UNION ALL
          MATCH (n:ExternalPolicy) RETURN n, 'external_policy' AS type
          UNION ALL
          MATCH (n:Memo) RETURN n, 'memo' AS type
          UNION ALL
          MATCH (n:Guideline) RETURN n, 'guideline' AS type
        }
        RETURN apoc.convert.toJson(collect({
          type: type,
          unique_id: n.unique_id,
          title: n.title,
          description: n.description,
          effective_date: toString(n.effective_date),
          last_updated: toString(n.last_updated),
          authored_date: toString(n.authored_date),
          relevant_sections: n.relevant_sections,
          legislative_authority: n.legislative_authority,
          ruling: n.ruling,
          source_institution: n.source_institution,
          raw_text: n.raw_text,
          raw_text_captured: toString(n.raw_text_captured),
          documents: [(n)-[:is_sourced_from]->(d:Document) |
            {unique_id: d.unique_id, name: d.name, uri_path: d.uri_path, file_path: d.file_path}
          ],
          webpages: [(n)-[:is_sourced_from]->(w:Webpage) |
            {unique_id: w.unique_id, name: w.name, url: w.url}
          ],
          // The two strengths of claim on the indicator framework (see the Governance
          // section docstring in graph_schema.py). Projected here rather than fetched
          // per-selection so the detail panel's existing refetch-the-list refresh picks
          // up an attach for free, exactly as documents/webpages already do.
          goals: [(n)-[:informs]->(g:Goal) |
            {unique_id: g.unique_id, name: g.name, goal_number: g.goal_number,
             goal: g.goal, removed: coalesce(g.removed, false),
             // The goal's working group disambiguates the picker: goal_number repeats
             // across groups, and some goals share text outright.
             working_group: head([(wg:ATIWorkingGroup)-[:responsible_for]->(g) | wg.name])}
          ],
          success_indicators: [(n)-[r:drives]->(si:SuccessIndicator) |
            {unique_id: si.unique_id, composite_key: si.composite_key,
             success_indicator: si.success_indicator, removed: coalesce(si.removed, false),
             provision: r.provision, quote: r.quote, note: r.note,
             added_date: toString(r.added_date)}
          ]
        })) AS jsonResult
    """
    results, _meta = db.cypher_query(query)
    if not results or not results[0] or not results[0][0]:
        return []
    return json.loads(results[0][0])


def get_governance_link_targets() -> dict:
    """
    The candidate pool for both governance -> indicator-framework edges, in one
    round trip: every Goal (for `informs`) and every live SuccessIndicator (for
    `drives`).

    Deliberately YEAR-AGNOSTIC. Both edges are assertions about an instrument and
    the framework, not about a campus's progress in a given year, so the
    `introduced_in_year` gate applied by fetch_success_indicators_for_working_group
    must NOT be inherited here — gating the picker by year would make an edge
    un-authorable in the very year the indicator was introduced.

    Removed indicators are excluded as NEW targets (nothing should start driving a
    retired indicator), but an existing edge to one still renders: the panel reads
    attached edges from the item's own projection, not from this pool.
    """
    query = """
        CALL {
          MATCH (g:Goal)
          RETURN collect({
            unique_id: g.unique_id,
            name: g.name,
            goal_number: g.goal_number,
            goal: g.goal,
            removed: coalesce(g.removed, false),
            working_group: head([(wg:ATIWorkingGroup)-[:responsible_for]->(g) | wg.name])
          }) AS goals
        }
        CALL {
          MATCH (si:SuccessIndicator)
          WHERE si.removed IS NULL OR si.removed = false
          // Each indicator's place in the framework tree. Goal -[:supported_by]-> SI is
          // a strict tree and every goal has exactly one working group, so these single
          // OPTIONAL MATCHes cannot fan out. They are what lets the picker present
          // working group -> goal -> indicator instead of 122 flat rows.
          OPTIONAL MATCH (goal:Goal)-[:supported_by]->(si)
          OPTIONAL MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal)
          RETURN collect({
            unique_id: si.unique_id,
            composite_key: si.composite_key,
            success_indicator: si.success_indicator,
            removed: false,
            goal_unique_id: goal.unique_id,
            goal_number: goal.goal_number,
            goal_name: coalesce(goal.name, goal.goal),
            working_group: wg.name
          }) AS indicators
        }
        RETURN apoc.convert.toJson({goals: goals, success_indicators: indicators}) AS jsonResult
    """
    results, _meta = db.cypher_query(query)
    if not results or not results[0] or not results[0][0]:
        return {"goals": [], "success_indicators": []}
    payload = json.loads(results[0][0])
    payload["goals"].sort(key=_framework_sort_key)
    payload["success_indicators"].sort(key=_framework_sort_key)
    return payload


def get_governance_for_indicator(composite_key: str, include_candidates: bool = False) -> dict:
    """
    The authority behind one SuccessIndicator, for the dashboard's indicator view —
    the inverse reading direction of get_all_governance_items(), which answers
    "what does this instrument drive?".

    Returns:
      driving        instruments with a `drives` edge to THIS indicator, with the
                     DrivesRel citation. Editable from the panel.
      informing_goal instruments with an `informs` edge to the indicator's parent
                     goal. Read-only CONTEXT, not edges on this indicator — this is
                     the union the Governance docstring describes ("an indicator's
                     authorities are its own drives edges plus its goal's informs
                     edges"), derived here rather than materialized.

    Both carry the instrument's SOURCE ARTIFACTS — its `is_sourced_from` Documents
    (with any uploaded file, projected the same way implementation/read.py does it)
    and Webpages. An instrument cited on an indicator is only as checkable as the
    artifact behind it is reachable, so the reviewer needs the document in hand
    without leaving the indicator. `has_raw_text` reports whether the instrument's
    text has been captured at all, which is what makes a quote possible.
      candidates     every governance node, for the picker. ONLY when
                     include_candidates is set.

    The candidate pool is ~93% of the payload but is needed only once the panel is
    expanded, and the panel starts collapsed — so it is opt-in. The default response
    carries just what the collapsed header shows (the counts), which is why the
    dashboard can afford to load this on every indicator selection.

    Deliberately omits `raw_text` in every case. The mirrors run to tens of thousands
    of characters; the governance area is where the full text is read.
    """
    query = """
        MATCH (si:SuccessIndicator {composite_key: $composite_key})
        OPTIONAL MATCH (goal:Goal)-[:supported_by]->(si)
        WITH si, goal
        RETURN apoc.convert.toJson({
          // unique_id, not just composite_key: the write actions are keyed by
          // indicator_unique_id, so the panel needs it to author an edge.
          unique_id: si.unique_id,
          composite_key: si.composite_key,
          success_indicator: si.success_indicator,
          goal: CASE WHEN goal IS NULL THEN NULL ELSE {
            unique_id: goal.unique_id,
            goal_number: goal.goal_number,
            name: coalesce(goal.name, goal.goal)
          } END,
          driving: [(n)-[r:drives]->(si)
            WHERE any(lbl IN labels(n) WHERE lbl IN
              ['Law','Case','Directive','ExternalPolicy','Memo','Guideline'])
            | {label: labels(n)[0], unique_id: n.unique_id, title: n.title,
               provision: r.provision, quote: r.quote, note: r.note,
               added_date: toString(r.added_date),
               has_raw_text: n.raw_text IS NOT NULL AND n.raw_text <> '',
               documents: [(n)-[:is_sourced_from]->(d:Document) | {
                 unique_id: d.unique_id, name: d.name,
                 uri_path: d.uri_path, file_path: d.file_path,
                 file: head([ (d)-[:has_file]->(sf:StoredFile) | {
                   storage_key: sf.storage_key, original_filename: sf.original_filename,
                   content_type: sf.content_type, size: sf.size,
                   download_url: '/ati/data-api/v1/files/' + sf.storage_key +
                     CASE WHEN sf.original_filename IS NULL THEN ''
                          ELSE '?name=' + apoc.text.urlencode(sf.original_filename) END
                 } ])
               }],
               webpages: [(n)-[:is_sourced_from]->(w:Webpage) |
                 {unique_id: w.unique_id, name: w.name, url: w.url}]
              }
          ],
          informing_goal: [(n)-[:informs]->(goal)
            WHERE any(lbl IN labels(n) WHERE lbl IN
              ['Law','Case','Directive','ExternalPolicy','Memo','Guideline'])
            | {label: labels(n)[0], unique_id: n.unique_id, title: n.title,
               documents: [(n)-[:is_sourced_from]->(d:Document) | {
                 unique_id: d.unique_id, name: d.name,
                 uri_path: d.uri_path, file_path: d.file_path,
                 file: head([ (d)-[:has_file]->(sf:StoredFile) | {
                   storage_key: sf.storage_key, original_filename: sf.original_filename,
                   content_type: sf.content_type, size: sf.size,
                   download_url: '/ati/data-api/v1/files/' + sf.storage_key +
                     CASE WHEN sf.original_filename IS NULL THEN ''
                          ELSE '?name=' + apoc.text.urlencode(sf.original_filename) END
                 } ])
               }],
               webpages: [(n)-[:is_sourced_from]->(w:Webpage) |
                 {unique_id: w.unique_id, name: w.name, url: w.url}]
              }
          ]
        }) AS jsonResult
    """
    results, _meta = db.cypher_query(query, {"composite_key": composite_key})
    if not results or not results[0] or not results[0][0]:
        raise NotFoundError(f"SuccessIndicator with composite_key '{composite_key}' not found.")
    payload = json.loads(results[0][0])

    if include_candidates:
        # A second, cheap projection rather than the full governance read, so the
        # picker never drags raw_text into the dashboard.
        candidate_rows, _meta = db.cypher_query("""
            MATCH (n)
            WHERE any(lbl IN labels(n) WHERE lbl IN
              ['Law','Case','Directive','ExternalPolicy','Memo','Guideline'])
            RETURN labels(n)[0] AS label, n.unique_id AS unique_id, n.title AS title
            ORDER BY label, title
        """)
        payload["candidates"] = [
            {"label": label, "type": _LABEL_TO_GOV_TYPE.get(label), "unique_id": uid, "title": title}
            for (label, uid, title) in candidate_rows
        ]

    for row in payload["driving"] + payload["informing_goal"]:
        row["type"] = _LABEL_TO_GOV_TYPE.get(row["label"])
    payload["driving"].sort(key=lambda r: (r.get("title") or ""))
    payload["informing_goal"].sort(key=lambda r: (r.get("title") or ""))
    return payload


def get_governance_item(governance_type: str, unique_id: str):
    """
    Fetch one governance node by type + unique_id. Returns the neomodel
    instance; caller may .serialize() or read properties directly.
    """
    cls = GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise NotFoundError(f"Unknown governance type '{governance_type}'.")
    node = cls.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"{cls.__name__} with unique_id '{unique_id}' not found.")
    return node
