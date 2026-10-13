"""Person identity gate for batch .cypher files.

A batch file that MERGEs a Person by name matches whoever already holds that name,
anywhere in the graph. Person.name is unique, so two people with one name cannot both
exist, and a file meant for a new person at one campus would silently attach its edges
to a namesake at another. The identity rule (email first, then name + campus) needs the
graph to apply, and a batch file is written offline, so the check happens here, before
anything runs.

The gate reads two shapes from each statement:

  - ``MERGE (p:Person {name: "N"})`` in a statement that also anchors a campus with
    ``MATCH (c:Campus {abbreviation: "X"})``. Blocks when N already works at a campus
    other than X.
  - ``SET p.email = "e"`` alongside a Person name. Blocks when e is not normalized
    (trimmed, lowercased), or when another Person already holds e, because email is the
    identity key and the file should use that person's name.

A statement without a campus anchor is not judged: there is nothing to compare.
"""
from __future__ import annotations

import re

from ..cli import transport

_STR = r'"((?:[^"\\]|\\.)*)"'
_MERGE_PERSON = re.compile(r"MERGE\s*\(\s*\w+\s*:\s*Person\s*\{\s*name\s*:\s*" + _STR + r"\s*\}\s*\)")
_MATCH_PERSON = re.compile(r"MATCH\s*\(\s*\w+\s*:\s*Person\s*\{\s*name\s*:\s*" + _STR + r"\s*\}\s*\)")
_CAMPUS = re.compile(r"\(\s*\w+\s*:\s*Campus\s*\{\s*abbreviation\s*:\s*" + _STR + r"\s*\}\s*\)")
_SET_EMAIL = re.compile(r"SET\s+\w+\.email\s*=\s*" + _STR)


def _unescape(s: str) -> str:
    return s.replace('\\"', '"').replace("\\\\", "\\")


def find_person_claims(statements: list[str]) -> tuple[list[dict], list[dict]]:
    """Return (anchors, emails) claimed by the statements.

    anchors: [{name, campus, statement}] for each Person MERGEd by name next to a
             campus anchor.
    emails:  [{name, email, statement}] for each email SET on a Person named in the
             same statement.
    """
    anchors, emails = [], []
    for i, stmt in enumerate(statements, 1):
        campus = _CAMPUS.search(stmt)
        merged = [_unescape(n) for n in _MERGE_PERSON.findall(stmt)]
        if campus:
            for name in merged:
                anchors.append({"name": name, "campus": _unescape(campus.group(1)), "statement": i})
        named = merged or [_unescape(n) for n in _MATCH_PERSON.findall(stmt)]
        for email in _SET_EMAIL.findall(stmt):
            for name in named:
                emails.append({"name": name, "email": _unescape(email), "statement": i})
    return anchors, emails


def email_form_problems(emails: list[dict]) -> list[str]:
    problems = []
    for e in emails:
        value = e["email"]
        if value != value.strip().lower() or "@" not in value:
            problems.append(
                f"person-identity #{e['statement']:03d}: email {value!r} for {e['name']!r} "
                f"is not normalized; write it trimmed and lowercased.")
    return problems


_CHECK = """
UNWIND $anchors AS a
MATCH (p:Person {name: a.name})-[:works_at_campus]->(c:Campus)
WHERE c.abbreviation <> a.campus
RETURN 'campus' AS kind, a.name AS name, a.campus AS claimed, c.abbreviation AS found,
       toString(a.statement) AS statement
UNION ALL
UNWIND $emails AS e
MATCH (p:Person {email: e.email})
WHERE p.name <> e.name
RETURN 'email' AS kind, e.name AS name, e.email AS claimed, p.name AS found,
       toString(e.statement) AS statement
"""


def person_identity_gate(statements: list[str]) -> list[str]:
    anchors, emails = find_person_claims(statements)
    problems = email_form_problems(emails)
    if not anchors and not emails:
        return problems
    params = {
        "anchors": [{k: a[k] for k in ("name", "campus", "statement")} for a in anchors],
        "emails": [{k: e[k] for k in ("name", "email", "statement")} for e in emails],
    }
    try:
        rows = transport.rows(_CHECK, params)
    except transport.CliError as exc:
        return problems + [f"person-identity: could not check the graph: {exc}"]
    for r in rows:
        n = int(float(r["statement"]))
        if r["kind"] == "campus":
            problems.append(
                f"person-identity #{n:03d}: {r['name']!r} already works at {r['found']}, but this "
                f"file anchors them at {r['claimed']}. If it is the same person, anchor the "
                f"statement at {r['found']} or identify them by email. If it is a different "
                f"person, give them a distinct name; Person.name is unique.")
        else:
            problems.append(
                f"person-identity #{n:03d}: email {r['claimed']!r} belongs to {r['found']!r}, not "
                f"{r['name']!r}. Email is the identity key: use {r['found']!r} as the name.")
    return problems
