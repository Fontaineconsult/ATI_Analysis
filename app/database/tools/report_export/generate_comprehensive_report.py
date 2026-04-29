"""
Comprehensive Report Generator for All ATI Working Groups
Generates a single HTML report containing all working groups with statistics and index
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List
from jinja2 import Environment, FileSystemLoader, select_autoescape
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group


def generate_comprehensive_report(academic_year: str = "2024-2025", output_dir: str = "reports") -> str:
    """
    Generate a comprehensive HTML report for all working groups using Jinja2 templates.

    Args:
        academic_year: The academic year to generate the report for
        output_dir: Directory to save the generated report

    Returns:
        Path to the generated HTML file
    """
    # Create output directory
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Define working groups
    working_groups_list = ["Web", "Procurement", "Instructional Materials"]

    print(f"Generating comprehensive report for {academic_year}...")
    print(f"Fetching data for {len(working_groups_list)} working groups...")

    # Fetch data for all working groups
    working_groups = []
    for wg_name in working_groups_list:
        try:
            print(f"  ✓ Fetching data for {wg_name}...")
            wg_data = fetch_evidence_for_working_group(wg_name, academic_year)
            wg_data['name'] = wg_name  # Add working group name to data
            working_groups.append(wg_data)
        except Exception as e:
            print(f"  ✗ Error fetching data for {wg_name}: {str(e)}")
            # Continue with empty data for this working group
            working_groups.append({
                'name': wg_name,
                'workingGroup': wg_name,
                'goals': [],
                'allAccomplishments': []
            })

    # Setup Jinja2 environment
    template_dir = Path(__file__).parent
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(['html', 'xml'])
    )

    # Load template
    template = env.get_template('comprehensive_report_template.html')

    # Prepare template context
    context = {
        'academic_year': academic_year,
        'generation_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'working_groups': working_groups
    }

    # Render template
    print("Rendering template...")
    html_content = template.render(context)

    # Save to file
    output_file = output_dir / f"comprehensive_report_{academic_year}.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✓ Report generated successfully: {output_file}")

    # Generate summary statistics
    print("\nSummary Statistics:")
    print(f"  • Working Groups: {len(working_groups)}")

    total_goals = sum(len(wg.get('goals', [])) for wg in working_groups)
    print(f"  • Total Goals: {total_goals}")

    total_indicators = 0
    total_evidences = 0
    total_plans = 0

    for wg in working_groups:
        for goal in wg.get('goals', []):
            total_indicators += len(goal.get('indicators', []))
            total_plans += len(goal.get('plans', []))

            for indicator in goal.get('indicators', []):
                total_evidences += len(indicator.get('evidences', []))
                for evidence in indicator.get('evidences', []):
                    total_plans += len(evidence.get('plans', []))

    print(f"  • Total Indicators: {total_indicators}")
    print(f"  • Total Evidence Items: {total_evidences}")
    print(f"  • Total Plans: {total_plans}")

    total_accomplishments = sum(len(wg.get('allAccomplishments', [])) for wg in working_groups)
    print(f"  • Total Accomplishments: {total_accomplishments}")

    return str(output_file)


def generate_individual_working_group_reports(academic_year: str = "2024-2025", output_dir: str = "reports") -> List[str]:
    """
    Generate individual HTML reports for each working group.

    Args:
        academic_year: The academic year to generate reports for
        output_dir: Directory to save the generated reports

    Returns:
        List of paths to generated HTML files
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    working_groups = ["Web", "Procurement", "Instructional Materials"]
    generated_files = []

    # Setup Jinja2 environment
    template_dir = Path(__file__).parent
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(['html', 'xml'])
    )

    # Load template
    template = env.get_template('comprehensive_report_template.html')

    for wg_name in working_groups:
        try:
            print(f"Generating report for {wg_name}...")

            # Fetch data
            wg_data = fetch_evidence_for_working_group(wg_name, academic_year)
            wg_data['name'] = wg_name

            # Prepare context with just this working group
            context = {
                'academic_year': academic_year,
                'generation_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'working_groups': [wg_data]  # Single working group
            }

            # Render template
            html_content = template.render(context)

            # Save to file
            output_file = output_dir / f"{wg_name.lower().replace(' ', '_')}_report_{academic_year}.html"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

            generated_files.append(str(output_file))
            print(f"  ✓ Generated: {output_file}")

        except Exception as e:
            print(f"  ✗ Error generating report for {wg_name}: {str(e)}")

    return generated_files


def create_master_index(academic_year: str = "2024-2025", output_dir: str = "reports"):
    """
    Create a master index page linking to all reports.

    Args:
        academic_year: The academic year for the reports
        output_dir: Directory containing the reports
    """
    output_dir = Path(output_dir)

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATI Reports Index - {academic_year}</title>
    <style>
        body {{
            font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
        }}
        .header {{
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c5282;
            margin: 0 0 10px 0;
        }}
        .reports-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .report-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }}
        .report-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }}
        .report-card h3 {{
            color: #2c5282;
            margin-bottom: 15px;
        }}
        .report-link {{
            display: inline-block;
            padding: 10px 20px;
            background: #3182ce;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
        }}
        .report-link:hover {{
            background: #2c5282;
        }}
        .meta {{
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>ATI Reports Index</h1>
        <p class="meta">Academic Year: {academic_year} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
    </div>

    <div class="reports-grid">
        <div class="report-card">
            <h3>📊 Comprehensive Report</h3>
            <p>Complete report containing all working groups with statistics and executive summary.</p>
            <a href="comprehensive_report_{academic_year}.html" class="report-link">View Comprehensive Report</a>
        </div>

        <div class="report-card">
            <h3>🌐 Web Working Group</h3>
            <p>Detailed report for the Web accessibility working group.</p>
            <a href="web_report_{academic_year}.html" class="report-link">View Web Report</a>
        </div>

        <div class="report-card">
            <h3>📋 Procurement Working Group</h3>
            <p>Detailed report for the Procurement working group.</p>
            <a href="procurement_report_{academic_year}.html" class="report-link">View Procurement Report</a>
        </div>

        <div class="report-card">
            <h3>📚 Instructional Materials Working Group</h3>
            <p>Detailed report for the Instructional Materials working group.</p>
            <a href="instructional_materials_report_{academic_year}.html" class="report-link">View Instructional Materials Report</a>
        </div>
    </div>

    <div style="text-align: center; color: #666; margin-top: 40px;">
        <p>ATI Evidence Tracking System - {academic_year}</p>
    </div>
</body>
</html>'''

    index_file = output_dir / "index.html"
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✓ Master index created: {index_file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Generate comprehensive ATI reports')
    parser.add_argument('--year', default='2024-2025', help='Academic year (default: 2024-2025)')
    parser.add_argument('--output', default='reports', help='Output directory (default: reports)')
    parser.add_argument('--mode', choices=['comprehensive', 'individual', 'both'],
                       default='both', help='Report generation mode')

    args = parser.parse_args()

    if args.mode in ['comprehensive', 'both']:
        # Generate comprehensive report
        generate_comprehensive_report(args.year, args.output)

    if args.mode in ['individual', 'both']:
        # Generate individual reports
        generate_individual_working_group_reports(args.year, args.output)

    # Always create master index
    create_master_index(args.year, args.output)

    print(f"\n✓ All reports generated in: {args.output}/")
    print(f"  Open {args.output}/index.html to view all reports")