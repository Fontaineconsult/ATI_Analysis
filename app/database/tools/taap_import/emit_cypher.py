"""
Emit one idempotent batch Cypher file per TAAP from parsed records plus the curation
decisions file.

Each file mirrors the side effects of queries/assets/create.py::create_taap and the
assign_* functions in queries/assets/update.py, in this order:

  1. Vendor (MERGE by name)                       -> Asset.supplied_by
  2. Asset (MERGE by asset_identifier)            -> asset_at_campus, supplied_by
  3. Requesting unit, alternative provider        -> OrgUnit:Department under the campus
  4. Signers, owner                               -> Person, works_at_campus when new
  5. Signed copy                                  -> Document by SHA-256 with raw_text
  6. The TAAP itself and its edges
  7. is_evidence_for to the campus/year YSEs
  8. An open Query when the form leaves the requesting department unnamed

Every string literal sits on one line (newlines escaped) because run_file splits a
file on ';' at end of line and drops lines that start with '//'.

    python -m app.database.tools.taap_import.emit_cypher "<folder>" <decisions.yaml> <out_dir>
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

import yaml

from app.database.identifiers import make_asset_identifier, make_taap_identifier
from app.database.tools.taap_import.parse_taap import pair_files, parse_plan

TODAY = date.today().isoformat()


# --- literal helpers --------------------------------------------------------------------

def q(value) -> str:
    """A Cypher string literal on one line, or null."""
    if value is None:
        return "null"
    s = str(value).replace("\\", "\\\\").replace('"', '\\"').replace("\r", "").replace("\n", "\\n")
    return f'"{s}"'


def d(value) -> str:
    return f'date("{value.isoformat() if isinstance(value, date) else value}")' if value else "null"


def lst(values) -> str:
    return "[" + ", ".join(q(v) for v in (values or [])) + "]"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")


def academic_year_for(when: date) -> str:
    start = when.year if when.month >= 7 else when.year - 1
    return f"{start}-{start + 1}"


NEW_ID = 'replace(randomUUID(), "-", "")'


# --- one plan ---------------------------------------------------------------------------

def build_plan(record: dict, decision: dict, shared: dict) -> tuple:
    """Return (taap_identifier, cypher_text) for one plan."""
    campus = decision.get("campus") or shared.get("campus_default")
    people_map = shared.get("people", {})
    evidence = shared.get("evidence", {})

    title = record["title"]
    asset_class = decision.get("asset_class", "third_party_service")
    asset_id = make_asset_identifier(slugify(title), campus)

    unit = decision["requesting_unit"]
    alt_unit = decision.get("alternative_provided_by")
    year_source = record["creation_date"] or record["effective_date"]
    if year_source is None:
        raise ValueError(f"{record['key']}: no creation or effective date")
    year_source = date.fromisoformat(year_source) if isinstance(year_source, str) else year_source
    taap_id = make_taap_identifier(asset_id, slugify(unit), str(year_source.year))
    ay = academic_year_for(year_source)

    preparer = decision.get("preparer", shared.get("preparer_default")) if "preparer" in decision else shared.get("preparer_default")
    vendor = decision.get("vendor")
    signers = [dict(s, name=people_map.get(s["name_as_written"], s["name_as_written"])) for s in record["signers"]]
    owner = next((s["name"] for s in signers if s["role"] == "department_head"), None)

    out = []
    w = out.append
    w(f"// {Path(record['docx'] or record['pdf']).name}")
    w(f"// TAAP {taap_id} at {campus}, academic year {ay}. Generated {TODAY} by")
    w("// app/database/tools/taap_import from the signed form; decisions in")
    w("// app/database/tools/taap_import/decisions/. Re-running is a no-op except that")
    w("// the TAAP's own properties are re-set from the form.")
    if decision.get("inferred"):
        w(f"// Requesting unit {unit!r} is inferred from the signers and prose, not stated on the form.")
    w("")

    # 1. Vendor
    if vendor:
        w("// ---- vendor")
        w(f"MERGE (v:Vendor {{name: {q(vendor['name'])}}})")
        sets = [f"v.unique_id = {NEW_ID}"]
        if vendor.get("contact_name"):
            sets.append(f"v.sales_contact_name = {q(vendor['contact_name'])}")
        if vendor.get("contact_email"):
            sets.append(f"v.sales_contact_email = {q(vendor['contact_email'])}")
        w("ON CREATE SET " + ", ".join(sets) + ";")
        w("")

    # 2. Asset
    w("// ---- asset (create_asset twin: composite identifier, campus anchor, vendor)")
    w(f"MATCH (c:Campus {{abbreviation: {q(campus)}}})")
    w(f"MERGE (a:Asset {{asset_identifier: {q(asset_id)}}})")
    w(f"ON CREATE SET a.unique_id = {NEW_ID}, a.title = {q(title)}, a.scope = \"campus\",")
    w(f"              a.asset_class = {q(asset_class)}, a.version = {q(record['version'])}")
    w("MERGE (a)-[:asset_at_campus]->(c)")
    if vendor:
        w("WITH a")
        w(f"MATCH (v:Vendor {{name: {q(vendor['name'])}}})")
        w("MERGE (a)-[:supplied_by]->(v);")
    else:
        w(";")
    w("")

    # 3. Units
    w("// ---- requesting unit (create_org_unit twin: Department under the campus)")
    for unit_name in dict.fromkeys([unit] + ([alt_unit] if alt_unit else [])):
        w(f"MATCH (c:Campus {{abbreviation: {q(campus)}}})")
        w(f"MERGE (u:OrgUnit {{name: {q(unit_name)}}})")
        w(f"ON CREATE SET u:Department, u.unique_id = {NEW_ID}")
        w("MERGE (u)-[:operates_under_campus]->(c);")
    w("")

    # 4. People
    if signers:
        w("// ---- signers (add_person twin: active, not a committee member; campus only when new)")
        for s in dict.fromkeys(s["name"] for s in signers):
            w(f"MATCH (c:Campus {{abbreviation: {q(campus)}}})")
            w(f"MERGE (p:Person {{name: {q(s)}}})")
            w(f"ON CREATE SET p.unique_id = {NEW_ID}, p.active = true, p.can_approve_yse = false,")
            w("              p.non_committee_member_active = true")
            w("WITH p, c WHERE NOT (p)-[:works_at_campus]->()")
            w("MERGE (p)-[:works_at_campus]->(c);")
        w("")

    # 5. Signed copy
    if record.get("pdf_sha256"):
        pdf_name = Path(record["pdf"]).name
        w("// ---- signed copy (Document keyed by the PDF's SHA-256; verbatim text in raw_text)")
        w(f"MERGE (doc:Document {{hash: {q(record['pdf_sha256'])}}})")
        w(f"ON CREATE SET doc.unique_id = {NEW_ID}, doc.name = {q(pdf_name)},")
        w(f"              doc.file_path = {q(record['pdf'])},")
        template = record.get("template_version")
        description = ("Signed Temporary Alternate Access Plan" +
                       (f" (CSU template {template})." if template else "."))
        w(f"              doc.description = {q(description)},")
        w(f"              doc.raw_text = {q(record['raw_text'])}, doc.raw_text_captured = date({q(TODAY)}),")
        w("              doc.include_in_report = false, doc.depreciated = false;")
        w("")

    # 6. TAAP
    w("// ---- the plan (create_taap twin: identifier, required edges, form fields)")
    w(f"MATCH (a:Asset {{asset_identifier: {q(asset_id)}}})")
    w(f"MATCH (c:Campus {{abbreviation: {q(campus)}}})")
    w(f"MATCH (u:OrgUnit {{name: {q(unit)}}})")
    w(f"MERGE (t:TAAP {{taap_identifier: {q(taap_id)}}})")
    w(f"ON CREATE SET t.unique_id = {NEW_ID}")
    w(f"SET t.title = {q(title)},")
    w(f"    t.template_version = {q(record.get('template_version'))},")
    w(f"    t.creation_date = {d(record['creation_date'])},")
    w(f"    t.vendor_contact = {q(record['vendor_contact'])},")
    w(f"    t.known_barriers = {q(record['known_barriers'])},")
    w(f"    t.affected_user_groups = {lst(record['affected_user_groups'])},")
    w(f"    t.proposed_alternative = {q(record['proposed_alternative'])},")
    w(f"    t.accessibility_statement = {q(record['accessibility_statement'])},")
    w(f"    t.statement_elements = {lst(record['statement_elements'])},")
    w(f"    t.distribution_actions = {lst(record['distribution_actions'])},")
    w(f"    t.requirements_met = {lst(record['requirements_met'])},")
    w(f"    t.outcome = {q(record['outcome'])},")
    w(f"    t.institutional_risk = {q(record['institutional_risk'])},")
    w(f"    t.accommodation_requirement = {q(record['accommodation_requirement'])},")
    w(f"    t.effective_date = {d(record['effective_date'])},")
    w(f"    t.review_due = {d(record['review_due'])},")
    w(f"    t.misc_notes = {q(record['misc_notes'])},")
    w(f"    t.taap_status = {q(record['taap_status'])},")
    w("    t.active = true")
    w("MERGE (t)-[:covers_asset]->(a)")
    w("MERGE (t)-[:taap_at_campus]->(c)")
    w("MERGE (t)-[:requested_by]->(u);")
    w("")
    w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (ay:AcademicYear {{name: {q(ay)}}})")
    w("MERGE (t)-[:taap_in_year]->(ay);")
    if alt_unit:
        w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (u:OrgUnit {{name: {q(alt_unit)}}})")
        w("MERGE (t)-[:alternative_provided_by]->(u);")
    if preparer:
        w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (p:Person {{name: {q(preparer)}}})")
        w("MERGE (t)-[:prepared_by]->(p);")
    if owner:
        w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (p:Person {{name: {q(owner)}}})")
        w("MERGE (t)-[:owned_by]->(p);")
    for s in signers:
        w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (p:Person {{name: {q(s['name'])}}})")
        w("MERGE (t)-[r:signed_by]->(p)")
        w(f"SET r.role = {q(s['role'])}, r.signed_date = {d(s.get('signed_date'))};")
    if record.get("pdf_sha256"):
        w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (doc:Document {{hash: {q(record['pdf_sha256'])}}})")
        w("MERGE (t)-[:signed_copy]->(doc);")
    w("")

    # 7. Evidence
    targets = dict(evidence.get("always", {}))
    if decision.get("instructional"):
        targets.update(evidence.get("instructional", {}))
    if "point_of_access" in (record["distribution_actions"] or []):
        targets.update(evidence.get("point_of_access", {}))
    w("// ---- evidence (connect_taap_to_yse twin; internal control)")
    for key, strength in targets.items():
        yid = f"{ay}-{key}-{campus}"
        w(f"MATCH (t:TAAP {{taap_identifier: {q(taap_id)}}}), (y:YearSuccessEvidence {{year_identifier: {q(yid)}}})")
        w("MERGE (t)-[r:is_evidence_for]->(y)")
        w(f"SET r.strength = {int(strength)}, r.control = \"internal\";")
    w("")

    # 8. Open question
    if decision.get("open_question"):
        signer_names = ", ".join(s["name"] for s in signers) or "the signers"
        detail = (f"The signed form names the product, the signers ({signer_names}) and the alternative, "
                  f"but not the requesting department. The plan is stored under the placeholder unit "
                  f"{unit!r}; renaming the unit re-identifies the plan, so settle this before the "
                  f"annual review.")
        w("// ---- open question: the form leaves the requesting department unnamed")
        w(f"MERGE (qn:Query {{question: {q(decision['open_question'])}}})")
        w(f"ON CREATE SET qn.unique_id = {NEW_ID}, qn.status = \"open\", qn.category = \"information_gap\",")
        w(f"              qn.date_raised = date({q(TODAY)}), qn.detail = {q(detail)}")
        w("WITH qn")
        w(f"OPTIONAL MATCH (wgp:WorkingGroupPlan {{plan_identifier: {q(f'{ay}-{campus}-pro')}}})")
        w("FOREACH (_ IN CASE WHEN wgp IS NULL THEN [] ELSE [1] END | MERGE (qn)-[:raised_under_plan]->(wgp))")
        w("WITH qn")
        w(f"OPTIONAL MATCH (y:YearSuccessEvidence {{year_identifier: {q(f'{ay}-8.10-pro-{campus}')}}})")
        w("FOREACH (_ IN CASE WHEN y IS NULL THEN [] ELSE [1] END | MERGE (qn)-[:addresses_evidence]->(y))")
        if preparer:
            w("WITH qn")
            w(f"OPTIONAL MATCH (p:Person {{name: {q(preparer)}}})")
            w("FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END | MERGE (qn)-[:answerable_by]->(p))")
        w(";")
        w("")

    return taap_id, "\n".join(out) + "\n"


# --- the run ----------------------------------------------------------------------------

def run(folder: Path, decisions_path: Path, out_dir: Path) -> list:
    shared = yaml.safe_load(decisions_path.read_text(encoding="utf-8"))
    plans = shared.get("plans", {})
    out_dir.mkdir(parents=True, exist_ok=True)

    pairs = {(p["docx"] or p["pdf"]).stem: p for p in pair_files(folder)}
    manifest = []
    for key, pair in pairs.items():
        decision = plans.get(key)
        if decision is None:
            raise KeyError(f"no decision for plan {key!r}; add it to {decisions_path.name}")
        if decision.get("skip"):
            continue
        pdf = folder / decision["pdf"] if decision.get("pdf") else pair["pdf"]
        pages = tuple(decision["pdf_pages"]) if decision.get("pdf_pages") else None
        record = parse_plan(pair["docx"], pdf, pages)
        record["key"] = key
        taap_id, cypher = build_plan(record, decision, shared)
        stamp = TODAY.replace("-", "_")
        path = out_dir / f"ingest_{stamp}_taap_{slugify(key)}.cypher"
        path.write_text(cypher, encoding="utf-8")
        manifest.append({
            "key": key, "taap_identifier": taap_id, "file": str(path),
            "status": record["taap_status"], "created": str(record["creation_date"]),
            "signers": [(s["role"], s["name_as_written"], str(s.get("signed_date"))) for s in record["signers"]],
            "unit": decision["requesting_unit"], "inferred": bool(decision.get("inferred")),
            "vendor": (decision.get("vendor") or {}).get("name"),
        })
    return manifest


def main(argv):
    if len(argv) != 4:
        print(__doc__)
        return 2
    manifest = run(Path(argv[1]), Path(argv[2]), Path(argv[3]))
    print(json.dumps(manifest, indent=1, ensure_ascii=False))
    print(f"{len(manifest)} plans emitted", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
