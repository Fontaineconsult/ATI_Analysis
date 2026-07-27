// 03_asset_taap.cypher
// Harden TAAP descriptors against WCAG-EM 2.0 (app/database/ontology/wcag-em-2.md).
// The node_type gets a guarded append drawing the TAAP / conforming-alternate-version
// boundary; the three outcome values were empty placeholders and are replaced.

// ==== harden-taap-node-type =============================================
// A TAAP exists precisely where no conforming alternate version exists at the
// technical layer — the two instruments must not be conflated.
MATCH (d:UniversalDescriptor {descriptor_handle: "node_type:TAAP"})
WHERE NOT coalesce(d.description_full, "") CONTAINS "WCAG-EM"
SET d.description_full = coalesce(d.description_full, "") + "\n\nBoundary against WCAG-EM 2.0's 'conforming alternate version': under WCAG 2, a sample whose content has a conforming alternate version still CONFORMS — the alternate is not a separate sample; sample and alternate are evaluated together as one unit (full page, Step 4.1). A TAAP is the opposite case: an administrative instrument covering acknowledged NON-conformance. A TAAP exists precisely where no conforming alternate version exists at the technical layer — if the alternate access were itself conformant and equivalent, there would be conformance, not a TAAP. The TAAP also parallels WCAG-EM's partial-conformance machinery (Step 5.3): where full conformance is not achieved, an evaluation statement must name the non-conforming product areas and the reason; the TAAP is the ATI's instrument for holding that state accountable and time-bound.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-outcome-equally-effective ==================================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:outcome.equally_effective"})
SET d.description_short = "The alternative affords the same result, benefit, and opportunity as the inaccessible original.",
    d.description_full = "The alternate access provides the same result, benefit, and opportunity in a comparably integrated setting — the ADA Title II standard behind the Equally-effective-access principle. Distinct from a WCAG 'conforming alternate version' (WCAG-EM 2.0, Step 4.1): equally-effective is judged at the program-access layer (does the person get the same outcome), not the technical-conformance layer. An alternative that is also technically conformant and kept current may qualify as a conforming alternate version, in which case the sample conforms and no TAAP is needed.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-outcome-non-equal-alternative ==============================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:outcome.non_equal_alternative"})
SET d.description_short = "An alternative exists but does not afford equal result, benefit, or opportunity — a managed, non-resting state.",
    d.description_full = "The alternate access falls short of equal result, benefit, or opportunity — accepted temporarily and explicitly non-resting. This is the state a WCAG-EM 2.0 partial-conformance statement would have to disclose (non-conforming areas plus reason, Step 5.3). It carries the strongest duty of the three outcomes — time-bound remediation with annual review — because the person with a disability is currently receiving less.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));

// ==== define-outcome-referral ===========================================
MATCH (d:UniversalDescriptor {descriptor_handle: "field_value:outcome.referral"})
SET d.description_short = "The TAAP routes the case to another process or authority rather than resolving access itself.",
    d.description_full = "The plan's outcome is referral: the case is routed to another instrument — for example an individual accommodation process, a procurement action, or an authority with the capacity to act — rather than the TAAP itself providing the alternate access. A referral records that resolution sits outside this plan's authority.",
    d.last_updated = date()
WITH d
SET d.search_text = toLower(reduce(s = "", p IN [x IN [d.title, d.description_short, d.description_full, d.target_label, d.target_field, d.target_value] WHERE x IS NOT NULL AND trim(x) <> ""] | s + CASE WHEN s = "" THEN "" ELSE " " END + trim(p)));
