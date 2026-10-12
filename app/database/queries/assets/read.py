#
# ASSET / TAAP READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.data_config import asset_scopes, taap_requirements
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError


# Each §508 stewardship capacity is held by a Person OR an OrgUnit under a shared
# rel-type. The two neomodel accessors are merged into one list per capacity so a
# caller never has to know whether the holder is an individual or a unit.
_STEWARDSHIP_ACCESSORS = {
    "procured_by":   ("procured_by", "procured_by_unit"),
    "developed_by":  ("developed_by", "developed_by_unit"),
    "maintained_by": ("maintained_by", "maintained_by_unit"),
    "used_by":       ("used_by", "used_by_unit"),
}

# Reverse accessors for implementations that remediate the asset (the work that
# keeps it accessible). Presence of ANY of these means the asset is remediated.
_REMEDIATION_ACCESSORS = (
    ("Process",   "remediated_by_processes"),
    ("Project",   "remediated_by_projects"),
    ("Procedure", "remediated_by_procedures"),
    ("Service",   "remediated_by_services"),
)


def _holders(person_rel, unit_rel) -> list:
    """Merge a Person accessor and an OrgUnit accessor into one tagged list."""
    holders = [
        {"type": "person", "unique_id": p.unique_id, "name": p.name}
        for p in person_rel.all()
    ]
    holders += [
        {"type": "org_unit", "unique_id": u.unique_id, "name": u.name}
        for u in unit_rel.all()
    ]
    return holders


def _asset_stewardship(asset) -> dict:
    return {
        capacity: _holders(getattr(asset, person_attr), getattr(asset, unit_attr))
        for capacity, (person_attr, unit_attr) in _STEWARDSHIP_ACCESSORS.items()
    }


def _asset_remediations(asset) -> list:
    remediations = []
    for label, accessor in _REMEDIATION_ACCESSORS:
        for impl in getattr(asset, accessor).all():
            remediations.append({
                "type": label,
                "title": impl.title,
                "unique_id": impl.unique_id,
            })
    return remediations


def _serialize_asset_detail(asset) -> dict:
    """
    Full asset projection: identity + stewardship parties + vendor/campus anchor
    + remediating implementations + covering TAAPs, plus the derived
    `elevation_signal`.

    elevation_signal encodes the model's headline insight: an asset that is
    stewarded under §508 yet has NO remediating implementation is the signal that
    remediation responsibility has elevated to the institution
    (Title II §35.205 / the responsibility heuristic).
    """
    stewardship = _asset_stewardship(asset)
    remediations = _asset_remediations(asset)
    campus_node = asset.at_campus.single()

    is_stewarded = any(stewardship.values())
    is_remediated = bool(remediations)

    data = asset.serialize()
    data.update({
        "stewardship": stewardship,
        "supplied_by": [
            {"unique_id": v.unique_id, "name": v.name} for v in asset.supplied_by.all()
        ],
        "at_campus": (
            {"abbreviation": campus_node.abbreviation, "name": campus_node.name}
            if campus_node else None
        ),
        "remediated_by": remediations,
        "covered_by_taap": [t.serialize() for t in asset.covered_by_taap.all()],
        "is_stewarded": is_stewarded,
        "is_remediated": is_remediated,
        "elevation_signal": is_stewarded and not is_remediated,
    })
    return data


def get_all_assets() -> list:
    """All Asset nodes as lightweight summaries (serialize()), ordered by identifier."""
    return [a.serialize() for a in Asset.nodes.order_by("asset_identifier").all()]


def get_asset(asset_identifier: str) -> dict:
    """Full detail for one Asset. Raises NotFoundError if it doesn't exist."""
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return _serialize_asset_detail(asset)


def get_assets_by_scope(scope: str) -> list:
    """All assets at a given scope (summaries). Raises ValidationError on a bad scope."""
    if scope not in asset_scopes:
        raise ValidationError(
            f"scope must be one of {list(asset_scopes.keys())}; got {scope!r}"
        )
    return [a.serialize() for a in Asset.nodes.filter(scope=scope).order_by("asset_identifier")]


# Assets anchored to a campus via the scope-anchor edge. Cypher (not an in-Python
# filter over all nodes) so the campus lookup happens in the database.
_ASSETS_BY_CAMPUS_QUERY = """
    MATCH (a:Asset)-[:asset_at_campus]->(:Campus {abbreviation: $campus_abbrev})
    RETURN a
    ORDER BY a.asset_identifier
"""


