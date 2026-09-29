# Cypher validation gates: from habit to gate

**Status:** proposed, not started. Opened and parked 2026-09-23.

**Where this stands.** Nothing is built. The audit in section 5a was run once against the
live database and its findings are recorded here; the scripts that produced them are
scratch and were not kept. Sections 5a and 5b came out of a design conversation on
2026-09-23 and carry its conclusions, including one reversal: an earlier draft claimed
Enterprise RBAC could not do per-campus write scoping, which was wrong, and section 5b
records why and what it would cost instead. Seven open decisions are listed in section 8
and none is settled. Resuming means starting at Phase 0, and re-running the audit first,
because the numbers here will have drifted.

**Goal:** move the checks that keep graph writes honest out of the skill prose and into
the tooling, so that a check runs because the tool refuses rather than because the agent
remembered. Scoped to the mechanical checks only. The judgment checks stay where they are.

**Companion docs:** `migrations/phases/schema-review-23-campuses.md` (authority on volume
and on which unique constraints change at the Aura import),
`migrations/adr-002-rbac-and-identity.md` (identity and campus-scoped authorization),
`claude_files/mcp-write-auth-plan.md` (the process-level write boundary these gates sit
under). Section 5b reconciles this plan with the 23-campus migration.

**Prompted by:** arXiv:2609.17107v1, "Symbolic Separation: Grounding Deep Agents in
Knowledge Graphs for Trustworthy Operational Data Analytics" (Davletiyarov, Khan,
Bartolini, University of Bologna), held at `app/database/ontology/2609.17107v1.pdf`. Its
deterministic ontology-conformance validator rejects classes, properties and domain/range
combinations absent from the ontology before execution. We hold the same material and
check it by habit.

---

## 1. The problem

A rule written in a skill file is still a habit. It looks like a rule, but the thing being
instructed is the same thing deciding whether to comply.

`/ontology-ingest` says to bind-check every MATCH before executing. It says so in bold,
with a calibration story attached, and it is still advisory. The same is true of pulling
descriptors before routing, of MERGEing on the right unique key, and of setting neomodel
defaults explicitly in raw Cypher.

### What makes this dangerous rather than untidy

`run_file` validation is EXPLAIN. EXPLAIN proves the Cypher parses. It proves nothing
about whether anything matches. A MATCH on a misspelled property is valid Cypher that
binds zero rows, so the statement no-ops, everything downstream of it silently vanishes,
and the exit code is 0.

The skill records this from the 2026-08-20 SFSU ingest: `AcademicYear
{academic_year_name: …}` where the property is `name`, which dropped three
`includes_plan` edges without any error.

### It recurred on 2026-09-16

Two failures in one session, both during recon rather than during a write.

- A read asked for `recorded_by` when the predicate is `minutes_recorded_by`. It bound
  nothing, which read as "no recorder is set". A second `minutes_recorded_by` edge was
  added to minutes that already had one, making it the only meeting in the graph with two
  recorders. Caught by read-back and reverted.
- An interview guide's Position row said "Nothing named" because the recon read
  implementation ownership and never looked at `Person-[:implements]->YSE`. Two people
  were already recorded. The guide went out with the wrong row in it.

The first is mechanical and a validator catches it. The second is a modelling mistake and
no validator catches it. That distinction is the whole design.

### The failures route through review, not just through writes

Both errors happened in reads. A wrong read produces a wrong manifest, and the manifest is
what gets approved in good faith. The damage path runs through the reviewer's trust rather
than through the write path, which is the argument for putting the validator in the shared
read helper and not only in `run_file`. See open decision 1.

---

## 2. The criterion

**A habit earns a gate when violating it is silent.**

Forgetting `unique_id ON CREATE` is loud, because neomodel reads fail later and somebody
finds out. Writing a property name that does not exist is silent. Only the second needs a
gate.

Two secondary tests. The check must be decidable without judgment, and the failure must
recur. Ontology conformance is decidable. Whether a fact is a Concern or a Recommendation
is not.

