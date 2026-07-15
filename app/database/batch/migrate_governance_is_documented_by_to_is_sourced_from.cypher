// migrate_governance_is_documented_by_to_is_sourced_from.cypher
//
// ONE-TIME migration. Governance source attachments (Document/Webpage) were
// originally created on the `is_documented_by` edge — the same relationship
// implementations use for *evidence*. Governance sources are references, not
// evidence, so they now live on their own `is_sourced_from` edge (see the 6
// governance classes' source_documents / source_webpages in graph_schema.py).
//
// This switches every governance -> (Document|Webpage) is_documented_by edge to
// is_sourced_from, preserving edge properties (e.g. added_date). Note/Message
// edges are intentionally left as is_documented_by. Idempotent: a re-run finds no
// governance is_documented_by doc/web edges and does nothing.
MATCH (g)-[r:is_documented_by]->(s)
WHERE (g:Law OR g:Case OR g:Directive OR g:ExternalPolicy OR g:Memo OR g:Guideline)
  AND (s:Document OR s:Webpage)
MERGE (g)-[r2:is_sourced_from]->(s)
ON CREATE SET r2 = properties(r)
DELETE r;
