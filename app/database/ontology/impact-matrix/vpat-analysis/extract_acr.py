"""Extract the facts of a vendor ACR with Claude.

Reads a PDF, Word, HTML or text ACR and writes <acr>.extraction.json next to the input, in the
structure of extraction-schema.json. Claude records what the report says. It grades nothing;
apply_rules.js applies the rubric.

Two modes:

- two-pass (the default). Haiku copies the report into plain data (parse-prompt.md): the front
  matter, and one entry per criterion row with the rating and remark verbatim, eight PDF pages
  per call, the calls in parallel over the cached document. Code maps the
  ratings to the template terms and labels the rows the rubric does not grade on their remarks
  (Not Applicable, Not Evaluated, Level AAA). Sonnet reads the plain data and returns the
  front-page facts and the remark labels by row id, without copying the remarks back
  (extraction-prompt.md plus label-prompt.md). Code merges the two.
- single. One Opus call reads the document and writes the whole extraction. Slower and about
  ten times the cost; kept as the reference the two-pass output is checked against.

    .venv314/Scripts/python app/database/ontology/impact-matrix/vpat-analysis/extract_acr.py <acr file> [--out <path>] [--mode two-pass|single] [--effort medium]

Each call's raw response is saved next to the output before anything reads it, so a failure
later in the script does not lose a paid call.

Needs ANTHROPIC_API_KEY, an `ant auth login` profile, or `api-key=...` in impact-matrix/.claude-env.
A key not scoped to a workspace also needs `workspace-id=wrkspc_...` there (or ANTHROPIC_WORKSPACE_ID).
"""
import argparse
import base64
import copy
import json
import re
import sys
from pathlib import Path

import anthropic

HERE = Path(__file__).resolve().parent
SINGLE_MODEL = "claude-opus-5-5"
PARSE_MODEL = "claude-haiku-5-5"
LABEL_MODEL = "claude-sonnet-5-5"
PROMPT = (HERE / "extraction-prompt.md").read_text(encoding="utf-8")
PARSE_PROMPT = (HERE / "parse-prompt.md").read_text(encoding="utf-8")
LABEL_PROMPT = PROMPT + "\n\n" + (HERE / "label-prompt.md").read_text(encoding="utf-8")
SCHEMA = json.loads((HERE / "extraction-schema.json").read_text(encoding="utf-8"))

# Dollars per million tokens, for the cost line each call prints: input, output. A 1-hour cache
# write costs twice the input rate and a cache read a tenth of it.
PRICES = {SINGLE_MODEL: (4.00, 20.00), LABEL_MODEL: (2.00, 10.00), PARSE_MODEL: (0.10, 0.50)}

TERMS = ["Supports", "Partially Supports", "Does Not Support", "Not Applicable", "Not Evaluated"]
LABEL_FIELDS = ["remark_type", "remark_reason", "features_named", "hedged", "contradicts_rating", "affected_groups"]
BLANK = {"", "-", "--", "n/a", "na", "none", "."}
# A rating cell that points elsewhere or marks a heading is not a rating: "See WCAG 2.x section",
# "Reserved for future", "Heading cell - no response required", "Advisory - no response required".
POINTER = re.compile(r"^\s*(see\b|reserved for future|heading cell|advisory)", re.I)
# The review uses WCAG and the Revised Section 508 Standards only. The parse prompt skips the EN
# 301 549 tables; this drops any Haiku transcribes anyway.
EN_301_549 = re.compile(r"EN\s*301\s*549|^\s*(table\s*\d+\s*[:.]\s*)?clause\s+\d+", re.I)
PAGES_PER_PARSE = 8

PARSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["front", "rows", "notes"],
    "properties": {
        "front": {"type": "string", "description": "Front matter and notes, verbatim, with [page N] markers."},
        "rows": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["p", "t", "c", "n", "l", "r", "m"],
                "properties": {
                    "p": {"type": ["integer", "null"]},
                    "t": {"type": "string"},
                    "c": {"type": "string"},
                    "n": {"type": "string"},
                    "l": {"type": "string"},
                    "r": {"type": "string"},
                    "m": {"type": "string"},
                },
            },
        },
        "notes": {"type": "array", "items": {"type": "string"}},
    },
}


def label_schema() -> dict:
    """The report and the label fields of extraction-schema.json, rows replaced by labels by id."""
    row = SCHEMA["properties"]["rows"]["items"]["properties"]
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["report", "labels", "reading_notes"],
        "properties": {
            "report": copy.deepcopy(SCHEMA["properties"]["report"]),
            "labels": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id"] + LABEL_FIELDS,
                    "properties": {"id": {"type": "integer"}, **{f: copy.deepcopy(row[f]) for f in LABEL_FIELDS}},
                },
            },
            "reading_notes": copy.deepcopy(SCHEMA["properties"]["reading_notes"]),
        },
        "$defs": copy.deepcopy(SCHEMA["$defs"]),
    }


def docx_text(path: Path) -> str:
    """The paragraphs and tables of a Word ACR in document order, tables as pipe rows."""
    import docx
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    doc = docx.Document(str(path))
    out = []
    for child in doc.element.body.iterchildren():
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = Paragraph(child, doc).text.strip()
            if text:
                out.append(text)
        elif tag == "tbl":
            for row in Table(child, doc).rows:
                out.append(" | ".join(cell.text.strip().replace("\n", " ") for cell in row.cells))
            out.append("")
    return "\n".join(out)


def document_block(path: Path) -> list:
    """The ACR as message content. A PDF goes as a document block, so Claude reads its pages
    and page numbers; other formats go as text, without page numbers."""
    suffix = path.suffix.lower()
    # The document is cached, so a rerun on the same ACR within the hour reads it at the cache rate.
    if suffix == ".pdf":
        data = base64.standard_b64encode(path.read_bytes()).decode("ascii")
        return [{"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": data},
                 "title": path.name, "cache_control": {"type": "ephemeral", "ttl": "1h"}}]
    if suffix == ".docx":
        text = docx_text(path)
    elif suffix in (".html", ".htm", ".txt", ".md"):
        text = path.read_text(encoding="utf-8", errors="replace")
    else:
        sys.exit(f"Unsupported file type {suffix}. Use PDF, DOCX, HTML or text.")
    return [{"type": "document", "source": {"type": "text", "media_type": "text/plain", "data": text},
             "title": path.name, "cache_control": {"type": "ephemeral", "ttl": "1h"}}]


def claude_env() -> dict:
    """The name=value lines of impact-matrix/.claude-env (gitignored), names lowercased."""
    env_file = HERE.parent / ".claude-env"
    if not env_file.exists():
        return {}
    out = {}
    for line in env_file.read_text(encoding="utf-8").splitlines():
        name, _, value = line.partition("=")
        if value.strip():
            out[name.strip().lower()] = value.strip().strip("'\"")
    return out


def client() -> anthropic.Anthropic:
    """A client on the environment's credential, else the `api-key` in .claude-env. A key not
    scoped to a workspace also needs `workspace-id`, sent as the anthropic-workspace-id header."""
    import os
    env = claude_env()
    key = None
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        key = env.get("api-key") or env.get("anthropic_api_key")
    workspace = os.environ.get("ANTHROPIC_WORKSPACE_ID") or env.get("workspace-id")
    headers = {"anthropic-workspace-id": workspace} if workspace else None
    return anthropic.Anthropic(api_key=key, default_headers=headers)


def cost(model: str, usage) -> float:
    rate_in, rate_out = PRICES.get(model, (0, 0))
    return (usage.input_tokens * rate_in
            + (usage.cache_creation_input_tokens or 0) * rate_in * 2
            + (usage.cache_read_input_tokens or 0) * rate_in * 0.1
            + usage.output_tokens * rate_out) / 1e6


