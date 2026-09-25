# SFBRN ATI VPAT Review Process

**Draft for working group review.**

## Working this document

Open questions are marked **OPEN** in the section they affect, numbered so minutes can cite
them. In a session, take a section, settle its OPEN items, and record the decision in the
minutes. Replace the OPEN block with the decision and the date it was taken. An item that is
not settled keeps its number and carries to the next session.

## Scope

This document tells an ATI Reviewer how to review vendor accessibility documentation for an
ICT purchase, and what to do with the result. It covers Steps 2 and 3 of the CSU Accessible
Procurement Process, which are the steps the ATI Reviewer owns.

**This document replaces the `VPAT/ACR Review Quick Guide` and the `VPAT/ACR Review in Depth
Guide`.** Both are superseded on approval and should then be marked deprecated. Current
material from each is folded in here: the screening checks and critical criteria from the
Quick Guide, and the product-type determination and Section 508 chapter coverage from the In
Depth Guide. Material in those guides written against WCAG 2.0 is not carried forward.

One document it does not replace:

| Document | Use it for |
|---|---|
| `IT Accessibility Review Procedure (P2P)` v1.0 | The click-by-click workflow in P2P, canned language, and TAAP signature routing and filing |

## Roles

The CSU Accessible Procurement Process names four. This document concerns the second.

- **Purchase Requester** identifies requirements, researches the market, requests the ACR
  from the vendor, and completes the IT purchase review form.
- **ATI Reviewer** reviews the documentation, determines impact, decides review tasks,
  approves or denies, obtains the vendor roadmap, and writes the TAAP.
- **Buyer** negotiates accessibility terms into the PO or contract and files the
  documentation with it.
- **Administrative Support Staff** completes and submits the requisition.

## VPAT vs ACR

A VPAT is a blank template published by the Information Technology Industry Council. A
completed VPAT is an Accessibility Conformance Report. Reviewers and vendors use both words
for the completed report; this document uses ACR for the completed report throughout.

The current template is VPAT 2.5Rev, April 2025, issued in four editions: WCAG, Revised 508,
EN 301 549, and INT. The edition determines which standards the report measures.

SF State does not accept reports built on templates earlier than VPAT 2.5, because the
Section 508 standards changed substantially before that version. Reject an older report and
ask for a current one.

An ACR is a vendor self-assessment. It measures conformance; it does not guarantee it.

**OPEN 10 - Which edition.** SF State asks vendors for the 508 Edition. The copy SFBRN holds
is the WCAG Edition. Decide which edition SFBRN requires, or state when each applies.
*Raised 2026-09-23. Unassigned.*

## When review applies

All ICT purchases require accessibility review. ICT includes software, web services, content
platforms, and hardware with a digital interface, on new purchases and on renewals.

The standard is **WCAG 2.1 Level A and AA**. Level AAA is not required and does not belong in
a TAAP or EEAAP. Section 508 reaches the CSU through California Government Code 7405, which
adopts it for state entities; the Revised Section 508 Standards (36 CFR Part 1194) incorporate
WCAG by reference.

Campuses differ on the operative version. SSU holds to 2.1 AA. Confirm the campus standard
before citing a version in a plan.

**OPEN 1 - Requisition categories.** A requisition coded as goods and services does not route
to ATI review, so some ICT purchases are never seen. Decide which categories must route here
and who corrects the coding. Recorded as an open Concern against 1.5-pro with no owner.
*Raised 2026-09-23. Unassigned.*

**OPEN 2 - Campus WCAG version.** Confirm whether SFSU and CSUEB hold 2.1 AA as SSU does, and
decide whether SFBRN states one standard or records three. *Raised 2026-09-23. Unassigned.*

## Review sequence

1. Open the requisition in P2P and read the Items section and the IT Software Request. See
   the P2P procedure for navigation.
2. Establish impact: who uses the product, how many, whether it is required for work or
   coursework, whether it is public-facing, and whether the product is itself an
   accommodation such as a screen reader or captioning tool.
3. Check for an existing plan before writing a new one. Search the CSU-Wide Vendor
   Accessibility & Security Document Repository, the SFBRN TAAP folder in Box, and the
   campus EEAAP store. A similar use case and user count means an existing plan can guide
   the new one.
4. Screen the ACR: the six heading checks, a conformance-term scan, and the critical criteria.
5. Set review depth from impact and from what the screen found.
6. Review to that depth.
7. Decide the outcome, and write the TAAP where one is required.

