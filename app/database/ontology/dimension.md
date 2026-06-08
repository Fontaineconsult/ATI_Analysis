# Implementation Brief: AMM Dimension Node + Implementation Assignment

**For:** a Claude Code session working in the `ATI_Analysis` repo.
**Spec author:** Daniel Fontaine (SFBRN Accessibility Lead), with design synthesis.
**Reference patterns to mirror:** the existing `ATIWorkingGroup` node (Dimension sits in the same
structural position — a shared classification node the work points at), the Governance vertical
slice, and the descriptor context (`useDescriptors` / `DescriptorContext`) for prose.

**Scope of THIS pass (do only this):**
1. Create a new **`Dimension`** node type — the seven W3C Accessibility Maturity Model (AMM)
   dimensions, each seeded with its AMM definition.
2. Add an edge so the four "doing" implementations (Process, Project, Procedure, Service) can be
   **classified under** one or more Dimensions.
3. Add a **Dimension assignment dropdown** to the **Details** section of the Implementation editing
   GUI.

**Explicitly NOT in this pass:** no Dimension-to-SuccessIndicator / Goal crosswalk; no proof-point
import (the AMM proof points are conceptually our success indicators and are already modeled — do
NOT re-import them); no principle/scaffold wiring; no changes to the Interface signature. Dimension
is a classification anchor for the work, nothing more, right now.

---

## 1. What a Dimension is (so the model stays clean)

A `Dimension` is one of the seven AMM areas of organizational accessibility practice. It is a
**cross-cutting classification of the work** (the implementations), orthogonal to the Interface
signature and orthogonal to the working group. It answers "what kind of accessibility activity is
this," distinct from working group, which answers "who is accountable for it."

It is modeled as a node (not a property) because each dimension has its own substance — an AMM
definition, and a place in the meta-layer (it can be described and, later, grounded to the AMM as a
source). This mirrors `ATIWorkingGroup`, which is already a node the work relates to.

