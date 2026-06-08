# ATI Knowledge Graph — Principles Reference

## What a principle is, and why it lives in the graph

The principle layer exists because the knowledge graph does not only store compliance records; it reasons in the terms the institution is legally and structurally accountable in. Every node and every edge is a claim about how accessibility works in an institution, and a principle is the load-bearing commitment that justifies why a given structure is shaped the way it is. Principles are not operational rules (what to do) and not node descriptions (what a thing is). They are the conceptual commitments that connect governance and theory, on one side, to the schema's structural choices on the other.

This matters most clearly at the level of the Interface, the object the whole model turns on. An Interface is a salient point of interaction with ICT, identified by the accessibility function because it can present an access barrier. It is where the accessibility duty lands and what remediation targets, and it exists whether or not it sits on top of an owned asset. That single object carries a stack of commitments: about what counts as ICT at all, about what individuates an interface, about where the duty attaches, and about how duty relates to ownership. Each of those commitments is a principle, and naming them lets the graph answer not just "what is this" but "why is it modeled this way, and what grounds that."

Each principle below is anchored two ways. It **derives from** a source — a law, a directive, the CSU ATI coded memo, or an intellectual/standards source such as WCAG, the W3C Accessibility Maturity Model, or a named theorist — so that no commitment floats free of its grounding. And it **shapes** one or more schema elements — a node type, a relationship, a coordinate — so that the structure of the graph can be traced back to the commitment that justifies it. A principle with no grounding is an unprincipled assertion; a principle that shapes nothing is inert. Both are detectable, which is part of how the layer keeps itself honest.

The principles fall into three groups: those drawn from the CSU ATI coded memo (how the institution has committed to run the program), those drawn from the ADA's two titles (the parallel legal duties), and those drawn from the ontology's own design (why the Interface and its neighbors are modeled as they are). The three groups ground in different sources — institutional policy, federal law, and ontology/standards respectively — but they sit in one layer because they do one job: they explain why the structure is what it is.

---

## Group 1 — Principles from the CSU ATI Coded Memo

These commitments come from the controlling ATI coded memo and the Executive Order behind it. They describe how the CSU has committed to pursue accessibility as a program. The three explicit ones are stated by the memo as its driving principles; the others are commitments embedded in its strategy and implementation language.

### Institution-wide responsibility
**Handle:** `principle:institution-wide-responsibility`
**Short description:** The duty to provide accessible technology runs to the institution as a whole and requires leadership across the enterprise, not ownership by a single office.
**Full rationale:** Accessibility is an institution-wide responsibility that requires commitment and involvement from leadership across the enterprise. The legal duty runs to the institution, not to particular offices, which is why responsibility must be distributed by a rule rather than assigned to one unit, and why institutional program accessibility is emergent and presents a collective-action problem. This principle grounds the distribution of stewardship across many organizational units and persons, and the rule by which responsibility rises to the institution when the party closest to the capacity to remediate cannot act.
**Derives from:** the ATI coded memo; ADA Title II; Section 504; Executive Order 1111.
**Shapes:** the Asset stewardship relationships; the responsibility-elevation pattern.

### Equally effective access
**Handle:** `principle:equally-effective-access`
**Short description:** Accessible technology must afford the same result, benefit, or opportunity, not merely some alternative.
**Full rationale:** Technology for individuals with disabilities must provide access to obtain the same result, gain the same benefit, or have the same opportunity to reach the same level of achievement as persons without disabilities. This language is drawn nearly verbatim from the Section 504 standard the memo restates. The principle is the measuring stick against which alternative-access outcomes are graded: "equally effective" is the standard met, and lesser outcomes are degrees of falling short of it.
**Derives from:** the ATI coded memo; Section 504's equal-access standard.
**Shapes:** the TAAP/EEAAP outcome vocabulary.

