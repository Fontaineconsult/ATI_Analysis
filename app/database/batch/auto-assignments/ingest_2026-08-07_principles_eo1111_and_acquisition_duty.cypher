// =============================================================================
// INGEST — Ground the bounded-duty principles locally, and guard the
//          standing obligation to acquire accessible technology
// Date:   2026-08-07
// Target: meta-scaffold (Principle)
// =============================================================================
//
// WHY
//   EO 1111's full text is now captured on the Directive node. It states the
//   fundamental-alteration / undue-burden limit at CSU level, states that
//   generally only one accessible alternative format per item is required, and
//   gives primary consideration to the alternate format of the user's choice.
//   Those propositions were previously grounded only in federal instruments.
//
//   The risk in grounding them is that the bounded-duty framing swallows the
//   primary obligation. Title II, Section 508, and California Government Code
//   7405 require accessible technology to be in place when it is developed,
//   procured, maintained, or used. That is the default. The burden limit is an
//   exception invoked case by case, and individual accommodation is a parallel
//   duty rather than a substitute. This file adds the guard explicitly so the
//   principle set cannot be read as licensing "we will provide alternatives
//   instead of buying accessible products."
//
// NODE IDENTITY
//   Two Directives named for Executive Order 1111 exist (a known duplicate,
//   backlog item 1.4). This file uses e6f402d1 — the node carrying the full
//   text — which also makes it the natural canonical one when that duplicate is
//   resolved. Section 508 likewise exists twice as a Law; 2d9ef551 is used
//   because it already carries the inbound derives_from from closest-to-capacity.
//
//   EO 1111 is scoped to STUDENTS. It is deliberately NOT attached to
//   program-accessibility-as-proactive-duty, whose scope includes employees and
//   the public — grounding it there would narrow the principle.
//
// PURITY
//   No instrument is named in any principle text. All grounding is on edges.
// =============================================================================


// -----------------------------------------------------------------------------
// 1. Ground the bounded-duty limit locally
// -----------------------------------------------------------------------------

MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"}), (d:Directive {unique_id: "e6f402d1454048baa0774281e82e64d7"})
MERGE (p)-[:derives_from]->(d);

MATCH (p:Principle {handle: "principle:equally-effective-access"}), (d:Directive {unique_id: "e6f402d1454048baa0774281e82e64d7"})
MERGE (p)-[:derives_from]->(d);


// -----------------------------------------------------------------------------
// 2. bounded-duty-burden-limits — add the guard
// -----------------------------------------------------------------------------
// Paragraph one is unchanged. The final passage is new: it fixes what the limit
// does NOT reach, so the principle cannot be cited to excuse acquiring
// inaccessible technology or to treat accommodation as discharge.

MATCH (p:Principle {handle: "principle:bounded-duty-burden-limits"})
SET p.description_full = "The obligation to remediate or to provide an alternative is bounded. Where making a program accessible would fundamentally alter its nature or impose undue financial and administrative burdens, the institution is not required to take that particular action. The duty is bounded, not extinguished. It must still take any other action that would not produce such alteration or burden, and must ensure that people with disabilities receive the benefits and services it provides to the fullest extent possible. The limit is invoked by a documented determination made at the level of authority accountable for the program, supported by a written statement of reasons, never by an operating unit's assertion that the work is hard. This principle matters because without it the alternative-access commitment reads as absolute, implying that every non-conformant resource must be paired with an equally effective substitute however large the resource is. At sufficient scale no equivalent substitute can be constructed by the unit that subscribes to a resource, and the honest institutional answer is a documented bounded-duty determination with residual mitigation, not an unmeetable demand and not a silent exception. The limit reaches a particular action and not the standing obligation that made the action necessary. The institution is separately required to acquire, develop, and maintain technology that is accessible to begin with, and a burden determination about one remediation does not relax that requirement for the next acquisition. Providing one person an alternative does not discharge it either. The duty to make the program accessible and the duty to accommodate a particular person are parallel obligations, and satisfying the second leaves the first exactly where it was.";


// -----------------------------------------------------------------------------
// 3. Ground the acquisition duty on program-accessibility-as-proactive-duty
// -----------------------------------------------------------------------------
// Previously grounded only in Title II and the web rule, which carry program
// access but not the procure/develop/maintain/use mandate.

MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"}), (l:Law {unique_id: "2d9ef5513cca4b4a958c1f3e6a84aac6"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:program-accessibility-as-proactive-duty"}), (l:Law {title: "California Government Code Section 7405"})
MERGE (p)-[:derives_from]->(l);


// -----------------------------------------------------------------------------
// 4. universal-design-over-accommodation — fill it in and ground it
// -----------------------------------------------------------------------------
// This is the principle that carries "accessible in the first place." It was the
// last one with no description_full and no grounding at all, which meant the
// obligation the user just flagged had no home in the principle set.

MATCH (p:Principle {handle: "principle:universal-design-over-accommodation"})
SET p.description_full = "Accessibility built into technology when it is designed, acquired, or configured serves everyone who encounters it, and requires nobody to identify themselves as needing it. Accommodation runs the other way. It is arranged for one person, after they have met a barrier, and only once they have asked for it. The two are not alternatives of equal standing. The institution is required to acquire and maintain technology that is accessible to begin with, and accommodation is what remains necessary where that requirement has not been met. A program that relies on accommodation to deliver access has not reduced its obligation. It has converted a standing obligation into a recurring one, and moved the cost of access onto the people the technology excludes. Designing and buying for accessibility up front is therefore not simply the more efficient option. It is what the obligation asks for, and accommodation is the residue left when it has not been done.";

MATCH (p:Principle {handle: "principle:universal-design-over-accommodation"}), (l:Law {unique_id: "2d9ef5513cca4b4a958c1f3e6a84aac6"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:universal-design-over-accommodation"}), (l:Law {title: "California Government Code Section 7405"})
MERGE (p)-[:derives_from]->(l);

MATCH (p:Principle {handle: "principle:universal-design-over-accommodation"}), (l:Law {title: "Americans with Disabilities Act Title II"})
MERGE (p)-[:derives_from]->(l);


// -----------------------------------------------------------------------------
// AFTER THIS FILE
// -----------------------------------------------------------------------------
// - All 16 principles are grounded. universal-design was the last ungrounded one.
// - institution-wide-responsibility is now the only principle without a
//   description_full.
// - Still inert: no principle has a `shapes` edge except equally-effective-access.
// =============================================================================