**OPEN 3 - Vendor-maturity gate.** Decide whether a vendor-maturity assessment runs before
step 4, so that a vendor who cannot build or maintain accessible products is caught before a
reviewer spends time on the ACR. *Raised 2026-09-23. Unassigned.*

## Impact and risk

Risk sets review depth and decides whether a TAAP is required.

**High risk.** More than 25 users, or required for job duties or coursework, or public-facing,
or supporting a critical business function or academic program. High risk normally requires a
TAAP before approval.

**Low risk.** 25 users or fewer, use is optional, the product is an individual accommodation,
or a current ACR shows no significant barriers. Low risk normally needs no TAAP and is
approved with the low-risk canned language in the P2P comments.

**Medium risk.** Between the two. Whether a TAAP is required is a judgment call, taken from
prior decisions and supervisor guidance.

Weigh every factor, not just user count. A product required for instruction or for essential
job functions can be high risk with few users, and a product with many users can be lower risk
where the ACR shows few barriers.

### Impact matrix

Seven dimensions, adapted from the CSU ATI Prioritization Framework. Rate each, then take the
overall impact from the pattern rather than from any single row. A product scoring high on
legal exposure or on denial of access is high impact whatever the other rows say.

| Dimension | High | Medium | Low |
|---|---|---|---|
| Program or service | Critical | Important, not critical | Optional |
| Audience | Large, or members of the public | Moderate, not public-facing | Small, not public-facing |
| Accommodation cost | High | Moderate | Little or none |
| Legal exposure | Significant | Moderate | Little or none |
| Access for people with disabilities | Denies access | Limits access | Does not limit access |
| Barriers | Recur frequently | Recur occasionally | Do not recur |
| Likelihood of affecting people with disabilities | Strong | Moderate | Low |

High impact requires a full accessibility evaluation. Medium impact is evaluated at the
discretion of the campus disability office, which at SF State is DPRC. Low impact needs no
further evaluation beyond the screen.

Two standing cautions. This framework guides a determination and does not make it, so consult
the campus disability office for the call. Impact changes as a product spreads, so a
determination made at purchase does not hold forever, and renewal is the point to revisit it.

## Determining what applies

Before reading the criteria tables, establish what the product is, because product type
determines which parts of the standard the ACR has to answer.

| Product type | What applies |
|---|---|
| Web page | WCAG. Add Chapter 5 section 502 where the page uses platform accessibility features |
| Software | WCAG except 2.4.1, 2.4.5, 3.2.3 and 3.2.4, with WCAG word substitutions. Add 501 and 502 for a platform, 503 for an application, 504 for an authoring tool |
| Public-facing electronic content | WCAG, scoped to electronic content |
| Official agency communication | E205.4, covering emergency notifications, decisions, policy announcements, benefit and employment notices, acknowledgements, surveys, forms, training materials, and intranet pages built as web pages |
| Non-web document | WCAG except 2.4.1, 2.4.5, 3.2.3 and 3.2.4, with WCAG word substitutions |

A product with more than one interface needs one ACR per interface. An administrative
interface and an end user interface are separate products for review. A single report
covering both usually means one was tested.

## Checking the product heading

Six checks. Each answers yes or no.

| Check | Fails when |
|---|---|
| Report date | Older than 12 months at submission. Six to nine months is preferred |
| Product and version | The report names the product line, or a version other than the one being bought |
| Report creator | The tester sits in sales or marketing rather than an accessibility team or a third-party accessibility firm |
| Applicable standards | The report measures only WCAG 2.0 or only Section 508 |
| Evaluation method | Automated scanning only, a vendor-proprietary method that cannot be examined, "general product knowledge", or a claim that the product resembles another evaluated product |
| Scope of testing | The report does not say which pages, screens, functions or tasks were tested |

Look for named assistive technology in the evaluation method, such as NVDA, JAWS, or
keyboard-only navigation, and for named browsers and operating systems.

**OPEN 4 - Confidence call.** Decide who judges whether to proceed when an ACR fails these
checks but the product is needed. No role holds this today. *Raised 2026-09-23. Unassigned.*

## Reading the criteria tables

Review every WCAG 2.1 Level A and AA criterion. Note each one marked Partially Supports or
Does Not Support; those are the candidates for a TAAP, an EEAAP, or further testing. Ignore
criteria outside WCAG 2.1 A and AA unless someone asks for them.

