# Components — Badges, Forms, Buttons & States

**Source of truth:** `design-sense.md` §4–§5 + reference implementations
(`AssetBadges.js`, `GovernanceForm.js`, `AssetForm.js`). Colors come from the
token layer (`foundations/color.md`) — **never inline hex**.

---

## Badges

`colorScheme`-driven, centralized per domain in a config + a tiny badge
component (e.g. `AssetBadges.js` → `ScopeBadge`/`ClassBadge`/`ElevationBadge`;
`governanceTypes.js` color map).

| Prop | Value |
|---|---|
| `fontSize` | `2xs` / `xs` |
| `textTransform` | `uppercase` (type pills) |
| `variant` | `subtle` / `outline` / `solid` |
| `borderRadius` | `full` (status pills) · `md` (type/category) |

- **Categorical** badges may use `colorScheme="purple"` / `"coral"` per the
  domain config.
- **Status** badges use the centralized helpers, never the brand accents:
  plan status → `getPlanStatusColorScheme()`; maturity → the ramp helpers
  (`foundations/color.md` §4).
- **Count chips turn red when zero** — the diagnostic tell
  (`design-sense.md` §1.1). An indicator with no responsible person, an empty
  required relationship, etc.

---

## Forms (create / edit)

Modal-based (`GovernanceForm.js`, `AssetForm.js`, `TaapForm.js`):

| Element | Recipe |
|---|---|
| Modal | `Modal size="lg"` |
| Field | `FormControl` + `FormLabel` (`fontSize="sm"` `color="gray.700"` `fontWeight="semibold"`) |
| Inputs | `Input` / `Select` / `Textarea` `size="sm"` |
| Multi-select | `CheckboxGroup` + `Wrap` / `WrapItem` / `Checkbox` |
| Footer | ghost **Cancel** + teal **Create/Save** (`isLoading` + `loadingText`) |

Field labels/help can be sourced from the descriptor layer via
`useDescriptors().describeField(label, field)` with a humanized fallback.

This is the same field recipe the existing `Login.js` uses (`FormControl`,
`FormLabel` `fontSize="sm" color="gray.700" fontWeight="semibold"`, `Input
size="sm"`) — keep the login redesign on these tokens.

---

## Buttons & actions

| Role | Recipe |
|---|---|
| Primary | `colorScheme="teal"` `variant="solid"` `size="sm"`/`xs` |
| Secondary | `variant="outline"` |
| Tertiary / cancel | `variant="ghost"` |
| "Add X" | `leftIcon={<AddIcon />}` |
| Destructive | `colorScheme="red"` `variant="ghost"`, guarded by `window.confirm` / alert dialog |
| Per-row icon action | `IconButton` (`ViewIcon`/`EditIcon`/`DeleteIcon`), `variant="outline"` |

---

## States (wire every one — `design-sense.md` §5)

| State | Treatment |
|---|---|
| Nothing selected | Dashed `gray.300` border, `bg="gray.50"`, centered muted prompt: "Select … to view." |
| Empty list | Italic `gray.500` text in a plain card: "No … yet." |
| Missing / critical | `bg="red.50"` `borderColor="red.200"` box, `red.700` text ("No evidence …"). |
| Loading (area) | Centered `Spinner size="xl"` + text. |
| Loading (inline) | `HStack` `Spinner size="sm" color="teal.500"` + "Loading …". |
| Background update | Non-blocking small spinner ("Updating … in the background"). |
| Error | `Alert status="error"` (`borderRadius="md"`, `fontSize="sm"`) + `AlertIcon`. |
| Success / failure ops | `useToast` (success 2s; error 3–3.5s with `description`). |

---

## Accessibility

- Selectable lists are an ARIA `listbox`: `role="listbox"` + rows `role="option"`
  `aria-selected`, roving tabindex, arrow-key nav, Enter/Space to select.
- Visible focus: `_focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}`.
  (Note the competing global gold focus in `App.css` — see `foundations/color.md`
  §5.)
- Color is never the only signal — pair status color with a text label/badge.

---

## Reuse, don't rebuild (entity linking)

- `functional_components/PersonAssignmentSelector.jsx` — assign/unassign people.
- `functional_components/EntityAttachmentSelector.jsx` — generic `{unique_id,
  label}` many-to-many with optional "+ New".
