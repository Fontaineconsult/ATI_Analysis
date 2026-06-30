# ATI Analysis — Design System

The root-level home for the app's visual + interaction language. This folder
**formalizes the foundations** (color, type, spacing), **specs the components**,
and **hosts visual mockups** for design iterations.

```
design-system/
  README.md            ← you are here
  index.html           ← open in a browser: live swatches of every token
  foundations/
    color.md           ← brand scales, semantic status, maturity ramp, neutrals
    typography.md      ← fonts, the fontSizes scale, heading patterns
    spacing-shape.md   ← spacing rhythm, radii, shadows, borders, containers
  components/
    cards-sections.md  ← the Card / Section primitives
    badges-forms.md    ← badges, forms, buttons, states
  mockups/             ← standalone HTML design iterations (login next)
```

## How this relates to everything else

There are three layers of "design truth" in this repo. Know which one you are
touching:

| Layer | Where | Role |
|---|---|---|
| **The values, in code** | `app/frontend/src/src/theme.js`, `styles/palette.js`, `services/utils/statusColors.js`, `styles/App.css` | The **single source of truth the app actually consumes.** Chakra reads `theme.js` at runtime. |
| **The contract (how it behaves)** | `claude_files/design-sense.md` | The prose interaction language — layout shells, master-detail, states, a11y, "build a new area" recipe. Still canonical for *behavior*. |
| **This folder** | `design-system/` | **Documents and mirrors** the values, **specs** the components, and **hosts mockups**. A designer-facing reference + sandbox. |

### Deliberate decision: docs/mockup-forward, *not* a build dependency

This folder **documents** the tokens; it does **not** feed the build (yet).
`theme.js` remains the source the app imports. We chose this on purpose so the
folder can be a fast design sandbox without coupling to the React build. The
trade-off: **drift is possible.** When a token changes in `theme.js` /
`palette.js` / `statusColors.js`, update the matching `foundations/*.md` and the
swatches in `index.html` in the same change.

> Aspiration (tracked, not done): lift the token values into a single module here
> that `theme.js` imports *from*, collapsing the top two rows into one. Until
> then, **code wins on conflict** — if a doc disagrees with `theme.js`, the doc
> is stale; fix the doc.

## How to use it

- **Designing / picking a color?** Open `index.html` in a browser for live
  swatches with hex + token name, then read `foundations/color.md` for the
  sanctioned *use* of each.
- **Building a component?** `components/*.md` here, then `design-sense.md` §3–§6
  for the layout shell, states, and accessibility conventions.
- **Iterating on a screen's look?** Drop a standalone `*.html` in `mockups/` and
  link it from `index.html`. First up: the login redesign (`/design-login`).

## Contributing

1. **Code is the source of truth for values.** Change `theme.js` first; reflect
   it here second, same PR.
2. **One concept per doc.** Color, type, and spacing stay in their own
   `foundations/` files; component specs stay in `components/`.
3. **Cite the source file** when you state a token (e.g. "`teal.500` =
   `#4966A4`, `theme.js`") so the next person can verify against code.
4. **No new hex in components.** If you need a value that isn't here, add it to
   the appropriate token layer *in code* and document it here — never inline.