The template defines five conformance terms.

| Term | Means |
|---|---|
| Supports | Meets the criterion, without known defects or through equivalent facilitation |
| Partially Supports | Some functionality does not meet the criterion |
| Does Not Support | The majority of functionality does not meet the criterion |
| Not Applicable | The criterion is not relevant to the product |
| Not Evaluated | Not assessed. Permitted only on Level AAA criteria |

Terms outside that set, such as Pass, Fail, or Supports with Exceptions, mean the vendor
worked from an old template or wrote their own. Not Evaluated against a Level A or AA
criterion is a defect in the report.

The template requires the remarks column to identify the functions or features with issues
and how they fall short, wherever the level is Partially Supports or Does Not Support. Where
a criterion does not apply, the remarks explain why. Where an accessible alternative exists,
the remarks describe it.

Flag these:

- Every criterion marked Supports.
- Remarks that restate the criterion instead of describing the product.
- An empty remarks column against Partially Supports or Does Not Support.
- Wording about design intent rather than behaviour, such as "designed to be accessible".
- Many Not Applicable responses against features the product has. Where no content exists for
  a criterion, the template directs the vendor to answer Supports, so Not Applicable in that
  position is a reporting error rather than a barrier.

## Beyond WCAG

WCAG covers the interface. Three further parts of the Revised 508 Standards apply to most
products. Read them in the Revised 508 Standards text, which is captured in the graph against
`Revised Section 508 Standards (36 CFR Part 1194) (2017)`.

- **Chapter 3, Functional Performance Criteria (302).** Whether the product is usable without
  vision, hearing, speech, or fine motor control.
- **Chapter 5, Software.** 501 general, 502 interoperability with assistive technology, 503
  applications, 504 authoring tools.
- **Chapter 6, Documentation and Support.** 602 support documentation, including whether
  documentation is available in accessible electronic formats on request. 603 support
  services, including whether help desks accommodate the communication needs of users with
  disabilities, and whether support staff are trained to answer accessibility questions.

Chapter 6 is the part most often skipped. A product can meet WCAG and still leave a user
unable to get help.

## Review depth

| Depth | When | Method |
|---|---|---|
| Screen | Every review | The six heading checks, a conformance-term scan, and the critical criteria below |
| Full | Medium and high impact, or the screen raises doubt | Every WCAG 2.1 A and AA criterion, plus Chapters 3, 5 and 6 |
| Hands-on | High impact, or the ACR and the product disagree | Test the product against the criteria the report claims to support |

### Critical criteria

Eight Level A criteria to spot-check first. All are checkable without specialist tooling.

| Criterion | Check |
|---|---|
| 1.1.1 Non-text Content | Images and controls have text alternatives that serve the same purpose |
| 1.2.2 Captions (Prerecorded) | Prerecorded audio in synchronised media is captioned |
| 1.3.1 Info and Relationships | Headings, lists and table headers are marked up, not just styled |
| 1.4.1 Use of Color | Colour is not the only way information is conveyed |
| 2.1.1 Keyboard | Everything doable with a mouse is doable from the keyboard |
| 2.2.2 Pause, Stop, Hide | Automatic movement stops within five seconds or can be paused |
| 2.4.1 Bypass Blocks | A skip link is the first focusable item on a web-delivered product |
| 2.4.3 Focus Order | Focus moves in an order that preserves meaning, with a visible indicator |

A failure found by hand against a criterion the ACR marks Supports tells you what the rest of
the report is worth.

**OPEN 5 - Hands-on thresholds.** Decide the user count or reach at which a reviewer tests the
product rather than accepting the ACR, and who does that testing.
*Raised 2026-09-23. Unassigned.*

## Missing or inadequate ACR

Search in this order: the requisition attachments, the campus VPAT store, the CSU-Wide
Repository, and the vendor's own accessibility, compliance, or legal pages.

Where none exists and the product will be used by more than one person, comment in P2P asking
the Purchase Requester to obtain a current ACR from the vendor, and tag them so they are
notified. Use the canned VPAT request language in the P2P procedure. Ask in the same comment
for anything else the review needs, such as an accurate user count, whether the product
delivers course instruction, and whether it is public-facing.

Where the vendor cannot produce an ACR and the product has medium to large reach or is
required for work or classes, the purchase needs a TAAP for approval.