def get_assets_by_campus(campus_abbrev: str) -> list:
    """All assets whose scope anchor is the given campus (summaries)."""
    results, _ = db.cypher_query(_ASSETS_BY_CAMPUS_QUERY, {"campus_abbrev": campus_abbrev})
    return [Asset.inflate(row[0]).serialize() for row in results]


# The elevation query: assets stewarded under §508 (any procure/develop/maintain/use
# edge) but with NO remediating implementation. These are the assets where
# responsibility has elevated to the institution. The shared rel-types let one
# pattern catch Person and OrgUnit holders alike.
_ELEVATION_SIGNAL_QUERY = """
    MATCH (a:Asset)
    WHERE (a)-[:procured_by|developed_by|maintained_by|used_by]->()
      AND NOT (a)<-[:remediates]-()
    RETURN a
    ORDER BY a.asset_identifier
"""


def get_elevation_signal_assets() -> list:
    """
    Assets that are stewarded yet unremediated — the modeled signal that
    remediation responsibility has elevated to the institution. Returns full
    detail (so the caller sees who stewards each one).
    """
    results, _ = db.cypher_query(_ELEVATION_SIGNAL_QUERY)
    return [_serialize_asset_detail(Asset.inflate(row[0])) for row in results]


#
# TAAP reads
#

def _person_ref(p) -> dict:
    return {"unique_id": p.unique_id, "name": p.name}


def _unit_ref(u) -> dict:
    return {"unique_id": u.unique_id, "name": u.name,
            "type": "College" if isinstance(u, College) else "Department" if isinstance(u, Department) else "OrgUnit"}


def _document_ref(d) -> dict:
    return {"unique_id": d.unique_id, "name": d.name, "uri_path": d.uri_path,
            "has_raw_text": bool(d.raw_text)}


def _taap_summary(taap) -> dict:
    """serialize() plus the two identity anchors a list needs to group by."""
    data = taap.serialize()
    campus = taap.at_campus.single()
    unit = taap.requested_by.single()
    data["campus"] = campus.abbreviation if campus else None
    data["requesting_unit"] = unit.name if unit else None
    return data


def _serialize_taap_detail(taap) -> dict:
    """
    Full TAAP projection: the form's fields (serialize()) plus every edge the
    plan carries, with edge properties where the edge has them. Adds
    `checklist_consistent`: the form grades outcome from the requirements count
    (all six = equally effective, one to five = partial, none = referral), so a
    plan whose stored outcome disagrees with its stored checklist is flagged
    rather than silently corrected.
    """
    data = taap.serialize()
    campus = taap.at_campus.single()
    year = taap.in_year.single()
    signed_copy = taap.signed_copy.single()
    previous = taap.supersedes.single()

    signers = []
    for person in taap.signed_by.all():
        edge = taap.signed_by.relationship(person)
        signers.append({**_person_ref(person), "role": edge.role, "signed_date": edge.signed_date})

    references = []
    for rel, target_type in ((taap.references_documents, "document"), (taap.references_webpages, "webpage")):
        for target in rel.all():
            edge = rel.relationship(target)
            references.append({
                "target_type": target_type,
                "unique_id": target.unique_id,
                "name": getattr(target, "name", None) or getattr(target, "title", None),
                "url": getattr(target, "url", None) or getattr(target, "uri_path", None),
                "kind": edge.kind,
                "note": edge.note,
            })

    evidence = []
    for yse in taap.is_evidence_for.all():
        edge = taap.is_evidence_for.relationship(yse)
        evidence.append({"year_identifier": yse.year_identifier,
                         "strength": edge.strength, "control": edge.control})

    met = len(taap.requirements_met or [])
    expected = ("equally_effective" if met == len(taap_requirements)
                else "referral" if met == 0 else "non_equal_alternative")

    data.update({
        "covers_asset": [a.serialize() for a in taap.covers_asset.all()],
        "at_campus": ({"abbreviation": campus.abbreviation, "name": campus.name} if campus else None),
        "in_year": year.name if year else None,
        "owned_by": [_person_ref(p) for p in taap.owned_by.all()],
        "prepared_by": [_person_ref(p) for p in taap.prepared_by.all()],
        "signed_by": signers,
        "requested_by": [_unit_ref(u) for u in taap.requested_by.all()],
        "alternative_provided_by": [_unit_ref(u) for u in taap.alternative_provided_by.all()],
        "references": references,
        "signed_copy": _document_ref(signed_copy) if signed_copy else None,
        "supersedes": previous.taap_identifier if previous else None,
        "superseded_by": [t.taap_identifier for t in taap.superseded_by.all()],
        "is_evidence_for": evidence,
        "requirements_met_count": met,
        "checklist_consistent": taap.outcome is None or taap.outcome == expected,
    })
    return data