### Universal Design reduces individual accommodation
**Handle:** `principle:universal-design-over-accommodation`
**Short description:** Designing for accessibility up front reduces the need for reactive individual accommodations.
**Full rationale:** The implementation of Universal Design principles should reduce the need for, and the costs associated with, individual accommodations for inaccessible technology products. This is a strategic and design commitment the CSU adopts rather than a direct legal mandate, and it has its own intellectual lineage in Universal Design. It is the commitment behind preferring proactive, systemic accessibility to reactive accommodation, and behind keeping the two as separate, non-substituting duties.
**Derives from:** the ATI coded memo; Universal Design as an intellectual source.
**Shapes:** the parallel-duties distinction (program accessibility vs. reasonable accommodation).

### Capability maturity over binary compliance
**Handle:** `principle:capability-maturity-over-binary-compliance`
**Short description:** Accessibility is assessed as levels of organizational capability that improve and institutionalize over time, not as a fixed compliant/non-compliant state.
**Full rationale:** The CSU commits to evaluating accessibility through graded levels of organizational capability (Not Started, Initiated, Defined, Established, Managed, Optimized) rather than as a binary judgment of compliance. This is a substantive commitment about what accessibility is: an institutionalized, continuously improving organizational capability rather than a static endpoint. It reflects a "capabilities maturity" strategy aimed at reliably and sustainably delivering accessible services. This principle is the conceptual basis for representing status as graded maturity levels rather than a pass/fail flag, and for treating movement between levels as the unit of progress.
**Derives from:** the ATI coded memo; the Capability Maturity Model lineage.
**Shapes:** the StatusLevel node/backbone and the status_value field.

### Accessibility as continuous, sustained remediation
**Handle:** `principle:continuous-sustained-remediation`
**Short description:** Accessibility is an ongoing, multi-year process of incremental barrier removal, not a one-time achievement.
**Full rationale:** The memo commits to the view that, just as accessibility barriers develop over years, their remediation often requires years to fully implement, and that the institution should achieve incremental improvements in barrier removal each year. The underlying commitment is about the temporal nature of accessibility: it is a sustained process that is never finished, requiring continuous effort and year-over-year tracking rather than a single point of compliance. This principle is the basis for the annual evidence cycle, for tracking progress across academic years, and for the trajectory of an effort being meaningful independent of its absolute status.
**Derives from:** the ATI coded memo.
**Shapes:** the YearSuccessEvidence and AcademicYear nodes; the trajectory field on ProgressUpdate.

### Shared responsibility requiring coordination
**Handle:** `principle:shared-responsibility-requiring-coordination`
**Short description:** Meeting the accessibility duty requires coordinated, ongoing effort across distributed actors, which a coordinating function exists to provide.
**Full rationale:** Distinct from the principle that the duty sits with the institution as a whole, this principle concerns how the duty is met: accessibility is a shared responsibility that requires a coordinated, ongoing effort across many actors to succeed. Because no single unit produces institutional accessibility on its own, the work is a collective-action problem that needs a coordinating function. This is the conceptual root of the coordinating/second-line role and of the distinction between line authority (held by the units that build and operate technology) and functional authority (held by the accessibility function accountable for an outcome it does not directly control). It justifies attaching working-group accountability to the work and maintaining a coordinating body across distributed owners.
**Derives from:** the ATI coded memo.
**Shapes:** the ATIWorkingGroup node; the accountable_working_group edge on implementations; the coordinating-function modeling.

### Procurement as an accessibility lever
**Handle:** `principle:procurement-as-accessibility-lever`
**Short description:** The institution advances accessibility upstream at acquisition, shaping vendor products through partnerships and the procurement process.
**Full rationale:** The memo commits to driving improvements in product accessibility by leveraging the procurement process and by partnering with vendors and publishers. The underlying commitment is that accessibility can and should be advanced upstream, at the point of acquisition, rather than only remediated after a product is in use, and that the institution's purchasing power is a legitimate instrument for improving the accessibility of the market it buys from. This principle is the basis for treating procurement as a distinct priority area, for the vendor and supplier relationships in the model, and for the upstream gatekeeping function that reviews ICT before it enters the environment.
**Derives from:** the ATI coded memo; Section 508 procurement provisions.
**Shapes:** the Vendor node and supplied_by edge; the procurement working group; the asset-acquisition/gating modeling.

