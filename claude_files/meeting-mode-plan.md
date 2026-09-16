# Meeting Mode: a presentation view for shared-screen remote meetings

Status: built 2026-09-12 (phases 1 to 4 of section 7; uncommitted on `plans-updates`).
Route `/ati/:campus/present/plans/:planId`; entry buttons on the Plans page and the
Campus Plan title row. See section 9 for what changed in the data model and where
the code landed. The Campus Plan indicator deck (phase 5) is not built.

## 1. The problem the current Plans view has on a shared screen

Measured on the dev build at 1568 x 771, which is what a shared laptop screen
comes through as after Zoom or Teams downsamples it.

| Region | Height | Share of viewport |
|---|---|---|
| Top nav (logo, campus, year, person) | 60 px | 8% |
| Sub nav (working-group links) | 48 px | 6% |
| Page padding + "Plans & Accomplishments" header card | ~110 px | 14% |
| Tab bar | ~40 px | 5% |
| Stat strip | ~80 px | 10% |
| Sort controls | ~40 px | 5% |
| **Content (list + detail) begins at** | **~400 px** | **the lower 48%** |

Beyond the vertical budget, four things work against communicating progress:

1. The detail panel is edit-first. The first card after the header is the
   Details form with inputs for name, description, status and two switches.
   Nobody in a meeting needs to see an input box; they need to read the plan.
2. Progress is the fourth card. It sits below Details and Associated Year
   Success Evidence, so the thing the meeting is about is below the fold on
   every plan.
3. Type is tuned for a desk, not a projector. Body text is `sm` (14 px), meta
   is `xs` and `2xs` (12 px and 10 px). At 70% downsample the chips read as
   colored smudges.
4. The container caps at 1400 px, so on a wide monitor a third of the screen
   is empty gutter.

The notes side has a structural gap too. Progress on a plan is recorded as
Asana subtasks, which is right for tasks. Minutes are recorded per working
group plan as Markdown on the Campus Plan page, in a modal. There is no
surface where you can type what the room said about *this plan* while
looking at it, and have it land where the follow-up pipeline reads.

## 2. What the mode is

A **route-level shell**, not a flag on the existing page. The URL carries it:

```
/ati/:campus/present/plans            the deck opens on the top attention plan
/ati/:campus/present/plans/:planId    the deck opens on one plan (shareable in chat)
```

Entered from a "Meeting mode" button on the Plans page header and the Campus
Plan page. Exited with Esc or the exit button, returning to the page you came
from with the same plan selected.

The shell owns three things every deck needs. Plans is the first deck; the
Campus Plan indicator table is the natural second.

- **Chrome collapse.** No top nav, no sub nav, no Container. One 40 px bar:
  campus, year, working-group filter, "Notating as", Meeting mode badge, exit.
- **Presentation type scale.** A CSS variable, `--present-scale`, defaulting
  to 1.25, applied at the shell root. Body becomes 18 px, meta becomes 14 px,
  nothing renders under 13 px. Badges drop the `2xs` size. Identifiers, sync
  timestamps and monospace unique ids are hidden.
- **Fixed-viewport layout.** `100vh`, no page scroll. Each column scrolls
  internally. The shared frame stays stable while you move between plans.

## 3. Layout

Three columns. Ratio roughly 1 : 2.4 : 1.6 on a 1568 px frame.

```
+--------------------------------------------------------------------------------------+
| SFSU · 2025-2026 · [All WGs v]                    Notating as Daniel   MEETING   Exit |
+------------------+-----------------------------------------+-------------------------+
| AGENDA      3/14 | Assemble ATI Committee and Support      | MEETING NOTES           |
| [Attention v]    | Groups                                  | Web WG · Sep 12 minutes |
|                  | IN PROGRESS · WEB · CAMPUS PLAN         |                         |
| > Assemble ATI   |                                         | 10:04 Daniel            |
|   Committee ...  | The SFBRN ATI needs to find members     | Frank confirmed two of  |
|   2 open · 2 due |   across all 3 campuses and establish   | the three campus leads. |
|                  |   a communication cadence ...           | Sonoma still open.      |
|   Prepare Pope-  |                                         |   [Make task]           |
|   tech for new   | PROGRESS            [====------] 3 / 5  |                         |
|   SFSU Website   |                                         | 10:07 Daniel            |
|   0 open · no    | [ ] Recruit CSUEB lead     Frank  Sep 5 | Decision: cadence is    |
|   next step      |     OVERDUE                             | monthly, first Thursday |
|                  | [ ] Recruit Sonoma lead    --     Sep 5 |                         |
|   Verify new     |     OVERDUE · UNOWNED                   |                         |
|   accessibility  | [ ] Draft charter          Daniel Oct 1 |                         |
|   statement ...  |                                         |                         |
|                  | + Add next step                         |                         |
| INSTRUCTIONAL    |                                         |                         |
| MATERIALS      4 | 2 completed  [show]                     |                         |
|   ...            |                                         | +-----------------------+
|                  | INDICATORS FURTHERED                    | | Type a note...        |
|                  | 1.21-web  Established   9.3-web Defined | |          [Save] [Task]|
+------------------+-----------------------------------------+-+-----------------------+
```

