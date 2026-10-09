"""
Parse one completed TAAP form into a dict.

The .docx is the primary source: its checkbox content controls carry a machine
readable state, where the PDF only carries a glyph. The PDF is read for what the
Word file cannot hold: the e-signature stamps (Adobe Sign at Sonoma State, DocuSign
at SF State), the SHA-256 of the signed bytes, and the verbatim text stored as the
signed copy's raw_text. Two SF State plans exist only as PDF; the same section
parser runs over the PDF text for those.

Run as a module to dump a folder to JSON:

    python -m app.database.tools.taap_import.parse_taap "<folder>" records.json
"""
import hashlib
import json
import re
import sys
import zipfile
from datetime import date
from pathlib import Path

from dateutil import parser as dateparser
from lxml import etree

from app.data_config import (
    taap_distribution_actions,
    taap_requirements,
    taap_signer_roles,
    taap_statement_elements,
    taap_user_groups,
)

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}
P_TAG = "{%s}p" % W
TR_TAG = "{%s}tr" % W
TC_TAG = "{%s}tc" % W

PLACEHOLDER = "Click or tap here to enter text."
CHECKED, UNCHECKED = "☒", "☐"

# Section headings in form order. A section's text runs from its heading to the next.
HEADINGS = [
    "ICT Product Information",
    "Referenced Documentation",
    "Known Accessibility Barriers",
    "Affected User Groups",
    "Proposed Alternative",
    "Product Specific Accessibility Statement",
    "Communication and Distribution",
    "Requirements Checklist",
    "Process Outcome",
    "Institutional Risk",
    "Accommodation Requirements",
    "Administrative Approval",
    "Next Review",
    "In the event of Vendor Non-Compliance",
    "Miscellaneous Notes",
    "Notice to all Parties",
    "Legal Framework",
]

# Form label -> vocabulary key, per checkbox section. Labels are matched by prefix
# after whitespace normalization, so the "(if applicable)" and repository parentheticals
# do not matter.
USER_GROUP_LABELS = {v: k for k, v in taap_user_groups.items()}
REQUIREMENT_LABELS = {v.rstrip("."): k for k, v in taap_requirements.items()}
STATEMENT_LABELS = {
    "Known barriers in the product interface": "known_barriers",
    "Impacted disability groups": "impacted_groups",
    "Link or reference to this document": "link_to_plan",
    "Add a disclaimer": "disclaimer",
    "Provide contact for further accessibility assistance": "assistance_contact",
}
DISTRIBUTION_LABELS = {
    "Posted the Accessibility Statement in course syllabi": "syllabi",
    "Posted the Accessibility Statement where the product is accessed": "point_of_access",
    "Provided copies of this document to Requesting Department": "requesting_department",
    "Provided copies of this document to Disability Services Office": "disability_services",
    "Provided copies of this document to Human Resources": "human_resources",
    "Provided copies of this document to IT Help Desk": "it_help_desk",
    "Saved the document in the ATI Systemwide ACR Repository": "acr_repository",
    "Other": "other",
}
OUTCOME_LABELS = {
    "Meets all six": "equally_effective",
    "Meets some": "non_equal_alternative",
    "Unable to provide": "referral",
}
RISK_LABELS = {"HIGH": "high", "MODERATE": "moderate", "LOW": "low"}
ROLE_LABELS = {v: k for k, v in taap_signer_roles.items()}

# Repeated page furniture in the PDF text that is not form content.
PDF_FURNITURE = re.compile(
    r"^(https://ati\.calstate\.edu/\S*|https://access\.sfsu\.edu/\S*|Version \d\.\d \d{6}|"
    r"Content is licensed under a Creative Commons.*|Docusign Envelope ID: .*)\s*$",
    re.M,
)


# --- .docx linearization -------------------------------------------------------------

def _para_text(p) -> str:
    out = []
    for node in p.iter():
        tag = etree.QName(node).localname
        if tag == "t":
            out.append(node.text or "")
        elif tag == "tab":
            out.append("\t")
        elif tag == "br":
            out.append("\n")
    return "".join(out)


