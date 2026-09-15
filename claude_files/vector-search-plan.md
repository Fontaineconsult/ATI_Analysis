# Vector search over source text: plan

**Goal:** return the passage that answers a question, out of the prose already held in
the graph, instead of making a caller guess from a node title. Two consumers: the
ati-graph MCP server, so `/maturity-status-reviewer`, `/ontology-ingest`,
`/implementation-rectify` and `/follow-up` can read the evidence rather than infer it,
and later a search field in the Documentation area of the app.

Status: not started. This document is the agreed design, not a record of work done.

---

## Measured corpus

Probed against the live database on 2026-09-03.

| Source | Nodes | With text | Characters | Longest |
|---|---|---|---|---|
| `Webpage.raw_text` | 264 | 84 | 443,164 | 63,038 |
| `Document.raw_text` | 164 | 15 | 122,289 | 23,051 |
| `Note.content` | 559 | 559 | 191,043 | 5,292 |
| `MeetingMinutes.content` | 16 | 16 | small | |

About 700 populated nodes and 756,000 characters. At 1500 characters per chunk with 200
overlap that is roughly 620 chunks, about 2MB of vectors at 768 dimensions. Size is not a
design constraint anywhere in this plan.

One number sets the ceiling: 345 of the 428 documentation nodes hold no text at all.
Search cannot see them, and no retrieval method fixes that. The `/get-source-text`
backlog is the limit on recall, and this work does not change it.

---

## Platform findings

Probed on the same date.

- Neo4j 5.26.2, Community edition. `db.index.vector.createNodeIndex`,
  `db.index.vector.queryNodes` and `db.index.vector.queryRelationships` are all present,
  so native vector indexes work with no install and no restart.
- APOC is installed (192 procedures). `server.directories.plugins` is
  `C:\neo4j-community-5.26.2\plugins`. `dbms.security.procedures.unrestricted` is empty.
- The database holds no fulltext index at all. Every search in the codebase today is
  `toLower(...) CONTAINS`.
- No `genai.*` procedures are installed.

---

## Decisions

### 1. Embeddings come from Ollama, running on the DPRC server

Ollama is a separate process with an HTTP API, so the embedding model never enters the
Flask or MCP virtualenv. That matters because the IIS venv has already failed once on a
missing base Python (FastCGI exit 103), and `sentence-transformers` would add torch to
it. There is no API key to store, rotate or leak, and no outbound network access is
required, which also removes the open question of whether the campus server can reach an
external API.

`neo4j-graphrag` ships `OllamaEmbeddings` as a first-party embedder, so this is a
supported path rather than a custom one.

### 2. Rejected: the Neo4j GenAI plugin

It is genuinely available on Community from 5.23, and installing it means moving
`neo4j-genai-plugin-*.jar` into the plugins directory and restarting. Four reasons not
to:

1. Restarting takes the live production database down, and there is no test instance to
   rehearse on.
2. It does not embed locally. It calls an external provider from the database server, so
   it relocates the network dependency instead of removing it.
3. Provider credentials are passed inline in the query configuration map. Neo4j
   obfuscates them in `query.log` but documents that a malformed query is logged
   unobfuscated, and any user with query privileges sees the real value.
4. `genai.vector.encode` and `encodeBatch` are deprecated. The replacement provider
   config path requires Cypher 25, which is Neo4j 2025.x, not the 5.26 LTS this instance
   runs.

### 3. Rejected: the Anthropic API

There is no embeddings endpoint. The Claude API surface is Messages, Batches, Files,
Token Counting, Models and Admin, and Anthropic's own documentation points to Voyage AI
for embeddings. A Claude Max subscription would not pay for it either: a paid Claude
subscription does not include API or Console access, which is billed separately.

The generation half of a GraphRAG stack is already covered. The consumer of the search
tool is an agent reading the chunks directly through MCP, so putting a second model
inside the pipeline to summarise text the agent is about to read costs money for nothing.

### 4. Chunks, not one vector per node

One vector for a 63,000 character page averages it into nothing usable. Chunk level
retrieval also returns a quotable passage, which is what a maturity review needs. About
620 chunks at 1500 characters with 200 overlap.