### 3.1 Agenda rail (left)

The existing plan list, restyled as the meeting's agenda. Same data (the
`/plans/board` read), same sort options with "Needs attention" as the
default, same working-group grouping. Differences:

- Position counter in the header (3 / 14) so the room knows how far along
  the meeting is.
- Rows are bigger and carry only name, status, open count, overdue count and
  the no-next-step flag. No campus badge, no chip cloud.
- `In Progress Only` stays the default and is the only filter shown.
- Collapsible to a 56 px strip of numbered dots when you want the full width
  for one plan.

### 3.2 Plan stage (center)

Read-first. The plan rendered as a page, not a form.

1. **Identity band.** Name at `xl`, then status pill, working group with its
   identity color, Campus Plan and Key Plan badges. No copy-link button. A
   small pencil on the description opens the existing `PlanEditForm` in a
   modal for the rare live correction.
2. **Description** as body text.
3. **Progress**, the load-bearing section. A `done / total` meter, then open
   tasks first, each as a full-width row: checkbox, name, owner, due date,
   OVERDUE and UNOWNED flags spelled out in text, not only color. Completing a
   task here is the same Asana-first write `PlanProgress` already makes.
   Completed tasks collapse to a count with a disclosure. "Add next step" is
   the existing add form with the person picker, so a no-next-step plan gets
   its next step recorded while the owner is in the room.
4. **Indicators furthered.** One line per Year Success Evidence with the
   indicator key and its maturity pill. Read-only here; assignment stays on
   the desk view.

The Associated Year Success Evidence board with assign and unassign controls
does not appear in this mode.

### 3.3 Notes pad (right)

What the room says about the plan, typed while looking at it.

**Storage.** Notes go into the working group's `MeetingMinutes` record for
today, as Markdown appended to `content`. The shell finds or creates it:
lookup via `minutes_panel_for_working_group(campus, year, wg)` filtered to
today's date, else `create_meeting_minutes` with title "Web working group,
2026-09-12" and `recorded_by` the "Notating as" person. One record per
working group per meeting day, which is the existing grain.

**Format appended per entry**, so the record stays readable and diffable:

```markdown
### Assemble ATI Committee and Support Groups
- 10:04 Daniel Fontaine: Frank confirmed two of the three campus leads. Sonoma still open.
- 10:07 Daniel Fontaine: Decision: cadence is monthly, first Thursday.
```

The plan heading is written once per plan per meeting. Entries are appended
under the heading of the plan on stage. Because the body is Markdown the
Campus Plan minutes modal renders it as it does today, and `/ontology-ingest`
finds it as un-ingested source material.

**Actions per entry:**

- **Make task.** Turns the note text into an Asana subtask on the plan on
  stage, with the inline owner and due date pickers from `PlanProgress`. The
  minutes line gets a suffix `(task created)`.
- **Decision** and **Ask** prefixes, two buttons that prepend the word. The
  ontology-ingest rubric already routes "Ask" lines toward Query nodes and
  "Decision" lines toward Notes on the YSE. This keeps the meeting-followup
  hook fed without the presenter learning the ontology.

Nothing else. No rich text, no threading.

### 3.4 Progress strip (top of the stage, optional)

A single line under the bar, not four stat cards: "14 plans in progress · 14
open tasks · 3 overdue · 7 without a next step · 5 tasks completed since
Aug 28". The last figure comes from `AsanaSubtask.completed_at` compared to
the previous minutes record's `meeting_date` for this working group. It is the
one number that says "progress since we last met" and the current UI cannot
show it.

## 4. Interaction

Keyboard is the presenter's instrument; the mouse is for the room.

| Key | Action |
|---|---|
| `j` / `k` or `↓` / `↑` | Next / previous plan in the agenda |
| `n` | Focus "Add next step" |
| `m` | Focus the notes input |
| `Enter` in notes | Save entry (Shift+Enter for a newline) |
| `[` | Collapse or expand the agenda rail |
| `f` | Toggle browser fullscreen via `requestFullscreen`, with a fallback message |
| `Esc` | Exit meeting mode |

