#!/usr/bin/env python3
"""
Apply the approved SSU web-scan alignment (claude_files/ssu-web-scan-alignment.md).

One-off, idempotent. Scope approved 2026-08-13:
  A1-A7  grouped webpage attachments from accessibility.sonoma.edu onto existing
         nodes; fill six empty descriptions.
  C1     create Guidance "SSU ATI Program Overview (Committee & Ambassadors)"
         grouping the two ATI pages + what-can-i-do; evidence links to the per-WG
         committee indicators (7.5-web, 9.1-pro, 9.2-ins) — NO -gov indicators
         (user: gov not in use yet), 2025-2026 ONLY.
  C2     create Guidance "SSU Captioning Guidelines & Style Guide" grouping the
         captioning guidelines + style guide pages; evidences 2.6-web + 1.12-web,
         2025-2026 ONLY.
  DQ1    fix the malformed Webpage url on CTET Accessibility Guidance (two URLs
         space-concatenated) -> point at the Google Doc; add the Google Form as
         its own attached Webpage.
  DQ2    merge the triplicate Course Instructional Materials Adoption policy into
         the PolicyStat node; move 5.11-ins + 7.1-ins links; delete both dups;
         retitle keeper "Course Instructional Materials Adoption Policy".
  DQ3    mark the /universal-access-hub Webpage no_longer_exists (HTTP 403).

Out of scope: baseline-timeline pages (historical), APARC retype (DQ4, flagged
only), any 2026-2027 evidence links.

Run from repo root:
    python -m app.database.tools.apply_ssu_web_alignment --dry-run
    python -m app.database.tools.apply_ssu_web_alignment
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection

CAMPUS = "ssu"
LINK_YEARS = ["2025-2026"]          # user: "we are only on 2025-2026" — no 2026-2027 links

ACC = "https://accessibility.sonoma.edu"

# (label, impl_type, impl_unique_id, url, webpage_name, webpage_description)
WEBPAGE_ATTACHMENTS = [
    ("A1", "Guidance", "df55ea6aeaac4ea794a14650f4ae969b",
     f"{ACC}/web/minimum-accessibility-requirements",
     "SSU Minimum Accessibility Requirements",
     "The 20-checkpoint Section 508 manual-evaluation standard for SSU web content "
     "(syntax/semantic validation, text and multimedia equivalents, color, tables, "
     "forms, navigation, user validation)."),
    ("A1", "Guidance", "df55ea6aeaac4ea794a14650f4ae969b",
     f"{ACC}/accessibility-basics-when-developing-digital-content",
     "SSU Accessibility Basics for Digital Content",
     "Campus basics for accessible digital content: modality equivalence, headings, "
     "meaningful links, 4.5:1 contrast, alt text, email and audio/video practices."),
    ("A2", "Guidance", "1e36c9aaae434f2594aef65c2c3e4cd9",
     f"{ACC}/it-purchasing-requirements",
     "SSU IT Purchasing Requirements",
     "Section 508 accessibility requirements for newly acquired electronic and IT "
     "systems; process detail lives in the IT knowledge base."),
    ("A2", "Guidance", "1e36c9aaae434f2594aef65c2c3e4cd9",
     f"{ACC}/it-purchasing-requirements/information-vendors",
     "SSU Information for Vendors",
     "Vendor-facing requirements: Gov Code 11135 / EO 926 basis, VPAT completion "
     "guide, CSU Section 508 manual evaluation method."),
    ("A2", "Guidance", "1e36c9aaae434f2594aef65c2c3e4cd9",
     f"{ACC}/software-accessibility-resources",
     "SSU Software Accessibility Resources",
     "Directory of accessibility guides and support articles for ~70 software "
     "applications and web services in use at SSU."),
    ("A3", "Guidance", "7f494374946644c181ce970a6fb11762",
     f"{ACC}/faculty-accessibility-guide",
     "SSU Faculty Accessibility Guide",
     "Faculty guide: what accessibility is, legal basis, CTET training, @One "
     "courses, Universal Access Hub, OpenStax, DSS accommodation routing, "
     "responsibility for content accessibility."),
    ("A3", "Guidance", "7f494374946644c181ce970a6fb11762",
     f"{ACC}/documents-multimedia",
     "SSU Documents & Multimedia Accessibility",
     "How-tos for accessible syllabi (template), PDFs, Word, PowerPoint, and "
     "captioning, with WebAIM/Adobe/NCDAE resources."),
    ("A4", "InternalPolicy", "d16bd34bec49433dab9f470f978f2d1e",
     f"{ACC}/instructional-materials",
     "SSU Instructional Materials Accessibility",
     "Instructional materials accessibility guidance: syllabus accessibility "
     "statement requirement (WCAG 2.1), privacy, early accommodation requests, "
     "DSS and CTET contacts."),
    ("A6", "Guidance", "99060a9a0f7547079cd213438db6e012",
     f"{ACC}/training/accessibility-demo-videos",
     "SSU Accessibility Demo Videos",
     "Video training directory: SiteImprove dashboard, misspellings and broken "
     "links, plus Word, Google Docs, Canvas, and mobile accessibility playlists."),
]

# (label, impl_type, impl_unique_id, new_description)
DESCRIPTION_UPDATES = [
    ("A1", "Guidance", "df55ea6aeaac4ea794a14650f4ae969b",
     "SSU's published web accessibility guidance: site editors must follow accessible "
     "design and coding standards (Section 508, EO 926, CSU ATI), with Help Desk ticket "
     "support for editors. Backed by the 20-checkpoint Minimum Accessibility "
     "Requirements (the CSU Section 508 manual-evaluation standard: valid syntax and "
     "semantics, text and multimedia equivalents, color independence, accessible "
     "tables, forms, navigation and skip links, user validation) and by the digital "
     "content basics page (modality equivalence, heading structure, meaningful links, "
     "12pt+ fonts at 4.5:1 contrast, alt text, simple formatting, multiple formats, "
     "avoiding PDFs when feasible)."),
    ("A2", "Guidance", "1e36c9aaae434f2594aef65c2c3e4cd9",
     "SSU's published accessible procurement guidance. Accessibility is evaluated from "
     "the earliest stages of software/web-service procurement: purchase requests enter "
     "via CSUBuy P2P; IT reviews information security and accessibility; VPATs/ACRs "
     "are examined for WCAG 2.1 alignment; procurements are risk-classified by user "
     "scope; Equally Effective Alternative Access Plans (EEAAPs) are developed where "
     "barriers exist; documents route for signature before purchase. Low-risk TPR "
     "minimum 14 days. Scope covers web applications, hardware, software, "
     "telecommunications, multimedia, copiers, kiosks, and similar (Section 508, Gov "
     "Code 11135, EO 926). Vendor-facing VPAT guidance and a directory of software "
     "accessibility resources are published alongside."),
    ("A3", "Guidance", "7f494374946644c181ce970a6fb11762",
     "CTET-centered accessibility guidance for SSU faculty: accessibility training "
     "for Canvas and related platforms, the Faculty Accessibility Guide (legal basis, "
     "where to get help, who assists students, what materials must be accessible, "
     "responsibility for remediation), @One self-paced courses, OpenStax accessible "
     "textbooks, and documents & multimedia how-tos (accessible syllabi, PDF, Word, "
     "PowerPoint, captioning). Accommodation requests route through Disability "
     "Services for Students."),
    ("A5", "Service", "74e8d022ab6947459d4f020bac84be5f",
     "Downloadable Microsoft Word syllabus template meeting accessibility standards, "
     "aligned to SSU Syllabus Policy #2006-2 (2025 revision). Faculty type over the "
     "template directly or paste prior syllabus content section by section with "
     "'Match Destination Formatting' to preserve accessible styling; links are "
     "formatted as page name followed by URL; the instructions page is deleted "
     "before distribution."),
    ("A6", "Guidance", "99060a9a0f7547079cd213438db6e012",
     "Training for SiteImprove and related accessibility tooling, anchored by the "
     "published accessibility demo video directory: SiteImprove dashboard training "
     "plus misspelling/broken-link workflows, alongside Word, Google Docs, Canvas, "
     "and mobile-device accessibility playlists."),
    ("A7", "Guidance", "a6fecfb2e5d84ac1bce3ebddc2b6e0f0",
     "SSU's published web accessibility statement: commitment to an inclusive "
     "environment and WCAG 2.0 AA conformance for university web content, with an "
     "accessibility concern reporting route via the SFBRN help ticket form."),
]

C1 = {
    "type": "Guidance",
    "title": "SSU ATI Program Overview (Committee & Ambassadors)",
    "description": (
        "How the Accessible Technology Initiative is organized at Sonoma State. The "
        "ATI Committee meets monthly under a Presidential mandate and covers the "
        "three priority areas (Web, Procurement, Instructional Materials); chaired "
        "by Dr. Sandy Ayala (Faculty Fellow). The ATI Ambassador Program places a "
        "faculty representative in each school with monthly strategy meetings, led "
        "by Dr. Justin Lipp. Supporting staffing: Universal Access support in IT "
        "(Accessibility Services Analyst), bookstore coordination for timely "
        "textbook ordering, DSS alternate-format production (2000+ pages per "
        "semester), CTET training and remediation. Published role-based guidance "
        "('What can I do?') covers faculty, staff, and student responsibilities."),
    "webpages": [
        (f"{ACC}/accessible-technology-initiative",
         "SSU Accessible Technology Initiative",
         "CSU ATI framing and SSU's commitment; stakeholder collaboration overview."),
        (f"{ACC}/accessible-technology-initiative-sonoma-state",
         "ATI at Sonoma State",
         "SSU-specific ATI organization: committee, ambassador program, staffing, "
         "priorities."),
        (f"{ACC}/what-can-i-do",
         "SSU Accessibility - What Can I Do?",
         "Role-based accessibility responsibilities for faculty, staff, and "
         "students."),
    ],
    # Per-WG committee-review indicators only — NO -gov (not in use yet).
    "indicators": ["7.5-web", "9.1-pro", "9.2-ins"],
}

C2 = {
    "type": "Guidance",
    "title": "SSU Captioning Guidelines & Style Guide",
    "description": (
        "Published campus guidance for captioning and media accessibility: all "
        "SSU-produced time-based media requires WCAG 2.1 AA compliant closed "
        "captioning; audio-only content requires text alternatives; live events "
        "require synchronized captions; automated captions must be manually reviewed "
        "and corrected. Approved no-cost platforms: YuJa (instructional), YouTube, "
        "Google Drive/Docs; other platforms (Vimeo, transcription and podcast "
        "services) require CSUBuy review; AutomaticSync provides professional "
        "WCAG-compliant captioning at department expense. The companion style guide "
        "(maintained by the Accessibility Services Analyst) sets caption content "
        "rules, white-on-black sans-serif presentation, 37-char/2-line limits, "
        "180wpm max reading speed, and sound/speaker notation. Captioning service "
        "contact: DSS (Stephanie Graham); YuJa support: CTET."),
    "webpages": [
        (f"{ACC}/web/captioning-guidelines-and-resources",
         "SSU Captioning Guidelines and Resources",
         "Captioning requirements, methods, platform list, and request routing."),
        (f"{ACC}/captioning-and-transcription-style-guide",
         "SSU Captioning & Transcription Style Guide",
         "Caption/transcript content, presentation, and timing rules."),
    ],
    "indicators": ["2.6-web", "1.12-web"],
}

# DQ1 — malformed Webpage url on CTET Accessibility Guidance
DQ1_BAD_URL_MARKER = "/edit  https://docs.google.com/forms/"
DQ1_DOC_URL = ("https://docs.google.com/document/d/"
               "1koJvMvracl2_UT4mdMgf0owJGsDecsOIKPKHZdlagJc/edit")
DQ1_FORM_URL = ("https://docs.google.com/forms/d/e/"
                "1FAIpQLScNp0OksLQD75Duhc_yqSZUQ6f-y4Y-SOmJ_g-OmTxeEGAwmQ/viewform")
DQ1_IMPL = ("Guidance", "7f494374946644c181ce970a6fb11762")

# DQ2 — triplicate merge
DQ2_KEEPER_ID = "db695b3e6fe84d19957d7c4c929152ce"   # "- Sonoma", PolicyStat, real description
DQ2_DUP_IDS = [
    "42250e094fa54f85ae891fd72c0dc842",              # "Course Instructional Materials Adoption"
    "4f48d85cff254fa79edf5748e633b93f",              # "Instructional Materials Adoption Policy"
]
DQ2_TYPE = "InternalPolicy"
DQ2_FINAL_TITLE = "Course Instructional Materials Adoption Policy"
DQ2_EXTRA_WEBPAGE = (
    "https://policies.sonoma.edu/policies/course-instructional-materials-adoption",
    "SSU Course Instructional Materials Adoption Policy",
    "The adoption policy as published on policies.sonoma.edu (also on PolicyStat).")

# DQ3 — dead page
DQ3_URL = f"{ACC}/universal-access-hub"


def log(label, message):
    print(f"[{label}] {message}")


def webpage_attached(impl_id, url):
    from neomodel import db
    rows, _ = db.cypher_query(
        "MATCH (n {unique_id: $id})-[:is_documented_by]->(w:Webpage {url: $url}) RETURN count(w)",
        {"id": impl_id, "url": url})
    return rows[0][0] > 0


def attach(label, impl_type, impl_id, url, name, desc, dry_run):
    from app.database.queries.documentation.create import add_webpage
    if webpage_attached(impl_id, url):
        log(label, f"already attached, skipping: {url}")
        return
    if dry_run:
        log(label, f"WOULD attach {url} -> {impl_type} {impl_id}")
        return
    add_webpage(url=url, name=name, no_longer_exists=False, depreciated=False,
                depreciated_date=None, description=desc, include_in_report=True,
                implementation_id=impl_id, implementation_type=impl_type)
    log(label, f"attached {url}")


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


def apply_attachments(dry_run):
    for label, impl_type, impl_id, url, name, desc in WEBPAGE_ATTACHMENTS:
        attach(label, impl_type, impl_id, url, name, desc, dry_run)


def apply_descriptions(dry_run):
    from app.database.queries.implementation.update import update_implementation_fields
    for label, impl_type, impl_id, new_desc in DESCRIPTION_UPDATES:
        if dry_run:
            log(label, f"WOULD fill description of {impl_type} {impl_id} "
                       f"({len(new_desc)} chars)")
            continue
        update_implementation_fields(implementation_type=impl_type,
                                     implementation_unique_id=impl_id,
                                     description=new_desc)
        log(label, f"description filled on {impl_type} {impl_id}")


def apply_create(label, spec, dry_run):
    from app.database.class_factory import implementation_classes
    from app.database.queries.implementation.create import add_guidance

    cls = implementation_classes[spec["type"]]
    node = cls.nodes.get_or_none(title=spec["title"])
    if node is None:
        if dry_run:
            log(label, f"WOULD create {spec['type']} '{spec['title']}'")
        else:
            add_guidance(title=spec["title"], description=spec["description"])
            node = cls.nodes.get(title=spec["title"])
            log(label, f"created {spec['type']} '{spec['title']}' ({node.unique_id})")
    else:
        log(label, f"exists ({node.unique_id}), skipping create")

    for url, name, desc in spec["webpages"]:
        if node is not None:
            attach(label, spec["type"], node.unique_id, url, name, desc, dry_run)
        elif dry_run:
            log(label, f"WOULD attach {url}")

    for key in spec["indicators"]:
        for year in LINK_YEARS:
            link_if_yse_exists(label, spec["type"], spec["title"],
                               f"{year}-{key}-{CAMPUS}", dry_run)


def apply_dq1(dry_run):
    from app.database.graph_schema import Webpage
    bad = None
    for w in Webpage.nodes.filter(url__contains=DQ1_BAD_URL_MARKER):
        bad = w
        break
    if bad is None:
        log("DQ1", "malformed webpage url not found (already fixed?)")
    elif Webpage.nodes.get_or_none(url=DQ1_DOC_URL) is not None:
        # Clean-URL node already exists; the malformed one is redundant only if we
        # merged it — don't guess, just report.
        log("DQ1", f"clean doc URL already exists separately; malformed node "
                   f"{bad.unique_id} left for manual review")
    elif dry_run:
        log("DQ1", f"WOULD rewrite malformed url on Webpage {bad.unique_id} -> {DQ1_DOC_URL}")
    else:
        bad.url = DQ1_DOC_URL
        bad.save()
        log("DQ1", f"rewrote url on Webpage {bad.unique_id}")
    impl_type, impl_id = DQ1_IMPL
    attach("DQ1", impl_type, impl_id, DQ1_FORM_URL,
           "CTET Accessibility Request Form",
           "Google Form companion to the CTET accessibility guidance document.",
           dry_run)


def apply_dq2(dry_run):
    from neomodel import db
    from app.database.class_factory import implementation_classes
    from app.database.queries.implementation.delete import delete_implementation
    from app.database.queries.implementation.update import update_implementation_fields

    cls = implementation_classes[DQ2_TYPE]
    keeper = cls.nodes.get_or_none(unique_id=DQ2_KEEPER_ID)
    if keeper is None:
        log("DQ2", f"keeper {DQ2_KEEPER_ID} not found - ABORTING merge")
        return

    for dup_id in DQ2_DUP_IDS:
        dup = cls.nodes.get_or_none(unique_id=dup_id)
        if dup is None:
            log("DQ2", f"duplicate {dup_id} already gone")
            continue
        rows, _ = db.cypher_query(
            "MATCH (n {unique_id: $id})-[:is_evidence_for]->(yse:YearSuccessEvidence) "
            "RETURN yse.year_identifier ORDER BY yse.year_identifier", {"id": dup_id})
        yse_ids = [r[0] for r in rows]
        log("DQ2", f"'{dup.title}' evidences {len(yse_ids)} YSE(s)")
        for year_identifier in yse_ids:
            link_if_yse_exists("DQ2", DQ2_TYPE, keeper.title, year_identifier, dry_run)
        if dry_run:
            log("DQ2", f"WOULD delete duplicate '{dup.title}' ({dup_id})")
        else:
            delete_implementation(dup_id)
            log("DQ2", f"deleted duplicate ({dup_id})")

    url, name, desc = DQ2_EXTRA_WEBPAGE
    attach("DQ2", DQ2_TYPE, DQ2_KEEPER_ID, url, name, desc, dry_run)

    if keeper.title == DQ2_FINAL_TITLE:
        log("DQ2", "keeper already retitled")
    elif dry_run:
        log("DQ2", f"WOULD retitle keeper -> '{DQ2_FINAL_TITLE}'")
    else:
        update_implementation_fields(implementation_type=DQ2_TYPE,
                                     implementation_unique_id=DQ2_KEEPER_ID,
                                     title=DQ2_FINAL_TITLE)
        log("DQ2", f"keeper retitled -> '{DQ2_FINAL_TITLE}'")


def apply_dq3(dry_run):
    from app.database.graph_schema import Webpage
    page = Webpage.nodes.get_or_none(url=DQ3_URL)
    if page is None:
        log("DQ3", f"no Webpage node for {DQ3_URL} - skipping")
        return
    if page.no_longer_exists:
        log("DQ3", "already marked no_longer_exists")
        return
    if dry_run:
        log("DQ3", f"WOULD mark no_longer_exists on Webpage {page.unique_id} (HTTP 403)")
        return
    page.no_longer_exists = True
    page.save()
    log("DQ3", f"marked no_longer_exists on Webpage {page.unique_id}")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--dry-run", action="store_true",
                    help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()

    mode = "DRY RUN" if args.dry_run else "APPLY"
    print(f"=== SSU web-scan alignment [{mode}] ===")
    apply_attachments(args.dry_run)
    apply_descriptions(args.dry_run)
    apply_create("C1", C1, args.dry_run)
    apply_create("C2", C2, args.dry_run)
    apply_dq1(args.dry_run)
    apply_dq2(args.dry_run)
    apply_dq3(args.dry_run)
    print("=== done ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