### 5. `TextChunk` is a derived structure, not ontology

Every other node in this graph means something. `TextChunk` does not: it is an index,
droppable and rebuildable from its source at any time. The class docstring says so, so
that a future reader does not treat a chunk as a record.

### 6. Staleness is a content hash, not a date

`Webpage` and `Document` carry `raw_text_captured`, and `update_webpage` /
`update_document` already move it only when the text itself changes. `Note` has no
equivalent stamp. A sha256 of the source text, stored on each chunk as `source_hash`,
works identically for all four labels and does not depend on a property that one of them
lacks. The backfill rebuilds a source's chunks when the hash differs and skips it
otherwise.

### 7. `nomic-embed-text`, with its prefix contract

768 dimensions, 8192 token context, 274MB. The context window is the reason to prefer it
over `mxbai-embed-large`, which caps at 512 tokens and would silently truncate the longer
chunks.

**The prefix contract is the top correctness trap in this plan.** The model requires
asymmetric task prefixes: document text embedded for the index must be prefixed
`search_document: `, and a search string must be prefixed `search_query: `. No framework
injects these, `neo4j-graphrag` included. Omitting them does not error. It quietly costs
retrieval quality, and the symptom is results that look plausible and rank wrong. One
helper function applies the prefix, both the backfill and the query path call it, and a
unit test asserts each path uses the right one.

### 8. Model identity is recorded on every chunk

Vectors from two different models are not comparable, and the failure mode is silent:
the query returns confident, wrong neighbours instead of an error. Each chunk stores
`embedding_model` and `embedding_dims`. The backfill refuses to write into an index whose
existing chunks name a different model, and the retrieval path checks the same thing.
A model change is then an explicit re-index rather than a guess.

### 9. Hybrid retrieval, for correctness and as a fallback

This corpus is dense with codes and acronyms: `1.21-web`, VPAT, WCAG 2.1 AA, campus
abbreviations. Embeddings handle those badly, and a Lucene fulltext index over the same
chunk text handles them well. `HybridCypherRetriever` fuses the two by reciprocal rank
fusion and then runs a Cypher traversal on the seeds.

The second reason is availability. If the Ollama service is down, the vector leg fails
and the fulltext leg still answers. The search tool degrades instead of breaking.

### 10. The backfill is a batch tool, never a request path

No embedding call happens inside a Flask request or an MCP tool that writes. The MCP
read tool embeds only the query string, which is one short call.

### 11. The MCP tool is a feature module, not a registry entry

Every `query_registry.yaml` entry is Cypher plus string parameters. This tool has to
embed the query string before any Cypher runs, so it belongs in
`mcp/features/search.py` alongside `interview_guides.py`, not in the registry.

---

## Architecture

```
  Webpage.raw_text ──┐
  Document.raw_text ─┤   app/database/tools/build_text_index.py   (batch, idempotent)
  Note.content ──────┤        chunk -> prefix -> embed via Ollama -> upsert
  MeetingMinutes ────┘
                                      |
                                      v
                         (:source)-[:has_chunk]->(:TextChunk)
                              vector index + fulltext index
                                      |
                    app/database/queries/search/read.py   <-- the shared engine
                        search_source_text()  hybrid + graph expansion
                                      |
                    |-- MCP feature   mcp/features/search.py        (Phase 5)
                    +-- Flask endpoint -> React search field        (Phase 6, later)
```

The engine is one function in the queries layer, matching how `queries/ontology/read.py`
serves both the MCP feature and the Flask endpoint.

---

## Phases

| Phase | What | Runs where | Blocked by |
|---|---|---|---|
| 0 | Prerequisite checks on the server | DPRC server | nothing |
| 1 | `TextChunk` schema + chunker + prefix helper | local, no DB | nothing |
| 2 | Ollama installed as an NSSM service | DPRC server | 0 |
| 3 | Backfill tool + the two indexes | wherever Ollama is reachable | 1, 2 |
| 4 | Retrieval engine | local + DB | 3 |
| 5 | MCP search tool | DPRC server | 4 |
| 6 | Frontend search field | local | 4 |

