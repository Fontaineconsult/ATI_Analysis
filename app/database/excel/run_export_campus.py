"""
Campus-scoped Excel export — one tab per campus, all working groups per tab.

Usage:
    python -m app.database.excel.run_export_campus [academic_year]

Example:
    python -m app.database.excel.run_export_campus 2024-2025
"""
import sys

from app.database.graph_schema import set_connection
from app.database.excel.data_prep_campus import prepare_export_data
from app.database.excel.export_campus import build_workbook


DEFAULT_ACADEMIC_YEAR = "2024-2025"


def main(academic_year: str = None):
    if academic_year is None:
        academic_year = DEFAULT_ACADEMIC_YEAR

    print("Connecting to database...")
    set_connection()

    print(f"Fetching data for academic year: {academic_year}")
    data = prepare_export_data(academic_year)

    campus_count = len(data['campuses'])
    total_rows = 0
    for campus in data['campuses']:
        campus_rows = sum(len(wg['rows']) for wg in campus['working_groups'])
        total_rows += campus_rows
        print(f"  {campus['abbreviation']}: {campus_rows} rows across {len(campus['working_groups'])} working groups")

    print(f"Total: {campus_count} campuses, {total_rows} rows")
    print(f"Found {len(data['all_persons'])} persons")

    print("Building Excel workbook...")
    filepath = build_workbook(data)

    print(f"Export complete: {filepath}")
    return filepath


if __name__ == "__main__":
    year = sys.argv[1] if len(sys.argv) > 1 else None
    main(year)