### Prioritization by impact under finite resources
**Handle:** `principle:prioritization-by-impact`
**Short description:** Because resources are finite, accessibility work is triaged toward the barriers with the greatest impact rather than pursued uniformly.
**Full rationale:** The memo commits to selecting implementation activities that target the accessibility barriers with the greatest impact, in explicit recognition that staffing, time, and tools are finite each year. The underlying commitment is a value choice about allocation: accessibility effort is prioritized by impact (using an impact, probability, and capacity framework) rather than spread evenly across all barriers. This principle is the basis for priority levels on tracked work and connects to the minimal-impact reasoning that governs whether non-conforming technology may remain in use while remediation proceeds.
**Derives from:** the ATI coded memo.
**Shapes:** the priority_level field on YearSuccessEvidence; the prioritization modeling.

### Flexibility for campus variation
**Handle:** `principle:local-adaptation-flexibility`
**Short description:** Implementation is locally adapted to each campus rather than uniformly imposed, within shared systemwide goals.
**Full rationale:** The memo repeatedly commits to campuses having adequate flexibility to manage their own ATI implementation, recognizing that each campus faces unique challenges. The underlying commitment is that the systemwide goals and success indicators are shared and fixed, but the means of achieving them are adapted locally, with those who carry out the work helping shape how it is done. This principle is the basis for keeping the schema substrate-independent and multiply realizable, with shared structure in the model and campus-specific particulars in the data, so that every campus loads into one ontology without the schema encoding any one campus's specifics.
**Derives from:** the ATI coded memo.
**Shapes:** the multiply-realizable schema design; the campus-in-data-not-schema decision; the Campus node and per-campus scoping.

---

## Group 2 — Principles from the ADA's two titles

These commitments come from the two distinct legal duties the ADA imposes. They are deliberately mirrored: Title II yields proactive, systemic, standard-based principles; Title I yields reactive, individualized, hardship-bounded principles. The contrast between the two sets is the parallel-duties framework expressed as structure.

### Program accessibility is a proactive, systemic duty (Title II)
**Handle:** `principle:program-accessibility-as-proactive-duty`
**Short description:** Under ADA Title II the institution must make its programs, services, and activities accessible in advance and as a whole, independent of any individual request.
**Full rationale:** ADA Title II requires that the programs, services, and activities of a public entity, viewed in their entirety, be readily accessible to and usable by people with disabilities. The 2024 DOJ web rule operationalizes this for digital content by adopting WCAG 2.1 Level AA as the technical standard for web content and mobile applications, with compliance required of large public entities such as the CSU by April 26, 2027 following the DOJ's 2026 interim final rule (the substantive requirements are unchanged; only the dates moved). The defining feature of this duty is that it is proactive and systemic: accessibility must be built into the institution's digital presence ahead of need and for the general population of users, not produced reactively in response to a particular person. This principle is the conceptual basis for treating program accessibility as a standing obligation on the interfaces and assets the institution offers, distinct from and not satisfied by individual accommodation, and for measuring conformance against a fixed external technical standard.
**Derives from:** ADA Title II (28 CFR Part 35); Section 504.
**Shapes:** the Interface/Asset conformance modeling; the standing-duty treatment of interfaces.

### Conformance to an external technical standard (Title II)
**Handle:** `principle:conformance-to-an-external-technical-standard`
**Short description:** Digital program accessibility is measured against a fixed, externally defined technical standard (WCAG 2.1 AA under the Title II rule), not an internal or subjective judgment.
**Full rationale:** The Title II web rule fixes accessibility to a specific, externally maintained technical standard: WCAG 2.1 Level AA, incorporated by reference. Entities may adopt a later version such as WCAG 2.2, but 2.1 AA is the binding floor. The significance is that conformance is not an internal or negotiable judgment of "accessible enough"; it is assessment against a published, versioned, third-party criterion set. This principle grounds the model's treatment of WCAG as the authority that individuates components and defines what conformance means, the separation between a fixed standard layer and the institution's own assessment of where it stands against that standard, and the need to track which version governs as the standard evolves.
**Derives from:** ADA Title II 2024 rule; WCAG 2.1 AA (incorporated by reference).
**Shapes:** the Component layer and its must_satisfy relationship to WCAG; the standard-vs-assessment separation.

