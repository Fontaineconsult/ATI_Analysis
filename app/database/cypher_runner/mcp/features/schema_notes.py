"""
Feature: a read-only MCP *resource* describing the graph's shape.

Demonstrates the second MCP primitive (resources, alongside tools) and gives a
client the relationship map so it can pick the right query. Mirrors the schema
notes in the cypher-runner SKILL.md / app/database/graph_schema.py.

If your installed MCP SDK lacks the resource decorator, this whole feature is
skipped gracefully (build_server logs and moves on) — the tools still load.
"""

NAME = "schema_notes"

SCHEMA_NOTES = """\
# ATI knowledge graph — relationship map

Backbone (mandate -> measurement -> proof):

    (Law|Case|Directive|ExternalPolicy|Memo|Guideline)-[:informs]->(Goal)
    (ATIWorkingGroup)-[:responsible_for]->(Goal)-[:supported_by]->(SuccessIndicator)
    (YearSuccessEvidence)-[:tracks]->(SuccessIndicator)
    (YearSuccessEvidence)-[:evidence_in_year]->(AcademicYear)
    (YearSuccessEvidence)-[:evidence_at_campus]->(Campus)
    (YearSuccessEvidence)-[:status_is]->(StatusLevel)

The work that proves evidence:

    (Process|Project|Procedure|Service|Guidance|Tracking|InternalPolicy|TAAP)
        -[:is_evidence_for]->(YearSuccessEvidence)

People and org:

    (Person)-[:participates_in]->(ATIWorkingGroup)
    (Person)-[:works_at_campus]->(Campus)
    (Person)-[:implements]->(YearSuccessEvidence)
    (Department|College)-[:operates_under_campus]->(Campus)

ICT / Section 508 layer:

    (Process|Project|Procedure|Service)-[:remediates]->(Asset)
    (Process|Project|Procedure|Service)-[:remediates_interface]->(Interface)
    (Interface)-[:presented_by]->(Asset)
    (Interface)-[:has_component]->(Component)

Documentation (from anything):

    (anything)-[:is_documented_by]->(Document|Webpage|Note|Message)

Conventions:
- Campus abbreviations are stored lowercase (e.g. 'sfsu', 'ssu', 'csueb').
- Most active nodes carry a `removed` or `depreciated` boolean — filter with
  `coalesce(n.removed, false) = false`.
- Composite identity strings (year_identifier, plan_identifier) are unique-indexed.
"""


def register(mcp, ctx) -> None:
    @mcp.resource(
        "ati-graph://schema",
        name="ATI graph schema notes",
        description="Node labels and relationship directions for the ATI knowledge graph.",
        mime_type="text/markdown",
    )
    def schema_notes() -> str:
        return SCHEMA_NOTES
