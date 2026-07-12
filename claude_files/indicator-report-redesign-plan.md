# Single-Indicator Evidence Report — Redesign Plan (blended)

Branch: `report-view-updates` (off `master`). Design handoff: `Downloads/ATI Analysis wireframes (2).zip`
→ `design_handoff_indicator_report/` (README + `Campus Plan Wireframes.dc.html` wireframe **4c**).

**This plan deliberately blends the handoff with the existing code rather than treating the
handoff as absolute.** The current view is already a modern, canon-styled component; the
designer's spec is largely a re-articulation of what exists plus real bug-fixes and
render-the-dropped-data work. Where the designer's assumptions don't match the code, this
plan overrides the handoff and says why.

---

## Ground truth (verified against the code)

**Rewrite target:** `report_components/IndicatorReportView.js` (props contract: `({ report })`).
- Rendered by exactly ONE parent: `SingleReportMasterContainer.js:105`. Safe to rewrite in place.
- `SingleReportMasterContainer` is rendered in TWO places — the routed report (`Dashboard.js`)
  **and the approval workflow preview** (`ati_explorer_containers/ApprovalMasterContainer.js`).
  ⇒ The rewrite must not break the approval preview.

**Data path:** container fetches the WHOLE GOAL via `/report/goal` → `get_goal_report` loops
`get_indicator_report` per indicator, cached in DataContext by `group|goal|year|campus`.
⇒ Any per-indicator backend traversal is paid N× (once per indicator in the goal). Reading
extra node attributes is free; adding new queries is what costs.

