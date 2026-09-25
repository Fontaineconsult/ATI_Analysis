# Outline: SFBRN ATI VPAT Review Process

Drafted 2026-09-16 for the plan `SFBRN: Draft the official VPAT Review Procedure`, which
Daniel Fontaine committed at the Procurement Working Group on the same day to bring as a
draft to the next meeting.

This is an outline, not the document. It says what the document must contain, where each
part comes from, and what has to be obtained before any of it can be written.

## What this document is not

**It is not the TAAP procedure.** The working group split those apart deliberately. A TAAP
carries its own signature workflow and its own hunt for the responsible department contact,
and Sara Marquez pointed out that a TAAP is sometimes required when there is no VPAT to
review at all. Merging them would bury one inside the other. The TAAP Procedural Document
is a separate plan, sequenced after this one.

**It does not replace the CSUBuy procedure.** `SFBRN CSUBuy IT Accessibility Review
Procedure` describes how a reviewer moves a requisition through P2P. This document explains
how to judge the conformance report that procedure asks for. One is the workflow, the other
is the judgment inside it.

**It is not the manual ACR review process.** That is a separate live plan covering what to
do when a product has no VPAT or an inadequate one. This document defines what "inadequate"
means, which is what that plan needs in order to trigger.

## The gap this document closes

Jonathan Hale named it precisely: East Bay's existing documentation lists the reference
materials required and the fields to fill in, and never explains why a TAAP is needed or
when the process applies. A reader who does not already know the process cannot learn it
from what exists. He expects the library to hit exactly that confusion soon.

So the document has to answer "why" and "when" before it answers "how", which is the
reverse of how the current material is written.

## What we hold

### Readable, with captured text

| Source | Type | Characters | What it gives this document |
|---|---|---|---|
| Massachusetts ACR Review Checklist | IntellectualSource | 7,425 | Eight named checks, each a yes/no question with the guidance to perform it. The closest thing to a finished review method anywhere in the corpus. |
| How to Interpret a VPAT (Harvard) | IntellectualSource | 4,385 | The red flags, the two-part structure of a VPAT, and four follow-up questions to put to a vendor. |
| Evaluate Compliance Documentation (Michigan) | IntellectualSource | 2,777 | A two-stage gate: HECVAT for vendor maturity, then VPAT for product conformance. Currency and version tests. |
| Impact-tiered ICT accessibility review | IntellectualSource | 4 pages, all captured | The risk model that decides how deep a review goes. |
| Prioritizing Accessibility in the E-Resources Procurement Lifecycle | IntellectualSource | 35,029 | Scholarly treatment of the conformance report as a lifecycle instrument rather than a purchase gate. |
| SFBRN CSUBuy IT Accessibility Review Procedure | Procedure | 19,476 across 2 docs | The workflow this judgment sits inside, including the existing low/medium/high risk rating and the TAAP trigger. |
| About ICT Purchases - VPAT | Guidance | 35,699 across 2 of 3 docs | Campus-facing explanation of VPATs. The largest single body of text we hold on the subject. |
| Primary ATI Public Resources Regarding Accessible Procurement | Guidance | 9,860 across 2 of 5 docs | The public resource set. |
| SFBRN TAAP Authoring Process | Procedure | 8,407 across 1 of 5 docs | The adjacent procedure, for the boundary section. |
| SSU Accessible Procurement Guidance | Guidance | 7,180 across 4 of 5 docs | A campus's own version, useful as a model for register. |
| SF State Accessible Technology Procurement Process | Process, **retired** | 4,885 | Historical. Says what we used to do. |
| CSUEB Equal Access Plan EAP | Process, **retired** | 3,847 | Historical. The predecessor to the TAAP at East Bay. |
| SSU Procurement Policy | InternalPolicy | 1,139 | Campus policy anchor. |

### Held, but unreadable

Rewritten 2026-09-23, after the capture run recorded in section 6. Eight of the thirteen
governance instruments named here are now readable: the Revised Section 508 Standards in
both their Guideline and Directive forms, WCAG 2.1, WCAG2ICT, WCAG-EM 2.0, the Section 508
ICT Testing Baseline, the Section508.gov procurement guidance, and the VPAT 2.5Rev node.
Section 3 is unblocked.

