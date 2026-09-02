# CSUEB Web Scan → Implementation Alignment — Findings for Review

**Date:** 2026-08-13 · **Status: PROPOSAL — no DB writes, no commits until reviewed**

## What was compared

**Web side** — crawl of the (redesigned) public ATI section:
`/ati/index.html`, `/ati/web-accessibility.html`, `/ati/instructional-materials/{index,faculty-staff,students}.html`, `/ati/captioning/index.html`, `/ati/faq/index.html`, `/ict/index.html`

**Graph side** — 38 implementation nodes evidencing YSEs at `csueb`, pulled with the **new `implementations_for_campus` registry query** (MCP update #1, uncommitted — becomes a server tool automatically on next MCP start).

**Headline:** the graph is *richer* than the site — the deep operational processes (UDOIT Orchestrator, Verbit automation, Textbook platform, Equalify Reflow, LTI gate, TAAP/CSUBuy procedures) have no public page and need no change. The deltas run the other way: the site's new `/ati/` section postdates most graph webpage links, so the main work is **7 updates, 1–3 creates, and 4 data-quality fixes**.

---

## A. Update candidates (7)

| # | Node (type) | `unique_id` | Proposed change |
|---|---|---|---|
| U1 | **General Web Accessibility Guidance** (Guidance) | `b84b0f46…` | Only webpage is the legacy Cascade-training page. Attach **`/ati/web-accessibility.html`** (quick-start checklist, four-principles evaluation, testing methods; 8 topic subpages hang off it). Refresh description accordingly. Keep Cascade link unless dead. *Optional:* also evidence `2.10-web` (pre-publication review request process) — the page describes pre-publication quality checks. |
| U2 | **ATI Overview** (Guidance) | `77c3cc2b…` | Aligned (description ≈ site's About text). Append the published **vision** ("Create a culture of access for an inclusive learning and working environment"), mission, and **2025–26 priorities** (document/course remediation, high-traffic page barriers, ICT review). Attach **`/ati/faq/index.html`** as a second supporting webpage rather than creating a thin FAQ node. |
| U3 | **Report of On-Campus Inaccessibility (barrier report form)** (Service) | `d46bab54…` | Site now routes barrier reports via the new ServiceNow ESC portal **`https://sfbrn.service-now.com/esc`**; graph holds only the old catalog-item deep link. Add the ESC URL; verify whether the old deep link still resolves and mark `depreciated` if not. |
| U4 | **CSU Eastbay Public Accessibility Statement** (Guidance) | `5184d8ab…` | Node has no webpage, and U3's own description calls the formal WCAG 2.1 AA statement "the planned companion piece" — **it now exists**: the ATI pages publish an "Accessibility of this site" section (WCAG 2.1 Level AA aim + barrier reporting). Attach `/ati/index.html`, update description from "planned" to "published". |
| U5 | **Accessibility Compliance for Digital Teaching & Learning** (Guidance) | `71f8b7e0…` | 16 indicators, zero webpages. The faculty-staff IM page names the workshop series and the Title II / April 24 2026 timeline. Attach **`/ati/instructional-materials/faculty-staff.html`**. |
| U6 | **Instructional Materials - ATI** (Guidance) | `4d43f6f7…` | Webpage (IM index) correct. Attach the two new subpages **`faculty-staff.html`** and **`students.html`** (per-audience responsibilities, "equally effective" definition, per-term faculty duties). Also: the stored description ends mid-sentence ("…in alignment with:") — complete it from the live page. |
| U7 | **SFBRN CSUBuy IT Accessibility Review Procedure** (Procedure) | `f8e96ec8…` | No webpages. The public **`/ict/index.html`** describes the CSUBuy P2P intake, the five review categories (Electronic Content/Hardware/Software/Web/IT Services), and VPAT+ISO review — the public face of this procedure. Attach it. |

## B. Create candidates

| # | Proposed node | Rationale | Evidence links |
|---|---|---|---|
| C1 | **Guidance: "Media Captioning & Prioritization Guidance"** — webpage `/ati/captioning/index.html` | Substantive new page with no graph counterpart: WCAG 2.1 AA caption requirement, high/low prioritization framework (accommodation-driven, repeated-use, public-facing = high), auto-caption correction rule, request routing (courses → Accessibility Services / Online Campus; events → University Communications; purchased media → ICT + ATI). Existing nodes don't cover it — Verbit automation is backend, Accessible Remediation is accommodations. | **`2.6-web`** (video/audio process before publish — strong), **`1.12-web`** (manual multimedia evaluations — plausible). Years 2025-2026 + 2026-2027, i.e. YSEs `2025-2026-2.6-web-csueb` etc. — resolve at write time. |
| C2 | **Service: "Assistive Technology Office (ATO)"** *(optional — recommend deferring)* | Named on index + students pages (assessments, training, device loans). But no success indicator mentions assistive technology; it's an accommodations service more than an ATI implementation. Create only if you want the public-facing service inventory complete. | Weak — nearest are alt-media indicators already covered by Accessibility Services nodes. |
| C3 | **Campus committees (DACC + Web & Communication Access Subcommittee)** *(flag only — your call on modeling)* | Index page names both coordinating committees. Committees straddle governance vs implementation; internal ATIWorkingGroup nodes are a different concept (and "Steering" is data-only per prior session). If wanted: Guidance/Service node evidencing **`7.6-web`** (web subcommittee informs the plan) and/or **`3.1-gov`**. | `7.6-web`, `3.1-gov` — candidates. |

## C. Data-quality findings (from the pull, independent of the scan)

| # | Finding | Proposal |
|---|---|---|
| D1 | **Duplicate InternalPolicy pair:** "CSUEB P-card Policy" (`866d491e…`, evidences `1.7-pro`, no webpage, empty description) vs "CSUEB Pcard Policy" (`86aa1e4e…`, evidences `5.5-pro`, PolicyStat URL). | Merge: keep the PolicyStat one, move the `1.7-pro` evidence link onto it, delete/retire the other. (The Process "Pcard Purchase Process" is a distinct node and fine.) |
| D2 | Title typo: "Informal Accessible Course Content **Guidlines**" (`fd50218a…`). | Rename → "…Guidelines". |
| D3 | Two nodes carry dashed `unique_id`s (Verbit `9329b070-…`, LTI gate `7f88a439-…`) — raw-Cypher seeds that skipped the `replace(randomUUID(),'-','')` convention. | Harmless; note only. Fix only if something keys on the 32-hex format. |
| D4 | "Tutorials for creating accessible content." (`c3a7d686…`) — empty description, trailing-period title, same webpage as U6, overlaps ScreenSteps + ICT Training nodes. | Either enrich (description + distinct purpose) or fold into U1/U6 and retire. Your call. |

## D. Aligned — no change needed (24)

About ICT Purchases - VPAT · ScreenSteps Faculty Guides · Back to the Bay Workshops · ICT Training Materials · the five CIC/FAC internal policies · Timely Adoption policy · SFBRN TAAP Authoring · Equal Access Plan EAP · Alt Media Automation · Verbit Captioning Activation · Textbook Adoption Monitoring Platform · Textbook Adoption Internal Tracking · Equalify Reflow Pipeline · LTI Review & Approval Gate · Pcard Purchase Process · UDOIT Scanning & Bulk Remediation · VPAT Process (already retired — consistent with CSUBuy takeover) · ATI Coordinator Role (site contact Zach Oshri / 510-885-3884 matches) · Accessible Course Materials Remediation Form · Accessible Remediation (AS) · CO Access to eResources · PopeTech Scanning · IM Remediation Dashboard · Chancellor's Office listing.

---

## E. Write phase — what happens after you approve

1. **MCP update #2 (code):** new `features/implementations_write.py` (write-gated, `ATI_MCP_ALLOW_WRITE`), wrapping the sanctioned queries layer — all functions already exist except one:
   - `create_implementation` → `queries/implementation/create.py:add_guidance/add_service/…`
   - `link_implementation_to_yse` → `queries/evidence/update.py:assign_implementation_to_year_success_indicator`
   - `attach_webpage_to_implementation` → `queries/documentation/create.py:add_webpage` + `queries/implementation/update.py:assign_documentation_to_implementation`
   - `retire_implementation` → exists in `queries/implementation/update.py`
   - `update_implementation_fields` (title/description) → **missing; add to `queries/implementation/update.py`** first, then wrap.
2. **Execute the approved A/B/C changes directly against the DB** through those code paths (`.venv314`; `import app.endpoints.data_api` warm-up first).
3. Commits only when you say so. Separately: the hosted MCP needs its `AtiMcp` task cycled on DPRC-SERVER (down since Aug 2, `^C` in `mcp.log`) before the new tools reach campuses.
