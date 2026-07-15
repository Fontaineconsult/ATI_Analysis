"""
Generate a Cypher seed script from app/database/ontology/governance_seed.md.

The seed is a Markdown file whose entities are fenced ```yaml blocks following the
"Conversion Contract" documented at the top of that file:

  * `type`         -> the Neo4j label
  * `merge_key`    -> the property to MERGE on (always `title` here)
  * `properties`   -> written to the node; `effective_date` / `last_updated` /
                      `authored_date` are DateProperty fields and are wrapped in
                      Cypher `date("YYYY-MM-DD")`
  * `confidence` / `notes` are provenance metadata and are NOT written.
  * `sources` (url/title/accessed) ARE attached, as Document (for `.pdf` URLs) or
    Webpage (everything else) nodes linked `(gov)-[:is_sourced_from]->(source)`
    (distinct from the evidence-flavored `is_documented_by` used by implementations).

This is a self-contained text transformer — it parses the regular, single-line
`  key: "value"` property lines directly (no YAML/Neo4j dependency) and emits two
idempotent multi-statement .cypher files:

  1. governance_seed.cypher     — the 61 governance nodes (MERGE on title).
  2. governance_sources.cypher  — Document/Webpage source nodes + is_documented_by
                                  edges (run AFTER the seed; MATCHes the gov nodes).

Both mint `unique_id` ON CREATE so raw-Cypher nodes carry the id neomodel expects.
Source nodes dedupe on their unique key (Document.hash / Webpage.url), so a URL cited
by several governance nodes becomes one node with several edges.

Run:  .venv314/Scripts/python.exe app/database/tools/generate_governance_cypher.py
Output: app/database/batch/governance_seed.cypher, governance_sources.cypher
"""
from __future__ import annotations

import hashlib
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

# Repo-root-relative paths (this file lives at app/database/tools/).
ROOT = Path(__file__).resolve().parents[3]
SEED_MD = ROOT / "app" / "database" / "ontology" / "governance_seed.md"
OUT_CYPHER = ROOT / "app" / "database" / "batch" / "governance_seed.cypher"
OUT_SOURCES = ROOT / "app" / "database" / "batch" / "governance_sources.cypher"

# Property keys that are neomodel DateProperty fields -> wrap in date("...").
DATE_KEYS = {"effective_date", "last_updated", "authored_date"}

# Labels we expect, with the coverage-table counts from the seed (a sanity check).
EXPECTED_COUNTS = {
    "Law": 16,
    "Case": 16,
    "Directive": 7,
    "ExternalPolicy": 4,
    "Memo": 7,
    "Guideline": 11,
}

YAML_BLOCK = re.compile(r"```yaml\s*\n(.*?)```", re.DOTALL)
PROP_LINE = re.compile(r"^  ([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$")
TOP_LINE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$")
SOURCE_URL_LINE = re.compile(r"^  - url:\s*(.*)$")
SOURCE_FIELD_LINE = re.compile(r"^    (url|title|accessed):\s*(.*)$")


def _unquote(value: str) -> str:
    """Strip one pair of surrounding double quotes from a YAML scalar."""
    value = value.strip()
    if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
        return value[1:-1]
    return value


def _cypher_string(value: str) -> str:
    """A double-quoted Cypher string literal with backslashes/quotes escaped."""
    escaped = (
        value.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "")
    )
    return f'"{escaped}"'


