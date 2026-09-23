# SFBRN ATI VPAT Review Process

**Status: skeleton. Nothing below the section headings is agreed.**

This is the working draft for the plan `SFBRN: Draft the official VPAT Review Procedure`.
It exists to be filled in across a few working sessions rather than written by one person
and reviewed afterwards. Each section says what it has to answer, what the graph already
holds, and what the room has to settle. The drafting blocks are empty on purpose.

Companion documents. The reasoning behind this structure, the source material behind each
section, and the capture state of the governance text are in
`vpat-review-process-outline.md`. Read that before drafting a section; do not restate it
here.

## How to use this in a session

1. Take one or two sections per meeting. Sections 4 and 5 are the substance and will take a
   session each.
2. Work the **Settle in the room** list first. Those are the questions that block drafting.
3. Write into the drafting block while the people who know the answer are present.
4. Move the section's row in the tracker below.

Anything the room cannot settle becomes an open question in the text, not a guess. A
document that says "this is undecided, and X owns the decision" is usable. One that invents
an answer gets found out in the first hard case.

## Section tracker

| # | Section | State | Needs |
|---|---|---|---|
| 1 | Why this exists and when it applies | Not started | Intake categorisation |
| 2 | What a VPAT is, and what it is not | Not started | Nothing, can be drafted now |
| 3 | What the standard requires | Not started | Nothing, the text is captured |
| 4 | How to evaluate one | Not started | A session |
| 5 | The decision matrix | Not started | A session, plus two WG decisions |
| 6 | Missing or inadequate reports | Not started | Who plays the confidence-call role |
| 7 | Urgent and time-sensitive requests | Not started | Whole section is undefined today |
| 8 | Cross-campus review | Not started | One open Query |
| 9 | Where the artifacts live | Not started | The three lookup paths, written down |

---

## 1. Why this exists and when it applies

**Must answer:** which purchases enter accessibility review, which do not, and what decides.

**Have:** the CSUBuy procedure's scope. An open Concern against 1.5-pro recording that a
requisition coded as goods and services does not route through ATI review, with no owner.

**Settle in the room:**
- What categorisation at intake sends a requisition to ATI review?
- Who owns the goods-and-services gap, and is it in scope for this document or a fix elsewhere?

*Draft:*

## 2. What a VPAT is, and what it is not

**Must answer:** the difference between the blank template and a completed ACR, and what a
completed one does and does not prove.

**Have:** enough to draft. The template is confirmed as 2.5Rev, all four editions dated 24
April 2025. Harvard's page says 2.4 and dates it to February 2020, which is stale and should
not be carried forward.

**Settle in the room:** nothing. This section can be written before the first meeting and
brought as prose to react to.

*Draft:*

## 3. What the standard requires

**Must answer:** why WCAG 2.1 AA binds the CSU, and where WCAG2ICT applies instead.

**Have:** the governance text, captured 2026-09-23. The Revised 508 Standards, WCAG 2.1,
WCAG2ICT and the Section 508 statute are all readable. California Government Code 7405 is
still empty, and it is the link that makes 508 bind us, so quote it once it is captured.

**Settle in the room:** nothing. Write the chain, then have someone check it.

*Draft:*

## 4. How to evaluate one

**Must answer:** what a reviewer actually checks, in an order a non-specialist can follow.

**Have:** the eight checks from the Massachusetts checklist, already in the outline as
yes/no questions. The ICT Testing Baseline, which is what a credible test is measured
against. The in-depth SFBRN VPAT/ACR review guide, 70,657 characters, which is the closest
thing we already have to a method.

**Settle in the room:**
- Do the eight checks match what reviewers already do? Walk a real recent review against them.
- Which checks are pass/fail, and which are judgment?
- What does the reviewer do when a check fails but the product is still needed?

*Draft:*

## 5. The decision matrix

**Must answer:** how a rating is arrived at, and what each outcome obliges.

**Have:** the CSUBuy procedure already rates low, medium and high on user count, whether use
is required, and public-facing exposure, and already requires a signed TAAP before a
high-risk approval. Start there. Do not invent a second scale.

**Settle in the room:**
- Do we add a vendor-maturity gate such as HECVAT before the product review?
- Does review depth tie to reach, with independent testing for high-impact products?
- What do approved, approved with a TAAP, and denied each oblige, and who may issue each?

*Draft:*

## 6. What to do when the report is missing or inadequate

**Must answer:** the threshold that makes a report inadequate, and what happens next.

**Have:** the manual ACR review process is a separate live plan and this document supplies
its trigger. Harvard's four follow-up questions for the vendor are the step before escalation.

**Settle in the room:**
- Who makes the confidence call when a report fails the checks? Massachusetts gives this to a
  named officer and we have no equivalent.

*Draft:*

## 7. Urgent and time-sensitive requests

**Must answer:** what qualifies as urgent, what may be compressed, what may never be skipped,
and who authorises it.

**Have:** nothing. There is no path today, which is why this is a requirement of the document
rather than a separate concern. Jonathan Hale's live case is a security software licence
running against a term limit on a grace-period extension.

**Settle in the room:** all of it. This section is written from scratch.

*Draft:*

## 8. Cross-campus review

**Must answer:** how a shared queue is worked, and whether one campus's review travels.

**Have:** the claim-and-release rules agreed 2026-09-16, recorded as notes on the CSUBuy
procedure. Reviewers hold cross-campus access in P2P.

**Settle in the room:**
- Does a product reviewed at one campus need independent review at another? This is an open
  Query with no answer. If the room cannot settle it, write it as open.

*Draft:*

## 9. Where the artifacts live

**Must answer:** where a completed review is filed, where prior reviews are found, and what a
reviewer checks first.

**Have:** three lookup paths in use as of the 2026-09-16 minutes, across P2P by supplier,
ServiceNow, and East Bay's legacy CFS and PeopleSoft. They are habits, not a documented
order. Writing them down is most of the work here.

**Settle in the room:**
- What is the order a reviewer should check, and who maintains it?

*Draft:*

---

## Alignment check, before this is called final

The draft has to match the processes as they run now, not as they ran when the source
material was written.

- [ ] Walk the draft against the current **CSUBuy** procedure end to end, with someone who
      works the queue. The risk rating and the TAAP trigger in section 5 come from it.
- [ ] Confirm the **SFBRN** claim-and-release rules in section 8 are still what reviewers do.
- [ ] Confirm the TAAP boundary. A TAAP is sometimes required when there is no VPAT to review
      at all, so section 6 must not imply the two always travel together.
- [ ] Confirm nothing here contradicts the separate manual ACR review plan or the TAAP
      Procedural Document.
- [ ] Re-confirm the VPAT version at the time of final drafting. ITI revises without renaming
      the page.

## Decisions parked for the working group

These are not the drafter's to make. Each one blocks a section.

| Decision | Blocks |
|---|---|
| Vendor-maturity gate such as HECVAT before product review | 5 |
| Review depth tied to reach, with independent testing for high impact | 5 |
| Who makes the confidence call on a failing report | 6 |
| What qualifies as urgent, and who authorises a compressed review | 7 |
| Whether a product reviewed at one campus needs review at another | 8 |