def call(client_, step: str, model: str, system: str, content: list, schema: dict, effort: str,
         max_tokens: int, raw_path: Path) -> tuple[dict, dict]:
    """One structured-output call. Returns the parsed JSON and a usage record."""
    kwargs = {}
    if model != PARSE_MODEL:
        # Server-side fallback reruns the request on another model if a safety classifier
        # declines it, so a vendor document that trips a classifier still gets read. Haiku has
        # no server-side fallback.
        kwargs = {"betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}
    with client_.beta.messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral", "ttl": "1h"}}],
        output_config={"effort": effort, "format": {"type": "json_schema", "schema": schema}},
        messages=[{"role": "user", "content": content}],
        **kwargs,
    ) as stream:
        message = stream.get_final_message()
        request_id = getattr(stream, "request_id", None)

    # The raw response goes to disk before anything reads it, so a bug below cannot lose a paid call.
    raw_path.write_text(message.to_json(), encoding="utf-8")
    u = message.usage
    record = {
        "step": step, "model": message.model, "request_id": request_id, "effort": effort,
        "stop_reason": message.stop_reason, "input_tokens": u.input_tokens,
        "cache_creation_input_tokens": u.cache_creation_input_tokens,
        "cache_read_input_tokens": u.cache_read_input_tokens, "output_tokens": u.output_tokens,
        "cost_usd": round(cost(model, u), 4),
    }
    print(f"{step}: {message.model}, {message.stop_reason}, input {u.input_tokens} + cache write "
          f"{u.cache_creation_input_tokens or 0} + cache read {u.cache_read_input_tokens or 0}, output "
          f"{u.output_tokens}, about ${record['cost_usd']:.3f}. Request id {request_id}.", file=sys.stderr)
    if message.stop_reason == "refusal":
        details = message.stop_details
        sys.exit(f"{step}: Claude declined the request ({getattr(details, 'category', None)}). Request id {request_id}.")
    if message.stop_reason == "max_tokens":
        sys.exit(f"{step}: the response ran past {max_tokens} tokens; it is saved in {raw_path.name}. "
                 "Lower --effort, or split the ACR by product or table and run each part.")
    text = next(b.text for b in message.content if b.type == "text")
    return json.loads(text), record


# ---- two-pass mode

TERM_IN_CELL = re.compile(r"partially supports|does not support|not applicable|not evaluated|supports", re.I)
# The worst part of a rating split by product part stands for the row.
WORST_FIRST = ["Does Not Support", "Partially Supports", "Supports", "Not Evaluated", "Not Applicable"]


def term(raw: str) -> str:
    """The template term a printed rating maps to, or `other`."""
    return rating(raw)[0]


def rating(raw: str) -> tuple[str, list | None]:
    """The term a rating cell maps to, and its parts when VPAT 2.5's per-part form splits it,
    such as "Web: Supports, Mobile: Partially Supports". A cell whose words are not all terms
    and part labels is `other`, for the analyst to read."""
    folded = re.sub(r"[\s.:;]+$", "", re.sub(r"\s+", " ", raw)).strip().lower()
    for t in TERMS:
        if folded == t.lower():
            return t, None
    found = TERM_IN_CELL.findall(raw)
    if not found:
        return "other", None
    # What is left once the terms, the part labels ("Web:") and bracketed labels are taken out
    # must be punctuation or "and"; anything else is a word the rubric cannot read.
    rest = TERM_IN_CELL.sub(" ", raw)
    rest = re.sub(r"[^\s:,;()/]+(?:\s+[^\s:,;()/]+)*\s*:", " ", rest)
    rest = re.sub(r"\([^)]*\)", " ", rest)
    if re.sub(r"[\s,;/&+\-–.]|\band\b", "", rest, flags=re.I):
        return "other", None
    parts, prev_end = [], 0
    for m in TERM_IN_CELL.finditer(raw):
        before = raw[prev_end:m.start()]
        after = re.match(r"\s*\(([^)]*)\)", raw[m.end():])
        # "Web: Supports" puts the label before the term; "Supports (Web)" puts it after.
        label = before.rsplit(":", 1)[0] if ":" in before else (after.group(1) if after else "")
        label = re.sub(r"^[\s,;/&+\-–.]+|[\s,;/&+\-–.:]+$|^\s*and\s+", "", label.replace(")", ""))
        parts.append({"part": label or None, "term": next(t for t in TERMS if t.lower() == m.group(0).lower())})
        prev_end = m.end() + (after.end() if after else 0)
    return min((p["term"] for p in parts), key=WORST_FIRST.index), parts