### Time-bound alternative access when full conformance is not yet achieved (Title II)
**Handle:** `principle:time-bound-alternative-when-not-conformant`
**Short description:** Where program content cannot meet the standard, the institution provides a documented, time-bound equally effective alternative while it remediates, rather than treating non-conformance as acceptable.
**Full rationale:** The Title II framework recognizes limited circumstances where content does not meet WCAG 2.1 AA, and the institution's obligation in those cases is to provide an equally effective means of access while remediation proceeds, with exceptions kept time-bound rather than permanent. Best-practice implementation pairs any such exception with a documented remediation plan, a risk acceptance, and an equally effective alternative where needed — a pattern the W3C Accessibility Maturity Model also names as an exception/risk-acceptance process with justification, time limits, and executive approval. The underlying commitment is that non-conformance is a temporary, managed state carrying an affirmative duty to provide alternative access, not a resting state. This principle grounds the alternate-access-plan instrument (its time-bound nature, annual review, and graded outcomes), the modeling of non-conformance as an active condition requiring a covering plan, and the elevation signal when a non-conformant asset has no remediating work or covering alternative.
**Derives from:** ADA Title II (35.205); the W3C Accessibility Maturity Model (exception/risk-acceptance process).
**Shapes:** the TAAP instrument (time-bound, annual review, graded outcomes); the non-conformance-coverage modeling; the elevation signal.

### Reasonable accommodation is an individualized, reactive duty (Title I)
**Handle:** `principle:reasonable-accommodation-as-individualized-duty`
**Short description:** Under ADA Title I the institution must provide reasonable accommodations to specific qualified employees with disabilities, triggered by the individual and tailored to them.
**Full rationale:** ADA Title I requires employers to provide reasonable accommodations to qualified applicants and employees with disabilities so they can access the application process, perform essential job functions, and enjoy equal benefits and privileges of employment, unless doing so would impose undue hardship. Unlike the systemic Title II duty, this obligation is individualized and reactive: it is triggered by a particular person's disability and request and is met through a case-by-case interactive process between the employee and the employer. When workplace digital tools (intranets, training platforms, productivity and line-of-business software) are inaccessible, they can exclude employees with disabilities and constitute discrimination, a reach courts now enforce. This principle is the conceptual basis for treating employee accommodation as a distinct duty owned by the accommodation function (HR, in coordination with the disability office), tied to a person rather than to an asset, and not satisfied by general program-accessibility work alone.
**Derives from:** ADA Title I; EEOC enforcement guidance; FEHA (California).
**Shapes:** the accommodation-function modeling; the person-tied (not asset-tied) duty.

### The accommodation duty is bounded by undue hardship (Title I)
**Handle:** `principle:duty-bounded-by-undue-hardship`
**Short description:** The reasonable-accommodation obligation extends until it would impose significant difficulty or expense, judged by an individualized assessment, not a blanket rule.
**Full rationale:** Title I's accommodation duty is not unlimited: it is bounded by undue hardship, defined as significant difficulty or expense. Crucially, undue hardship must be established through an individualized assessment of current circumstances for the specific accommodation at issue; generalized conclusions about cost or difficulty do not suffice, and the employer is expected to consider outside funding and alternative accommodations before concluding that none is feasible. The underlying commitment is that the limit on the duty is itself individualized and evidentiary, not categorical. This principle grounds the modeling of accommodation as a bounded, case-specific obligation whose limits must be documented and justified per instance, and it distinguishes the accommodation function's reasoning (individualized hardship analysis) from the program-accessibility function's reasoning (conformance to a fixed standard).
**Derives from:** ADA Title I; EEOC enforcement guidance on reasonable accommodation and undue hardship.
**Shapes:** the bounded, case-specific accommodation modeling; the per-instance justification requirement.

