# Foundations — Color

Every value below is mirrored from code. **Source of truth:** `theme.js`
(brand scales), `styles/palette.js` (plan-status semantics),
`services/utils/statusColors.js` (maturity ramp), `styles/App.css` (chrome).
See `index.html` for live swatches.

The governing instinct (`design-sense.md` §1.7): **calm, single-accent
palette.** Chrome stays desaturated; **saturated color is reserved for
*meaning* (status/severity) or *identity* (working group)**, never decoration.

---

## 1. Brand scales (chrome / accent)

Published in `theme.js`. The SFBRN logo blue is published **under Chakra's
`teal` key** so every existing `teal.*` / `colorScheme="teal"` resolves to brand
blue with no per-component edits. **In this codebase, `teal.*` *means* "brand
accent."** (Residual debt: the alias reads oddly for a blue — a future
mechanical rename to `brand.*` would finish it.)

### `teal` — SFBRN brand blue (primary accent)

| Token | Hex | Sanctioned use |
|---|---|---|
| `teal.50`  | `#F4F6FB` | Selection highlight bg, active nav bg |
| `teal.100` | `#E4E9F4` | |
| `teal.200` | `#C9D3E8` | Quiet card edge (legacy `.plan-card`) |
| `teal.300` | `#A7B7D7` | |
| `teal.400` | `#7E93BF` | Brand-rule gradient stop (on navy) |
| `teal.500` | `#4966A4` | Primary buttons, active solid, selection border/focus ring, **Web working group** |
| `teal.600` | `#40598F` | |
| `teal.700` | `#354A7A` | Section/card headings, accents |
| `teal.800` | `#2A3A62` | Header / top-nav surface (flat, no gradient) |
| `teal.900` | `#202C4A` | Brand navy (`App-header`) |

### `purple` — SFBRN accent purple

Overrides Chakra's `purple` so `colorScheme="purple"` harmonizes with the logo.

| Token | Hex | Sanctioned use |
|---|---|---|
| `purple.50` | `#F6F4FA` | |
| `purple.100` | `#E9E5F3` | |
| `purple.200` | `#D3CCE6` | |
| `purple.300` | `#B6AAD4` | |
| `purple.400` | `#8F7DB9` | Brand-rule gradient stop |
| `purple.500` | `#635098` | **Instructional Materials working group**, categorical badges |
| `purple.600` | `#574686` | |
| `purple.700` | `#483A70` | |
| `purple.800` | `#3A2F5A` | |
| `purple.900` | `#2B2343` | |

### `coral` — SFBRN accent coral (**identity only**)

| Token | Hex | Sanctioned use |
|---|---|---|
| `coral.50` | `#FCF1F0` | |
| `coral.100` | `#F9DEDC` | |
| `coral.200` | `#F2BDB9` | |
| `coral.300` | `#EA9A94` | |
| `coral.400` | `#E27970` | Brand-rule gradient stop |
| `coral.500` | `#DB5850` | **Procurement working group**, categorical badges |
| `coral.600` | `#C24A43` | |
| `coral.700` | `#A03C36` | |
| `coral.800` | `#7E2F2A` | |
| `coral.900` | `#5C221F` | |

> ⚠ **Coral is identity-only.** It sits next to the danger reds (`#E53E3E`), so
> it must **never** signal status/severity. If a coral element could read as an
> error, use purple instead.

### `brand.*` — raw logo palette (addressable directly)

| Token | Hex |
|---|---|
| `brand.blue` | `#4966A4` |
| `brand.purple` | `#635098` |
| `brand.coral` | `#DB5850` |
| `brand.charcoal` | `#231F20` |

### The brand rule (the *only* sanctioned gradient)

A thin `linear(to-r, teal, purple, coral)` line marks **brand moments**, not
arbitrary dividers:
- **2px** under the header logo / login brand band — use the `.400` stops on navy.
- **3px × 72px** under About-page titles — use the `.500` stops on light.

