"""TAAP importer: signers enter as contacts and follow the identity rule.

Pure unit tests over emit_cypher.build_plan; no database. The person-identity gate's
parser reads the emitted statements, which is how the importer and the gate agree.
"""
import pytest

from app.database.cypher_runner.gates.person_identity import find_person_claims
from app.database.cypher_runner.run_file import split_statements
from app.database.tools.taap_import.emit_cypher import build_plan, resolve_person

pytestmark = pytest.mark.unit


def _record(signers):
    return {
        "key": "x", "title": "Widget", "docx": "Widget.docx", "pdf": None, "pdf_sha256": None,
        "creation_date": "2026-08-01", "effective_date": None, "version": None,
        "template_version": None, "signers": signers, "vendor_contact": None,
        "known_barriers": None, "affected_user_groups": [], "proposed_alternative": None,
        "accessibility_statement": None, "statement_elements": [], "distribution_actions": [],
        "requirements_met": [], "outcome": None, "institutional_risk": None,
        "accommodation_requirement": None, "review_due": None, "misc_notes": None,
        "taap_status": "approved", "raw_text": None,
    }


def _emit(signers, people=None):
    shared = {"campus_default": "ssu", "people": people or {}, "evidence": {}}
    _, cypher = build_plan(_record(signers), {"requesting_unit": "Library"}, shared)
    return cypher


def test_new_signer_is_created_as_a_contact_and_never_as_a_committee_flag():
    cypher = _emit([{"role": "department_head", "name_as_written": "Ryan Smith"}])
    assert 'p.ati_involvement = "contact"' in cypher
    assert "non_committee_member_active" not in cypher
    # Involvement is set only ON CREATE, so an existing member is never demoted or promoted.
    create_block = cypher.split('MERGE (p:Person {name: "Ryan Smith"})', 1)[1].split(";", 1)[0]
    assert "ON CREATE SET" in create_block and create_block.count("ati_involvement") == 1


def test_people_map_accepts_a_name_or_a_name_with_email():
    assert resolve_person("Dr. X", {"Dr. X": "X"}) == {"name": "X", "email": None}
    assert resolve_person("Dr. X", {"Dr. X": {"name": "X", "email": " X@Sonoma.EDU "}}) == \
        {"name": "X", "email": "x@sonoma.edu"}
    assert resolve_person("Unmapped", {}) == {"name": "Unmapped", "email": None}


def test_known_email_is_written_normalized_and_only_to_a_person_without_one():
    cypher = _emit([{"role": "department_head", "name_as_written": "Dr. Jeff"}],
                   people={"Dr. Jeff": {"name": "Jeff Wilson", "email": "WilsonJ@sonoma.edu"}})
    assert ('MATCH (p:Person {name: "Jeff Wilson"}) WHERE p.email IS NULL '
            'SET p.email = "wilsonj@sonoma.edu";') in cypher


def test_emitted_signers_are_visible_to_the_identity_gate():
    cypher = _emit([{"role": "department_head", "name_as_written": "Dr. Jeff"}],
                   people={"Dr. Jeff": {"name": "Jeff Wilson", "email": "wilsonj@sonoma.edu"}})
    anchors, emails = find_person_claims(split_statements(cypher))
    assert {"name": "Jeff Wilson", "campus": "ssu"} in [{k: a[k] for k in ("name", "campus")} for a in anchors]
    assert [e["email"] for e in emails] == ["wilsonj@sonoma.edu"]