Five instruments remain at zero characters.

| Instrument | Sources | Bears on |
|---|---|---|
| `California Government Code Section 7405` | 2 | Section 3. This is the link that makes Section 508 bind the CSU |
| `Rehabilitation Act of 1973, Section 508` | 2 | Section 3, as the statute 7405 adopts |
| EN 301 549 (V3.2.1, 2021) | 1 | Section 2, where the VPAT editions are named. It does not bind the CSU |
| WCAG 2.0 | 1 | Section 2 only, as a version the VPAT WCAG edition still reports against |
| WCAG 2.2 | 1 | Same |

The first two are the ones that matter. Section 3 states a chain running from 7405 to
Section 508 to WCAG, and the two statutes at the head of that chain are now the only part of
it still written from titles. Everything they point to is captured.

The VPAT 2.5Rev node is readable but does not hold the VPAT. Its captured source is the ITI
page describing the template, not the template. See section 6.

A duplicate to settle while here: `Section 508 of the Rehabilitation Act of 1973` is a second
Law node for the same statute, with no sources and no text. It is one of the duplicate-node
decisions already blocking the `informs` edges.

Still empty elsewhere: `Public TAAP Guidance`, `Pcard Purchase Process`, and the
purchase-card material. `LTI Accessibility Review and Approval Gate (CSUEB Online Campus)`
carries one document with no text, which is thin for a live review gate. `VPAT/ACR
Guidances` has left this list: three of its five documents were captured on 2026-09-23.

## The outline

### 1. Why this exists and when it applies

Written first because it is the part currently missing everywhere. States which purchases
enter accessibility review at all and which do not, and says plainly that the categorisation
applied at intake is what decides. Names the known failure: a requisition coded as goods and
services does not route through ATI review, which is recorded as an open Concern against
1.5-pro and has no owner.

Sources: the open Concern; the CSUBuy procedure's scope.

### 2. What a VPAT is, and what it is not

A VPAT is a blank template published by the Information Technology Industry Council. A
completed one is an Accessibility Conformance Report. The two words are used
interchangeably and mean different things, which matters when asking a vendor for one.

The load-bearing sentence, from Massachusetts: the existence of an ACR is not a guarantee of
conformance, only a measurement of how well a product meets the standard. Harvard's version
of the same point is that having a VPAT does not mean the accessibility box is checked.

State the current template version. Ours is 2.5Rev, April 2025, recorded on the Governance
node. **Harvard's page says the current version is 2.4 and dates it to February 2020**,
which is five years stale. Do not carry that forward, and note the discrepancy where a
reader might otherwise trust the Harvard page.

Sources: Massachusetts; Harvard; the VPAT 2.5Rev Governance node.

### 3. What the standard requires

WCAG 2.1 levels A and AA is the operative bar for the CSU, and the reason it binds is that
California Government Code 7405 adopts Section 508 for state entities. Section 508 in turn
incorporates WCAG. Say the chain explicitly, because a reader who does not know it treats
WCAG as a guideline we chose rather than a requirement we inherited.

Note where WCAG2ICT applies: most purchased ICT is not a website, and WCAG2ICT is what makes
a WCAG claim meaningful for a desktop application, a document or software with closed
functionality.

**This section cannot be written until the governance text is captured.** See section 6.

### 4. How to evaluate one

The eight checks, taken from the Massachusetts checklist and kept as yes/no questions
because that is what makes them usable by a non-specialist.

1. **Report date.** No more than twelve months old at submission.
2. **Product and version.** Specific to the product and version being bought, not the
   product line. Michigan flags this as the test campuses skip most often.
3. **Report creator.** Completed by someone with accessibility expertise or a reputable
   third-party firm. If internal, ask who wrote it and what their expertise is.
4. **Standard measured.** WCAG 2.1 or 2.2, levels A and AA. A report against WCAG 2.0 or
   against Section 508 alone fails this check.
5. **Evaluation method.** Both automated and manual testing, with assistive technology
   named. Harvard's contrast is the usable one: "tested with a screen reader" says nothing,
   "tested the X workflow using NVDA, keyboard and Siteimprove" says something.
6. **Scope of testing.** Which pages, screens, functions or tasks. A product with both an
   admin and an end-user interface needs a separate report for each.