---

## 2. Working-group identity

The accent trio's main job (`design-sense.md` §2). Rendered as a 7px dot
(SubNavbar) and dot + 2px underline (`GoalNavigator`).

| Working group | Abbrev | Token | Hex |
|---|---|---|---|
| Web | `web` | `teal.500` | `#4966A4` |
| Instructional Materials | `ins` | `purple.500` | `#635098` |
| Procurement | `pro` | `coral.500` | `#DB5850` |

> Lives in two configs that must stay in sync: SubNavbar items + `WORKING_GROUPS`
> in `GoalNavigator.js`.

---

## 3. Neutrals (structure)

| Use | Token | Hex |
|---|---|---|
| Page background | `App.css .App` | `#eceef2` (calm cool neutral) |
| Header-container chrome | `App.css` | `#e0e7ec` (≈ gray.75) |
| Card / surface background | `white` | `#FFFFFF` |
| Borders, dividers | `gray.200` | `#E2E8F0` |
| Primary text | `gray.800` | |
| Secondary text | `gray.600` | |
| Tertiary / mono identifiers | `gray.400` | |
| Muted / empty-state text | `gray.500` (often `italic`) | `#718096` |

(Gray values without an explicit hex are Chakra defaults — not overridden in
`theme.js`.)

---

## 4. Semantic — meaning only

**Do not hardcode these hexes.** Two centralized palettes:

### 4a. Plan status — `styles/palette.js`

Three values each: `solid` (dots/bars/bold text), `bg` (filled-pill background),
`fg` (text on `bg`). Access via `getPlanStatusColor()` /
`getPlanStatusColorScheme()` in `styles/planStatusColors.js` — never re-derive.

| Status | `solid` | `bg` | `fg` |
|---|---|---|---|
| Not Started | `#6B7280` | `#F3F4F6` | `#4B5563` |
| In Progress | `#3182CE` | `#EBF8FF` | `#2B6CB0` |
| Completed | `#38A169` | `#F0FFF4` | `#276749` |
| On Hold | `#DD6B20` | `#FFFAF0` | `#9C4221` |
| Abandoned | `#E53E3E` | `#FFF5F5` | `#9B2C2C` |

### 4b. Maturity ramp (the CMM ladder) — `services/utils/statusColors.js`

A strict **red → green heat ramp** across the six `status_levels`. Access via
`getStatusColor(name)` (hex) + `getStatusBackgroundColor(name)` (tint). **Never
reach for `teal.*` here** — `teal` is brand chrome; the ramp must read as
maturity.

| Level | `getStatusColor` | bg tint |
|---|---|---|
| Not Started | `#E53E3E` (red.500) | `red.50` |
| Initiated | `#ED8936` (orange.500) | `orange.50` |
| Defined | `#ECC94B` (yellow.500) | `yellow.50` |
| Established | `#41b441` (green.400) | `green.50` |
| Managed | `#246f24` (green.600) | `green.100` |
| Optimizing | `#157744` (green.700) | `green.200` |
| _(none / no evidence)_ | `#718096` (gray.500) | `gray.50` |

> ✔ Brand and status are disjoint (resolved 2026-06): the former `teal` entry
> for "Optimizing"/level 5 was moved into the green family. The numeric
> `getStatusColor(0..5)` colorScheme map lives in
> `indicators/indicatorHelpers.js`.

---

## 5. Known color debts

- **Two focus-ring colors coexist.** Component focus (`design-sense.md` §6) is
  `_focusVisible` → `2px solid teal.500`. But the **global** `button:focus,
  a:focus` rule in `App.css` is `2px solid #E9D597` (a gold). Pick one when you
  touch focus styling; prefer the `teal.500` ring for consistency with the
  component contract.
- **Coral ≈ danger red** by design proximity — see the §1 warning.
- **`teal` is a blue** — the alias is intentional but reads oddly; a future
  rename to `brand.*` is tracked in `design-sense.md` §8.