def docx_lines(path: Path) -> list:
    """
    The form as a list of text lines in document order. Table rows become
    'cell | cell | cell' so a checkbox row reads '☒ | Blindness' and a signature
    row reads 'Role | Name | Signature | Date'. Checkbox glyphs come from the
    content control's rendered text, which Word keeps in step with its state.
    """
    with zipfile.ZipFile(path) as z:
        root = etree.fromstring(z.read("word/document.xml"))
    body = root.find("w:body", NS)
    lines = []
    for el in body.iter(P_TAG, TR_TAG):
        if el.tag == TR_TAG:
            cells = ["".join(_para_text(p) for p in tc.iter(P_TAG)).strip() for tc in el.iter(TC_TAG)]
            lines.append(" | ".join(cells))
        else:
            if any(a.tag == TC_TAG for a in el.iterancestors()):
                continue
            text = _para_text(el).strip()
            if text:
                lines.append(text)
    return lines


# --- .pdf reading --------------------------------------------------------------------

def pdf_text(path: Path, pages: tuple = None) -> str:
    """Text of the PDF, or of a 1-based inclusive page range when one PDF holds two plans."""
    import pymupdf

    with pymupdf.open(path) as doc:
        first, last = (1, len(doc)) if not pages else pages
        return "\n".join(doc[i].get_text() for i in range(first - 1, min(last, len(doc))))


def pdf_stamps(text: str) -> list:
    """
    E-signature stamps in document order.

    Adobe Sign (Sonoma State): 'Sarah Ellison (Sep 2, 2026 16:22:34 PDT)' -> name + date.
    DocuSign (SF State):       '10/03/2025 | 3:10 PM PDT'                 -> date only.
    """
    stamps = []
    for m in re.finditer(r"([A-Z][A-Za-z.'\- ]+?) \(([A-Z][a-z]{2} \d{1,2}, \d{4}) \d{2}:\d{2}:\d{2} [A-Z]{3,4}\)", text):
        stamps.append({"name": m.group(1).strip(), "date": _parse_date(m.group(2))})
    for m in re.finditer(r"(\d{2}/\d{2}/\d{4}) \| \d{1,2}:\d{2} [AP]M [A-Z]{3,4}", text):
        stamps.append({"name": None, "date": _parse_date(m.group(1))})
    return stamps


# --- field helpers -------------------------------------------------------------------

def _clean(value):
    if value is None:
        return None
    value = value.replace(PLACEHOLDER, "").strip().strip(".").strip()
    if not value or value.lower() in {"n/a", "na", "none", "[insert date]", "insert date"}:
        return None
    return value


def _parse_date(value):
    value = _clean(value)
    if not value:
        return None
    value = re.sub(r"(\d)(st|nd|rd|th)\b", r"\1", value)
    value = re.sub(r"\bSept\b", "Sep", value)
    value = value.replace(",", ", ").replace("  ", " ")
    try:
        return dateparser.parse(value, fuzzy=False).date()
    except (ValueError, OverflowError):
        return None


def _sections(text: str) -> dict:
    """Split the linearized form into {heading: body_text} in form order."""
    positions = []
    for heading in HEADINGS:
        m = re.search(r"^\s*" + re.escape(heading) + r"\s*$", text, re.M)
        if m:
            positions.append((m.start(), m.end(), heading))
    positions.sort()
    sections = {}
    for i, (start, end, heading) in enumerate(positions):
        stop = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        sections[heading] = text[end:stop].strip()
    return sections


def _checked(section: str, labels: dict) -> list:
    """
    Which labelled boxes in a section are checked. A label counts as checked when the
    nearest glyph before it on the same line (docx row) or the preceding line (PDF) is ☒.
    """
    flat = re.sub(r"\s+", " ", section)
    found = []
    for label, key in labels.items():
        pattern = r"([" + CHECKED + UNCHECKED + r"])\s*\|?\s*" + re.escape(label)
        m = re.search(pattern, flat)
        if m and m.group(1) == CHECKED and key not in found:
            found.append(key)
    return found