### Phase 0: prerequisite checks

Answer these before writing code, because two of them can change the plan.

1. Does the DPRC server have the disk and CPU headroom for Ollama plus a 274MB model?
2. Where will the backfill run? It needs to reach both Neo4j and Ollama. Running it on
   the server is simplest. Running it from a dev machine means a second Ollama install
   there, and the same model, or the vectors will not match.
3. Which virtualenv runs the MCP server in production? `neo4j-graphrag` has to be
   installed there, and `.venv314` and `.venv` already differ.
4. Confirm `create_new_ay_campus` does not attempt to copy `has_chunk` edges.
   Documentation nodes are not year-duplicated, so it should not, but check rather than
   assume.

### Phase 1: schema and chunker

- `app/database/graph_schema.py`: a `TextChunk` class (`unique_id`, `text`, `ordinal`,
  `source_uid`, `source_label`, `source_hash`, `embedding_model`, `embedding_dims`,
  `embedding`), and `chunks = RelationshipTo("TextChunk", "has_chunk")` on `Webpage`,
  `Document`, `Note` and `MeetingMinutes`. The docstring states that the node is derived
  and rebuildable.
- `app/data_config.py`: `CHUNK_SIZE_CHARS = 1500`, `CHUNK_OVERLAP_CHARS = 200`,
  `EMBEDDING_MODEL_DEFAULT = "nomic-embed-text"`, `EMBEDDING_DIMS = 768`. Vocabularies
  and constants live here, and `data_config` has no project imports.
- A pure chunker plus the prefix helper, both testable with no database and no Ollama.

The vector index cannot be declared through neomodel, so it is raw Cypher in Phase 3.

### Phase 2: Ollama as a service

`ollama.exe` does not implement the Windows Service Control Manager interface, so it
cannot be a native service. NSSM wraps it. This is the same tooling already needed for
the MCP server, which has been dying because a console Scheduled Task is killed at
logoff.

```
nssm install ollama C:\ollama\ollama.exe
nssm set ollama AppParameters serve
nssm set ollama AppEnvironmentExtra OLLAMA_HOST=127.0.0.1:11434
nssm start ollama
ollama pull nomic-embed-text
```

Bind to `127.0.0.1` and not `0.0.0.0`. The Ollama API is unauthenticated, and both
consumers are on the same host.

### Phase 3: backfill and indexes

`app/database/tools/build_text_index.py`, following the existing `tools/` conventions:
`set_connection()` from the entry point, and `import app.endpoints.data_api` before any
queries module to clear the circular import.

It creates both indexes if absent:

```cypher
CREATE VECTOR INDEX text_chunk_embedding IF NOT EXISTS
FOR (c:TextChunk) ON (c.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 768,
  `vector.similarity_function`: 'cosine'
}}

CREATE FULLTEXT INDEX text_chunk_fulltext IF NOT EXISTS
FOR (c:TextChunk) ON EACH [c.text]
```

Then for each source node with text: hash it, skip when the hash matches the existing
chunks, otherwise delete that source's chunks and rebuild them. Chunks are written with
`db.create.setNodeVectorProperty`. Reruns touch only what changed, so the tool is safe to
run on a schedule and safe to interrupt.

Flags: `--dry-run` to report what would change, `--label` to limit to one source type,
`--force` to rebuild regardless of hash.

### Phase 4: retrieval engine

`app/database/queries/search/read.py`, exposing `search_source_text(query, k, ...)`.

It prefixes the query with `search_query: `, embeds it, runs `HybridCypherRetriever`, and
expands each seed chunk to its provenance: the source node, its maintainer, the
implementation it documents, the YSE that implementation evidences, and the campus. That
expansion is the reason this is worth building over a plain search box, because the
answer arrives already attached to who owns it.

Two filters are not optional. `depreciated` and `include_in_report` must be respected,
and the result set must never reach the public report blueprint at `/ati/reports/public`
without them.

If the embedder is unreachable the function logs it, runs the fulltext leg alone, and
marks the result as degraded so the caller can say so.