def _resolve_taap_for_read(key: str):
    # Same identifier-then-title resolution the write side uses; imported lazily
    # because update.py imports create.py, which this module must not cycle with.
    from app.database.queries.assets.update import _resolve_taap
    return _resolve_taap(key)


def get_all_taaps() -> list:
    """All TAAP nodes as summaries, ordered by title then identifier."""
    return [_taap_summary(t) for t in TAAP.nodes.order_by("title", "taap_identifier").all()]


def get_taap(key: str) -> dict:
    """Full detail for one TAAP by taap_identifier (or an unambiguous title). Raises NotFoundError if missing."""
    return _serialize_taap_detail(_resolve_taap_for_read(key))


def get_taaps_for_asset(asset_identifier: str) -> list:
    """All TAAPs covering the given asset (summaries). Raises NotFoundError if the asset is missing."""
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return [_taap_summary(t) for t in asset.covered_by_taap.all()]


def get_active_taaps() -> list:
    """All TAAPs flagged active=True (summaries)."""
    return [_taap_summary(t) for t in TAAP.nodes.filter(active=True).order_by("review_due")]


def get_taaps_due_for_review(on_or_before) -> list:
    """
    Active TAAPs whose review_due is on or before `on_or_before`
    (a date or 'YYYY-MM-DD' string). Useful for the annual-review worklist.
    """
    from app.database.queries.assets.create import _coerce_date

    cutoff = _coerce_date(on_or_before, field_name="on_or_before")
    if cutoff is None:
        raise ValidationError("on_or_before is required")
    # Cypher rather than a neomodel filter: the ORM deflates the date to a string,
    # and a Date-typed property never compares equal or less than a string.
    results, _ = db.cypher_query(
        """
        MATCH (t:TAAP)
        WHERE coalesce(t.active, true) AND t.review_due IS NOT NULL
          AND t.review_due <= date($cutoff)
        RETURN t ORDER BY t.review_due, t.title
        """,
        {"cutoff": cutoff.isoformat()},
    )
    return [_taap_summary(TAAP.inflate(row[0])) for row in results]


# TAAPs at a campus, optionally within one academic year. The year filter is the
# `taap_in_year` anchor, which is what indicator 8.10-pro ("Total number of EEAAPs
# completed") counts per campus per year.
_TAAPS_BY_CAMPUS_QUERY = """
    MATCH (t:TAAP)-[:taap_at_campus]->(:Campus {abbreviation: $campus_abbrev})
    WHERE $academic_year IS NULL OR (t)-[:taap_in_year]->(:AcademicYear {name: $academic_year})
    RETURN t
    ORDER BY t.title, t.taap_identifier
"""


def get_taaps_by_campus(campus_abbrev: str, academic_year: str = None) -> list:
    """TAAPs anchored to a campus (summaries), narrowed to one academic year when given."""
    try:
        Campus.nodes.get(abbreviation=campus_abbrev)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus {campus_abbrev!r} not found")
    results, _ = db.cypher_query(
        _TAAPS_BY_CAMPUS_QUERY,
        {"campus_abbrev": campus_abbrev, "academic_year": academic_year},
    )
    return [_taap_summary(TAAP.inflate(row[0])) for row in results]