**Keep the boundary:** Dimension nodes carry definitional content and are classification anchors
that work points at. They are NOT places where work happens and must NOT accumulate first-order
operational data. The seven nodes are fixed (the AMM's seven); this is a controlled set, not a
user-grown list.

---

## 2. Backend — the `Dimension` node

Add to `app/database/graph_schema.py`, mirroring the style of `ATIWorkingGroup`.

```python
class Dimension(StructuredNode):
    """
    A W3C Accessibility Maturity Model (AMM) dimension — one of the seven areas of
    organizational accessibility practice (Communications, Governance & Oversight,
    ICT Development Lifecycle, Knowledge & Skills, Personnel, Procurement, Support).

    A cross-cutting classification of the WORK: the four doing-implementations
    (Process/Project/Procedure/Service) are classified_under one or more Dimensions.
    Orthogonal to the Interface signature and to ATIWorkingGroup — Dimension answers
    "what kind of accessibility activity is this," where working group answers "who is
    accountable." Sits in the same structural position as ATIWorkingGroup: a shared
    node the work points at.

    Fixed controlled set of seven (the AMM's); not a user-grown list. Carries the AMM
    definition so the node is self-describing. Classification anchor only — no
    first-order operational data lives here.

    Grounded in the W3C Accessibility Maturity Model (https://w3c.github.io/maturity-model/).
    """
    unique_id = UniqueIdProperty()

    handle = StringProperty(unique_index=True, required=True)  # e.g. "dimension:communications"
    name = StringProperty(unique_index=True, required=True)    # e.g. "Communications"
    description = StringProperty()                              # the AMM definition (seeded; see §5)

    # Reverse side of Implementation.classified_under (see §3).
    classifies_processes   = RelationshipFrom("Process",   "classified_under")
    classifies_projects    = RelationshipFrom("Project",   "classified_under")
    classifies_procedures  = RelationshipFrom("Procedure", "classified_under")
    classifies_services    = RelationshipFrom("Service",   "classified_under")

    def serialize(self):
        return {
            "unique_id": self.unique_id,
            "handle": self.handle,
            "name": self.name,
            "description": self.description,
        }
```

Notes:
- `handle` is the stable key (prefixed `dimension:`), matching the handle convention used elsewhere
  (assets, interfaces, descriptors). Use it for seeding idempotency and as the value the dropdown
  submits.
- If the codebase prefers a single shared rel-type reachable by ad-hoc Cypher (the
  Person-or-OrgUnit stewardship pattern on Asset), the four `RelationshipFrom` lines all use the
  same rel-type string `"classified_under"`, so `(:Process|Project|Procedure|Service)-[:classified_under]->(:Dimension)`
  matches uniformly. Keep that single rel-type.

---

## 3. Backend — the edge on the four implementations

On each of `Process`, `Project`, `Procedure`, `Service` in `graph_schema.py`, add the forward edge
(multi-valued — an implementation can exercise several dimensions at once, e.g. Development
Lifecycle and Support):

```python
    classified_under = RelationshipTo("Dimension", "classified_under")
```

- Multi-valued is intentional: a single piece of work genuinely can fall under more than one AMM
  dimension. Do not constrain to one.
- Add ONLY to the four doing-implementations (Process, Project, Procedure, Service) — the same set
  that carries `remediates_interface` / `accountable_working_group`. Do not add to Plan, Guidance,
  Tracking, InternalPolicy, etc. in this pass.
- Update each implementation's `serialize()` to include its dimensions, e.g.:
  ```python
  "dimensions": [{"handle": d.handle, "name": d.name} for d in self.classified_under.all()],
  ```

---

## 4. Backend — API + serializer

Two pieces, mirroring the governance/working-group endpoints and the `make_response` envelope:

**(a) A read endpoint for the dimension list** (the dropdown needs the seven options). Either add a
small `DimensionAPI` MethodView at `/dimensions` (GET returns `{ data: { items:[...] } }`), or — if
there is already a settings/vocabulary endpoint pattern — expose the seven there. Prefer a real
`/dimensions` GET so the node’s `description` (AMM definition) is available for tooltips. CRUD beyond
GET is not needed this pass (the seven are seeded, not user-created), but follow the existing
MethodView shape if you add the file so it’s consistent.

**(b) Assignment on the Implementation update path.** The Implementation editing flow must be able to
set/replace an implementation’s dimensions. Follow the existing attach/detach `action`-dispatch
convention used by governance PUT (`attach_document` etc.). Add to the Implementation update
endpoint an action such as:
- `set_dimensions` — body carries the implementation identity (type + unique_id) and a list of
  dimension handles; backend replaces the implementation’s `classified_under` edges to match.
  (Replace-semantics is simplest for a multi-select dropdown: the dropdown’s current selection is
  the full intended set.)

Return the updated implementation item (with its `dimensions` array) so the GUI reconciles.

CRUD/query code in `app/database/queries/…` per the existing per-domain layout; a `_serialize_dimension`
projector defines the item shape `{ unique_id, handle, name, description }`.

---

## 5. Seed the seven Dimensions

Add an idempotent seed (e.g. extend `app/database/tools/seed_descriptors.py` or a sibling
`seed_dimensions.py`), upserting on `handle` so re-running updates rather than duplicates. Seed the
seven with the AMM’s own dimension definitions:

| handle | name | description (AMM definition) |
|---|---|---|
| `dimension:communications` | Communications | Information as it relates to an organization's accessibility, and the accessibility of all internal and external communications. Covers communications that are external and internal, formal and informal, major and minor, and produced either by the organization directly or by third parties under contract. |
| `dimension:governance-oversight` | Governance & Oversight | The organization's commitment to accessibility: directing, monitoring, sustaining, and measuring accessibility across the organization. Establishes accountability through policies, standards, and decision-making structures, and integrates accessibility into planning, resourcing, and risk management. |
| `dimension:ict-development-lifecycle` | ICT Development Lifecycle | Incorporation of web, software, and hardware accessibility considerations throughout the development process — from idea conception through design, development, testing, ACR production, user research, maintenance, and obsolescence. |
| `dimension:knowledge-skills` | Knowledge & Skills | Ongoing education and outsourcing practices that give internal and external personnel at all levels the accessibility knowledge and skills relevant to their organizational role. |
| `dimension:personnel` | Personnel | Employing qualified individuals with disabilities throughout the organization's hierarchy — across job types, authority levels, and departments — so their insights and lived experience inform decision-making. |
| `dimension:procurement` | Procurement | The strategic process of finding and acquiring accessible products and services the organization needs, including sourcing, negotiation, and selection, with accessibility integrated into procurement processes and contract language. |
| `dimension:support` | Support | Accessibility assistance provided to internal employees and external customers with disabilities, including reasonable accommodations for employees and accessibility-specific customer support. |

(These definitions are condensed from the AMM dimension descriptions; keep them as the seeded
`description`. They may later also be surfaced through the descriptor layer, but seeding the node’s
own `description` now keeps the node self-describing without a dependency.)

Seed order: create Dimensions before anything tries to classify against them.

---

## 6. Frontend — Dimension assignment dropdown in the Implementation **Details** section

Add to the Implementation editing GUI, specifically the **Details** section of the Implementation
detail/edit view.

- **Control:** a multi-select dropdown (an implementation can have several dimensions). Use the same
  Chakra component conventions the Implementation form already uses for other multi-selects; if the
  codebase has a standard multi-select, reuse it.
- **Options:** the seven Dimensions, fetched from the `/dimensions` GET (or the vocabulary endpoint).
  Display `name`; submit `handle`. Show the dimension `description` as a tooltip/help on each option
  if the component supports it (the AMM definition is useful context for the person assigning).
- **Label/help text:** source the field label and any help prose from the **descriptor context**
  (`useDescriptors`), per the repo convention that prose comes from descriptors, not hardcoded
  strings. Fall back to a humanized label ("Dimensions") if no descriptor exists yet.
- **Current value:** pre-populate from the implementation’s `dimensions` array (the serialized
  edges).
- **Save:** on change/save, call the Implementation update service with the `set_dimensions` action
  (or the chosen action name from §4b), passing the selected handles as the full intended set
  (replace-semantics). Reload/reconcile the implementation so the Details view reflects the saved
  dimensions. Match the existing toast + `onSaved`/`onAfter*` callback pattern.
- **Placement:** within the existing **Details** section, alongside the other implementation
  attributes — not a separate tab or modal.

Service layer (`services/api/`): add a thin function for the assignment, mirroring the
attach/detach wrappers (axios for the PUT), e.g.
`setImplementationDimensions(implementationType, implementationUniqueId, dimensionHandles)` →
PUT `{ action:'set_dimensions', type, unique_id, dimension_handles }` → returns `.data.item`.
Add `fetchAllDimensions()` (GET) for the dropdown options.

---

## 7. Implementation order

1. Backend: add the `Dimension` node (§2) and the `classified_under` edge on the four
   implementations (§3); update their `serialize()`.
2. Backend: seed the seven Dimensions (§5), idempotent on `handle`.
3. Backend: `/dimensions` GET + the `set_dimensions` action on the Implementation update endpoint
   (§4); `_serialize_dimension`.
4. Frontend: `fetchAllDimensions()` + `setImplementationDimensions()` service functions (§6).
5. Frontend: the multi-select dropdown in the Implementation **Details** section (§6), wired to
   fetch options, pre-populate, save via the action, and reconcile.
6. Run the project’s schema-install step (`install_all_labels()` is called in `__main__`); run the
   seed; verify no neomodel errors.

---

## 8. Acceptance checks

- A `Dimension` node type exists with exactly seven seeded nodes, each with `handle`, `name`, and an
  AMM `description`; re-running the seed produces no duplicates (handle uniqueness holds).
- Each of Process / Project / Procedure / Service can be `classified_under` one or more Dimensions
  via the single `classified_under` rel-type; `(:Process|Project|Procedure|Service)-[:classified_under]->(:Dimension)`
  traverses uniformly, and the reverse (a Dimension → all work under it) traverses cleanly.
- The Implementation **Details** section shows a multi-select Dimension dropdown, populated from the
  seven, displaying `name` and submitting `handle`, pre-filled from current assignments.
- Saving the dropdown replaces the implementation’s dimensions to match the selection and the
  Details view reflects it after reload.
- Implementation `serialize()` includes a `dimensions` array.
- No proof points were imported; no Dimension-to-SuccessIndicator/Goal edges were created; the
  Interface signature is unchanged. Dimension carries definitional content only and no first-order
  operational data.
- Field label/help for the dropdown resolves through the descriptor context (with a humanized
  fallback).

---

## 9. Design rationale (the "why")

- **Node, not property:** each AMM dimension has its own substance (an AMM definition) and a place in
  the meta-layer, so it is a first-class entity, not a value. This matches how `ATIWorkingGroup` is
  already modeled — both are shared classification nodes the work points at.
- **Two orthogonal cuts of the work:** working group = who is accountable; AMM dimension = what kind
  of practice. Keeping both as nodes the implementation relates to makes the two cuts symmetric and
  lets either be traversed independently. Their divergence (e.g. Web-accountable work that is
  Knowledge-&-Skills practice) becomes queryable.
- **Classification anchor, not a work surface:** Dimension holds definitional content and is pointed
  at; it must not accumulate operational data, or it stops being a clean classification.
- **Not the proof points:** the AMM proof points are conceptually our success indicators and are
  already modeled; this pass captures only the seven dimension *categories* as a classification, per
  the explicit scope boundary.
- **Maturity-lens payoff (future):** because work is now classifiable by AMM dimension, the data can
  later roll up against the AMM maturity model (e.g. "how much of our work is Support-dimension"),
  a cross-cutting view the CSU three-priority-area structure cannot express. Not built now, but this
  is why the dimension cut earns its place.
```