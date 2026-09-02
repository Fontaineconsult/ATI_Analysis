# SSU Web Scan → Implementation Alignment — Findings for Review

**Date:** 2026-08-13 · **Status: PROPOSAL — no DB writes until reviewed**

## What was compared

**Web side** — full crawl of `accessibility.sonoma.edu` (sitemap-enumerated, 17 content pages):
ATI overview ×2, web-site-accessibility, minimum-accessibility-requirements, accessibility-basics,
documents-multimedia, instructional-materials (+syllabus-template), faculty-accessibility-guide,
what-can-i-do, captioning guidelines + style guide, it-purchasing ×2, software-procurement,
software-accessibility-resources, training/demo-videos, plus the legacy baseline-timeline tabs.

**Graph side** — 31 implementation nodes evidencing YSEs at `ssu` (via `implementations_for_campus`).

**Headline:** SSU's graph is already better web-linked than CSUEB's was — the procurement page,
syllabus template page, and web accessibility statement are attached to the right nodes. The
operational depth (CTET remediation program, SiteImprove workflows, SFBRN procedures) has no public
pages and needs no change. What's left: **grouped webpage attachments + description fills on 7
existing nodes, only 2 creates (each grouping multiple pages), and 3 data-quality fixes** — the
biggest being a *triplicate* Instructional Materials Adoption policy cluster.

Site-content observation for the ATI team (no graph action): several SSU pages still cite WCAG 2.0
AA and EO 926 (superseded), while the captioning and procurement pages already say WCAG 2.1.

---

## A. Updates to existing nodes — grouped attachments + description fills (7)

