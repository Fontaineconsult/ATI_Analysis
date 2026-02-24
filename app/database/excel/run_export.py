"""
Main entry point for generating the YSE Excel export.

Usage:
    python -m app.database.excel.run_export [academic_year]

Example:
    python -m app.database.excel.run_export 2023-2024
"""
import sys

from app.database.graph_schema import set_connection
from app.database.excel.data_prep import prepare_export_data
from app.database.excel.export import build_workbook


DEFAULT_ACADEMIC_YEAR = "2024-2025"


def main(academic_year: str = None):
    if academic_year is None:
        academic_year = DEFAULT_ACADEMIC_YEAR

    print(f"Connecting to database...")
    set_connection()

    print(f"Fetching data for academic year: {academic_year}")
    data = prepare_export_data(academic_year)

    wg_count = len(data['working_groups'])
    total_rows = sum(len(wg['rows']) for wg in data['working_groups'])
    print(f"Found {wg_count} working groups with {total_rows} total rows")
    print(f"Found {len(data['all_persons'])} persons, {len(data['all_campuses'])} campuses")

    print("Building Excel workbook...")
    filepath = build_workbook(data)

    print(f"Export complete: {filepath}")
    return filepath


if __name__ == "__main__":
    year = sys.argv[1] if len(sys.argv) > 1 else None
    main(year)
