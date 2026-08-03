# The Case for a Native Graph Database

## Why the ATI system is built on Neo4j, argued from the code itself

**Audience:** leadership evaluating the technology choice.
**Method:** this is not an abstract "graph vs SQL" essay. Every claim below is an
*exhibit* — a specific structure or query in our codebase today, shown as it is,
then contrasted with what the same capability costs in a relational database. The
companion document (`scripts/graph-vs-sql-ay-rollover.md`) works one example — the
annual rollover — end to end; this document surveys the whole system.
**Premise — the staffing reality:** this system is maintained by a domain expert
working with AI assistance. There is no dedicated SQL developer on this project
and none is planned. Several exhibits note where a specialist SQL team could
blunt a cost; under the actual staffing model those mitigations are not
available, and every comparison below should be read against the relational
system we would *actually* build and maintain — not the one an expert team could.

---

## Executive summary

The ATI system's job is to answer **connection questions** about accessibility
compliance across CSU campuses:

- *What evidence do we have that this indicator is being met, at this campus, this year — and how strong is it?*
- *Which laws, court cases, and executive orders make this requirement exist at all?*
- *Which technology assets does this indicator's work actually touch?*
- *Which §508-stewarded assets have **no one** remediating them?* (the institutional-risk signal)
- *What must carry forward, intact, when the academic year rolls over?*

Every one of these is a **path through a network**, not a lookup in a table. The
codebase reflects that:

| What the code contains | Count |
|---|---|
| Distinct entity types (`graph_schema.py`) | **56** |
| Relationship declarations between them | **289** |
| Relationship types that carry their own data (strength ratings, year lists, dated annotations…) | 6 classes |
| Hand-written Cypher query sites (beyond the ORM) | 110 across 47 files |
| Tables a faithful relational model would need | **~150+** (56 entities + ~100 junction tables) |

The honest one-sentence version of the argument: **in a graph database the
network is the data; in SQL the network is reconstructed on every query, by hand,
through join tables — and the reconstruction code is the majority of the system
and the majority of its maintenance risk.**

---

## 1. The domain is a network — six interlocking clusters

`graph_schema.py` (~2,500 lines) defines six clusters that only mean anything
*through* their connections:

1. **Governance & law** — `Law`, `Case`, `Directive`, `ExternalPolicy`, `Memo`,
   `Guideline`, `IntellectualSource`, `Principle`. Why requirements exist.
2. **Planning** — `Goal`, `SuccessIndicator`, `CampusPlan`, `WorkingGroupPlan`,
   `Plan`, `Accomplishment`, `ProgressUpdate`, `Query` (pending questions),
   `MeetingMinutes`, `AsanaSubtask`. What we intend to do.
3. **Evidence** — `YearSuccessEvidence`, `AcademicYear`, `StatusLevel`. What
   actually happened, per indicator, per campus, per year.
4. **Implementation** — eight types of real-world work (`Process`, `Project`,
   `Procedure`, `Service`, `Guidance`, `Tracking`, `InternalPolicy`, `TAAP`)
   that *evidence* the evidence.
5. **People & organization** — `Person`, `Role`, `OrgUnit`, `Campus`, `Vendor`,
   `ATIWorkingGroup`, with participation and role-holding as data-carrying links.
6. **Technology estate** — `Asset`, `Interface`, `Component`, `Tool`: the systems
   being made accessible, connected to the work that remediates them.

Plus a seventh that only a graph makes natural: **the ontology itself**
(`UniversalDescriptor`) — the schema's own documentation lives *in the graph*,
connected to the elements it describes (Exhibit H).

A single compliance answer routinely crosses four of these clusters. That is the
design center of the whole system — and it is exactly the workload relational
databases handle worst.

---

## 2. Exhibits

### Exhibit A — The annual rollover (the maintenance argument)

Covered in full in `graph-vs-sql-ay-rollover.md`. Summary: duplicating a year's
evidence **with every connection intact** is ~55 generic lines in Cypher that
never name a connection type — so features added later roll forward
automatically. The SQL equivalent is 13+ hand-maintained copy statements whose
failure mode, when a future feature forgets to update the list, is **silent data
loss** discovered mid-year.

### Exhibit B — One question, five levels, one query

The working-group report (`queries/compound_queries/get_all_by_working_group_campus.py`)
assembles, in **one round trip**: working group → goals → indicators → evidence →
(notes + messages + metrics + status + reviewers + implementers + plans with
their progress notes) → implementations → (documents + webpages, filtered by
per-link year rules) — returned as the exact nested JSON the frontend renders.

