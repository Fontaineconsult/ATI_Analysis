"""
Generate comprehensive report from raw-data.json file
This is a fallback option when Neo4j database is not available
"""

import json
from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape


def load_json_data(json_file_path: str) -> dict:
    """Load data from raw-data.json file"""
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('data', {})


def transform_json_to_working_groups(raw_data: dict) -> list:
    """
    Transform raw JSON data into the working group structure expected by the template
    This is a simplified transformation - adjust based on actual data structure
    """
    # Group data by working group based on year_identifier suffix
    working_groups = {
        'Web': {'name': 'Web', 'goals': [], 'allAccomplishments': []},
        'Procurement': {'name': 'Procurement', 'goals': [], 'allAccomplishments': []},
        'Instructional Materials': {'name': 'Instructional Materials', 'goals': [], 'allAccomplishments': []}
    }

    # Process accomplishments
    all_accomplishments = raw_data.get('allAccomplishments', [])
    for acc in all_accomplishments:
        # Try to determine working group from YSE identifiers
        if acc.get('advances_yse_list'):
            for yse in acc['advances_yse_list']:
                year_id = yse.get('properties', {}).get('year_identifier', '')
                if '-web' in year_id.lower():
                    working_groups['Web']['allAccomplishments'].append(acc)
                    break
                elif '-procurement' in year_id.lower():
                    working_groups['Procurement']['allAccomplishments'].append(acc)
                    break
                elif '-instructional' in year_id.lower():
                    working_groups['Instructional Materials']['allAccomplishments'].append(acc)
                    break

    # Since raw-data.json doesn't have the full goal/indicator structure,
    # we'll create a simplified version
    # In a real implementation, you'd need to parse the full data structure

    return list(working_groups.values())


def generate_report_from_json(
    json_file_path: str = None,
    academic_year: str = "2024-2025",
    output_dir: str = "reports"
) -> str:
    """
    Generate HTML report from JSON data file

    Args:
        json_file_path: Path to raw-data.json file
        academic_year: Academic year for the report
        output_dir: Directory to save the report

    Returns:
        Path to generated HTML file
    """
    # Find json file if not provided
    if json_file_path is None:
        # Try to find raw-data.json
        possible_paths = [
            Path(__file__).parent.parent.parent.parent.parent / 'app/frontend/src/raw-data.json',
            Path(__file__).parent.parent.parent.parent.parent / 'app/frontend/src/src/raw-data.json',
            Path('raw-data.json')
        ]

        for path in possible_paths:
            if path.exists():
                json_file_path = str(path)
                print(f"Found raw-data.json at: {json_file_path}")
                break

        if json_file_path is None:
            raise FileNotFoundError("Could not find raw-data.json file")

    # Create output directory
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading data from: {json_file_path}")
    raw_data = load_json_data(json_file_path)

    print("Transforming data...")
    working_groups = transform_json_to_working_groups(raw_data)

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
    output_file = output_dir / f"report_from_json_{academic_year}.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"[SUCCESS] Report generated successfully: {output_file}")

    # Print summary
    print("\nSummary:")
    print(f"  - Working Groups: {len(working_groups)}")
    total_accomplishments = sum(len(wg.get('allAccomplishments', [])) for wg in working_groups)
    print(f"  - Total Accomplishments Found: {total_accomplishments}")

    return str(output_file)


def generate_simple_report(raw_data: dict, output_file: str = "simple_report.html"):
    """
    Generate a simple HTML report directly from raw data
    This is a minimal version focusing on accomplishments and basic data
    """
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ATI Report - Simplified</title>
    <style>
        body {{
            font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
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
        .section {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h2 {{
            color: #3182ce;
            margin-bottom: 15px;
        }}
        .accomplishment {{
            background: #faf5ff;
            padding: 15px;
            margin: 10px 0;
            border-left: 3px solid #a855f7;
            border-radius: 4px;
        }}
        .yse-list {{
            color: #666;
            font-size: 0.9em;
            margin-top: 8px;
        }}
        .badge {{
            display: inline-block;
            padding: 2px 8px;
            background: #e0e7ff;
            color: #3730a3;
            border-radius: 4px;
            font-size: 0.85em;
            margin-right: 5px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>ATI Accomplishments Report</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
    </div>
'''

    # Group accomplishments by working group
    web_acc = []
    procurement_acc = []
    instructional_acc = []
    unassigned_acc = []

    for acc_item in raw_data.get('allAccomplishments', []):
        acc = acc_item.get('accomplishment', {})
        yse_list = acc_item.get('advances_yse_list', [])

        # Determine working group
        assigned = False
        for yse in yse_list:
            year_id = yse.get('properties', {}).get('year_identifier', '')
            if '-web' in year_id.lower():
                web_acc.append(acc_item)
                assigned = True
                break
            elif '-procurement' in year_id.lower():
                procurement_acc.append(acc_item)
                assigned = True
                break
            elif '-instructional' in year_id.lower():
                instructional_acc.append(acc_item)
                assigned = True
                break

        if not assigned:
            unassigned_acc.append(acc_item)

    # Generate sections
    sections = [
        ('Web Working Group', web_acc),
        ('Procurement Working Group', procurement_acc),
        ('Instructional Materials Working Group', instructional_acc),
        ('Unassigned', unassigned_acc)
    ]

    for section_name, accomplishments in sections:
        if accomplishments:
            html += f'''
    <div class="section">
        <h2>{section_name} ({len(accomplishments)} accomplishments)</h2>
'''
            for acc_item in accomplishments:
                acc = acc_item.get('accomplishment', {})
                props = acc.get('properties', {})
                yse_list = acc_item.get('advances_yse_list', [])

                html += f'''
        <div class="accomplishment">
            <strong>{props.get('name', 'Unnamed')}</strong>
            <p>{props.get('description', '')}</p>
'''
                if yse_list:
                    html += '            <div class="yse-list">Advances YSE: '
                    for yse in yse_list:
                        year_id = yse.get('properties', {}).get('year_identifier', 'Unknown')
                        html += f'<span class="badge">{year_id}</span>'
                    html += '</div>\n'

                html += '        </div>\n'

            html += '    </div>\n'

    html += '''
</body>
</html>'''

    # Save file
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"[SUCCESS] Simple report generated: {output_path}")
    return str(output_path)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Generate report from JSON data')
    parser.add_argument('--json', help='Path to raw-data.json file')
    parser.add_argument('--year', default='2024-2025', help='Academic year')
    parser.add_argument('--output', default='reports', help='Output directory')
    parser.add_argument('--simple', action='store_true', help='Generate simple report instead')

    args = parser.parse_args()

    if args.simple:
        # Generate simple report
        if args.json:
            raw_data = load_json_data(args.json)
        else:
            # Try to find the file
            json_path = Path(__file__).parent.parent.parent.parent.parent / 'app/frontend/src/raw-data.json'
            if not json_path.exists():
                json_path = Path('raw-data.json')
            raw_data = load_json_data(str(json_path))

        generate_simple_report(raw_data, f"{args.output}/simple_report.html")
    else:
        # Generate full report
        generate_report_from_json(args.json, args.year, args.output)