def level(row: dict) -> str:
    """The level printed on the row, else the one in a table heading such as "Level AA"."""
    m = re.search(r"(?<![A-Za-z])(AAA|AA|A)(?![A-Za-z])", row["l"] or "")
    m = m or re.search(r"\bLevel\s+(AAA|AA|A)(?![A-Za-z])", row["t"] or "", re.I)
    return m.group(1).upper() if m else "none"


def by_rule(row: dict) -> dict | None:
    """Labels for a row the rubric does not grade on its remark, or None when Sonnet labels it."""
    if row["conformance"] not in ("Not Applicable", "Not Evaluated") and row["level"] != "AAA":
        return None
    blank = row["remarks"].strip().lower() in BLANK
    return {
        "remark_type": "blank" if blank else "generic",
        "remark_reason": ("Labelled by rule: the cell is empty." if blank else
                          "Labelled by rule: Not Applicable, Not Evaluated and Level AAA rows are not graded on the remark."),
        "features_named": [], "hedged": False, "contradicts_rating": False, "affected_groups": [],
    }


def label_input(parsed: dict, rows: list, to_label: list) -> str:
    tables = {}
    for r in rows:
        tables[r["table"]] = tables.get(r["table"], 0) + 1
    lines = ["FRONT MATTER (transcribed, with [page N] markers)", "", parsed["front"], "",
             "TABLES (heading as printed: rows)"]
    lines += [f"- {t}: {n}" for t, n in tables.items()]
    lines += ["", "FIRST-PASS NOTES"] + [f"- {n}" for n in parsed["notes"] or ["(none)"]]
    lines += ["", "ROWS TO LABEL (id | table | criterion name | level | rating as printed | remark)"]
    for i in to_label:
        r = rows[i]
        lines.append(f"{i} | {r['table']} | {r['criterion']} {r['name']} | {r['level']} | {r['conformance_raw']} | {r['remarks'] or '(empty)'}")
    return "\n".join(lines)


# Criterion numbers as they appear in running text. A WCAG number is not read out of an EN 301 549
# clause number (9.1.4.3) or a longer section number (11.5.2.5), since a digit or a point sits
# against it.
WCAG_IN_TEXT = re.compile(r"(?<![\d.])([1-4]\.\d{1,2}\.\d{1,2})(?![\d.]*\d)")
S508_IN_TEXT = re.compile(r"(?<![\d.])((?:30\d|40\d|41[0-5]|50[1-4]|60[2-3])(?:\.\d+)+)(?![\d])")


def text_layer(path: Path) -> dict | None:
    """The criterion numbers in the document's own text, for apply_rules.js to check the
    transcription against. It runs locally and costs nothing. None for a format without one."""
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        import pypdf
        pages = [(p.extract_text() or "") for p in pypdf.PdfReader(str(path)).pages]
    elif suffix == ".docx":
        pages = [docx_text(path)]
    elif suffix in (".html", ".htm", ".txt", ".md"):
        pages = [path.read_text(encoding="utf-8", errors="replace")]
    else:
        return None
    criteria, with_criteria = set(), []
    for i, text in enumerate(pages, 1):
        found = set(WCAG_IN_TEXT.findall(text)) | set(S508_IN_TEXT.findall(text))
        criteria |= found
        if found:
            with_criteria.append(i)
    return {"pages": len(pages), "pages_with_text": sum(1 for t in pages if t.strip()),
            "pages_with_criteria": with_criteria, "criteria": sorted(criteria)}