The SQL renditions of this are all bad in different ways:

- **One mega-join:** dozens of joins across ~20 tables; the row-set explodes
  combinatorially (every note × every message × every metric per evidence), then
  application code de-duplicates and re-nests it. Fragile, slow, unreadable.
- **N+1 queries:** one query per level per row — hundreds of round trips per page
  load. (We know this pattern's cost precisely, because our own migration plan
  flags the few places the *app* layer does it as bugs to fix.)
- **JSON-aggregation CTEs:** modern Postgres can nest `json_agg` inside CTE
  pyramids — at which point you are hand-building, in SQL's least readable
  corner, exactly the tree the graph query expresses directly.

To be fair about our side of the ledger: the graph version is *better*, not
*easy*. The master query is ~400 lines and has had its own cardinality bugs
(documented in its comments, with their fixes). The claim is comparative — one
maintainable-with-effort query versus three architectures that are worse in
different ways — not that Cypher makes five-level reports trivial.

### Exhibit C — Reading the graph backwards: "which assets does this indicator touch?"

The same report answers a question nobody designed a table for: *which technology
assets are affected by the work evidencing this indicator?* Assets are reached
three different ways — directly remediated, behind a touched interface, or the
parent of a used tool. In Cypher each is one line-of-sight pattern:

```cypher
(indicator)<-[:tracks]-(yse)<-[:is_evidence_for]-(impl)-[:remediates]->(asset)
(indicator)<-[:tracks]-(yse)<-[:is_evidence_for]-(impl)-[:remediates_interface]->(:Interface)-[:presented_by]->(asset)
(indicator)<-[:tracks]-(yse)<-[:is_evidence_for]-(impl)-[:uses_tool]->(:Tool)-[:tool_of_asset]->(asset)
```

Four hops, traversed *in reverse*, filtered by year and campus inline, deduped.
In SQL each pattern is a 4–5 table join; the three unioned; the "implementation"
step multiplied by its eight possible tables (Exhibit F); the year/campus filters
repeated in each branch. The graph version is 15 lines inside a larger query.
The SQL version is a stored procedure with a name, an owner, and a maintenance
schedule.

The deeper point: **this question was added long after the schema was designed,
and required no schema work at all.** The edges already existed; the question was
just a new path through them. In SQL, questions you didn't anticipate when you
drew the ER diagram are exactly the expensive ones.

### Exhibit D — Insight from absence: the elevation signal

The system's headline risk indicator (`queries/assets/read.py`) is an asset that
**is** stewarded under §508 but has **no** remediating implementation — meaning
responsibility has legally elevated to the institution (Title II §35.205):

```python
"elevation_signal": is_stewarded and not is_remediated
```

Behind those two booleans: "stewarded" checks four capacities, each holdable by a
Person **or** an OrgUnit; "remediated" checks incoming links from four
implementation types. A graph asks "does any such edge exist?" SQL asks eight
`NOT EXISTS` subqueries across eight junction tables, widening with every new
stewardship capacity or implementation type.

An experienced SQL developer would call that ladder routine, and they'd be
right — this exhibit is about *verifiability*, not impossibility. The person
maintaining this system is a domain expert, not a SQL specialist: "is there any
remediating edge?" can be checked against their mental model of the domain by
reading it, while eight anti-join branches must each be verified against the
schema. Getting one branch wrong doesn't error — it mis-reports institutional
legal exposure.

### Exhibit E — The connections carry data

Six relationship classes attach data *to the connection itself*, because in this
domain the connection is where the meaning lives:

- `IsEvidenceForRel.strength` — **how strongly** work evidences an indicator (0–3);
- `DocumentedByRel.included_in_years / excluded_from_years` — which years a
  document applies to a given implementation;
- `YseProgressRel` — dated, attributed progress annotations on the plan↔evidence link;
- `RoleHoldingRel` — whether a person's role is in their position description;
- `ParticipationRel`, `HasGoalRel` — similar.

Every report above filters or projects on these edge properties inline. In SQL,
each becomes columns on a junction table — workable — but every array property
(`included_in_years`) becomes an additional side table, and every query touching
the link grows another join. The rollover document shows what those year-lists
cost in practice: a business rule ("empty list means all years") re-implemented
in every reader.

### Exhibit F — Polymorphism, three times over

The domain is irreducibly polymorphic, in three separate places:

1. **Eight implementation types** share the same evidencing, documentation, and
   remediation behavior.
2. **Stewardship holders** are a Person *or* an OrgUnit under the same
   relationship type.