### The rungs between habit and gate

There are more than two positions, and the cheapest rung that actually catches the failure
is the right one.

| Rung | Example already in this codebase |
|---|---|
| Habit in prose | "bind-check every MATCH" in `/ontology-ingest` |
| Convention with a reviewable artifact | the ingest file header recording every judgment |
| Self-check the agent runs | the bind-check query written before `--execute` |
| Tooling that makes the right thing easy | `updateWebpageSourceText` beside the six-argument `updateWebpage` |
| Tooling that makes the wrong thing impossible | `_resolve_implementation` rejecting a non-implementation target |
| A test that fails on drift | `test_attachable_labels_match_the_frontend_families` |
| A precondition in the runner | none yet; this plan adds them |

The codebase already knows how to do this. `Webpage.url` being uniquely indexed is what
makes the cross-link rule enforceable rather than merely intended, and
`raw_text_captured` being stamped by the query layer rather than accepted from the caller
is why a re-run cannot forge a capture date. The work here is deciding which remaining
habits deserve promotion and to which rung.

---

## 3. Scope

### In

Four gates, all mechanical, all decidable from `graph_schema` plus the database.

### Out, deliberately

Routing decisions, signal-strength grading, evidence-strength ratings, and prose style.
These are judgment, and the gate for judgment is the verify-before-commit manifest, which
is a human gate and is working. On 2026-09-16 it caught an implementation that should not
have been created, a naming collapse (TAP is TAAP), a query that should not have been
tracked, and a concern that belonged inside a plan as a requirement. No automated check
finds any of those.

**Do not automate the manifest.** It is the one gate whose value comes from a person
reading it.

---

## 4. The gates

### Gate 1 — Schema conformance, static

Parse the statement, extract every `Label {property: …}` and every `-[:rel_type]->`, check
them against the neomodel classes in `graph_schema`, and refuse on anything unknown.

Runs offline, needs no database. Strictly better than a bind-check because it diagnoses:
a bind-check reports zero rows, this reports that `AcademicYear` has no property
`academic_year_name` and suggests `name`.

Relationship types matter as much as properties. Property checking alone would not have
caught `recorded_by`.

Introspection is already written and proven; it was used on 2026-09-16 to recover
`Plan`'s unique key and the direction of six relationships.

### Gate 2 — Bind-check, dynamic

Count what each bare `MATCH` binds and refuse to execute if any binds zero.

The rule that makes this safe to automate: **in an idempotent batch file, a bare `MATCH`
that binds zero rows is always a bug, and `MERGE` is exempt by definition** because
binding nothing is what makes it create. So the gate applies to `MATCH` only.

Catches what Gate 1 cannot: a correctly spelled property whose value does not exist, such
as a `year_identifier` for a YSE that was never created.

Auto-derive from the file for the dominant `MATCH (x:Label {prop: "literal"})` shape.
Where a pattern is too complex to derive, allow an explicit declaration rather than
silently skipping it.

### Gate 3 — Read-only means read-only

Reject write keywords in the ad-hoc read helper unless a flag is passed. Mirrors what
`run_query` already does with the registry's `mode` field.

Ten lines. On 2026-09-22 a helper described in its own docstring as read-only was used to
write three times. Each write was deliberate and verified, and the gap between the name
and the behaviour is how that stops being true.

### Gate 4 — MERGE key validation

If a `MERGE` keys on a property that is not a unique index on that label, refuse.

`MERGE (p:Plan {name: …})` is the case. `Plan`'s unique index is `description`, and
merging on `name` would duplicate plans on every re-run. The skill records that this was
nearly done once and avoided only because someone checked.

---

## 5. Where the gates live

All four belong in `app/database/cypher_runner/`, because that is the one place both the
batch path and the ad-hoc read path already pass through.

- Gates 1, 2 and 4 hook into `run_file`, before `--execute`.
- Gate 3 belongs to the ad-hoc helper.
- Gate 1 should probably also run on ad-hoc reads. See open decision 1.