def _single_choice(section: str, labels: dict):
    flat = re.sub(r"\s+", " ", section)
    for label, key in labels.items():
        m = re.search(CHECKED + r"\s*" + re.escape(label), flat)
        if m:
            return key
    return None


def _between(text: str, start_marker: str, end_marker: str = None) -> str:
    i = text.find(start_marker)
    if i < 0:
        return text.strip()
    body = text[i + len(start_marker):]
    if end_marker:
        j = body.find(end_marker)
        if j >= 0:
            body = body[:j]
    return body.strip()


def _value_after(text: str, label: str):
    m = re.search(re.escape(label) + r"\s*(.*)", text)
    return _clean(m.group(1)) if m else None


def _signers(section: str) -> list:
    """
    The Administrative Approval table: one entry per role row with a name. The
    signature and date cells are empty in the Word file; the stamps come from the PDF.
    """
    flat = re.sub(r"[ \t]+", " ", section)
    signers = []
    for label, key in ROLE_LABELS.items():
        m = re.search(re.escape(label) + r"\s*\|?\s*([^|\n]+)", flat)
        if m:
            name = m.group(1).strip()
            if name and name not in ("Name",):
                signers.append({"role": key, "name_as_written": name})
    return signers


# --- the record -----------------------------------------------------------------------

def parse_form_text(text: str) -> dict:
    s = _sections(text)
    product_block = s.get("ICT Product Information", "")
    product = _value_after(product_block, "Product Name:")
    if product and "Vendor Contact:" in product:
        product = _clean(product.split("Vendor Contact:")[0])

    barriers = _between(s.get("Known Accessibility Barriers", ""),
                        "Describe the known accessibility barriers that affect core functionality.")
    alternative = _between(s.get("Proposed Alternative", ""), "name the responsible department.")
    statement_section = s.get("Product Specific Accessibility Statement", "")
    statement = _between(statement_section, "(Post this statement wherever the product is available and in use.)")
    notes = _between(s.get("Miscellaneous Notes", ""), "")
    notes = notes.replace(
        "This box will expand. If pasting content, paste it as plain text to maintain box formatting.", ""
    )
    # In PDF text the e-signature stamps print after the notes; they are not notes.
    notes = "\n".join(
        line for line in notes.splitlines()
        if not re.match(r"^\s*(\d{2}/\d{2}/\d{4}( \| .*)?|[A-Z][A-Za-z.'\- ]+ \([A-Z][a-z]{2} \d{1,2}, \d{4} .*\))\s*$", line)
    ).strip() or None

    review_m = re.search(r"on or before \[?([^\]\n]*)\]?", s.get("Next Review", ""))

    template_m = re.search(r"Version (\d\.\d \d{6})", text)

    return {
        "template_version": template_m.group(1) if template_m else None,
        "title": product,
        "version": _value_after(product_block, "Version:"),
        "vendor_contact": _value_after(product_block, "Vendor Contact:"),
        "creation_date": _parse_date(_value_after(product_block, "Creation Date:")),
        "known_barriers": barriers or None,
        "affected_user_groups": _checked(s.get("Affected User Groups", ""), USER_GROUP_LABELS),
        "proposed_alternative": alternative or None,
        "statement_elements": _checked(statement_section, STATEMENT_LABELS),
        "accessibility_statement": statement or None,
        "distribution_actions": _checked(s.get("Communication and Distribution", ""), DISTRIBUTION_LABELS),
        "requirements_met": _checked(s.get("Requirements Checklist", ""), REQUIREMENT_LABELS),
        "outcome": _single_choice(s.get("Process Outcome", ""), OUTCOME_LABELS),
        "institutional_risk": _single_choice(s.get("Institutional Risk", ""), RISK_LABELS),
        "accommodation_requirement": _single_choice(s.get("Accommodation Requirements", ""), RISK_LABELS),
        "signers": _signers(s.get("Administrative Approval", "")),
        "review_due": _parse_date(review_m.group(1)) if review_m else None,
        "misc_notes": notes,
    }