def get_stewarded_ict_for_yse(year_identifier: str) -> dict:
    """
    The ICT footprint BEHIND one YSE's internally-controlled evidence, derived —
    not stored: internal is_evidence_for links (control unset counts as
    internal) → the implementations' owners/participants → the Department/
    College units employing them → every Asset whose §508 stewardship edges
    (procured_by / developed_by / maintained_by / used_by) land on those units
    or people. Answers "what ICT does the responsible unit answer for?" even
    when no remediates/uses_tool wiring exists yet.

    :return: {people: [names], units: [{name, type}], assets: [
              {asset_identifier, title, scope, stewards: [
                {name, holder_type, capacities: [...]}]}]}
    """
    try:
        YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"No YearSuccessEvidence found with year_identifier: {year_identifier}")

    basis_rows, _ = db.cypher_query(
        """
        MATCH (impl)-[r:is_evidence_for]->(e:YearSuccessEvidence {year_identifier: $yid})
        WHERE coalesce(r.control, 'internal') = 'internal'
        OPTIONAL MATCH (impl)-[:owned_by]->(o:Person)
        OPTIONAL MATCH (impl)<-[:worked_on]-(p:Person)
        WITH collect(DISTINCT o) + collect(DISTINCT p) AS raw
        UNWIND raw AS person
        WITH DISTINCT person WHERE person IS NOT NULL
        OPTIONAL MATCH (u)-[:employs]->(person) WHERE u:Department OR u:College
        RETURN person.name,
               [x IN collect(DISTINCT u) WHERE x IS NOT NULL |
                  {name: x.name, type: CASE WHEN x:College THEN 'College' ELSE 'Department' END}]
        """,
        {"yid": year_identifier},
    )
    people = [r[0] for r in basis_rows]
    units, seen_units = [], set()
    for _, unit_list in basis_rows:
        for u in unit_list:
            if u["name"] not in seen_units:
                seen_units.add(u["name"])
                units.append(u)

    steward_rows, _ = db.cypher_query(
        """
        MATCH (impl)-[r:is_evidence_for]->(e:YearSuccessEvidence {year_identifier: $yid})
        WHERE coalesce(r.control, 'internal') = 'internal'
        OPTIONAL MATCH (impl)-[:owned_by]->(o:Person)
        OPTIONAL MATCH (impl)<-[:worked_on]-(p:Person)
        WITH collect(DISTINCT o) + collect(DISTINCT p) AS raw
        UNWIND raw AS person
        WITH [x IN collect(DISTINCT person) WHERE x IS NOT NULL] AS people
        OPTIONAL MATCH (u)-[:employs]->(pp) WHERE pp IN people AND (u:Department OR u:College)
        WITH people, [x IN collect(DISTINCT u) WHERE x IS NOT NULL] AS units
        MATCH (a:Asset)-[st]->(h)
        WHERE type(st) IN ['procured_by', 'developed_by', 'maintained_by', 'used_by']
          AND (h IN units OR h IN people)
        RETURN a.asset_identifier, a.title, a.scope, type(st), h.name,
               CASE WHEN h:Person THEN 'Person'
                    WHEN h:College THEN 'College' ELSE 'Department' END
        ORDER BY toLower(a.title)
        """,
        {"yid": year_identifier},
    )

    assets, index = [], {}
    for asset_id, title, scope, capacity, holder, holder_type in steward_rows:
        entry = index.get(asset_id)
        if entry is None:
            entry = {"asset_identifier": asset_id, "title": title, "scope": scope, "stewards": []}
            index[asset_id] = entry
            assets.append(entry)
        steward = next((s for s in entry["stewards"] if s["name"] == holder), None)
        if steward is None:
            steward = {"name": holder, "holder_type": holder_type, "capacities": []}
            entry["stewards"].append(steward)
        capacity_name = capacity.replace("_by", "")
        if capacity_name not in steward["capacities"]:
            steward["capacities"].append(capacity_name)

    return {"people": people, "units": units, "assets": assets}


#
# Public TAAP search (unauthenticated register; see app/public_reports)
#

# A plan is public once it is in force. Drafts and plans awaiting signature never
# leave the internal app, and this rule lives in the query rather than in the
# sanitizer so a template mistake cannot surface an unsigned plan.
PUBLIC_TAAP_STATUSES = ("signed", "under_review", "renewed")

# Full-text index spanning the plan, its covered asset and that asset's vendor, so
# a search for a product or company name finds the plan through either node.
# Created through neo4j-cli (schema write):
#   CREATE FULLTEXT INDEX taap_public_search IF NOT EXISTS
#   FOR (n:TAAP|Asset|Vendor) ON EACH [n.title, n.name, n.known_barriers, n.accessibility_statement]
TAAP_FULLTEXT_INDEX = "taap_public_search"

