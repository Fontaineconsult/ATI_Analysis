# Action Plan: Roles / Capacity System (People → Work)

**For:** a Claude Code session working in the `ATI_Analysis` repo.
**Spec author:** Daniel Fontaine (SFBRN Accessibility Lead), with design synthesis.
**Reference patterns to mirror:** the just-built **Dimension** node + its implementation edge and
Details-section dropdown (this roles work is its sibling on the people side); `ATIWorkingGroup` and
`Vendor` as shared-node precedents; the Governance vertical slice for CRUD shape; the descriptor
context (`useDescriptors`) for prose.

**Premise:** the **Dimension** system is already implemented — dimensions classify the *work* (an
implementation *is* ICT Development Lifecycle activity, *is* Support activity; the categorical
"noun" of the work). This plan adds the complementary **people side**: roles are what a person
*does* (the active "verb"), and the way people connect to the work they actually perform.

**Scope of THIS plan (do only this):**
1. Create a **`Role`** node type — the capacities people provide, seeded from the applicable AMM
   role-categories.
2. Add a **`holds`** edge (Person → Role) carrying **PD tracking**: a yes/no flag and a free-text
   field for how the position description addresses it.
3. Add a **participatory edge** connecting a person-in-a-role to **Implementations** — the
   day-to-day working team — explicitly **distinct from `owned_by`** (which stays the
   evidence-record custodian).
4. GUI: manage a person's roles (with PD tracking) on the **Person** view, and assign
   **participants** (people-in-roles) to an implementation in the implementation **Details** section.

**Explicitly NOT in this pass:** no change to `owned_by` semantics (it remains who maintains the
evidence record); no imported AMM role-to-dimension table (that relationship is left to EMERGE from
data — see §8); no change to the Dimension system; no scaffold/principle wiring; no projecting of
position-description taxonomy (PD coverage is a flag + free text only).

---

## 1. The conceptual split (so the model stays clean)

- **Dimension = the category of the work** (noun). Already implemented; sits on implementations as
  classification. Untouched here.
- **Role = what a person does** (verb). A person *acts as* a QA specialist, a procurement reviewer,
  a captioner. Roles are how a person actively connects to the work they perform.
- **`owned_by` ≠ doing the work.** `owned_by` is custodial — who is answerable for the
  implementation's evidence record. It is NOT the working team. This plan adds the participatory
  relationship that `owned_by` does not capture: who actually does the day-to-day work, and in what
  capacity. Keep both; they answer different questions.
- The relationship between roles and dimensions (which capacities tend to do which kinds of work) is
  **not modeled as a table** — it emerges from the data (people-in-roles participating in
  dimension-classified work). Do not import the AMM role/dimension matrix.

---

## 2. Backend — the `Role` node

Add to `app/database/graph_schema.py`, mirroring `Dimension` / `ATIWorkingGroup` style.

```python
class Role(StructuredNode):
    """
    A capacity a person provides to accessibility work — what a person DOES
    (QA specialist, procurement reviewer, designer, developer, captioner, etc.).
    The active "verb" side, complementary to Dimension (the categorical "noun" of
    the work). A person holds one or more Roles (see Person.holds_role); a Role is
    how a person participates in the Implementations they actually work on
    (see Implementation participant edge, §4) — distinct from owned_by, which is
    custodial (who maintains the evidence record).

    Seeded from the applicable W3C Accessibility Maturity Model role-categories,
    kept general rather than projecting institution-specific titles. A shared node,
    describable via the descriptor layer. Classification/relationship anchor — no
    first-order operational data lives here.
    """
    unique_id = UniqueIdProperty()

    handle = StringProperty(unique_index=True, required=True)  # e.g. "role:qa-specialist"
    name = StringProperty(unique_index=True, required=True)    # e.g. "QA Specialist"
    description = StringProperty()                              # general capacity description (seeded; §6)

    # Reverse of Person.holds_role (the holding edge carries PD tracking; see §3).
    held_by = RelationshipFrom("Person", "holds_role", model="RoleHoldingRel")

    # Reverse of the participant edge from the four doing-implementations (see §4).
    participates_in_processes  = RelationshipFrom("Process",   "has_participant")
    participates_in_projects   = RelationshipFrom("Project",   "has_participant")
    participates_in_procedures = RelationshipFrom("Procedure", "has_participant")
    participates_in_services   = RelationshipFrom("Service",   "has_participant")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "handle": self.handle,
            "name": self.name,
            "description": self.description,
        }
```