def parse_plan(docx_path: Path = None, pdf_path: Path = None, pdf_pages: tuple = None) -> dict:
    """
    One plan from its Word file and/or signed PDF. The Word file wins for every form
    field; the PDF supplies stamps, hash, and raw text. With only a PDF, the form
    fields are parsed from its text after the page furniture is removed. `pdf_pages`
    narrows a merged PDF to the pages holding this plan; the hash stays the file's.
    """
    if docx_path is None and pdf_path is None:
        raise ValueError("a .docx or a .pdf is required")

    record = {"docx": str(docx_path) if docx_path else None, "pdf": str(pdf_path) if pdf_path else None,
              "pdf_pages": list(pdf_pages) if pdf_pages else None}

    raw = None
    if pdf_path is not None:
        raw = pdf_text(pdf_path, pdf_pages)
        record["pdf_sha256"] = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
        record["stamps"] = pdf_stamps(raw)
        record["raw_text"] = raw
    else:
        record["pdf_sha256"] = None
        record["stamps"] = []
        record["raw_text"] = None

    if docx_path is not None:
        form_text = "\n".join(docx_lines(docx_path))
    else:
        form_text = PDF_FURNITURE.sub("", raw)
    record.update(parse_form_text(form_text))
    if not record.get("template_version") and raw:
        # The version string sits in the Word footer, which the body walk does not
        # see; the PDF prints it on every page.
        m = re.search(r"Version (\d\.\d \d{6})", raw)
        record["template_version"] = m.group(1) if m else None

    stamps = record["stamps"]
    signers = record["signers"]
    # Pair stamps to signer rows: by name when the stamp carries one, else by order.
    for idx, signer in enumerate(signers):
        signer["signed_date"] = None
        surname = signer["name_as_written"].split()[-1].lower() if signer["name_as_written"] else ""
        named = next((st for st in stamps if st["name"] and st["name"].split()[-1].lower() == surname), None)
        if named:
            signer["signed_date"] = named["date"]
        elif stamps and all(st["name"] is None for st in stamps) and idx < len(stamps):
            signer["signed_date"] = stamps[idx]["date"]

    dated = [sg["signed_date"] for sg in signers if sg.get("signed_date")]
    record["effective_date"] = max(dated) if dated else None
    filename_signed = bool(pdf_path and re.search(r"\(signed\)", pdf_path.name, re.I))
    if signers and dated and len(dated) == len(signers):
        record["taap_status"] = "signed"
    elif filename_signed:
        record["taap_status"] = "signed"
    elif dated:
        record["taap_status"] = "awaiting_signature"
    else:
        record["taap_status"] = "draft"
    return record


def pair_files(folder: Path) -> list:
    """
    Group a folder's files into plans. A plan's .docx and .pdf share a stem once the
    '(signed)', '(v2)', '(1)' and spacing differences are dropped; PDFs with no Word
    file stand alone.
    """
    def stem_key(p: Path) -> str:
        s = p.stem
        s = re.sub(r"\((?:signed|v\d+|\d+)\)", "", s, flags=re.I)
        s = re.sub(r"\.docx$", "", s, flags=re.I)
        return re.sub(r"[^a-z0-9]+", "", s.lower())

    plans = {}
    for p in sorted(folder.iterdir()):
        if p.suffix.lower() not in (".docx", ".pdf") or p.name.startswith("~$"):
            continue
        entry = plans.setdefault(stem_key(p), {"docx": None, "pdf": None})
        entry[p.suffix.lower().lstrip(".")] = p
    return [v for _, v in sorted(plans.items())]


def _json_default(value):
    if isinstance(value, date):
        return value.isoformat()
    raise TypeError(f"not serializable: {type(value)}")


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    folder, out = Path(argv[1]), Path(argv[2])
    records = []
    for pair in pair_files(folder):
        rec = parse_plan(pair["docx"], pair["pdf"])
        rec["key"] = (pair["docx"] or pair["pdf"]).stem
        records.append(rec)
    out.write_text(json.dumps(records, indent=2, default=_json_default, ensure_ascii=False), encoding="utf-8")
    print(f"{len(records)} plans -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