Nothing here changes the query layer or the endpoints. The invariants those enforce are
already gates.

---

## 5c. Transport: where the gates plug in (landed 2026-09-25)

The runners no longer open Bolt. `run_file` and `run_query` go through `neo4j-cli`
(`app/database/cypher_runner/cli/transport.py`), which holds the credential in the OS
keyring and refuses writes without `--rw`. Two consequences for this plan.

- **The hook point exists.** `run_file.GATES` is a list of callables
  `(statements) -> [failure messages]`, run after EXPLAIN validation and before
  `--execute`. Gates 1, 2 and 4 register there. Nothing is registered yet, because
  Phase 0 is still open. Gate 2 (bind-check) will read through the CLI like validation
  does, so it stays free of the driver.
- **Gate 3 is partly the CLI's.** The CLI's EXPLAIN preflight blocks write statements
  unless `--rw` is passed, and `run_query` passes it only under `--allow-write`. What
  remains of Gate 3 is the registry's `mode` field being honest, which `--validate`
  cannot check and the audit test could.

The gates plan's status line above stands: proposed, not started. The transport work
was the CLI rollout, not this plan.

---

## 5a. Phase 0: the schema has to be trustworthy before it can be a gate

Audited 2026-09-23 against the live database. The finding that reorders this plan: **the
class definitions and the database disagree in at least fourteen places**, so a validator
built today would reject working Cypher.

### What is already hard, and cannot get harder

The database is **Neo4j 5.26.2 Community**. Community supports uniqueness constraints and
nothing else: no property-existence, no node key, no type constraints.

- **Uniqueness is fully installed.** 137 constraints, every declared `unique_index=True`
  present, zero missing, zero duplicated values anywhere. There is nothing to gain here.
- **Existence can never be enforced by the database on this edition.** Every
  `required=True` in `graph_schema` is a Python-side promise. Raw Cypher can and does
  bypass it, and seven nodes currently do.
- **Types likewise.** Not available.

So the answer to "harden the schema first" is not "add constraints". It is "make the
declared schema and the actual graph agree", because that agreement is what a validator
validates against.

### What the audit found

**Two property names that collide with relationship names on the same class.** This is the
one that would have broken Gate 1 on day one.

| Class | Name | Declared as | Also present as a property on |
|---|---|---|---|
| `YearSuccessEvidence` | `admin_reviewer_note` | `RelationshipTo` → `admin_review_note` | **441 nodes** |
| `Plan` | `completed_year` | `RelationshipTo` → `completed_in_year` | 4 nodes |

Cypher reading `y.admin_reviewer_note` gets the property. neomodel reading the same name
gets the relationship. Both are in use and they are not the same thing.

**Nine uniqueness constraints on properties the class no longer declares.**
`Accomplishment.accomplishment_description`, `Plan.plan_description`, `Plan.title`,
`Message.uuid`, `Note.uuid`, and `requirement_description` on four `*Description`
classes. Leftovers from renames.

**Five constraints on four labels absent from `graph_schema` entirely:**
`EvidenceDescription`, `Policy`, `Requirement`, `SchemaElement`.

**Three other orphan properties in data:** `Plan.for_next_year` (2 nodes), `Plan.title`
(1), `Accomplishment.accomplishment_description` (5).

**Seven nodes violating `required=True`**, and the majority are the schema's fault rather
than the data's. `Accomplishment` declares `description` as required and unique; 14 nodes
carry it, 5 carry `accomplishment_description` instead, none carry both. That is a rename
applied to the class and to most of the data but not all of it. The remaining two are an
`InternalPolicy` and a `Plan` that are genuinely empty stubs.

### Why this comes first

Gate 1 checks Cypher against `graph_schema`. Shipped today it would reject a read of
`admin_reviewer_note` on 441 nodes as an unknown property, because the class calls that
name a relationship. The gate would be right about the declaration and wrong about the
graph, and the first thing anyone would do is add an override, which is how a gate decays
back into a habit.