Shortcuts are suppressed while focus is in an input. All of them are also
buttons, and the shortcut list is a `?` popover.

Accessibility carries over unchanged: the agenda stays an APG listbox with
roving tabindex, the notes list is an `aria-live="polite"` region so a
screen-reader user in the room hears an entry land, and flags are text plus
color. The 8:1 text floor holds; the larger scale only helps.

## 5. Code shape

```
components/present/
  PresentShell.jsx          route-level shell: bar, --present-scale, 100vh grid
  PresentBar.jsx            campus · year · WG filter · notating-as · exit
  usePresentKeys.js         the shortcut map
  useMeetingMinutes.js      find-or-create today's minutes, append entry
  decks/plans/
    AgendaRail.jsx          PlansList data, presentation styling
    PlanStage.jsx           identity band, description, progress, indicators
    NotesPad.jsx            entries + input + Make task / Decision / Ask
    ProgressStrip.jsx
```

Reuse, not fork:

- `fetchPlansBoard`, `fetchPlanAsanaSubtasks`, `addPlanSubtask`,
  `setPlanSubtaskCompleted`, `setPlanSubtaskAssignee` as they are.
- `PlanEditForm` inside a modal for the pencil.
- `getPlanStatusColorScheme`, `WORKING_GROUP_LIST`, `StatusPill` for the
  indicator line.
- `createMeetingMinutes`, `updateMeetingMinutes`, `fetchMeetingMinutes`.

Routing: in `App.js` `AppContent`, a `useMatch('/:campus/present/*')` short-
circuits the header, `SubNavbar` and `Container` and renders `PresentShell`
instead. `SettingsContext` and `UserContext` still wrap it, so campus, year
and "Notating as" come from the same place.

One backend addition: `minutes_panel_for_working_group` already returns the
working group's minutes with dates, so find-or-create can be done client-side
with no new endpoint. The "completed since last meeting" count needs
`completed_at` on the tasks board rows; it is on the node but not in the
`_TASKS_BOARD_QUERY` return list, a one-line change.

## 6. Design-sense conformance

- Diagnostic first: overdue and no-next-step lead the agenda sort and are
  spelled out on every task row.
- Master-detail preserved as agenda-stage; the notes pad is a third column,
  not a modal.
- Reading is inline; the only modals are the edit pencil and the shortcut
  help.
- Colors stay the sanctioned ones: brand blue chrome, working-group identity
  trio, plan-status palette via `planStatusColors`, maturity pills via the
  ramp helpers. Nothing new.
- Writing style: no puffery in labels. "Add next step", "Make task", "Exit".

## 7. Phasing

1. Shell + agenda + stage, read-only, with the type scale and keyboard map.
   Ships value on its own: the current page, made presentable.
2. Task writes on stage (complete, add next step with owner).
3. Notes pad writing to today's minutes, with Make task.
4. Progress strip with "completed since last meeting".
5. Second deck: Campus Plan indicator table.

## 8. Open decisions for the user

- **Notes grain.** One minutes record per working group per day is proposed.
  If you run cross-working-group meetings, the alternative is one record per
  meeting attached to the Steering working group plan, which exists in the
  graph but not in the code vocabularies.
- **Who can write.** The mode inherits the app's write access. If it is ever
  shown to a campus with read-only access, the pad should degrade to a
  read-only minutes view rather than disappear.
- **Type scale default.** 1.25 is proposed. 1.4 fits a 1280-wide share
  better but pushes the three-column layout to two columns.

## 9. As built

### Data model (two additive edges, no migration)

| Edge | Written by | Read back as |
|---|---|---|
| `(:MeetingMinutes)-[:discusses]->(:Plan)` | `append_minutes_entry` on the first note under a plan's heading | `discussed_plans` on every minutes read; `Plan.discussed_in` accessor |
| `(:AsanaSubtask)-[:raised_in]->(:MeetingMinutes)` (ZeroOrOne) | `link_subtask_to_minutes`, called by the subtask POST when `minutes_unique_id` is sent | `raised_in` on every subtask row |

`completed_at` was already stored on `AsanaSubtask`; the tasks board now returns it.

### Backend

- `queries/meeting_minutes/create.py` `open_meeting_minutes_for_day(campus, year, wg, meeting_date=None, recorded_by=None)`
  returns `(minutes, created)`. One record per working group per day; an existing record is returned unchanged.
- `queries/meeting_minutes/update.py` `append_minutes_entry(unique_id, text, plan_unique_id, author_unique_id, kind, clock)`
  appends `- HH:MM Author: [Decision: |Ask: ]text` under `### <plan name>`; the heading is repeated only when the
  previous heading was a different plan. Returns the record plus `appended_line`.