7. **Conformance level terms.** Supports, Partially Supports, Does Not Support, Not
   Applicable, Not Evaluated. Pass and Fail are not VPAT terms and their presence means the
   report was not written to the template.
8. **Remarks and explanations.** Detail for every Partially Supports and Does Not Support,
   including where the violation is. An empty remarks column is Harvard's flagged red flag.

Add the pattern check that sits above the individual rows: a report marking nearly
everything Supports or Not Applicable indicates an absence of critical thinking rather than
an accessible product. Harvard's framing is worth carrying verbatim in substance, that a
vendor who identifies flaws and plans to fix them scores above one claiming perfection
without evidence.

Sara Marquez's live example belongs here as the worked case. The AI Essentials report
claimed no accessibility issues at all and, in her words, quite literally looked
AI-generated. Tracing the product showed it had never been through accessibility review in
P2P at all.

Sources: Massachusetts, all eight checks; Harvard, the red flags and the pattern test; the
2026-09-16 minutes for the worked example.

### 5. The decision matrix

The existing CSUBuy procedure already rates products low, medium or high risk on user count,
whether use is required for work or coursework, and public-facing exposure, and already
requires a signed TAAP before a high-risk approval. **Start from that rather than inventing
a second scale**, and make this document explain the rating the procedure applies.

Two additions to consider, both from the intellectual sources:

- **A vendor-maturity gate before the product review.** Michigan runs HECVAT first, on the
  vendor, and only reviews the VPAT if the vendor passes. A failing HECVAT means the vendor
  probably cannot deliver or maintain accessible products whatever this one report says. We
  have no equivalent step. Adopting it is a working-group decision, not a drafting one.
- **Review depth tied to reach.** The impact-tiering source has high-impact products getting
  independent testing that validates the vendor's claims rather than accepting them, and
  medium-impact reviewed at a committee's discretion. Our current model decides whether a
  TAAP is needed; it does not decide whether anyone tests.

Then state what each outcome means. Approved, approved with a TAAP, and denied are the three
the current procedure produces. Say what each obliges, and who may issue each.

Sources: the CSUBuy procedure; Michigan; impact-tiered ICT accessibility review.

### 6. What to do when the report is missing or inadequate

Points at the manual ACR review process, which is a separate live plan. This document's job
is to define the trigger: an inadequate report is one that fails the checks in section 4,
and this is where the threshold gets stated. Massachusetts routes a failing report to a
Secretariat Accessibility IT Officer for a confidence judgment; we have no equivalent role,
and naming who plays it here is a working-group decision.

Include Harvard's four follow-up questions for the vendor, which is the step before
escalating: what tools and methods were used, can they supply the test plan and results, is
there a roadmap for the violations found.

### 7. Urgent and time-sensitive requests

**Currently has no path, which is why it is a requirement of this document rather than a
separate concern.** Jonathan Hale's live case is a security software licence running against
a term limit on a grace-period extension. Define what qualifies as urgent, what may be
compressed, what may never be skipped, and who authorises the compression.

### 8. Cross-campus review

Reviewers now hold cross-campus access in P2P and work a shared queue. Two things belong
here. The claim-and-release rules agreed on 2026-09-16, which are recorded as notes on the
CSUBuy procedure. And the open question of whether a product reviewed at one campus needs an
independent review at another, which is an open Query with no answer yet and must be written
as an open question rather than resolved in the draft.

### 9. Where the artifacts live

Where a completed review is filed, where prior reviews are found, and what a reviewer checks
first. The 2026-09-16 minutes record three lookup paths in use, across P2P by supplier,
ServiceNow, and East Bay's legacy CFS and PeopleSoft. They are habits rather than a
documented order, and writing them down is most of the work of this section.

## What must be obtained before drafting

1. **Capture the governance text.** Done 2026-09-23. Fourteen sources were written, and
   fifteen of the eighteen sources on these items now carry Source Text, totalling 1,516,310
   characters. The Revised 508 Standards and 255 Guidelines came in at 401,678 characters,
   WCAG2ICT at 317,786, WCAG 2.1 at 264,354, and the ART requirements statements at 54,451.
   Section 3 can be written against the text instead of against the titles. The Section 508
   ICT Testing Baseline is captured at both its portfolio page and its web baseline, which is
   what section 4's evaluation-method check measures a test against.