def parse_blocks(text: str) -> list[dict]:
    """Return [{'type': label, 'props': {...}, 'sources': [{url,title,accessed}]}]."""
    entities = []
    for raw in YAML_BLOCK.findall(text):
        label = None
        props: dict[str, str] = {}
        sources: list[dict] = []
        section = None  # None | 'properties' | 'sources'
        for line in raw.splitlines():
            if not line.strip():
                continue
            # A non-indented key toggles the current section.
            top = TOP_LINE.match(line)
            if top and not line[0].isspace():
                key, val = top.group(1), top.group(2)
                if key == "type":
                    label = _unquote(val)
                    section = None
                elif key == "properties":
                    section = "properties"
                elif key == "sources":
                    section = "sources"
                else:  # merge_key, confidence, notes, ...
                    section = None
                continue
            if section == "properties":
                m = PROP_LINE.match(line)
                if m:
                    props[m.group(1)] = _unquote(m.group(2))
            elif section == "sources":
                start = SOURCE_URL_LINE.match(line)
                if start:
                    sources.append({"url": _unquote(start.group(1))})
                    continue
                field = SOURCE_FIELD_LINE.match(line)
                if field and sources:
                    sources[-1][field.group(1)] = _unquote(field.group(2))
        if label and "title" in props:
            entities.append({"type": label, "props": props, "sources": sources})
        else:
            raise ValueError(f"Block missing type/title:\n{raw[:200]}")
    return entities


def build_statement(entity: dict) -> str:
    label = entity["type"]
    props = entity["props"]
    title = props["title"]

    assignments = []
    for key, value in props.items():
        if key == "title":
            continue  # already the MERGE key
        if key in DATE_KEYS:
            assignments.append(f'  n.{key} = date("{value}")')
        else:
            assignments.append(f"  n.{key} = {_cypher_string(value)}")

    lines = [f"MERGE (n:{label} {{title: {_cypher_string(title)}}})"]
    lines.append("ON CREATE SET n.unique_id = replace(randomUUID(), '-', '')")
    if assignments:
        lines.append("SET\n" + ",\n".join(assignments))
    return "\n".join(lines) + ";"


def classify_source(url: str) -> str:
    """A `.pdf` URL is modeled as a Document (uri_path); anything else a Webpage."""
    return "Document" if urlsplit(url).path.lower().endswith(".pdf") else "Webpage"


def _doc_hash(url: str) -> str:
    """Stable dedupe key for a web-referenced Document (Document.hash is the unique key)."""
    return hashlib.sha1(url.encode("utf-8")).hexdigest()


def build_source_statement(entity: dict, source: dict) -> str:
    """MATCH the (already-seeded) governance node, MERGE the source node, MERGE the edge.

    MATCH-first means a missing governance node yields no rows and creates no orphan
    source. Source nodes dedupe on their unique key so a URL shared across governance
    nodes becomes one node with several `is_sourced_from` edges.
    """
    label = entity["type"]
    title = entity["props"]["title"]
    url = source["url"]
    name = source.get("title") or url
    accessed = source.get("accessed")
    kind = classify_source(url)

    lines = [f"MATCH (n:{label} {{title: {_cypher_string(title)}}})"]
    if kind == "Document":
        lines.append(f'MERGE (s:Document {{hash: "{_doc_hash(url)}"}})')
        lines.append(
            "ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),\n"
            f"    s.name = {_cypher_string(name)},\n"
            f"    s.uri_path = {_cypher_string(url)},\n"
            "    s.include_in_report = true"
        )
    else:
        lines.append(f"MERGE (s:Webpage {{url: {_cypher_string(url)}}})")
        lines.append(
            "ON CREATE SET s.unique_id = replace(randomUUID(), '-', ''),\n"
            f"    s.name = {_cypher_string(name)},\n"
            "    s.include_in_report = true"
        )
    lines.append("MERGE (n)-[r:is_sourced_from]->(s)")
    if accessed:
        lines.append(f'ON CREATE SET r.added_date = date("{accessed}")')
    return "\n".join(lines) + ";"