| # | Node (type, id) | Attach webpages | Description |
|---|---|---|---|
| A1 | **SSU General Web Accessibility Guidance** (Guidance `df55ea6a…`) | `/web/minimum-accessibility-requirements` (20-checkpoint 508 manual-evaluation standard), `/accessibility-basics-when-developing-digital-content` | Fill empty description: editor obligations (508/EO 926/ATI), Help Desk support route, the checkpoint standard, digital-content basics (modality equivalence, headings, contrast 4.5:1, alt text, avoid PDFs when feasible). |
| A2 | **SSU Accessible Procurement Guidance** (Guidance `1e36c9aa…`) | `/it-purchasing-requirements`, `/it-purchasing-requirements/information-vendors`, `/software-accessibility-resources` (70-vendor accessibility-guide directory) | Fill empty description: CSUBuy P2P intake → IT security+accessibility review → VPAT/ACR vs WCAG 2.1 → risk classification → EEAAP for barriers → signature routing; TPR ≥14 days low-risk; vendor VPAT guide; Section 508 / Gov Code 11135 / EO 926 basis. |
| A3 | **CTET Accessibility Guidance** (Guidance `7f494374…`) | `/faculty-accessibility-guide`, `/documents-multimedia` | Fill empty description: faculty-facing accessibility guidance — CTET training (Canvas), @One courses, OpenStax, document/multimedia how-tos (syllabus, PDF, Word, PPT, captioning), DSS accommodation routing. Also fixes DQ1 (malformed webpage URL, below). |
| A4 | **Accessible Syllabus Policy** (InternalPolicy `d16bd34b…`) | `/instructional-materials` (the page's core is the syllabus accessibility-statement requirement + WCAG 2.1 reference, DSS/CTET contacts) | Keep existing description. |
| A5 | **Accessible Syllabus Template** (Service `74e8d022…`) | — (template page already attached) | Fill empty description: downloadable Word template aligned to Syllabus Policy #2006-2, 2025 revision, direct-input or match-destination-formatting workflow. |
| A6 | **Site Improve Training** (Guidance `99060a9a…`) | `/training/accessibility-demo-videos` (only training node with no webpage; page contains the SiteImprove dashboard/misspellings/broken-links training videos — note it also covers Word/Google/Canvas/mobile topics) | Fill empty description: video training directory incl. SiteImprove dashboard training. |
| A7 | **SSU Web Accessibility Statement** (Guidance `a6fecfb2…`) | — (both pages already attached) | Fill empty description: published commitment to WCAG 2.0 AA + barrier ticket route (sfbrn get-help form). |

## B. Creates — 2 only, each grouping several pages

| # | Proposed node | Groups | Evidence links |
|---|---|---|---|
| C1 | **Guidance: "SSU ATI Program Overview (Committee & Ambassadors)"** | `/accessible-technology-initiative` (CSU framing), `/accessible-technology-initiative-sonoma-state` (ATI Committee: monthly under President's mandate, three priority areas, chair Dr. Sandy Ayala; ATI Ambassador Program: faculty rep per school, monthly, Dr. Justin Lipp; staffing incl. Universal Access support, bookstore coordination, DSS 2000+ pages/semester), `/what-can-i-do` (role-based responsibilities) | **`3.1-gov`** (steering-committee plan process) — strong; optionally `9.1-pro`/`9.2-ins`/`7.5-web` (per-WG committee review processes) — flag, link only if you want them. Years 2025-2026 + 2026-2027 where YSEs exist. |
| C2 | **Guidance: "SSU Captioning Guidelines & Style Guide"** | `/web/captioning-guidelines-and-resources` (WCAG 2.1 AA captions on all SSU time-based media; approved platforms YuJa/YouTube/Google free vs CSUBuy-review list; AutomaticSync vendor at dept expense; DSS contact Stephanie Graham) + `/captioning-and-transcription-style-guide` (style rules, maintained by Accessibility Services Analyst) | **`2.6-web`** + `1.12-web` — mirrors the approved CSUEB captioning node, years where YSEs exist. Distinct from the "In-House Video Caption Correction (CTET)" procedure (that's the internal ops; this is the published guidance). |

**Deliberately NOT created** (grouping/conservatism): no per-page nodes for minimum-requirements,
accessibility-basics, documents-multimedia, demo-videos, what-can-i-do, software-resources, vendor
info (all folded into A1–A6/C1); no node for the **baseline-timeline tabs** (10 pages of 2019-20-era
CSU baseline status tables — historical reporting, not a live implementation); no committee node for
**APARC** (already in graph, see DQ4); nothing for SiteImprove-the-tool (Tool/Asset domain, and
"SSU Site Improve Reports" + "Site Improve Work Divide" already cover the practice).

## C. Data-quality fixes

| # | Finding | Proposal |
|---|---|---|
| DQ1 | **Malformed Webpage URL** on CTET Accessibility Guidance: one Webpage node's url is two URLs space-concatenated (`…1koJvMvracl2…/edit  https://docs.google.com/forms/…viewform`). | Split: point the node at the Google Doc URL alone; add the Google Form as its own Webpage attached to the same node. |
| DQ2 | **Triplicate IM-adoption policy cluster:** "Course Instructional Materials Adoption" (`42250e09…`, 5.11-ins, policies.sonoma.edu), "Instructional Materials Adoption Policy" (`4f48d85c…`, 7.1-ins, SAME policies.sonoma.edu URL), "Course Instructional Materials Adoption - Sonoma" (`db695b3e…`, 1.1-ins, PolicyStat). One underlying policy, three nodes. | Merge into the PolicyStat one (authoritative source, has the real description), move 5.11-ins + 7.1-ins evidence links onto it, also attach the policies.sonoma.edu URL, delete the two duplicates, retitle keeper "Course Instructional Materials Adoption Policy". Mirrors the approved CSUEB P-card merge. |
| DQ3 | **Dead webpage:** SSU Universal Access Services points at `/universal-access-hub`, which now returns **HTTP 403** (the faculty guide still links to it too). | Mark that Webpage node `no_longer_exists=true` (keep the attachment for history). Worth asking SSU whether the Hub moved — the faculty guide says it offers remediation and 1:1 help. |
| DQ4 | "APARC Committee" is typed **InternalPolicy** but describes a senate committee, not a policy. | Flag only — no action without your direction (retyping means a new node; evidence links would need moving). |

## D. Aligned — no change (the rest)

CSUBuy/TAAP SFBRN procedures (shared nodes) · Canvas Course Remediation, PDF Remediation, In-House
Caption Correction, Student Remediation Team, Canvas Remediation Manual (CTET ops — no public pages,
correctly so) · Site Improve Work Divide · SSU Site Improve Reports · Accessible Canvas Template ·
Accessible Content Remediation (DSS) · SSU Alternative Services · Equatio · CTET QLT Certification ·
QLT Accessibility Checklist · SFBRN Pope Tech Training · APARC/Course Modality/Faculty
Disability/SSU Procurement policies (site doesn't contradict them).

## E. Write phase (after approval)

Same machinery as CSUEB: clone `apply_csueb_web_alignment.py` → `apply_ssu_web_alignment.py`
(webpage attachments via `add_webpage`, description fills via `update_implementation_fields`,
creates via `add_guidance` + `link_implementation_to_yse` with YSE-existence guards, DQ2 merge via
the D1 pattern). DQ1/DQ3 need two small Webpage-node touch-ups (url fix, no_longer_exists flag) —
done directly on the Webpage nodes in the same script. MCP already has all needed write tools from
the CSUEB round.
