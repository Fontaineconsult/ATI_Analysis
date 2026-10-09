"""
TAAP importer: turns completed Temporary Alternate Access Plan forms (CSU template
3.2 051225) into batch Cypher for the graph.

Three stages, each a module:

  parse_taap   read one plan (the .docx when present, the signed .pdf for signature
               stamps and the verbatim text) into a plain dict, one key per form section.
  decisions    the curation file a person writes: requesting unit, vendor, preparer,
               name normalizations, evidence targets. Nothing the form does not state
               is inferred by code.
  emit_cypher  record + decisions -> one idempotent .cypher file per plan that mirrors
               the side effects of queries/assets/create.py::create_taap.

The emitted files land in app/database/batch/auto-assignments/ and run through
run_file (validate, then --execute). This package never opens a graph connection.
"""
