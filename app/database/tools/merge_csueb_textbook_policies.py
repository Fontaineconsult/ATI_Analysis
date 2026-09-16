#!/usr/bin/env python3
"""
Merge the two CSUEB textbook-adoption InternalPolicy nodes into one.

One-off, idempotent. Scope approved 2026-09-14:
  M1  attach the Academic Affairs Directive 2018-01 PDF (the only thing the
      retiring node uniquely held) to the keeper, included in 2024-2025,
      2025-2026 and 2026-2027 to match its inclusion on the retiring node.
  M2  rewrite the keeper's description so it covers both instruments at the
      level of what they are for. The clause-by-clause content stays in the
      Source Text on the two attached webpages, where it can be read directly.
  M3  retire "Policy on Timely Adoption to Assure Accessibility and
      Affordability of Textbooks" with a note naming the keeper.

Keeper   410a57b968544b37a8c3ca2441f7925b  24-25 CIC 47/FAC 14/FDEC 5
Retiring 667e1005aa96485fb4c4fda5418720bb  Policy on Timely Adoption

No evidence is lost. The retiring node's four is_evidence_for edges
(1.1-ins in 2024-2025, 2025-2026, 2026-2027 and 4.5-ins in 2025-2026) are a
strict subset of the keeper's twenty-six, carrying identical strength and
control, so nothing needs copying. Historical links on the retired node are
left in place; the report renders them marked retired.

The keeper's title does not change. It is the formal Senate citation, it is
unique-indexed, and renaming it breaks the reference.

Explicitly out of scope (flagged, not approved): retiring
"2007-08 CIC 8 - Policy on Course Material Accessibility" (a5926f875c6f4229ab704446b6bab7b0),
which CIC 47's own background text says it replaces.

Everything goes through the sanctioned queries layer.

Run from repo root:
    python -m app.database.tools.merge_csueb_textbook_policies --dry-run
    python -m app.database.tools.merge_csueb_textbook_policies
"""
import argparse
import sys

import app.endpoints.data_api  # noqa: F401  (warm data_api before queries-layer imports)
from app.database.graph_schema import set_connection

IMPL_TYPE = "InternalPolicy"

KEEPER_ID = "410a57b968544b37a8c3ca2441f7925b"
RETIRING_ID = "667e1005aa96485fb4c4fda5418720bb"

# The Academic Affairs Directive 2018-01 PDF, currently only on the retiring node.
PDF_WEBPAGE_ID = "23839e47e47c40eb88236de3b25721ed"
PDF_YEARS = ["2024-2025", "2025-2026", "2026-2027"]

MERGED_DESCRIPTION = (
    "Textbook adoption and course material accessibility at CSU East Bay are governed by two "
    "instruments, recorded here as one.\n\n"
    "Academic Affairs Directive 2018-01, Policy on Timely Adoption to Assure Accessibility and "
    "Affordability of Textbooks, sets the adoption deadline and the machinery around it, so that "
    "materials are chosen early enough to be remediated and priced for students.\n\n"
    "24-25 CIC 47/FAC 14/FDEC 5, The Policy on Accessibility in Textbooks and Instructional "
    "Materials, is Academic Senate policy approved in 2025 against the April 2026 ADA Title II "
    "date. It replaces 2007-08 CIC 8 and defines what faculty must deliver for course materials "
    "to count as accessible. It does not replace the directive: it requires faculty to meet that "
    "adoption deadline and attaches accessibility obligations to what they adopt.\n\n"
    "The deadline is the mechanism and the accessibility standard is the requirement it serves."
)

RETIRED_DATE = "2026-09-14"
RETIRED_NOTE = (
    "Merged into 24-25 CIC 47/FAC 14/FDEC 5: The Policy on Accessibility in Textbooks and "
    "Instructional Materials (410a57b968544b37a8c3ca2441f7925b), which cites this directive as "
    "the adoption deadline it requires faculty to meet. Directive 2018-01 remains in force at "
    "the campus. Its four evidence links were already carried by CIC 47 at the same strength and "
    "control, and the Academic Affairs PDF is attached to that node as well."
)


def log(step, message):
    print(f"[{step}] {message}")


def apply_m1(dry_run):
    """Attach the Directive 2018-01 PDF to the keeper, one call per year."""
    from app.database.queries.implementation.update import assign_documentation_to_implementation

    for year in PDF_YEARS:
        if dry_run:
            log("M1", f"WOULD attach webpage {PDF_WEBPAGE_ID} to keeper for {year}")
            continue
        assign_documentation_to_implementation(
            implementation_id=KEEPER_ID,
            implementation_type=IMPL_TYPE,
            documentation_type="webpage",
            documentation_id=PDF_WEBPAGE_ID,
            academic_year=year,
            include_in_year=True,
        )
        log("M1", f"attached webpage {PDF_WEBPAGE_ID} to keeper for {year}")


def apply_m2(dry_run):
    """Rewrite the keeper's description to cover both instruments."""
    from app.database.queries.implementation.update import update_implementation_fields

    if dry_run:
        log("M2", f"WOULD set keeper description ({len(MERGED_DESCRIPTION)} chars)")
        return
    update_implementation_fields(
        implementation_type=IMPL_TYPE,
        implementation_unique_id=KEEPER_ID,
        description=MERGED_DESCRIPTION,
    )
    log("M2", f"set keeper description ({len(MERGED_DESCRIPTION)} chars)")


def apply_m3(dry_run):
    """Retire the Timely Adoption node."""
    from app.database.queries.implementation.update import retire_implementation

    if dry_run:
        log("M3", f"WOULD retire {RETIRING_ID} dated {RETIRED_DATE}")
        return
    retire_implementation(
        IMPL_TYPE,
        RETIRING_ID,
        True,
        retired_date=RETIRED_DATE,
        retired_note=RETIRED_NOTE,
    )
    log("M3", f"retired {RETIRING_ID} dated {RETIRED_DATE}")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--dry-run", action="store_true",
                    help="Report what would change without writing.")
    args = ap.parse_args(argv)

    set_connection()

    mode = "DRY RUN" if args.dry_run else "APPLY"
    print(f"=== CSUEB textbook policy merge [{mode}] ===")
    apply_m1(args.dry_run)
    apply_m2(args.dry_run)
    apply_m3(args.dry_run)
    print("=== done ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