**The current view already renders:** identity + status (full maturity ladder), People
(implementers w/ title+roles; admin-review sub-block), Implementation Evidence cards (type,
owner, accountable WG, AMM dimensions, participants, remediated interfaces, docs/notes/metrics),
a "Remediation Backbone" (= the handoff's "ICT Footprint": Assets/Interfaces/Tools/Vendors),
TAAPs, Plans & Accomplishments, and YSE-level notes/messages/metrics. So this is
**flatten + bug-fix + render-what's-dropped + typed-artifact polish**, not a rewrite.

---

## Handoff vs. code — reconciliation

### Designer got it right
- **Broken document links** — real, but **frontend-only**. Payload nests the download URL at
  `d.file.download_url` (via `serialize_has_file` inside each node's `serialize()`); the view
  uses `href={d.file_path || d.uri_path}` (`IndicatorReportView.js:64`), which is null for
  uploaded (managed) files. Fix mirrors the existing `FileDownload` in
  `implementation_explorer/doc_components/docPrimitives.jsx:162`.
- **Backend field gaps are real** and the properties exist on the schema — the report just
  builds hand-rolled `indicator`/`yse` dicts that omit them:
  - `SuccessIndicator.override_implementation_requirement` — `graph_schema.py:450`
  - YSE: `priority_level`, `documentation_status`, `resources_status`,
    `implementation_plan_status`, `ready_for_admin_review`, `worked_on_in_current_year`,
    `will_work_on_next_year` — `graph_schema.py:1264-1283`
  - These are **cheap**: the YSE node is already loaded — just read more attributes.
- **Carried-but-dropped data** (all present in the payload, not rendered):
  impl-level `messages[]`, `admin_review_notes[]`, `people.admin_review_completed_by`,
  participation `note` (`serialize_participants` returns `{person, role_handle, note}`),
  TAAP `signed_by[]/notes[]/messages[]`, person `email`, vendor emails.

### Designer missed the code
- **"prev → current status pills" has no data behind it.** This payload carries only the
  *current* status (`status.status_level`). Real prev→current needs a prior-year YSE lookup.
  ✅ *Decision:* add it (below) — folded into the existing `_resolve_identity` query so it
  costs **no extra round-trip**, mirroring `committees/read.py:213-218`.
- **`docPrimitives.jsx` already exists** — `FileDownload`/`PathLinks`/`ReportBadges`/`ItemShell`/
  `EmptyText`. No need to invent a new artifact-row toolkit from scratch; reuse these behind one
  small `resolveArtifactHref(node)` helper.
- **`EvidenceQualityPanel` must not be deleted** — `services/report_constructor.js:1157` still
  uses it. Only remove it *from this page*.
- **`Document.serialize()` does not emit `description`** — so the handoff's "document
  description" line has no data. Treated as optional (needs a 1-line serialize add first).

---

## Locked decisions

1. **Status display → prev→current pills + backend.** Use `StatusProgression`/`StatusPill`
   from `campus_plan_components/StatusProgression.js`; add a prior-year status lookup to the
   report payload so `prev` is real.
2. **Evidence-quality rubric → inline as a flat block.** Drop the sticky right rail; fold the
   *current level's* criteria into a plain block under the Status section (no rail, no
   collapse). Reuse `StatusLevelContext` (the same source `EvidenceQualityPanel` reads).
3. **Rollout → two PRs: fix bugs first, then restyle.**

---

## PR 1 — Correctness (frontend only; no backend, no layout change)

**Status: DONE** (uncommitted on `report-view-updates`). All changes in `IndicatorReportView.js`;
new `IndicatorReportView.test.js` (7 passing). Introduced `resolveArtifactHref` + a `DocLink`
(unlinked/struck fallback), a `MessageList` (renders the file link Notes dropped), and an
`AdminNoteList` (author + date). Wired impl `messages`, participation `note`, admin_review_notes,
`admin_review_completed_by`, and TAAP `signed_by`/`notes`/`messages`; switched YSE messages to
`MessageList`.

Touches `IndicatorReportView.js` only. Keeps the existing two-column layout + EvidenceQualityPanel
(those change in PR2). Purely additive rendering + the href fix, so risk is low.

1. **Link resolution.** Introduce a tiny `resolveArtifactHref(node)` =
   `node.file?.download_url || node.uri_path || node.file_path || null` (webpages use
   `node.url`). Apply it in `DocLinks` (currently `:64`) and to the newly-rendered messages.
   Dead webpages (`no_longer_exists`) render struck-through with no anchor.
2. **Implementation messages.** `ImplementationCard` renders `impl.documents/webpages/notes/
   metrics` but drops `impl.messages` — render them (content, date, + resolved file link).
3. **Admin review completeness.** Render `report.admin_review_notes[]` (quoted content +
   author + date) and use `people.admin_review_completed_by.name` for the "completed {date}
   by {name}" line.
4. **Participation notes.** Append the participation `note` to each participant row when present.
5. **TAAP completeness.** `TaapCard` renders `taap.signed_by[]` (all signatories),
   `taap.notes[]`, and `taap.messages[]`.

*PR1 test:* extend/author an RTL smoke test asserting a fixture with an uploaded doc renders a
link whose href is the `file.download_url`, and that impl messages / admin_review_notes / TAAP
signatories appear.

---

## PR 2 — Redesign (flatten + backend fields + polish + tests)

### Backend — `get_indicator_report.py`
- `indicator` dict += `override_implementation_requirement`.
- `yse` dict += `priority_level`, `documentation_status`, `resources_status`,
  `implementation_plan_status`, `ready_for_admin_review`, `worked_on_in_current_year`,
  `will_work_on_next_year` (all via `getattr(yse, …)`).
- **Previous-year status:** add an `OPTIONAL MATCH` to `_resolve_identity`'s existing Cypher —
  `(prevYse)-[:tracks]->(si)` at the same campus, `evidence_in_year` = previous year,
  `-[:status_is]->(prevSl)` — returning `prevSl.status_level AS previous_status_level`. Add
  `previous_status_level` (and `_value`) to the `status` block. Pass
  `$previous_year = _previous_academic_year(academic_year)`. Relocate `_previous_academic_year`
  from `committees/read.py:11` to `app/database/identifiers.py` (shared util) and import in both.
- *(Optional)* if doc descriptions are wanted: add `description` to `Document.serialize()` first
  (verify the property exists on the node), then render it.

### Frontend — `IndicatorReportView.js` (flatten to one column)
- Remove the 3:1 `Flex` + right rail; **remove `EvidenceQualityPanel` import/JSX on this page**
  (keep the file). Swap inline `Card` → shared `graph_components/common/Card.jsx`. Keep the
  chrome-less inline `Section` (it carries the ` (count)` suffix the shared one lacks).
- **§1 Header:** composite key (mono) · WG dot + name · "{campus} · {year}"; full SI text; goal
  line; actions right = **Print** (solid teal, `window.print()`) + **Edit** (outline →
  `navigateToIndicator`).
- **§2 Status & Admin Review** (always rendered):
  - `StatusProgression` prev→current pills (labeled prev/current).
  - **Inline maturity rubric** block: read `StatusLevelContext`, render the current level's
    category descriptions/requirements flat (extract an `InlineMaturityCriteria` from
    `EvidenceQualityPanel`'s `LevelCard`/`CategoryBlock`).
  - Chips (render when present/true): `Priority: {priority_level}`, `worked on this year`,
    `continuing next year`, `Ready for admin review`, documentation/resources/plan status.
  - Admin-review line (badge + "completed {date} by {name}" + reviewers), `admin_review_description`
    block, `admin_review_notes[]` (from PR1).
- **§3 People** (always; empty "No people assigned."): implementer rows — name, role badges,
  title, **email as `mailto:`** (net-new; email is in `_person_ref`).
- **§4 Implementation Evidence** (always): typed artifact rows via `resolveArtifactHref` +
  `docPrimitives` — tags FILE / URL / WEB / GONE / NOTE / MSG / METRIC; deprecated struck-through;
  `no_active_documents` orange border/badge (keep); owner/accountable/AMM chips (keep);
  participants + note (PR1); remediates chips (keep). Empty state honors
  `override_implementation_requirement` → "This indicator is exempt from implementation evidence."
- **§5 ICT Footprint** (always; keep the existing Assets/Interfaces/Tools/Vendors rows):
  add tool identifiers; vendor emails as `mailto:`.
- **§6 TAAPs** (always): signatories, covers, review-due, artifact rows (from PR1 + tags).
- **§7 Plans & Accomplishments** (always): plan status via `planStatusColors` schemes
  (Abandoned red), Key/Campus chips.
- **§8 YSE Notes / Messages / Metrics** (always): typed artifact rows with file links; metrics
  show value + comment + data + academic_year.
- **Every section always renders** with an explicit italic empty state (checklist completeness) —
  a behavioral change from today's conditional hiding of empty sections.
- **Print:** `@media print` (via component `sx`) hides app chrome + action buttons; the single
  column prints as-is.
- **A11y:** one `<h1>` (indicator key + goal), `<h2>` per section (`<section aria-labelledby>`),
  `<h3>` per implementation; dead links get `aria-label="{name} (no longer available)"`;
  body ≥14px, metadata ≥12px.

### Tests (PR2)
- **Frontend** `IndicatorReportView.test.js` (new): fat fixture — every section renders + empty
  states; uploaded-doc link href = `file.download_url`; artifact tags; `mailto:` links;
  `override_implementation_requirement` exempt state; prev→current pills; Print button calls a
  mocked `window.print`.
- **Backend** `tests/test_indicator_report.py` (new; no existing report-query test): sentinel-year
  YSE (SI+campus) + prior-year YSE with a status; assert the payload carries
  `override_implementation_requirement`, the 7 YSE props, and `previous_status_level`. Reuse
  `cleanup_yse_family`. Query-level (no Flask) for speed; `@pytest.mark.integration`.

---

## Reuse map (blend, don't rebuild)

| Need | Reuse | Path |
|---|---|---|
| Titled card | shared `Card` | `graph_components/common/Card.jsx` |
| prev→current pills | `StatusProgression`/`StatusPill` | `campus_plan_components/StatusProgression.js` |
| Managed-file download link | `FileDownload` (+`PathLinks`,`ReportBadges`,`ItemShell`,`EmptyText`) | `implementation_explorer/doc_components/docPrimitives.jsx` |
| Impl deep-link | `getImplementationURL` (already used) | `services/utils/tools.js:124` |
| Maturity rubric content | extract from `EvidenceQualityPanel` `LevelCard`/`CategoryBlock` | `report_components/EvidenceQualityPanel.js` |
| Rich descriptions (optional) | `Markdown` | `graph_components/common/Markdown.jsx` |
| Prev-year name helper | `_previous_academic_year` (relocate → identifiers.py) | `committees/read.py:11` |
| Export/print model | `CopyStatusReportButton` (pattern only) | `report_components/CopyStatusReportButton.jsx` |

Net-new (no existing component): `resolveArtifactHref` helper, `mailto:` person/vendor rows, the
Print action + print stylesheet, and the typed-tag artifact-row wrapper.

---

## Don't-break / risks
- **Approval preview** (`ApprovalMasterContainer`) renders the same `IndicatorReportView` — smoke-check it after the flatten.
- **`EvidenceQualityPanel` stays** (used by `report_constructor.js`); only its usage here is removed.
- **N× goal fetch** — keep backend additions to attribute reads + the single folded `OPTIONAL MATCH`; don't add per-indicator queries.
- **`StatusProgression` lives in `campus_plan_components`** — importing it into `report_components` is fine, but consider relocating it to a shared location if it starts to feel mis-homed.
