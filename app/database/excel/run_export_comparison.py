"""
Campus Comparison Excel export — one tab per working group showing
side-by-side campus comparison.

Usage:
    python -m app.database.excel.run_export_comparison [academic_year]

Example:
    python -m app.database.excel.run_export_comparison 2024-2025
"""
import sys

from app.database.graph_schema import set_connection
from app.database.excel.data_prep_comparison import prepare_comparison_data
from app.database.excel.export_comparison import build_workbook


DEFAULT_ACADEMIC_YEAR = "2024-2025"


def main(academic_year: str = None):
    if academic_year is None:
        academic_year = DEFAULT_ACADEMIC_YEAR

    print("Connecting to database...")
    set_connection()

    print(f"Fetching comparison data for academic year: {academic_year}")
    data = prepare_comparison_data(academic_year)

    for wg in data["working_groups"]:
        goal_count = len(wg["goals"])
        indicator_count = sum(len(g["indicators"]) for g in wg["goals"])
        print(f"  {wg['name']}: {goal_count} goals, {indicator_count} indicators")

    print(f"Found {len(data['all_persons'])} persons")
    print(f"Found {len(data['all_status_levels'])} status levels")
    print(f"Found {len(data.get('all_documents', []))} documents/webpages")

    print("Building comparison workbook...")
    filepath = build_workbook(data)

    print(f"Export complete: {filepath}")
    return filepath


if __name__ == "__main__":
    year = sys.argv[1] if len(sys.argv) > 1 else None
    main(year)