def _write_nodes(entities: list[dict], counts: Counter) -> None:
    header = [
        "// governance_seed.cypher",
        "// GENERATED from app/database/ontology/governance_seed.md by",
        "//   app/database/tools/generate_governance_cypher.py — do not edit by hand.",
        "//",
        "// Idempotent: MERGE on `title` (unique_index in graph_schema.py); node",
        "// properties are re-applied on every run; `unique_id` is minted once ON",
        "// CREATE (neomodel-compatible 32-char hex) so these nodes carry the id the",
        "// app expects. Provenance (confidence/notes) is intentionally omitted; the",
        "// `sources` are attached separately by governance_sources.cypher.",
        "//",
        f"// Nodes: {sum(counts.values())} total — "
        + ", ".join(f"{lbl} {counts[lbl]}" for lbl in EXPECTED_COUNTS),
        "// Requires Neo4j 4.3+ for randomUUID(). No relationships are created --",
        "// the `informs` edges (informs-hints in the seed) are left for a later pass.",
        "",
    ]
    body = []
    for label in EXPECTED_COUNTS:
        group = [e for e in entities if e["type"] == label]
        if not group:
            continue
        body.append(f"// ---- {label} ({len(group)}) " + "-" * (60 - len(label)))
        body.append("")
        for e in group:
            body.append(build_statement(e))
            body.append("")
    OUT_CYPHER.parent.mkdir(parents=True, exist_ok=True)
    OUT_CYPHER.write_text("\n".join(header + body).rstrip() + "\n", encoding="utf-8")


def _write_sources(entities: list[dict]) -> dict:
    """Emit governance_sources.cypher; return {edges, docs, webpages} unique-count stats."""
    stmt_count = 0
    unique_docs, unique_webpages = set(), set()
    body = []
    for label in EXPECTED_COUNTS:
        group = [e for e in entities if e["type"] == label]
        if not group:
            continue
        body.append(f"// ==== {label} " + "=" * (66 - len(label)))
        body.append("")
        for e in group:
            srcs = e.get("sources", [])
            if not srcs:
                continue
            body.append(f"// {e['props']['title']}")
            for s in srcs:
                url = s["url"]
                if classify_source(url) == "Document":
                    unique_docs.add(url)
                else:
                    unique_webpages.add(url)
                body.append(build_source_statement(e, s))
                body.append("")
                stmt_count += 1

    header = [
        "// governance_sources.cypher",
        "// GENERATED from app/database/ontology/governance_seed.md by",
        "//   app/database/tools/generate_governance_cypher.py — do not edit by hand.",
        "//",
        "// RUN AFTER governance_seed.cypher — each statement MATCHes an existing",
        "// governance node, then MERGEs the source (Document for .pdf URLs by",
        "// Document.hash, else Webpage by url) and the (gov)-[:is_sourced_from]->(src)",
        "// edge. Idempotent + deduped: a URL cited by several nodes is one node with",
        "// several edges. `unique_id` minted ON CREATE; edge.added_date = source's",
        "// `accessed` date.",
        "//",
        f"// {stmt_count} edges -> {len(unique_docs)} Document + {len(unique_webpages)} "
        f"Webpage unique source nodes.",
        "// Requires Neo4j 4.3+ for randomUUID().",
        "",
    ]
    OUT_SOURCES.write_text("\n".join(header + body).rstrip() + "\n", encoding="utf-8")
    return {"edges": stmt_count, "docs": len(unique_docs), "webpages": len(unique_webpages)}


def main() -> None:
    text = SEED_MD.read_text(encoding="utf-8")
    entities = parse_blocks(text)

    counts = Counter(e["type"] for e in entities)
    problems = []
    for label, expected in EXPECTED_COUNTS.items():
        if counts.get(label, 0) != expected:
            problems.append(f"  {label}: parsed {counts.get(label, 0)}, expected {expected}")
    unexpected = set(counts) - set(EXPECTED_COUNTS)
    if unexpected:
        problems.append(f"  unexpected labels: {sorted(unexpected)}")

    _write_nodes(entities, counts)
    src = _write_sources(entities)

    print(f"Wrote {OUT_CYPHER.relative_to(ROOT)}")
    print(f"  {sum(counts.values())} nodes: " + ", ".join(f"{k}={v}" for k, v in counts.items()))
    if problems:
        print("WARNING — coverage mismatch vs. the seed's table:")
        print("\n".join(problems))
    else:
        print("  coverage matches the seed's table (16/16/7/4/7/11).")
    print(f"Wrote {OUT_SOURCES.relative_to(ROOT)}")
    print(f"  {src['edges']} is_sourced_from edges -> "
          f"{src['docs']} Document + {src['webpages']} Webpage unique source nodes")


if __name__ == "__main__":
    main()