A validator inherits the authority of the thing it validates against. That has to be
earned first.

### Phase 0 work

1. Resolve the two property/relationship collisions. `admin_reviewer_note` on 441 nodes is
   the significant one and needs a decision about which meaning keeps the name.
2. Decide on the nine stale constraints and the five dead-label ones: drop, or document
   why they stay.
3. Migrate the five `Accomplishment` nodes onto `description`; fill or remove the two
   empty stubs.
4. Decide on `Plan.for_next_year` and `Plan.title`.
5. **Land the audit as a test.** This is the durable part. It is rung six on the ladder in
   section 2, it costs almost nothing, and it is the only existence check available on
   Community Edition. Assert zero orphan properties, zero stale constraints, zero
   `required=True` violations, and zero declared-but-uninstalled unique indexes.

Item 5 is worth shipping even if nothing else in this plan happens. The audit found all of
the above on its first run, and none of it was visible before.

---

## 5b. Enterprise Edition, and the 23-campus horizon

**This is not a separate procurement decision.** The AWS scale refactor targets Aura, and
Aura runs Enterprise. Everything below arrives with that migration rather than instead of
it. The question is which Enterprise capabilities this plan should start depending on, and
at which phase.

**Read `migrations/phases/schema-review-23-campuses.md` first.** It is the authority on
volume and on which unique constraints change, and it has already settled things this
section must not relitigate: the graph is never sharded and never multi-tenanted, ~11.5K
YSE nodes at full build-out is trivial, and the real scale risk is per-request traversal
fan-out rather than node count. `migrations/adr-002-rbac-and-identity.md` owns identity.

### What Enterprise gives that this plan can use

| Capability | Value here | When it starts mattering |
|---|---|---|
| **Property existence constraints** | Makes `required=True` real instead of a Python promise. Directly closes the Phase 0 gap. | At the Aura import. Cannot be added while violations exist. |
| **Separate dev / staging / prod instances** | Ends running the test suite against production behind a sentinel-year convention. | Immediately, and available under a Developer licence before any migration. |
| **Role-based access control** | Two uses. A read-only database user under the MCP read instance, so a code bug that registers a write tool still cannot write. And, if campus becomes a label, per-campus write denial at the database rather than only in the query layer. See below. | Phase 4, alongside RBAC enforcement. |
| **Online backup** | Community requires stopping the database to dump. Tolerable for three campuses, not for twenty-three. | At cutover. |
| **Node key constraints** | Only where composite coordinates are properties. The evidence backbone encodes campus and year as *edges*, so the string identifiers stay. Narrower than it looks. | Low priority. |
| **Type constraints** | Would catch a date stored as a string. Nothing found in the 2026-09-23 audit was a type error. | Low priority. |

### Per-campus write scoping: a campus label makes this tractable

An earlier draft of this section said Enterprise RBAC could not express "campus A may not
edit campus B's evidence". That was wrong, and the correction matters enough to record.

RBAC cannot filter on a property **value**: there is no `GRANT … WHERE n.campus = 'sfsu'`.
But it is scoped by **label**, and a campus label is something we can add.
`DENY WRITE ON GRAPH ati NODES CampusCSUEB TO role_sfsu_editor` is valid and does exactly
what is wanted.

Four things make this more attractive here than it first looks.

1. **The requirement is write scoping, not isolation.** Cross-campus reads are a feature,
   not a leak. The interview guides depend on them, naming what a peer campus holds as
   concrete pressure. So reads stay open to everyone and only writes are denied per
   campus, which is the simpler half of the problem.
2. **Multi-labelling is already the house pattern.** `Department:OrgUnit` (18 nodes) and
   `College:OrgUnit` (2) exist today, and CLAUDE.md already mandates dual-labelling for
   those because a single-label node breaks every neomodel read of the class.
3. **The backbone already knows its campus.** YSE, CampusPlan and WorkingGroupPlan carry
   campus in the unique key. Labelling them is mechanical, and they are the nodes where a
   cross-campus write is genuinely alarming.