3. **Documentation targets** are a Document, Webpage, Note, *or* Message.

In the graph these are non-events: an edge doesn't care what label is on the
other end; a `WHERE impl:Process OR impl:Project OR …` names the family when it
matters. SQL offers three bad options — duplicate the junction table per type
(×8 the rollover's copy blocks), a type-discriminator column with **no foreign
key** (the database can no longer guarantee links point at real rows), or an
inheritance super-table that every one of ~20 queries must join through. Our
schema would need this decision made — and lived with — in three places.

### Exhibit G — Provenance: "why does this requirement exist?"

The governance seed (`batch/governance_sources.cypher`, ~760 lines) loads laws,
court cases, consent decrees, and CSU executive orders and links them to the
principles they establish, which shape the goals and indicators campuses answer
to. "Why are we required to do this?" is answered by walking:

```
Law/Case/Directive → Principle → Goal → SuccessIndicator → YearSuccessEvidence → Implementation → Asset
```

— a seven-step heterogeneous chain from *a 9th-Circuit opinion* to *a specific
campus system*, traversable in either direction (audit: "show the legal basis for
this work"; impact: "which campus work does this consent decree ultimately
drive?"). In SQL this is a seven-way join across tables that share nothing but
the joins themselves, written once per direction per question. This is the
canonical workload native graph databases were invented for.

### Exhibit H — The system can explain itself (the AI angle)

Two recent additions only make sense on a graph:

- **The ontology layer** (`queries/ontology/read.py`, `UniversalDescriptor`,
  `Principle`): the schema's own documentation is stored in the graph, linked to
  the elements it describes; `ontology_health()` computes drift — descriptors
  pointing at elements that no longer exist, principles grounding nothing.
  The data model describing itself *in itself* is native here; in SQL it's a
  bolt-on metadata schema nothing enforces.
- **The MCP service** (`cypher_runner/mcp/`): a hosted tool surface that lets AI
  assistants query the graph directly — catalogued discovery queries, ontology
  introspection, and write-gated annotation (e.g. attaching meeting-transcript
  notes to the right evidence).

To be fair: AI models have seen far more SQL than Cypher, and agents read
relational catalogs fine — "agents can't do SQL" would be a false claim and we
don't make it. The durable advantage is narrower and stronger: this graph
*carries its own documentation*. An agent that lands on any node can read what
it is, what its fields mean, and which principles shape it, from the database
itself — and the same self-description powers drift detection for humans. That
layer exists because the schema and the data live in one traversable structure;
bolted onto a relational schema, it would be metadata tables nothing enforces
or keeps current.

### Exhibit I — Schema evolution at product speed

This system did not spring fully formed. The technology-estate cluster (Asset,
Interface, Component, Tool), TAAPs, campus plans and working-group plans, pending
questions, meeting minutes, progress updates, and the ontology layer were all
added **incrementally, over months, against a live shared database** — as new
node types and edges alongside existing data, with no equivalent of
`ALTER TABLE`, no table rebuilds, and (per Exhibit A) no retrofits to the
rollover. (Honest footnote: schema-free does not mean migration-free — our
`tools/` folder holds a handful of one-off scripts for *semantic* changes, like
re-scoping data to campuses. Those are data edits any database needs; what the
graph eliminated is the structural rebuild layer on top of them.)

The relational cost of the same velocity: every cluster addition is a migration
script; every many-to-many is a new junction table that every generic operation
(rollover, export, delete-cascade) must learn about; every polymorphic extension
reopens the Exhibit F decision. Schema agility isn't a luxury here — the ATI
program's reporting requirements change yearly by CSU and federal mandate.

---

## 3. The same system in SQL — summary of costs

| Capability (exhibit) | Graph today | Relational rendition |
|---|---|---|
| A. Year rollover | ~55 generic lines; immune to schema growth | 13+ enumerated copy statements; silent-loss failure mode |
| B. Five-level report | One query returns the UI's tree | Mega-join + app reassembly, N+1 storm, or CTE pyramid |
| C. Reverse reachability | 3 patterns, 15 lines, no schema work | Multi-branch stored procedure, ×8 polymorphism factor |
| D. Elevation signal | "does any edge exist?" | 8-way NOT-EXISTS ladder per asset |
| E. Data on connections | Native edge properties | Junction columns + side tables per array + extra joins |
| F. Polymorphism ×3 | Labels; a non-event | Table explosion, FK-less discriminators, or super-table joins |
| G. Provenance chains | Walk the path, either direction | Seven-way heterogeneous joins, written per question |
| H. Self-description + AI agents | Ontology in the graph; agents traverse | Bolt-on metadata schema; agents need join tutoring |
| I. Evolution | Additive; live | Migration scripts, rebuilds, retrofits |
| Model size | 56 node types, 289 declared edges | ~150+ tables before the first query is written |

---

## 4. The steelman: what SQL genuinely does better — and why it doesn't win here

An honest comparison names the trade-offs, so here they are.

**Tabular aggregation and BI.** For "count evidences by status by campus" SQL is
at home. But our aggregates are small (dozens of indicators, a handful of
campuses) and computed at the end of traversals — the hard part is *reaching* the
rows, not summing them. Where flat exports are wanted, we produce them
(`batch/export.cypher` → CSV) rather than shaping the whole system around them.

**Ecosystem and hiring.** SQL's talent pool is larger, and the honest residual
risk is succession: a future maintainer who inherits this system is more likely
to know some SQL than any Cypher. Three mitigations: neomodel gives day-to-day
CRUD an ORM shape any Python developer recognizes (most of our ~24 query domains
are plain ORM code; the 110 raw-Cypher sites concentrate in the report layer);
Cypher's pattern syntax — `(a)-[:REL]->(b)` is a picture of the data — is
learnable in days, not months; and the successor would face the 150-table
reassembly problem armed with *partial* SQL just the same. Under the staffing
premise, the deciding fact is that hard queries in either technology will be
written with AI assistance and verified by a domain expert — and a pattern that
draws the domain is verifiable by inspection in a way relational algebra is not.

**Database-enforced integrity.** This is SQL's best punch, and it lands: Neo4j
cannot enforce a required relationship the way a `NOT NULL` foreign key can. Our
codebase compensates by convention — create functions in
`queries/<domain>/create.py` are the only sanctioned creation path, and
bypassing them is documented as a bug. That is discipline in Python, not a
guarantee in the database, and we say so plainly. Two things blunt the punch:
the discipline is testable and lives in the language the system's maintainer
actually works in; and a constraint-complete relational schema is only real if
a specialist designs and evolves it. Under the staffing premise, the realistic
alternative is not textbook Postgres — it is a semi-normalized schema with
nullable foreign keys and JSON blobs where the junction tables got painful,
which has SQL's costs without SQL's guarantees.

**Operational maturity.** Managed Postgres is a commodity. This is a real
historical advantage that has largely closed: our scale plan (see
`migrations/aws-scale-refactor-plan.md`) targets **Neo4j Aura**, a managed
service with backups, monitoring, and SLAs — and has already audited our APOC
usage for Aura compatibility.

**Row-level security tooling.** Postgres RLS is mature. Our access model,
however, is *relationship-based* — "people at this campus see this campus's
data" — which we enforce at the application layer either way (campus-scoped RBAC
is designed and scheduled in the same plan, ADR-002).

**"Postgres has recursive CTEs and JSONB — it can do graphs."** It can *emulate*
them. Recursive CTEs handle single-relationship-type hierarchies acceptably; our
chains cross **heterogeneous** node and edge types (Exhibit G), which CTEs handle
only with union-per-type contortions. JSONB nesting rebuilds trees the graph
returns natively — while giving up the relational model's own referential
guarantees inside the blobs. Emulating a graph in SQL means paying SQL's costs
*and* the graph's, and getting neither's guarantees.

**What would actually change our minds:** if the workload shifted to
high-volume flat transactions, heavy tabular analytics, or wide-audience BI
self-service — or if the organization committed to staffing a dedicated
database team — a relational (or dual-store) architecture would deserve a fresh
look. Nothing on the ATI roadmap points that way; everything on it — more
campuses, more connection types, richer provenance, AI-assisted curation —
points deeper into the network.

---

## 5. Conclusion

The question "why not SQL?" assumes the default is a table and the graph is the
exotic choice. For this system it is precisely backwards. The ATI program's data
*is* a network — legal mandates flowing through principles into goals, indicators
tracked by evidence, evidenced by eight kinds of work, done by people in roles at
campuses, touching assets through interfaces and tools, all sliding forward one
academic year at a time. The graph database stores that network as what it is.
A relational database would store a disassembled version of it and oblige us to
reassemble it — correctly, completely, and by hand — in every query, every
report, every migration, and every rollover, forever.

We chose the database that makes the system's hardest things easy and its easy
things ordinary, over the one that makes its easy things familiar and its hardest
things permanent maintenance.
