#!/usr/bin/env python3
"""
Apply the approved CSUEB web-scan alignment (claude_files/csueb-web-scan-alignment.md).

One-off, idempotent. Scope approved 2026-08-13:
  U1-U7  attach the redesigned public ATI pages as supporting webpages; refresh the
         descriptions that predate the redesign (U1, U2, U4) and complete the
         truncated one (U6).
  C1     create Guidance "Media Captioning & Prioritization Guidance"
         (/ati/captioning/) and link it as evidence for the csueb captioning YSEs
         (2.6-web strong, 1.12-web plausible) in 2025-2026 / 2026-2027 where present.
  D1     merge the duplicate P-card InternalPolicy pair: move the 1.7-pro evidence
         links from "CSUEB P-card Policy" (no webpage, empty description) onto
         "CSUEB Pcard Policy" (PolicyStat webpage), delete the duplicate, then
         normalize the keeper's title to "CSUEB P-card Policy".
  D2     fix the title typo "Guidlines" -> "Guidelines".

Explicitly out of scope (flagged, not approved): U1's optional 2.10-web link, the
ATO service node (C2), committee nodes (C3), dashed-unique_id cleanup (D3), the
"Tutorials for creating accessible content." consolidation (D4). The old ServiceNow
catalog deep link still resolves (HTTP 200 checked 2026-08-13), so it is NOT
marked depreciated.

Everything goes through the sanctioned queries layer — the same functions the new
MCP implementations_write feature wraps.

Run from repo root:
    python -m app.database.tools.apply_csueb_web_alignment --dry-run
    python -m app.database.tools.apply_csueb_web_alignment
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection

CAMPUS = "csueb"

ATI = "https://www.csueastbay.edu/ati"

# (label, impl_type, impl_unique_id, url, webpage_name, webpage_description)
WEBPAGE_ATTACHMENTS = [
    ("U1", "Guidance", "b84b0f46b2f64332b67abd5014efe725",
     f"{ATI}/web-accessibility.html",
     "CSUEB ATI - Web Accessibility",
     "Campus web accessibility guidance: quick-start checklist for web editors and "
     "developers, four-principles evaluation, and testing methods."),
    ("U2", "Guidance", "77c3cc2b8b414006ab988243af0719cc",
     f"{ATI}/faq/index.html",
     "CSUEB ATI - FAQ",
     "ATI frequently asked questions: program scope, instructional materials and "
     "alternate formats, Canvas accessibility, barrier reporting."),
    ("U3", "Service", "d46bab54020b440d856c460f6148d794",
     "https://sfbrn.service-now.com/esc",
     "SFBRN Employee Service Center - accessibility barrier reporting",
     "ServiceNow ESC portal through which the Report an Accessibility Barrier form "
     "is now reached (the older catalog-item deep link still resolves)."),
    ("U4", "Guidance", "5184d8abb7a44b688c324eb0db5452ff",
     f"{ATI}/index.html",
     "CSUEB ATI home - Accessibility of this site",
     "ATI landing page carrying the published accessibility statement (WCAG 2.1 "
     "Level AA aim, barrier reporting routes)."),
    ("U5", "Guidance", "71f8b7e0653149e1b1ccc7d3411fc9c6",
     f"{ATI}/instructional-materials/faculty-staff.html",
     "CSUEB Instructional Materials - Faculty & Staff",
     "Per-term faculty responsibilities, accessibility training (Accessibility "
     "Compliance for Digital Teaching & Learning workshops), accommodation response."),
    ("U6", "Guidance", "4d43f6f74e0f4d29bd351db948a6d9fa",
     f"{ATI}/instructional-materials/faculty-staff.html",
     "CSUEB Instructional Materials - Faculty & Staff",
     "Per-term faculty responsibilities, accessibility training (Accessibility "
     "Compliance for Digital Teaching & Learning workshops), accommodation response."),
    ("U6", "Guidance", "4d43f6f74e0f4d29bd351db948a6d9fa",
     f"{ATI}/instructional-materials/students.html",
     "CSUEB Instructional Materials - Students",
     "Student-facing instructional materials accessibility: Accessibility Services, "
     "Assistive Technology Office, rights under ADA Title II."),
    ("U7", "Procedure", "f8e96ec87cb24b4cad8667483f7a5564",
     "https://www.csueastbay.edu/ict/index.html",
     "CSUEB ICT Purchases",
     "Public face of the ICT acquisition accessibility review: CSUBuy Procure-to-Pay "
     "intake, the five review categories, VPAT and ISO reviews."),
]

# (label, impl_type, impl_unique_id, new_description)
DESCRIPTION_UPDATES = [
    ("U1", "Guidance", "b84b0f46b2f64332b67abd5014efe725",
     "All CSU programs, services, and activities should be accessible to all students, "
     "staff, faculty, and the general public. This encompasses all technology products "
     "used to deliver academic programs and services, student services, information "
     "technology services, and auxiliary programs and services. The campus ATI web "
     "accessibility section publishes the current guidance: a quick-start checklist for "
     "web editors and developers (unique page titles, heading structure, alternate text, "
     "skip links, captions and transcripts, keyboard accessibility, meaningful markup, "
     "color and styling), evaluation guidance organized around the four WCAG principles "
     "(perceivable, operable, understandable, robust), and recommended testing methods "
     "(keyboard navigation, screen reader spot-checks, automated checkers). Target "
     "standard: WCAG 2.1 Level AA."),
    ("U2", "Guidance", "77c3cc2b8b414006ab988243af0719cc",
     "The Accessible Technology Initiative (ATI) is the California State University (CSU) "
     "systemwide effort to ensure that information and communication technology (ICT) is "
     "accessible to students, employees, and the public. ATI supports compliance with the "
     "Americans with Disabilities Act (ADA), Section 504 and Section 508 of the "
     "Rehabilitation Act, California Government Code 11135, Executive Order 1111, and CSU "
     "policy. Vision: create a culture of access for an inclusive learning and working "
     "environment. Mission: help implement CSU accessibility policy through accessible "
     "practices for the web, instructional materials, and technology procurement, applying "
     "universal design for broad accessibility. Focus areas: web accessibility, "
     "instructional materials, ICT procurement. Current priorities (2025-26): supporting "
     "document and course remediation, reducing barriers on high-traffic pages, and "
     "ensuring new ICT purchases follow accessibility review."),
    ("U4", "Guidance", "5184d8abb7a44b688c324eb0db5452ff",
     "Public accessibility statement published on the CSUEB ATI pages ('Accessibility of "
     "this site'): Cal State East Bay aims for WCAG 2.1 Level AA conformance, with "
     "published barrier-reporting routes (ServiceNow barrier report form, Accessibility "
     "Services contact) and links to complaint and appeal resolution. Supersedes the "
     "standard template footer statement."),
    ("U6", "Guidance", "4d43f6f74e0f4d29bd351db948a6d9fa",
     "The Instructional Materials (IM) priority within the Accessible Technology "
     "Initiative (ATI) focuses on the access and development of course materials that "
     "support the teaching and learning mission of the university. Instructional "
     "materials are a form of communication and must therefore be delivered in a way "
     "that is usable by students with disabilities, in alignment with the ADA (including "
     "the Title II web and mobile accessibility rule requiring WCAG 2.1 Level AA "
     "conformance by April 24, 2026), Sections 504 and 508 of the Rehabilitation Act, "
     "California Government Code 11135, and CSU Executive Order 1111. Instructional "
     "materials cover any content used for teaching and learning - digital textbooks, "
     "documents, Canvas components, presentations, multimedia, assessments, and "
     "interactive activities - and must provide equally effective communication: "
     "comparable in quality, comparable in timeliness, and delivered in a manner and "
     "medium appropriate to the significance of the message and the abilities of the "
     "person receiving it."),
]

C1_TITLE = "Media Captioning & Prioritization Guidance"
C1_TYPE = "Guidance"
C1_DESCRIPTION = (
    "Published campus guidance for captioning and media accessibility: all video with "
    "audio requires accurate, synchronized captions meeting WCAG 2.1 Level AA; audio-only "
    "content requires full-text transcripts; live-streamed events with accommodation "
    "requests require real-time captioning; auto-generated captions must be reviewed and "
    "corrected before use. Includes a prioritization framework (high priority: individual "
    "accommodation requests, multimedia used repeatedly or for extended periods, "
    "public-facing web content; lower: single-term lecture capture without accommodation "
    "requests) and request routing - courses and academic content via Accessibility "
    "Services or Online Campus, events and marketing video via University Communications, "
    "purchased media via ICT Purchases and the ATI team."
)
C1_WEBPAGE = (f"{ATI}/captioning/index.html",
              "CSUEB ATI - Captioning & Media Accessibility",
              "Campus captioning guidance: requirements, prioritization, request routing.")
C1_INDICATORS = ["2.6-web", "1.12-web"]
C1_YEARS = ["2025-2026", "2026-2027"]

D1_DUP_ID = "866d491e029549a78555c4737c9b0dd5"      # "CSUEB P-card Policy" (empty, no webpage)
D1_KEEPER_ID = "86aa1e4ecbad4f778af673e2a5163913"   # "CSUEB Pcard Policy" (PolicyStat webpage)
D1_TYPE = "InternalPolicy"
D1_FINAL_TITLE = "CSUEB P-card Policy"
D1_FINAL_DESCRIPTION = "CSUEB procurement card (P-card) policy, published on PolicyStat."

D2_ID = "fd50218af00c4380aed5ad1d8c214025"
D2_TYPE = "Guidance"
D2_FINAL_TITLE = "Informal Accessible Course Content Guidelines"


def log(label, message):
    print(f"[{label}] {message}")


def webpage_attached(impl_id, url):
    from neomodel import db
    rows, _ = db.cypher_query(
        "MATCH (n {unique_id: $id})-[:is_documented_by]->(w:Webpage {url: $url}) RETURN count(w)",
        {"id": impl_id, "url": url})
    return rows[0][0] > 0


def apply_webpage_attachments(dry_run):
    from app.database.queries.documentation.create import add_webpage
    for label, impl_type, impl_id, url, name, desc in WEBPAGE_ATTACHMENTS:
        if webpage_attached(impl_id, url):
            log(label, f"already attached, skipping: {url}")
            continue
        if dry_run:
            log(label, f"WOULD attach {url} -> {impl_type} {impl_id}")
            continue
        add_webpage(url=url, name=name, no_longer_exists=False, depreciated=False,
                    depreciated_date=None, description=desc, include_in_report=True,
                    implementation_id=impl_id, implementation_type=impl_type)
        log(label, f"attached {url}")


def apply_description_updates(dry_run):
    from app.database.queries.implementation.update import update_implementation_fields
    for label, impl_type, impl_id, new_desc in DESCRIPTION_UPDATES:
        if dry_run:
            log(label, f"WOULD refresh description of {impl_type} {impl_id} "
                       f"({len(new_desc)} chars)")
            continue
        update_implementation_fields(implementation_type=impl_type,
                                     implementation_unique_id=impl_id,
                                     description=new_desc)
        log(label, f"description refreshed on {impl_type} {impl_id}")


def link_if_yse_exists(label, impl_type, impl_title, year_identifier, dry_run):
    from app.database.graph_schema import YearSuccessEvidence
    from app.database.queries.evidence.update import (
        assign_implementation_to_year_success_indicator)
    from app.endpoints.data_api.errors.custom_exceptions import CrudError
    if YearSuccessEvidence.nodes.get_or_none(year_identifier=year_identifier) is None:
        log(label, f"no YSE {year_identifier} - skipping link")
        return
    if dry_run:
        log(label, f"WOULD link '{impl_title}' -> {year_identifier}")
        return
    try:
        assign_implementation_to_year_success_indicator(
            year_success_identifier=year_identifier,
            implementation_type=impl_type,
            implementation_title=impl_title)
        log(label, f"linked '{impl_title}' -> {year_identifier}")
    except CrudError as e:
        if "already assigned" in str(e):
            log(label, f"already linked: {year_identifier}")
        else:
            raise


def apply_c1(dry_run):
    from app.database.class_factory import implementation_classes
    from app.database.queries.documentation.create import add_webpage
    from app.database.queries.implementation.create import add_guidance

    guidance_cls = implementation_classes[C1_TYPE]
    node = guidance_cls.nodes.get_or_none(title=C1_TITLE)
    if node is None:
        if dry_run:
            log("C1", f"WOULD create {C1_TYPE} '{C1_TITLE}'")
        else:
            add_guidance(title=C1_TITLE, description=C1_DESCRIPTION)
            node = guidance_cls.nodes.get(title=C1_TITLE)
            log("C1", f"created {C1_TYPE} '{C1_TITLE}' ({node.unique_id})")
    else:
        log("C1", f"exists ({node.unique_id}), skipping create")

    url, name, desc = C1_WEBPAGE
    if node is not None and webpage_attached(node.unique_id, url):
        log("C1", f"webpage already attached: {url}")
    elif dry_run:
        log("C1", f"WOULD attach {url}")
    else:
        add_webpage(url=url, name=name, no_longer_exists=False, depreciated=False,
                    depreciated_date=None, description=desc, include_in_report=True,
                    implementation_id=node.unique_id, implementation_type=C1_TYPE)
        log("C1", f"attached {url}")

    for key in C1_INDICATORS:
        for year in C1_YEARS:
            link_if_yse_exists("C1", C1_TYPE, C1_TITLE, f"{year}-{key}-{CAMPUS}", dry_run)


def apply_d1(dry_run):
    from neomodel import db
    from app.database.class_factory import implementation_classes
    from app.database.queries.implementation.delete import delete_implementation
    from app.database.queries.implementation.update import update_implementation_fields

    policy_cls = implementation_classes[D1_TYPE]
    keeper = policy_cls.nodes.get_or_none(unique_id=D1_KEEPER_ID)
    if keeper is None:
        log("D1", f"keeper {D1_KEEPER_ID} not found - ABORTING merge")
        return
    dup = policy_cls.nodes.get_or_none(unique_id=D1_DUP_ID)

    if dup is not None:
        rows, _ = db.cypher_query(
            "MATCH (n {unique_id: $id})-[:is_evidence_for]->(yse:YearSuccessEvidence) "
            "RETURN yse.year_identifier ORDER BY yse.year_identifier",
            {"id": D1_DUP_ID})
        yse_ids = [r[0] for r in rows]
        log("D1", f"duplicate evidences {len(yse_ids)} YSE(s): {yse_ids}")
        for year_identifier in yse_ids:
            link_if_yse_exists("D1", D1_TYPE, keeper.title, year_identifier, dry_run)
        if dry_run:
            log("D1", f"WOULD delete duplicate '{dup.title}' ({D1_DUP_ID})")
        else:
            delete_implementation(D1_DUP_ID)
            log("D1", f"deleted duplicate ({D1_DUP_ID})")
    else:
        log("D1", "duplicate already gone, skipping move/delete")

    needs_rename = keeper.title != D1_FINAL_TITLE or (keeper.description or "") == ""
    if not needs_rename:
        log("D1", "keeper already normalized")
    elif dry_run:
        log("D1", f"WOULD normalize keeper -> '{D1_FINAL_TITLE}'")
    else:
        update_implementation_fields(implementation_type=D1_TYPE,
                                     implementation_unique_id=D1_KEEPER_ID,
                                     title=D1_FINAL_TITLE,
                                     description=D1_FINAL_DESCRIPTION)
        log("D1", f"keeper normalized -> '{D1_FINAL_TITLE}'")


def apply_d2(dry_run):
    from app.database.class_factory import implementation_classes
    from app.database.queries.implementation.update import update_implementation_fields
    node = implementation_classes[D2_TYPE].nodes.get_or_none(unique_id=D2_ID)
    if node is None:
        log("D2", f"{D2_ID} not found - skipping")
        return
    if node.title == D2_FINAL_TITLE:
        log("D2", "title already fixed")
        return
    if dry_run:
        log("D2", f"WOULD rename '{node.title}' -> '{D2_FINAL_TITLE}'")
        return
    update_implementation_fields(implementation_type=D2_TYPE,
                                 implementation_unique_id=D2_ID,
                                 title=D2_FINAL_TITLE)
    log("D2", f"renamed -> '{D2_FINAL_TITLE}'")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--dry-run", action="store_true",
                    help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()

    mode = "DRY RUN" if args.dry_run else "APPLY"
    print(f"=== CSUEB web-scan alignment [{mode}] ===")
    apply_webpage_attachments(args.dry_run)
    apply_description_updates(args.dry_run)
    apply_c1(args.dry_run)
    apply_d1(args.dry_run)
    apply_d2(args.dry_run)
    print("=== done ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