### Equal access to all benefits and privileges of employment (Title I)
**Handle:** `principle:equal-benefits-and-privileges-of-employment`
**Short description:** Employees with disabilities must have equal access to every aspect of employment, including the digital tools, training, and advancement available to others.
**Full rationale:** Title I reaches beyond core job tasks to all benefits and privileges of employment: workers with disabilities must have equal access to everything available to similarly situated employees without disabilities, including training, advancement opportunities, and the digital tools and systems of the workplace. As employment becomes increasingly digitized, this means an inaccessible internal system can deny equal employment opportunity even if it is never seen by a student or the public. The underlying commitment is that the scope of the employment-accessibility duty is the whole employment relationship, not a narrow set of tasks. This principle grounds the model's recognition that internal-facing, employee-only interfaces and assets carry a genuine accessibility duty under Title I (and Section 504), which is why internal-use tools are in scope for accessibility even when no Title II public-facing obligation or VPAT applies, and it connects the audience dimension of an interface to the governing legal basis.
**Derives from:** ADA Title I; EEOC employer guidance; Section 504.
**Shapes:** the in-scope treatment of internal/employee-only interfaces; the audience-to-legal-basis linkage.

---

## Group 3 — Principles from the ontology's design (the Interface and its neighbors)

These commitments come from the ontology itself rather than from law or policy. They explain why the Interface, the object the model turns on, is shaped as it is. They ground in standards and design sources — chiefly WCAG and the W3C Accessibility Maturity Model — rather than in statute, which is why those sources sit alongside the governance nodes as grounding targets.

### Interface is defined by functional role, not substrate
**Handle:** `principle:interface-defined-by-functional-role`
**Short description:** What makes something an interface is the role it plays in an interaction—a point where a person encounters ICT and could be blocked—not what it is made of.
**Full rationale:** An interface is individuated by what it does in an interaction, not by its underlying substrate. A standalone PDF and a Canvas course view are the same kind of thing because they play the same role: a point where a person encounters ICT and could face a barrier. This is the same functional logic that bounds ICT itself, where the test is principal function rather than physical form, so the outer boundary and the interface definition share one move applied at two levels. Defining the interface functionally is what lets a single ontology treat documents, web views, media, and tools as one kind of object, and it is why the model is substrate-independent and multiply realizable across systems and campuses.
**Derives from:** WCAG; the W3C Accessibility Maturity Model.
**Shapes:** the Interface node; its functional (not type-based) individuation.

### Interfaces exist only within the ICT boundary
**Handle:** `principle:interface-bounded-by-ict`
**Short description:** Only ICT—things whose principal function is handling electronic data and associated content—can host an interface; barriers outside ICT are real but out of scope for this ontology.
**Full rationale:** Following the W3C Accessibility Maturity Model, ICT is information technology and other equipment, systems, technologies, or processes whose principal function is the creation, manipulation, storage, display, receipt, or transmission of electronic data and information, as well as any associated content. This boundary decides what can host an interface at all: it gives "is X an interface?" a testable first gate—is X, or the thing behind it, ICT?—before the harder judgment of salience is reached. Because the boundary covers systems, processes, and associated content rather than only devices, both a standalone document and a remediation-relevant workflow can fall inside it, while a physical ramp, a face-to-face conversation, or a never-digitized paper form fall outside it and are out of scope for this ontology even though their barriers are real. This principle grounds the model's scope: it draws the outer line within which the accessibility duty is modeled.
**Derives from:** the W3C Accessibility Maturity Model (the ICT definition).
**Shapes:** the scope of what may be instantiated as an Interface; the ICT-or-not first gate.

