# Mockups

Standalone, browser-openable HTML design iterations. Each mockup is **self-
contained** (inline styles using the documented tokens) so you can open it
directly — no build step, no React. Use them to settle a screen's *look* before
porting it to Chakra.

## Conventions

- One file (or one folder of variants) per screen: `login.html`,
  `login-variants/`, etc.
- Use the **real token values** from `../foundations/` — page bg `#eceef2`, white
  cards, `teal.700` headings, the brand-rule gradient `linear(to-r, #7E93BF,
  #8F7DB9, #E27970)` (the `.400` stops) on navy.
- Link each new mockup from `../index.html` so the gallery stays current.
- A mockup is a **design artifact, not shipping code** — once approved, port to
  the real component and delete or archive the mockup.

## Planned / in progress

- [x] **`campus-plan.html`** — navigation study for the campus-plan area: a
      tabbed working-group shell vs. a one-page-with-rail layout, both applying
      working-group identity color. Companion write-up:
      `../explorations/campus-plan.md`.
- [ ] **`login.html`** — redesign of `components/Login.js` (`/design-login`).
      _Held: foundations first._

The current production login (`app/frontend/src/src/components/Login.js`) already
uses the canon: a `teal.800` brand band, the SFBRN light logo, the 2px brand-rule
gradient, an uppercase eyebrow, and a 400px white card. The redesign should start
from that and stay on the tokens in `../foundations/`.