Notes:
- `handle` prefixed `role:`, matching the handle convention (assets/interfaces/dimensions/descriptors).
- Same single-shared-rel-type approach as Dimension: the participant edge uses one rel-type
  `"has_participant"` across all four implementations so traversal is uniform (see §4).

---

## 3. Backend — the `holds_role` edge with PD tracking

The Person↔Role link carries the position-description status, because whether a role is in someone's
PD is a fact about that **specific person holding that specific role** — it belongs on the edge, not
on Person (a person holds several roles, variably formalized) and not on Role (the role exists
regardless of any holder's PD).

Define a relationship model and add the edge on `Person`:

```python
class RoleHoldingRel(StructuredRel):
    """A person's holding of a role, carrying whether the position description covers it."""
    in_position_description = BooleanProperty(default=False)   # yes/no flag
    pd_description = StringProperty()                           # free text: HOW the PD addresses it
                                                               # (or notes that it does not)
    added_date = DateProperty()
```

On `Person`:
```python
    holds_role = RelationshipTo("Role", "holds_role", model="RoleHoldingRel")
```

- The **flag** answers the core gap question (is this capacity formally recognized in their duties).
- The **free-text `pd_description`** is deliberate: rather than projecting a controlled vocabulary of
  PD language (which we cannot and do not want to assume), it lets whoever knows record HOW the PD
  addresses the capacity, in whatever words fit (e.g. "covered under general 'web maintenance'
  duties", "explicitly listed", "not in PD — done as service to the department"). Structure stays
  general (a flag); specifics live in free text, unmodeled.
- Update `Person.serialize()` to include held roles with their PD status, e.g.:
  ```python
  "roles": [
      {
        "handle": r.handle, "name": r.name,
        "in_position_description": rel.in_position_description,
        "pd_description": rel.pd_description,
      }
      for r, rel in <iterate holds_role with its relationship>
  ],
  ```
  (Use the codebase's pattern for reading a relationship model alongside its target — neomodel
  `.relationship(node)` or the established helper.)

The invisible-labor query this enables: role-holdings where `in_position_description = false` —
people holding (and doing) roles their position descriptions do not cover. Surfacing that is a core
value of the feature (it makes informal accessibility labor visible and argues for formalizing it).

---

## 4. Backend — the participant edge (person-in-role → implementation)

This is the day-to-day working-team relationship, distinct from `owned_by`. **Edge grain decision
(confirm):** two equivalent shapes carry the same {person, role, implementation} information:

- **(Recommended) Person→Implementation edge carrying the role as context.** A `worked_on` edge from
  Person to Implementation, with a `RoleHoldingRel`-like model carrying which role the person acted
  in. Cleaner for "who is on this work" because the person is directly on the edge, and a person can
  appear on one implementation in multiple roles via multiple edges. Reverse from the implementation
  lists its participants with their roles.
- **(Alternative) Role→Implementation edge.** The role mediates; you read participants by going
  Implementation → Role → Person. Cleaner if you think of the role as the connector, but it makes
  "which person" a second hop.

Recommend the **Person→Implementation** form. Define:

```python
class ParticipationRel(StructuredRel):
    """A person's participation in an implementation, in a given role."""
    role_handle = StringProperty()      # which Role the person acted in (e.g. "role:qa-specialist")
    note = StringProperty()             # optional: what they did
    added_date = DateProperty()
```

On each of `Process`, `Project`, `Procedure`, `Service`:
```python
    participants = RelationshipFrom("Person", "worked_on", model="ParticipationRel")
```

On `Person`:
```python
    worked_on = RelationshipTo("Process", "worked_on", model="ParticipationRel")   # + Project/Procedure/Service
```
(Or, if the codebase prefers one rel-type reachable across the four implementation labels, keep a
single `"worked_on"` rel-type so `(:Person)-[:worked_on]->(:Process|Project|Procedure|Service)`
traverses uniformly — mirror however the Dimension `classified_under` edge was done.)

- **Do NOT touch `owned_by`.** It stays as-is (evidence-record custodian). Participants are additive.
- Update each implementation's `serialize()` to include participants:
  ```python
  "participants": [
      {"person": {"unique_id": p.unique_id, "name": p.name},
       "role_handle": rel.role_handle, "note": rel.note}
      for p, rel in <iterate participants with relationship>
  ],
  ```
- Cross-check the `role_handle` on participation against the person's held roles where sensible (a
  person ideally participates in a role they hold), but do not hard-enforce — real work sometimes
  precedes formal role-holding, and that mismatch is itself informative.

---

## 5. Backend — API + serializers

Mirror the Dimension/governance MethodView shape and `make_response` envelope.

- **`/roles` GET** (and minimal CRUD if you want roles editable beyond the seed) → `{ data: { items:[…] } }`.
  Roles are seeded (§6); GET is what the GUI dropdowns need. A `_serialize_role` projector defines
  `{ unique_id, handle, name, description }`.
- **Person update path — role holdings.** Add an action (mirroring the governance attach/detach
  `action`-dispatch and the Dimension `set_dimensions` action) to set a person's role holdings with
  PD status:
  - `set_role_holdings` — body carries the person's unique_id and a list of
    `{ role_handle, in_position_description, pd_description }`; backend replaces the person's
    `holds_role` edges to match (replace-semantics, like the dimension dropdown). Returns the
    updated person item (with `roles`).
- **Implementation update path — participants.** Add an action to set an implementation's
  participants:
  - `set_participants` — body carries the implementation type + unique_id and a list of
    `{ person_unique_id, role_handle, note }`; backend replaces the implementation's participant
    edges to match. Returns the updated implementation item (with `participants`).
- CRUD/query code in `app/database/queries/…` per the existing per-domain layout; `_serialize_role`,
  plus updates to the person and implementation serializers (§3, §4).

---

## 6. Seed the Role nodes (from the applicable AMM role-categories)

Add an idempotent seed (e.g. `app/database/tools/seed_roles.py`), upserting on `handle`. Seed from
the AMM role-category list, **pruned to what applies to a CSU campus** — drop categories that are
vendor/standards-body-specific and won't appear in your org. Suggested starting set (confirm/prune):

| handle | name | general capacity (seeded description) |
|---|---|---|
| `role:accessibility-consultant-advisor` | Accessibility Consultant/Advisor | Provides expert accessibility guidance across dimensions. |
| `role:accessibility-specialist` | Accessibility Specialist | Hands-on accessibility expertise and remediation capacity. |
| `role:chief-accessibility-officer` | Chief Accessibility Officer / Lead | Executive-level accessibility program leadership. |
| `role:content-producer` | Content Provider/Producer | Creates and prepares accessible content. |
| `role:designer` | Designer | Designs accessible interfaces and experiences. |
| `role:developer` | Developer | Implements accessible software/UI. |
| `role:instructor-trainer` | Instructor/Trainer | Delivers accessibility knowledge and skills training. |
| `role:it-manager` | IT Manager | Manages ICT systems with accessibility responsibility. |
| `role:legal-representative` | Legal Representative | Provides legal/compliance counsel on accessibility. |
| `role:org-policy-maker` | Organizational Policy-Maker | Sets institutional accessibility policy. |
| `role:product-manager` | Product Manager | Owns product direction including accessibility. |
| `role:project-manager` | Project Manager | Coordinates accessibility projects and timelines. |
| `role:qa-specialist` | QA Specialist | Performs manual/automated accessibility testing. |
| `role:researcher` | Researcher | Conducts user research including users with disabilities. |
| `role:procurement-team` | Procurement Team | Integrates accessibility into acquisition. |
| `role:ux-team` | UX Team | User-experience capacity including accessibility. |
| `role:employee-with-disability` | Employee with Disability | First-hand lived-experience capacity informing the work. |
| `role:dei-officer` | Diversity & Inclusion Officer | Disability-inclusion capacity across the org. |
| `role:comms` | Public Relations/Communications | Accessible communications capacity. |
| `role:alt-media-coordinator` | Alternative Media Coordinator | Braille/alt-format production capacity (campus-specific, include if applicable). |

(Definitions are general capacity descriptions, not job descriptions. Keep them institution-neutral.
Prune freely; the AMM list is a seed, not a mandate. Seed roles before anything assigns them.)

Seed order: create Roles before assigning holdings or participants.

---

## 7. Frontend

Two surfaces, mirroring the Dimension dropdown pattern and the descriptor-prose convention.

### 7a. Person view — manage role holdings (with PD tracking)
On the **Person** detail/edit view, add a **Roles** section:
- A way to add/remove roles the person holds (multi; options from `/roles` GET, display `name`,
  submit `handle`).
- For each held role, two inputs: **In position description** (yes/no toggle) and **How the PD
  addresses it** (free text). These map to `RoleHoldingRel.in_position_description` and
  `pd_description`.
- Pre-populate from the person's `roles` array.
- Save via the `set_role_holdings` action (replace-semantics); reload/reconcile.
- Labels/help from the descriptor context (`useDescriptors`), humanized fallback.

### 7b. Implementation Details — assign participants (the working team)
In the implementation **Details** section (same section where Dimensions now live), add a
**Participants** control, clearly separate from the existing **Owner** (`owned_by`) field:
- Add participants as {person, role} pairs: pick a Person, pick the Role they acted in, optional
  note. Multi.
- Person options from the existing person list; role options from `/roles` GET. When a person is
  selected, optionally default the role picker to roles that person holds (nicety, not a constraint).
- Pre-populate from the implementation's `participants` array.
- Save via the `set_participants` action (replace-semantics); reload/reconcile.
- Make the UI copy distinguish the two: **Owner** = maintains the evidence record; **Participants** =
  who did the work. (Sourcing this help text from descriptors is ideal.)
- Match the existing toast + `onSaved`/`onAfter*` callback pattern.

Service layer (`services/api/`): add `fetchAllRoles()` (GET), `setPersonRoleHoldings(personId,
holdings)` (PUT `set_role_holdings`), and `setImplementationParticipants(type, implId, participants)`
(PUT `set_participants`) — axios, mirroring existing wrappers.

---

## 8. What is deliberately left to EMERGE (not built)

The relationship "which roles tend to do which dimensions" (the AMM appendix's role/dimension table)
is **not** modeled as data. Once people-in-roles participate in dimension-classified implementations,
that relationship is readable from the graph: for a given Dimension, the roles/people who have
actually participated in work of that dimension. This powers a future **staffing-suggestion** feature
("this work is Support + ICT Dev Lifecycle; here are people whose roles have done that kind of work")
WITHOUT importing the AMM matrix. Leave the data shaped to allow this query; do not build the
suggestion UI in this pass.

---

## 9. Implementation order

1. Backend: `Role` node (§2); `RoleHoldingRel` + `Person.holds_role` (§3); `ParticipationRel` +
   `participants`/`worked_on` on the four implementations (§4); update Person and implementation
   `serialize()`.
2. Backend: seed Roles (§6), idempotent on `handle`.
3. Backend: `/roles` GET + `set_role_holdings` (Person) + `set_participants` (Implementation) actions
   (§5); `_serialize_role`.
4. Frontend: `fetchAllRoles()`, `setPersonRoleHoldings()`, `setImplementationParticipants()` services.
5. Frontend: Person **Roles** section with PD tracking (§7a); Implementation **Details**
   **Participants** control, separate from Owner (§7b).
6. Run the schema-install step (`install_all_labels()`); run the seed; verify no neomodel errors.

---

## 10. Acceptance checks

- A `Role` node type exists, seeded from the pruned AMM role-categories (idempotent on `handle`).
- A Person can hold multiple Roles via `holds_role`; each holding carries
  `in_position_description` (bool) and `pd_description` (free text). Person `serialize()` includes a
  `roles` array with PD status.
- The invisible-labor query works: role-holdings where `in_position_description = false` are
  retrievable.
- Implementations carry **participants** (person + role + optional note) via a relationship distinct
  from `owned_by`; `owned_by` semantics are unchanged. Implementation `serialize()` includes a
  `participants` array.
- Person view: roles can be added/removed with the yes/no PD flag and free-text PD field; saves via
  `set_role_holdings`; reflects after reload.
- Implementation Details: participants can be assigned as {person, role} pairs, visibly separate
  from Owner; saves via `set_participants`; reflects after reload.
- No AMM role/dimension matrix was imported; the role↔dimension relationship is left to emerge from
  participation data. Dimension system unchanged.
- Dropdown labels/help resolve through the descriptor context (humanized fallback).

---

## 11. Design rationale (the "why")

- **Noun vs verb, correctly placed:** the work is *classified* into Dimensions (the categorical noun,
  already built); people *do* work via Roles (the active verb, this plan). The two live on different
  hosts and are not conflated.
- **Role as a node** (like Dimension, Vendor, ATIWorkingGroup): a capacity has its own substance and
  is shared across people, so it is an entity, not a string.
- **PD tracking on the holding edge:** whether a role is in a PD is a fact about the person-role
  pairing, so it lives on the `holds_role` edge — a yes/no flag plus free text, deliberately general
  (no projected PD taxonomy). The false-flag query surfaces informal/invisible accessibility labor.
- **Participants ≠ owner:** `owned_by` is custodial (maintains the evidence record); participants are
  the people who actually do the day-to-day work, in their roles. The graph previously knew only the
  former; this adds the latter, which is what staffing and invisible-labor visibility require.
- **Role↔dimension left to emerge:** rather than importing the AMM's generic role/dimension table,
  the relationship is read from real participation in dimension-classified work — your people, your
  data, the AMM only as the general vocabulary for roles.
```