### Phase 5: MCP search tool

`app/database/cypher_runner/mcp/features/search.py`, registered in
`features/__init__.py`. One read tool, `search_source_text(query, k=8, campus=None,
kinds=None)`, calling the Phase 4 function. No write gate, because it reads.

Configuration through machine environment variables, not `web.config` appSettings, which
do not reach `os.environ`: `ATI_EMBEDDING_HOST` (default `http://127.0.0.1:11434`) and
`ATI_EMBEDDING_MODEL` (default `nomic-embed-text`).

### Phase 6: frontend

A search field in the Documentation area, over a Flask endpoint on the same engine.
Deferred until the MCP tool has been used enough to show what the result shape should be.

---

## Tests

| Layer | What | Needs DB? | Needs Ollama? |
|---|---|---|---|
| Chunker | boundaries, overlap, short and empty input, hash stability | no | no |
| Prefix helper | document path emits `search_document: `, query path emits `search_query: ` | no | no |
| Model guard | a mismatched `embedding_model` raises rather than writes | no | no |
| Backfill | unchanged source is skipped, changed source is rebuilt, chunk count | yes | yes |
| Retrieval | known passage is returned for a paraphrase, `depreciated` is filtered | yes | yes |
| Degradation | embedder unreachable returns fulltext results marked degraded | yes | no |
| MCP tool | tool registers, returns provenance fields | yes | yes |

Test isolation needs care. The sentinel year rule does not apply, because chunks hang off
documentation nodes that carry no year. Tests create their own source nodes and a
`cleanup_chunk_family` fixture removes only the chunks attached to them.
**Never `MATCH (c:TextChunk) DETACH DELETE c` in a test**, which would destroy the real
index on the shared live database. The same rule as the existing blanket-delete ban.

Mark the Ollama-dependent tests so they can be deselected, following the existing
`unit` / `integration` / `api` markers.

---

## Risks

**The corpus is 20% of the documentation.** Retrieval will look worse than it is, because
most documentation nodes hold no text. Report coverage alongside results so a caller can
tell "no evidence exists" apart from "no text was captured".

**Silent quality loss from the prefixes.** Covered by decision 7 and a unit test, but it
is the failure most likely to go unnoticed, because nothing errors.

**Another service to keep alive on a host that has already lost one.** The MCP server
keeps dying at logoff. Installing Ollama the same wrong way repeats the fault. Use NSSM
for both, and move the MCP server onto NSSM at the same time.

**Neo4j is Community with no test instance.** Both index creations are additive and
`IF NOT EXISTS`, so they do not touch existing data, but there is no rehearsal
environment. Create the indexes at a quiet hour.

**The AWS and Aura migration.** Aura supports vector indexes, so this design ports, but
indexes have to be recreated on the target rather than assumed to arrive with the data.
Add both to the cutover checklist in `migrations/phases/`.

---

## Open questions

1. Does the DPRC server have room for Ollama, and who approves installing it?
2. Does the backfill run on the server, or on a dev machine with a matching local model?
3. Should `Recommendation.detail`, `Concern` and `Plan.description` join the corpus later?
   They are curated statements rather than mirrored source text, so mixing them into one
   result list makes provenance harder to present honestly. Left out for now.
4. Should the backfill run on a schedule, or stay a manual step after `/get-source-text`?

---

## References

- [Neo4j GenAI Plugin](https://neo4j.com/docs/genai/plugin/current/) and
  [Create and store embeddings](https://neo4j.com/docs/genai/plugin/current/embeddings/)
- [neo4j-graphrag-python](https://neo4j.com/docs/neo4j-graphrag-python/current/),
  [PyPI](https://pypi.org/project/neo4j-graphrag/) (1.19.0, requires
  `neo4j>=5.28.4,<7.0.0`; the project runs driver 6.1.0)
- [Hybrid retrieval with graph traversal](https://neo4j.com/blog/developer/enhancing-hybrid-retrieval-graphrag-python-package/)
- [Embeddings, Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/embeddings)
- [Paid Claude subscription vs API and Console](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console)