def page_ranges(path: Path) -> list:
    """Page ranges for the parse calls. Haiku shortens a transcription of a whole long report,
    so a PDF goes in ranges of PAGES_PER_PARSE pages. Other formats have no pages and go whole."""
    if path.suffix.lower() != ".pdf":
        return [None]
    import pypdf
    n = len(pypdf.PdfReader(str(path)).pages)
    return [(a, min(a + PAGES_PER_PARSE - 1, n)) for a in range(1, n + 1, PAGES_PER_PARSE)]


def parse(client_, path: Path, out: Path) -> tuple[dict, list]:
    """Transcribe the ACR range by range. The first call writes the document to the cache, then
    the rest run in parallel and read it from there."""
    from concurrent.futures import ThreadPoolExecutor
    doc = document_block(path)
    ranges = page_ranges(path)

    def one(i):
        span = ranges[i]
        ask = "Transcribe this ACR." if span is None else f"Transcribe pages {span[0]} to {span[1]} of this ACR."
        return call(client_, f"parse {i + 1}/{len(ranges)}" + (f" (pages {span[0]}-{span[1]})" if span else ""),
                    PARSE_MODEL, PARSE_PROMPT, doc + [{"type": "text", "text": ask}],
                    PARSE_SCHEMA, "medium", 64000, out.with_suffix(f".parse{i + 1}.raw.json"))

    results = [one(0)]
    with ThreadPoolExecutor(max_workers=8) as pool:
        results += list(pool.map(one, range(1, len(ranges))))
    for (data, usage), span in zip(results, ranges):
        usage["pages"] = list(span) if span else None
        usage["rows"] = len(data["rows"])
    parsed = {"front": "\n".join(r[0]["front"] for r in results if r[0]["front"].strip()),
              "rows": [row for r in results for row in r[0]["rows"]],
              "notes": [n for r in results for n in r[0]["notes"]]}
    return parsed, [r[1] for r in results]