2. **Capture `VPAT/ACR Guidances`.** Three of five documents now carry text. The one that
   bears on supersession is the Chancellor's Office `Vendor Accessibility Roadmap`, revision
   2.0 of Spring 2024: it is the format vendors use to commit to remediation timelines when
   medium- or high-impact ICT is acquired with known barriers. The two SFSU pages cover vendor
   requirements and impact determination. The remaining two are listed under Capture gaps.
3. **Read `About ICT Purchases - VPAT`.** 35,699 characters already captured and not yet
   read for this purpose. It is the largest body of VPAT text we hold and probably contains
   material to reuse rather than rewrite.
4. **Confirm the VPAT version.** Done 2026-09-23, from the captured ITI text. The current
   template is VPAT 2.5Rev, and ITI dates all four editions to 24 April 2025. The editions
   are 508, WCAG, EU (EN 301 549) and INT, which matches the Governance node's description.
   The node's `effective_date` of 2025-04-01 is close enough to leave; its `version` property
   is empty and could carry `2.5Rev`.

   One caveat, which bears on the template finding below. The copy in the repo is named
   `VPAT2.5Rev_WCAG_February2025.docx` and carries no internal revision date, only the string
   `Version 2.5Rev`. ITI's current WCAG edition is dated 24 April 2025, so ours may be two
   months stale, and the file cannot answer that question about itself. Download the current
   WCAG edition from ITI before attaching anything.
5. **Gather the old EAP and TAAP-era material.** Daniel Fontaine asked the group for it, and
   the two retired nodes, `SF State Accessible Technology Procurement Process` and `CSUEB
   Equal Access Plan EAP`, both carry captured text and are the obvious starting point.

### Capture gaps from the 2026-09-23 run

| Source | State | What it needs |
|---|---|---|
| Federal Register 2017-04059, the ICT final rule | Bot-blocked. The host redirects to `unblock.federalregister.gov`, which answers 200 and refuses programmatic access | Manual paste. The Access Board text at `access-board.gov/ict/` is captured and carries the same standards |
| `VPAT-ACR Review Quick Guide.docx` | SFSU Box login wall | Manual paste. No file is stored in the graph, so only the link is held |
| `VPAT-ACR Review in Depth Guide.docx` | SFSU Box login wall | Manual paste. Same |

Two findings from the same run are not capture gaps.

- **The VPAT 2.5Rev node does not hold the VPAT.** Its only source is the ITI page that
  describes the template. The repo copy,
  `app/database/ontology/VPAT2.5Rev_WCAG_February2025.docx`, converts cleanly to 20,740
  characters and carries both the Essential Requirements instructions and the blank
  conformance tables down to the individual criteria. It is attached to nothing. Per item 4,
  attach the April 2025 WCAG edition from ITI rather than this file, whose name says
  February.
- **One stored URL has rotted.** The node `Accessibility in Procurement II: Solicitation and
  Post-Solicitation` is stored at `.../buy/accessibility-in-procurement-pre-solicitation-2/`,
  which now serves a redirect stub. The live page is
  `.../buy/accessibility-in-procurement-solicitation-post-2/`. The node's name already
  matches the destination, so the name is right and the URL is wrong.

## Decisions for the working group, not for the drafter

- Do we adopt a vendor-maturity gate such as HECVAT before the product review?
- Does review depth tie to reach, with independent testing for high-impact products?
- Who plays the role Massachusetts gives its Secretariat Accessibility IT Officer, meaning
  who makes the confidence call when a report fails the checks?
- What qualifies a request as urgent, and who authorises a compressed review?
- Does a product reviewed at one campus need independent review at another?

## Provenance

Every intellectual source cited here carries no authority over the CSU. Massachusetts binds
Commonwealth agencies, Harvard and Michigan describe their own campuses, and the impact
tiering model is synthesized from four institutions. They are read material, and this
document borrows method from them rather than obligation. The obligation comes from Section
508 through California Government Code 7405. The Revised 508 Standards are now captured.
The statute behind them is not. `Rehabilitation Act of 1973, Section 508` and `California
Government Code Section 7405` both sit at zero characters, on the node and on every source
page beneath them.