4. **Shared content is a small, enumerable exception.** Of 137 implementations, 133
   evidence exactly one campus. Two span all three and two span two. Those want a
   `:Shared` label with SFBRN-level write rather than a campus one. The SFBRN CSUBuy IT
   Accessibility Review Procedure is the live case: it is Amanda McGowan's, not any single
   campus's.

#### What this costs, honestly

**It contradicts the schema review, and that needs settling rather than assuming.** The
review says plainly: *do not add campus edges to content nodes, derive*. A campus label is
the same denormalization wearing a different hat.

The counter-argument is narrow but real: the review rejected denormalization because
campus is derivable through `is_evidence_for` → YSE, and deriving is cheap for a reader.
**RBAC cannot derive.** It has no traversal step, so a fact reachable only across an edge
is a fact RBAC cannot act on. The review's reasoning holds for every consumer that can
traverse and fails for the one that cannot. Whoever owns that review should decide, not
this plan.

**The label becomes an invariant that itself needs a gate.** Adding `:CampusSFSU` on
create is a new rule, neomodel does not set dynamic labels easily, and a node created
without its campus label silently escapes the RBAC boundary. That is precisely the class
of silent failure section 2 is about. The audit test should assert that every
campus-anchored node carries exactly one campus label or `:Shared`.

**Coverage can be partial and still be worth it.** Labelling the backbone and leaving the
content leaves to query-layer checks gives a database-level backstop where a mistake is
most expensive, without committing to labelling every Note and Webpage.

### What Enterprise still does not solve

**The fourteen disagreements already in the graph.** Existence constraints would have
prevented some of them. They will not repair any.

### The sequencing that matters

The schema review calls the Aura import "the one cheap moment to change constraints",
because neomodel installs from class definitions and the import is when the class
definitions and the database are rebuilt together.

**Phase 0 of this plan has to land in that same window.** The two lists overlap and are
currently being tracked separately:

- The schema review plans to **drop** unique on `Person.name`, `Plan.description`,
  implementation `.title`, `Accomplishment.description`, `Note.name` and `Message.name`,
  because global uniqueness becomes a collision generator with twenty-three concurrently
  authoring campuses.
- The 2026-09-23 audit found that three of those same properties already carry data
  problems: `Accomplishment.description` has five nodes on a renamed field,
  `Plan.description` has one empty node, and both labels carry stale constraints on the
  old property names.

Reconciling first and migrating second means the import inherits a clean schema.
Reconciling after means doing it twice, once on Community and once on Aura.

### Findings the schema review does not yet carry

The 2026-09-23 audit surfaced three things that belong in its constraint-collision table
and are not there. They should be folded in rather than tracked here.

1. **Two property names collide with relationship names on the same class.**
   `YearSuccessEvidence.admin_reviewer_note` is declared as a relationship and exists as a
   property on **441 nodes**. `Plan.completed_year` is the same pattern on 4 nodes. At
   twenty-three campuses these become twenty-three coordinators reading a field whose
   meaning depends on whether they came through Cypher or the ORM.
2. **Nine stale uniqueness constraints** on properties the classes no longer declare, plus
   five on four labels absent from `graph_schema` entirely. The import is the moment they
   disappear, and the audit test is what stops them reaccumulating.
3. **Three orphan properties in data** beyond those: `Plan.for_next_year`, `Plan.title`,
   `Accomplishment.accomplishment_description`.

### One thing to check early

Whether a free Enterprise **Developer** licence covers a non-production instance. If it
does, the test-database item is available now rather than at cutover, and it converts the
"never run a blanket delete against production" convention into a structural
impossibility. That is the same move as everything else in this plan, and it would be the
cheapest one available.

Also worth planning for rather than discovering: Neo4j is ICT, so a CSU purchase runs
through the accessibility review this system exists to track. It needs an ACR like
anything else in the CSUBuy queue.

---

## 6. Phasing