_LUCENE_SPECIALS = set(r'+-&|!(){}[]^"~*?:\/')


def _fulltext_query(text: str) -> str:
    """
    Turn free text into a safe Lucene query: special characters escaped, each
    term given a trailing wildcard so a prefix matches ('hand' finds Handshake),
    terms joined with OR so any hit ranks. Returns '' for blank input.
    """
    terms = []
    for raw in (text or "").split():
        escaped = "".join(("\\" + ch) if ch in _LUCENE_SPECIALS else ch for ch in raw)
        if escaped:
            terms.append(escaped + "*")
    return " OR ".join(terms)


# Row projection shared by the list and the single-plan page. Only fields the
# public sanitizer may copy are returned; vendor contact, notes, signers and the
# signed copy are never selected here.
_PUBLIC_TAAP_ROW = """
    OPTIONAL MATCH (t)-[:taap_in_year]->(ay:AcademicYear)
    OPTIONAL MATCH (t)-[:covers_asset]->(a:Asset)
    OPTIONAL MATCH (a)-[:supplied_by]->(v:Vendor)
    OPTIONAL MATCH (t)-[:requested_by]->(u:OrgUnit)
    WITH t, c, score, ay, a, collect(DISTINCT v.name) AS vendors, collect(DISTINCT u.name) AS units
    WHERE $academic_year IS NULL OR ay.name = $academic_year
    WITH t, c, score, ay, a, vendors, units
    ORDER BY score DESC, t.review_due DESC, t.title, t.taap_identifier
    WITH collect({
        taap_identifier: t.taap_identifier, title: t.title,
        campus: c.abbreviation, campus_name: c.name, academic_year: ay.name,
        asset_identifier: a.asset_identifier, asset_title: a.title, asset_version: a.version,
        vendor: head(vendors), requesting_unit: head(units),
        outcome: t.outcome, institutional_risk: t.institutional_risk,
        accommodation_requirement: t.accommodation_requirement,
        affected_user_groups: coalesce(t.affected_user_groups, []),
        requirements_met: coalesce(t.requirements_met, []),
        distribution_actions: coalesce(t.distribution_actions, []),
        known_barriers: t.known_barriers, accessibility_statement: t.accessibility_statement,
        proposed_alternative: t.proposed_alternative,
        creation_date: toString(t.creation_date), effective_date: toString(t.effective_date),
        review_due: toString(t.review_due), taap_status: t.taap_status,
        template_version: t.template_version, score: score
    }) AS rows
    RETURN size(rows) AS total, rows[$skip..$skip + $limit] AS page
"""

_PUBLIC_TAAP_FILTER = """
    WHERE coalesce(t.active, true) AND t.taap_status IN $statuses
      AND ($taap_identifier IS NULL OR t.taap_identifier = $taap_identifier)
      AND ($outcome IS NULL OR t.outcome = $outcome)
      AND ($user_group IS NULL OR $user_group IN coalesce(t.affected_user_groups, []))
    MATCH (t)-[:taap_at_campus]->(c:Campus)
    WHERE $campus IS NULL OR c.abbreviation = $campus
"""

_PUBLIC_TAAP_BROWSE = "MATCH (t:TAAP) WITH t, 0.0 AS score\n" + _PUBLIC_TAAP_FILTER + _PUBLIC_TAAP_ROW

# A full-text hit on an Asset or Vendor resolves to the plans that cover it.
_PUBLIC_TAAP_SEARCH = """
    CALL db.index.fulltext.queryNodes($index, $q) YIELD node, score
    OPTIONAL MATCH (node)<-[:covers_asset]-(ta:TAAP)
    OPTIONAL MATCH (node)<-[:supplied_by]-(:Asset)<-[:covers_asset]-(tv:TAAP)
    WITH node, score, collect(DISTINCT ta) + collect(DISTINCT tv) AS linked
    WITH score, CASE WHEN node:TAAP THEN [node] ELSE [] END + linked AS hits
    UNWIND hits AS t
    WITH t, max(score) AS score
""" + _PUBLIC_TAAP_FILTER + _PUBLIC_TAAP_ROW