### Interfaces are individuated by the accessibility function's judgment of salience
**Handle:** `principle:interface-individuated-by-salience`
**Short description:** An interface is not every possible point of contact with a system, but the points the accessibility function judges salient because a barrier can occur there.
**Full rationale:** Within the ICT boundary, the accessibility function selects which interaction points are salient enough to model, on the basis that a barrier can occur there. That salience judgment is the individuating act, which makes the interface layer accessibility-relative rather than a neutral or exhaustive description of the technology. The same system would decompose into different interfaces if a security or UX function were drawing the lines; the interface layer reflects the accessibility function's view specifically. This principle is why interfaces are declared by judgment rather than enumerated mechanically from an asset's surfaces, and it is the conceptual basis for the declared-versus-enacted distinction, where declared interfaces come from this top-down salience judgment and enacted ones emerge from where remediation work actually clusters.
**Derives from:** the ontology design (the salience criterion); the W3C Accessibility Maturity Model (ICT scope within which salience operates).
**Shapes:** the declared provenance of interfaces; the declared-versus-enacted distinction.

### The accessibility duty attaches to the interaction, not the artifact
**Handle:** `principle:duty-attaches-to-the-interaction`
**Short description:** Accessibility is a property of an encounter between a person and ICT (the WCAG unit of conformance), so the duty lands on the interface rather than on the asset behind it.
**Full rationale:** The interface is WCAG's actual unit of conformance: the perceivable page, document, or view that a conformance claim is scoped to. The POUR predicates—perceivable, operable, understandable, robust—are predicates of an interaction, not properties of an artifact in isolation. A system has no accessibility until someone interacts with one of its surfaces; the question is always whether that encounter is perceivable and operable for a particular person. This is the deep reason the accessibility duty attaches to the interface and is what remediation targets, rather than attaching to the asset. It grounds the separation between where the duty is measured (the interface) and where the capacity to meet it resides (the asset).
**Derives from:** WCAG (the unit of conformance and the POUR predicates).
**Shapes:** the remediation target being the Interface (not the Asset); the duty-vs-capacity separation.

### Duty lands on the interface; ownership lives on the asset
**Handle:** `principle:duty-and-ownership-are-separate-objects`
**Short description:** The interface carries the accessibility duty and is the more fundamental object; the asset is an optional backing that carries ownership and the capacity to remediate.
**Full rationale:** The interface is where the obligation to be accessible attaches and what remediation acts on; the asset is the thing behind it that carries ownership and the capacity to remediate. These are distinct objects because the duty and the capacity to meet it routinely sit in different places. Critically, the interface is the more fundamental object and the asset is optional: a standalone interface with no backing asset is a valid, complete state, not a gap, because backing is a relationship some interfaces happen to have rather than a precondition for being an interface. This inverts the naive assumption that assets are primary and interfaces are merely their surfaces. The principle grounds the model's separation of the interface layer (duty, conformance, remediation target) from the asset layer (ownership, stewardship, remediation capacity), and it is the object-level expression of the broader split between where a duty is measured and where the capacity to discharge it lives.
**Derives from:** the ontology design; WCAG (interface as the unit of conformance).
**Shapes:** the Interface/Asset separation; the optional `presented_by` backing; the standalone-interface validity.

---

## Note on grounding sources

The principles in this reference ground in three kinds of source, all of which sit in the graph as targets of the `derives_from` relationship:

- **Governance nodes** — the ATI coded memo, Executive Order 1111, ADA Title I, ADA Title II, Section 504, Section 508. The legal and policy authorities.
- **Intellectual/standards sources** — WCAG, the W3C Accessibility Maturity Model, the Capability Maturity Model lineage, Universal Design, and named theorists where relevant. These are not legally binding but govern how the model thinks, and they earn a place beside the governance nodes precisely so that principles grounded in standards or theory have a citable anchor.
- The distinction is worth preserving: a principle grounded only in an intellectual source (for example, the ontology-design principles) is a design commitment, not a legal mandate, and the model should be able to show that difference rather than blur it.

The maturity-level scale used in the StatusLevel backbone (Not Started through Optimized) derives from the CSU ATI capability-maturity framework, not from the W3C Accessibility Maturity Model's four-level scale; the AMM is borrowed for its ICT boundary definition only.