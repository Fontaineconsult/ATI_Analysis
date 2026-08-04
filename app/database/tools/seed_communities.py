#!/usr/bin/env python3
"""
Seed a starter set of CommunityOfPractice nodes.

Communities are freely creatable data, not a seeded vocabulary — this script is
convenience data entry through the sanctioned create path (create_community), nothing
more. Names cover the functional areas and specialties ATI work is actually staffed
from across campuses; deliberately NOT the working-group pillars as governance bodies
and NOT capacities (those are Roles — e.g. there is no 'ATI Coordinators' community).

Skip-if-exists by name, NOT upsert: communities are user-editable from the app, so a
re-run must never overwrite someone's edits. Delete via the /communities endpoint if a
seeded community turns out to be unwanted.

Run from repo root:
    python -m app.database.tools.seed_communities            # apply
    python -m app.database.tools.seed_communities --dry-run  # report only
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection, CommunityOfPractice

COMMUNITIES = {
    "Academic Technology": (
        "Academic technologists supporting the LMS, courseware, and classroom "
        "technology across campuses."
    ),
    "Faculty Development": (
        "Teaching-and-learning center staff (Centers for Teaching / EdTech) who train "
        "and support faculty in accessible and inclusive course design."
    ),
    "Faculty & Instructional Staff": (
        "Faculty and instructional staff who select, author, and remediate "
        "instructional materials and build accessible courses in the LMS."
    ),
    "Disability Services": (
        "Staff of campus disability services offices (DPRC / DSS) coordinating "
        "accommodations, testing services, and the student-facing side of accessible "
        "technology."
    ),
    "Alternative Media": (
        "Alternative media specialists producing accessible course materials — e-text, "
        "braille, tactile graphics, captioning, and document remediation."
    ),
    "Library": (
        "Library staff — including library IT and administration — working on "
        "accessible collections, e-resource and database accessibility, and "
        "accessibility advocacy with content vendors."
    ),
    "Information Technology": (
        "Central IT staff — CIO offices, infrastructure, and IT consultants — "
        "responsible for the accessibility of enterprise systems and services."
    ),
    "Web & Mobile Development": (
        "Web and mobile developers and designers building accessible campus sites and "
        "applications. Distinct from the Web working group (a governance committee "
        "with a workplan): this is every practitioner in the area, system-wide."
    ),
    "Technical Support": (
        "Desktop support, service desk, and technical services staff who provision and "
        "troubleshoot the technology people use day to day."
    ),
    "Web Content Contributors": (
        "Content editors and contributors who maintain pages, documents, and posts on "
        "campus sites — distinct from the developers and designers who build the "
        "platforms."
    ),
    "Multimedia & Video Production": (
        "Video and audio producers and publishers — captioning, transcription, and "
        "multimedia accessibility for course and campus media."
    ),
    "Procurement": (
        "Buyers and contract specialists who review VPATs/ACRs and negotiate "
        "accessibility requirements into purchases. Distinct from the Procurement "
        "working group (a governance committee with a workplan)."
    ),
    "Accounts Payable & Fiscal Services": (
        "Accounts payable and fiscal services staff whose payment and financial "
        "processes intersect the procure-to-pay accessibility workflow."
    ),
    "Marketing & Communications": (
        "Marketing and communications staff responsible for accessible public-facing "
        "content, email, social media, and brand platforms."
    ),
    "Human Resources": (
        "Human resources staff handling employee accommodations and the "
        "employment-side obligations of accessible technology."
    ),
    "Auxiliary Enterprises": (
        "Auxiliary and commercial operations — bookstores, university corporations, "
        "and other enterprise units whose vendor platforms reach campus users."
    ),
    "Student Affairs": (
        "Student affairs and student activities staff whose programs, events, and "
        "platforms serve students directly."
    ),
    "Administrative Support": (
        "Administrative support staff and purchase requestors whose day-to-day work "
        "routes purchases and processes through the accessibility workflow."
    ),
    "Executive Leadership": (
        "Executive sponsors — AVPs, deans, CIOs, and directors — who provide the "
        "executive support, policy authority, and resourcing the ATI depends on."
    ),
}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Seed starter CommunityOfPractice nodes.")
    ap.add_argument("--dry-run", action="store_true", help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()
    from app.database.queries.communities.create import create_community

    created, skipped = [], []
    for name, description in COMMUNITIES.items():
        if CommunityOfPractice.nodes.first_or_none(name=name):
            skipped.append(name)
            continue
        if not args.dry_run:
            create_community({"name": name, "description": description})
        created.append(name)

    verb = "WOULD " if args.dry_run else ""
    print(f"[seed-communities] {verb}created {len(created)}, "
          f"skipped {len(skipped)} existing (of {len(COMMUNITIES)})")
    for n in created:
        print("  created:  " + n)
    for n in skipped:
        print("  skipped:  " + n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