# Fallback when the full-text index is absent: a case-insensitive CONTAINS scan over
# the same fields. Correct at any size the register will reach; it only lacks the
# ranking and prefix matching the index gives.
_PUBLIC_TAAP_CONTAINS = """
    MATCH (t:TAAP)
    OPTIONAL MATCH (t)-[:covers_asset]->(a0:Asset)
    OPTIONAL MATCH (a0)-[:supplied_by]->(v0:Vendor)
    WITH t, a0, collect(v0.name) AS vendor_names
    WITH t, toLower(coalesce(t.title, '') + ' ' + coalesce(t.known_barriers, '') + ' '
                  + coalesce(t.accessibility_statement, '') + ' ' + coalesce(a0.title, '') + ' '
                  + reduce(s = '', n IN vendor_names | s + ' ' + coalesce(n, ''))) AS blob
    WHERE all(term IN $terms WHERE blob CONTAINS term)
    WITH t, 0.0 AS score
""" + _PUBLIC_TAAP_FILTER + _PUBLIC_TAAP_ROW


def search_public_taaps(q: str = None, campus: str = None, academic_year: str = None,
                        outcome: str = None, user_group: str = None, status: str = None,
                        taap_identifier: str = None, page: int = 1, page_size: int = 25) -> dict:
    """
    The public TAAP register: plans in force, optionally narrowed by free text
    (full-text index over plan, asset and vendor), campus, academic year,
    outcome, affected user group, or one public status. One round trip returns
    the total and the requested page.

    Returns {"total": int, "page": int, "page_size": int, "items": [row, ...]}.
    Rows carry only the public projection; see app/public_reports/sanitize.py
    for the final allowlist. Raises ValidationError on a bad filter value.
    """
    from app.data_config import taap_outcomes, taap_user_groups

    if outcome is not None and outcome not in taap_outcomes:
        raise ValidationError(f"outcome must be one of {list(taap_outcomes.keys())}; got {outcome!r}")
    if user_group is not None and user_group not in taap_user_groups:
        raise ValidationError(f"user_group must be one of {list(taap_user_groups.keys())}; got {user_group!r}")
    if status is not None and status not in PUBLIC_TAAP_STATUSES:
        raise ValidationError(f"status must be one of {list(PUBLIC_TAAP_STATUSES)}; got {status!r}")
    try:
        page = max(1, int(page or 1))
        page_size = max(1, min(100, int(page_size or 25)))
    except (TypeError, ValueError):
        raise ValidationError("page and page_size must be integers")

    params = {
        "statuses": [status] if status else list(PUBLIC_TAAP_STATUSES),
        "taap_identifier": taap_identifier or None,
        "campus": (campus or None) and campus.lower(),
        "academic_year": academic_year or None,
        "outcome": outcome,
        "user_group": user_group,
        "skip": (page - 1) * page_size,
        "limit": page_size,
    }
    lucene = _fulltext_query(q)
    if lucene:
        params.update({"index": TAAP_FULLTEXT_INDEX, "q": lucene})
        try:
            results, _ = db.cypher_query(_PUBLIC_TAAP_SEARCH, params)
        except Exception as e:  # the index is a deploy step; search must not 500 without it
            if "index" not in str(e).lower():
                raise
            params["terms"] = [term.lower() for term in q.split()]
            results, _ = db.cypher_query(_PUBLIC_TAAP_CONTAINS, params)
    else:
        results, _ = db.cypher_query(_PUBLIC_TAAP_BROWSE, params)

    total, rows = (results[0][0], results[0][1]) if results else (0, [])
    return {"total": total, "page": page, "page_size": page_size, "items": rows}


def get_public_taap(taap_identifier: str) -> dict:
    """One plan's public row, or NotFoundError when it does not exist or is not public."""
    result = search_public_taaps(taap_identifier=taap_identifier, page_size=1)
    if not result["items"]:
        raise NotFoundError(f"No public TAAP {taap_identifier!r}")
    return result["items"][0]


def public_taap_campuses() -> list:
    """Campuses that hold at least one public plan, for the search page's filter."""
    results, _ = db.cypher_query(
        """
        MATCH (t:TAAP)-[:taap_at_campus]->(c:Campus)
        WHERE coalesce(t.active, true) AND t.taap_status IN $statuses
        RETURN DISTINCT c.abbreviation AS abbreviation, c.name AS name
        ORDER BY name
        """,
        {"statuses": list(PUBLIC_TAAP_STATUSES)},
    )
    return [{"abbreviation": r[0], "name": r[1]} for r in results]