0. **Phase 0 above.** Reconcile schema and graph, then land the audit as a test.
1. **Schema introspection module.** Extract the label, property, unique-key and
   relationship-type maps from `graph_schema` once, cached. Everything else consumes it.
   Testable with no database. The audit script already does most of this.
2. **Gate 1 in `run_file`.** Static, offline, highest value.
3. **Gate 3 in the read helper.** Cheapest of the four, independent of the others.
4. **Gate 2 in `run_file`.** Needs a database and needs the MATCH-versus-MERGE
   distinction to be right.
5. **Gate 4.** Smallest surface, depends on the unique-key map from phase 1.
6. **Shrink the skills.** See below.

Each phase ships on its own. Phase 2 is worth doing even if nothing after it happens.

---

## 7. The corollary: the skills get shorter

As a gate goes in, the prose it replaces comes out.

Once `run_file` refuses to execute on an unbound MATCH, `/ontology-ingest` should not
spend three paragraphs and a calibration story on bind-checking. It should say that
`run_file` will refuse, and how to read the error.

This is the second benefit and possibly the larger one. Instructions that a tool now
enforces are instructions competing for attention with the instructions that still need
following. Prose that describes a check the tool performs also rots, because nothing fails
when it drifts out of date.

Sections to revisit once the matching gate ships:

- `/ontology-ingest` — "Bind-check every MATCH target before executing", and the
  descriptor calibration list under step 0.
- `/ontology-ingest` — the mechanical conventions block, in part.
- `CLAUDE.md` — the hardcoded-year-prefix and blanket-delete warnings, if they become
  gates later.

---

## 8. Open decisions

1. **Does Gate 1 cover the ad-hoc read path, or only batch files?** Batch files hold the
   writes, so that is where the damage is. But both 2026-09-16 failures were reads, and a
   wrong read produces a wrong manifest that gets approved in good faith. Putting the
   validator in the shared helper costs more surface and catches the failures that
   actually happened.
2. **Refuse or warn on Gate 4?** A MERGE on a non-unique property is almost always wrong
   and occasionally deliberate. Refusing with an override flag is probably right, but it
   is a judgment about how often the override gets reached for.
3. **Does Gate 2 need the escape hatch at all?** If the auto-derivation covers every
   pattern the batch files actually use, an explicit declaration syntax is unused
   complexity. Worth checking against the existing files in
   `app/database/batch/auto-assignments/` before building it.
4. **Should the descriptors participate, or only `graph_schema`?** `UniversalDescriptor`
   carries `field_value:*` vocabularies that `graph_schema` does not, so it could validate
   enumerated values as well as names. It is also incomplete: role handles are not in the
   descriptor set at all. Probably a later phase.
5. **Which meaning keeps the name `admin_reviewer_note`?** The relationship on the class,
   or the property on 441 nodes. Whichever loses has to be renamed, and the property
   version is read by an unknown number of Cypher statements. This is the largest single
   item in Phase 0 and it is a modelling decision, not a cleanup.
6. **Are any of the nine stale constraints load-bearing?** A uniqueness constraint on a
   property the ORM no longer writes still protects against a raw-Cypher duplicate. If
   something outside neomodel still writes `Message.uuid`, dropping the constraint removes
   a guard. Worth checking before dropping rather than after.
7. **Does campus become a label?** Section 5b. This one is not ours to settle: it reverses
   the schema review's "derive, don't denormalize" for the specific case of a consumer
   that cannot traverse. If yes, the follow-on questions are how far the labelling goes
   (backbone only, or content leaves too) and what governs `:Shared`.

---

## 9. How we would know it worked

- A batch file with a misspelled property or relationship type fails before execution,
  with a message naming the offender.
- The ad-hoc helper refuses a write without a flag.
- The three sections listed in section 7 get shorter, and nothing regresses.
- A re-run of the four ingest files already in `app/database/batch/auto-assignments/`
  passes all gates, which is the regression test. If a gate rejects one of them, either
  the gate is wrong or the file has a bug nobody noticed, and both are worth knowing.