def extract_two_pass(path: Path, effort: str, out: Path) -> dict:
    client_ = client()
    parsed, parse_usage = parse(client_, path, out)
    if not parsed["rows"]:
        sys.exit("parse: Haiku transcribed no rows. The raw responses are saved; see their notes.")

    rows, seen, pointers, en_rows = [], set(), [], 0
    for p in parsed["rows"]:
        if EN_301_549.search(p["t"]):
            en_rows += 1
            continue
        if POINTER.match(p["r"]):
            # Kept in the record: a criterion rated "See WCAG 2.x section" is present, not missing.
            pointers.append({"table": p["t"], "criterion": p["c"].strip(), "rating": p["r"], "page": p["p"]})
            continue
        # A row on a range boundary can come back from both calls; the first copy stands.
        key = (p["t"].strip().lower(), p["c"].strip())
        if key in seen:
            continue
        seen.add(key)
        conformance, parts = rating(p["r"])
        row = {"table": p["t"], "criterion": p["c"].strip(), "name": p["n"].strip(), "level": level(p),
               "conformance": conformance, "conformance_raw": p["r"], "remarks": p["m"], "page": p["p"]}
        if parts:
            row["conformance_parts"] = parts
        rows.append(row)
    to_label = [i for i, r in enumerate(rows) if by_rule(r) is None]

    labelled, label_usage = call(
        client_, "label", LABEL_MODEL, LABEL_PROMPT,
        [{"type": "text", "text": label_input(parsed, rows, to_label)}],
        label_schema(), effort, 32000, out.with_suffix(".label.raw.json"))

    labels = {lab["id"]: lab for lab in labelled["labels"]}
    missing = [i for i in to_label if i not in labels]
    if missing:
        sys.exit(f"label: Sonnet returned no labels for row ids {missing}. Both raw responses are saved.")
    for i, r in enumerate(rows):
        lab = by_rule(r) or labels[i]
        r.update({f: lab[f] for f in LABEL_FIELDS})

    report = labelled["report"]
    # Code read the ratings, so it knows the nonstandard terms for certain.
    printed = sorted({r["conformance_raw"].strip() for r in rows if r["conformance"] == "other"})
    report["nonstandard_terms"] = sorted(set(report.get("nonstandard_terms") or []) | set(printed))
    notes = labelled["reading_notes"]
    notes.append(f"Two-pass extraction: {PARSE_MODEL} transcribed {len(rows)} rows; {LABEL_MODEL} labelled "
                 f"{len(to_label)}; {len(rows) - len(to_label)} Not Applicable, Not Evaluated or Level AAA rows "
                 f"were labelled by rule; {len(pointers)} rows whose rating cell points to another section or marks "
                 f"a heading were left out; {en_rows} EN 301 549 rows were left out, since the review does "
                 "not use that standard.")
    calls = parse_usage + [label_usage]
    return {
        # The front matter as transcribed, kept for later steps such as product_context.py.
        "report": report, "rows": rows, "reading_notes": notes, "front_matter": parsed["front"],
        "_source": {"file": path.name, "mode": "two-pass", "calls": calls,
                    "cost_usd": round(sum(c["cost_usd"] for c in calls), 4),
                    "dropped": {"pointer": pointers, "en_301_549": en_rows},
                    "text_layer": text_layer(path)},
    }


# ---- single mode

def extract_single(path: Path, effort: str, out: Path) -> dict:
    content = document_block(path) + [{
        "type": "text",
        "text": "Extract this ACR into the schema. Page numbers are null when the document has none.",
    }]
    # Thinking counts against max_tokens, and a full ACR is ~30k tokens of JSON on its own.
    data, usage = call(client(), "single", SINGLE_MODEL, PROMPT, content, SCHEMA, effort, 128000,
                       out.with_suffix(".raw.json"))
    data["_source"] = {"file": path.name, "mode": "single", "calls": [usage], "cost_usd": usage["cost_usd"],
                       "text_layer": text_layer(path)}
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("acr", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--mode", default="two-pass", choices=["two-pass", "single"])
    parser.add_argument("--effort", default="medium", choices=["low", "medium", "high", "xhigh", "max"],
                        help="effort for the labelling call (two-pass) or the one call (single)")
    args = parser.parse_args()
    if not args.acr.exists():
        sys.exit(f"No such file: {args.acr}")
    out = args.out or args.acr.with_suffix(".extraction.json")
    extract = extract_two_pass if args.mode == "two-pass" else extract_single
    try:
        data = extract(args.acr, args.effort, out)
    except anthropic.AuthenticationError:
        sys.exit("No valid Anthropic credential. Set ANTHROPIC_API_KEY or run `ant auth login`.")
    except TypeError as e:
        # The SDK raises TypeError before sending when it finds no credential at all.
        if "authentication" not in str(e):
            raise
        sys.exit("No Anthropic credential found. Set ANTHROPIC_API_KEY or run `ant auth login`.")
    except anthropic.RateLimitError as e:
        sys.exit(f"Rate limited. Retry after {e.response.headers.get('retry-after', '60')} seconds.")
    except anthropic.APIStatusError as e:
        sys.exit(f"API error {e.status_code}: {e.message}")
    except anthropic.APIConnectionError:
        sys.exit("Could not reach the Anthropic API.")
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out}: {len(data.get('rows', []))} rows, about ${data['_source']['cost_usd']:.3f}")


if __name__ == "__main__":
    main()