Where an ACR exists but fails the heading checks, put these questions to the vendor before
escalating:

1. How is accessibility built into your product development lifecycle?
2. Does your organisation run ongoing accessibility training for developers?
3. Which tools and methods do you use for accessibility testing?
4. Can you provide the accessibility test plan and the results behind the report?
5. Is there an accessibility roadmap for the issues the report identifies, with dates?

### Two alternatives to an ACR

Where a vendor cannot produce a report promptly, SF State ATI offers two routes. Either
produces evidence the review can use.

**ATI team testing.** The vendor provides functional demo access and the ATI team tests the
product directly.

**Vendor live demonstration.** The vendor answers the questions above and demonstrates the
product live, covering:

- Operating the entire interface with the keyboard alone.
- A clearly visible keyboard focus indicator throughout.
- Text scaled to 200 percent without losing content or functionality.
- Colour contrast meeting 4.5:1, excepting large text, logos and incidental images.
- Screen reader operation, using JAWS or NVDA.
- Functionality without reliance on CSS positioning.
- Reaching help documentation, the accessibility features, the support contact, and the way
  to report an accessibility problem.
- The product Accessibility Statement.

Record an inadequate report as an absence of evidence, not as evidence of inaccessibility. In
the TAAP, state that accessibility could not be evaluated because the vendor supplied no
documentation, and that barriers may exist.

## Outcomes

- **Approved.** The ACR is adequate and shows no significant barriers for the intended use.
  Add the low-risk approval canned language to the P2P comments, then approve.
- **Approved with a TAAP.** Barriers exist, the product is needed, and access for affected
  users is provided another way until the vendor fixes them. The TAAP is a condition of
  approval. Obtain the vendor's Accessibility Roadmap and send contract language
  recommendations to the Buyer.
- **Denied.** Barriers are substantial, no alternate access works, or the vendor cannot show
  the product was evaluated.

## TAAP

A TAAP is a formal agreement between the purchasing department, IT, and other involved
departments, setting out temporary accommodations while the vendor removes the barriers. It
requires executive signatures. Use it where the product is required, no alternative exists,
and the barriers are severe or actively being worked on.

An EEAAP is the related plan for an alternate path to the same task. Campuses use the two
terms differently, so confirm which instrument the campus expects.

**OPEN 6 - TAAP or EEAAP.** The P2P procedure defines both instruments. The CSU Accessible
Procurement Process names only the TAAP. Decide whether SFBRN uses one or two, and state when
each applies. *Raised 2026-09-23. Unassigned.*

Take the template from the SFBRN Shared TAAP folder in Box. Name the copy
`ProductName_Campus_Month Year`, for example `Zoom_SFSU_July 2026`. Link the accessibility
documentation into it: the ACR, the accessibility statement, the vendor roadmap, the vendor's
accessibility page. List every criterion marked partially supported or not supported against
the campus standard.

The department that implements and supports the product writes the access plan with the ATI
Reviewer, because they know which accommodations are workable. The P2P procedure carries the
signature routing, the filing steps, and the canned language for each stage.

## Urgent requests

No path exists today. A request arriving against a deadline gets the full review or gets
handled case by case, with no rule covering which.

**OPEN 7 - Urgent requests.** Define what qualifies a request as urgent, what may be
compressed, what may never be skipped whatever the deadline, and who authorises the
compression. The live case is a security software licence running against a term limit on a
grace-period extension. *Raised 2026-09-23. Unassigned.*

## Cross-campus review

Reviewers hold cross-campus access in P2P and work a shared queue. The claim-and-release
rules agreed on 2026-09-16 are recorded as notes on the CSUBuy procedure.

**OPEN 8 - Reciprocity.** Decide whether a product reviewed at one campus needs an independent
review at another, or whether the first review travels with the product.
*Raised 2026-09-23. Unassigned.*

## Filing

The Buyer files the accessibility documentation with the PO or contract. Completed TAAPs go
to the SFBRN TAAP folder in Box, and to the CSU-Wide Vendor Accessibility & Security Document
Repository where they are shared across campuses.

**OPEN 9 - Lookup order.** Three paths are in use for finding a prior review: P2P by supplier,
ServiceNow, and East Bay's CFS and PeopleSoft. Decide the order a reviewer checks, and who
keeps that order current. *Raised 2026-09-23. Unassigned.*