- `queries/asana/update.py` `link_subtask_to_minutes(plan_uid, asana_gid, minutes_unique_id)`.
- Endpoints: `POST /meeting-minutes {action: open_meeting_minutes_for_day}` (201 created, 200 opened),
  `PUT /meeting-minutes {action: append_entry}`, `POST /asana/subtasks/<plan> {..., minutes_unique_id}`.
- Tests: `tests/test_meeting_mode.py` (8), plus a `completed_at` assertion in `tests/test_plans_board.py`.

### Frontend (`components/present/`)

`PresentShell.jsx` (route shell, selection in the URL, keyboard map, minutes session), `PresentBar.jsx`,
`presentScale.js` (`--present-scale`, `ps()`, steps 1 / 1.25 / 1.4 remembered in localStorage),
`usePresentKeys.js`, `useMeetingMinutes.js`, and the Plans deck under `decks/plans/`: `AgendaRail`,
`PlanStage`, `NotesPad`, `ProgressStrip`. `App.js` short-circuits the header and container on
`useMatch('/:campus/present/*')`. `PlansList.attentionRank` is exported so the agenda sorts like the desk list.
Tests: `presentScale.test.js`, `AgendaRail.test.jsx`, `NotesPad.test.jsx`.

### Decisions taken while building

- Escape inside an input does nothing (it may be clearing a field); Escape elsewhere exits.
- The stage shows the plan's Year Success Evidence read-only, one chip per campus, with the maturity pill.
- Nothing is written until the first note or task is saved, so opening meeting mode and leaving writes nothing.

### Tweaks 2026-09-14

- Task rows on the stage open into a details and edit panel (`TaskRow.jsx`): name, description,
  owner, due date, status, resolution note; Asana-first writes, changed fields only.
- The right column is split: notes on top, `IndicatorsPanel.jsx` below with one section per
  campus; chips navigate through `navigateToIndicator` (the desk YSE board's route).
- The agenda spans campuses. `hooks/useResources.js` reads one board and one task list per
  campus through the shared cache; `planDeck.js` merges the same plan from several boards
  (by unique_id, remembering its `campuses`) and builds the deck. Campus toggles in the agenda
  header (all on by default, remembered in localStorage, never below one) filter the deck; rows
  show campus tags when more than one campus is on. Notes and new tasks still write against the
  URL campus.

### New plan on stage, 2026-09-15

A plan proposed in the room had to wait for the desk: meeting mode could edit a
plan and add its tasks but not create one, and the desk's Add Plan modal builds
its indicator list by walking the three-working-group dashboard payload, which
meeting mode does not load.

`decks/plans/NewPlanForm.jsx` is the form, opened by `a` or the agenda's
"New plan" button. It takes the plan (name, description, status, the two flags),
the coordinates a meeting knows (campus, working group, the indicator the plan
furthers, from the year's `/evidence/yses-by-campus` catalogue on the shared
`yse:by-campus:<year>` key), the first next step with an owner and due date, and
whether to record the decision in the minutes (on by default). Status defaults
to In Progress because only plans in progress are on deck; Not Started is
offered with a note that the plan will not appear until it is started.

Write order: open today's minutes for the group; `POST /plans` with
`minutes_unique_id`; the first step as a subtask on the new plan (`raised_in`
the same minutes); a `Decision: New plan: <name>` line under the plan's heading,
which asserts `discusses` the way any note does. The create failing keeps the
form open with the error. The later writes failing after the create succeeded
are reported in the toast, and the plan still goes on stage.

The shell holds the created plan as a pending selection while the boards
reload, switches its campus on and widens a narrower working-group filter, then
opens it. If the board comes back without it (created Not Started), the pending
selection is dropped and the first-plan fallback applies.

Data model, one additive edge: `(:Plan)-[:raised_in]->(:MeetingMinutes)`
(ZeroOrOne), set by `add_plan` when sent `minutes_unique_id`; the minutes read
returns it as `raised_plans`, beside `discussed_plans`. Same predicate as
`AsanaSubtask.raised_in`, so "what came out of that meeting" is one pattern over
both labels. `add_plan` now returns the created plan (a dict, still truthy for
the one caller that tested the old bool) and `POST /plans` returns it under
`data.plan`, which is what lets the form put it on stage without a second read.
A wrong minutes id is resolved before anything is written, so it fails with
nothing created.

Tests: `tests/test_meeting_mode.py` (four more: the edge and the read, no edge
without minutes, nothing created on a bad minutes id, the endpoint contract),
`NewPlanForm.test.jsx` (the indicator list follows campus and group, the write
order, the first step, the unchecked minutes box, Not Started, a failed create,
the required fields).
