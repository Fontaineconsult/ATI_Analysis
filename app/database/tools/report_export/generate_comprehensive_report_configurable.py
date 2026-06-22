"""
Comprehensive Report Generator with Configurable Database Connection
Allows switching between local and remote Neo4j databases
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from neomodel import get_config


def configure_database_connection(use_remote: bool = False, env_file: Optional[str] = None):
    """
    Configure database connection using environment files

    Args:
        use_remote: If True, use remote connection; if False, use local
        env_file: Optional path to custom .env file
    """
    # Determine which .env file to use
    if env_file and os.path.exists(env_file):
        dotenv_path = env_file
        print(f"Using custom environment file: {dotenv_path}")
    elif use_remote:
        dotenv_path = os.path.join(
            Path(__file__).parent.parent.parent.parent,
            '.env.remote'
        )
        print("Using remote connection configuration")
    else:
        dotenv_path = os.path.join(
            Path(__file__).parent.parent.parent.parent,
            '.env.development'
        )
        print("Using local/development connection configuration")

    # Check if file exists
    if not os.path.exists(dotenv_path):
        raise FileNotFoundError(f"Environment file not found: {dotenv_path}")

    # Load environment variables
    load_dotenv(dotenv_path, override=True)
    print(f"Loaded environment from: {dotenv_path}")

    # Configure neomodel
    database_url = os.environ.get('DATABASE_CONNECTOR') or os.environ.get('DATABASE_URL')
    database_name = os.environ.get('NEO4J_DATABASE') or 'ati'

    if not database_url:
        raise ValueError("DATABASE_CONNECTOR or DATABASE_URL must be set in environment file")

    get_config().database_url = database_url
    get_config().database_name = database_name

    print(f"Database Configuration:")
    print(f"  URL: {database_url}")
    print(f"  Database: {database_name}")

    return database_url, database_name


def fetch_evidence_for_working_group_with_config(working_group: str, academic_year: str, use_remote: bool = False):
    """
    Fetch evidence data with configurable connection

    Args:
        working_group: Name of the working group
        academic_year: Academic year to fetch data for
        use_remote: If True, use remote database; if False, use local

    Returns:
        Dictionary containing the evidence data
    """
    # Import here to ensure config is set first
    from app.database.queries.compound_queries.get_all_by_working_group import fetch_evidence_for_working_group
    from app.database.graph_schema import set_connection

    # Set connection based on configuration
    set_connection(remote=use_remote)

    # Fetch and return data - pass use_remote to avoid connection override
    return fetch_evidence_for_working_group(working_group, academic_year, use_remote=use_remote)


def generate_comprehensive_report(
    academic_year: str = "2024-2025",
    output_dir: str = "reports",
    use_remote: bool = False,
    env_file: Optional[str] = None,
    working_groups_list: Optional[List[str]] = None
) -> str:
    """
    Generate a comprehensive HTML report for all working groups using Jinja2 templates.

    Args:
        academic_year: The academic year to generate the report for
        output_dir: Directory to save the generated report
        use_remote: If True, use remote database; if False, use local
        env_file: Optional path to custom .env file
        working_groups_list: Optional list of working groups to include

    Returns:
        Path to the generated HTML file
    """
    # Configure database connection
    try:
        database_url, database_name = configure_database_connection(use_remote, env_file)
    except Exception as e:
        print(f"Error configuring database: {e}")
        print("Falling back to JSON mode...")
        # Could fall back to JSON here
        raise

    # Create output directory
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Define working groups
    if working_groups_list is None:
        working_groups_list = ["Web", "Procurement", "Instructional Materials"]

    print(f"\nGenerating comprehensive report for {academic_year}...")
    print(f"Database: {database_name} at {database_url.split('@')[1] if '@' in database_url else database_url}")
    print(f"Fetching data for {len(working_groups_list)} working groups...")

    # Fetch data for all working groups
    working_groups = []
    successful_fetches = 0

    for wg_name in working_groups_list:
        try:
            print(f"  Fetching data for {wg_name}...", end=' ')
            wg_data = fetch_evidence_for_working_group_with_config(
                wg_name,
                academic_year,
                use_remote=use_remote
            )
            wg_data['name'] = wg_name  # Add working group name to data
            working_groups.append(wg_data)
            successful_fetches += 1
            print("[SUCCESS]")
        except Exception as e:
            print(f"[FAILED]")
            print(f"    Error: {str(e)}")
            # Continue with empty data for this working group
            working_groups.append({
                'name': wg_name,
                'workingGroup': wg_name,
                'goals': [],
                'allAccomplishments': []
            })

    if successful_fetches == 0:
        print("\nNo data could be fetched from the database.")
        print("Please check your database connection and try again.")
        print("\nAlternatively, use generate_report_from_json.py to generate reports from JSON data.")
        return None

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
        'working_groups': working_groups,
        'database_info': {
            'type': 'Remote' if use_remote else 'Local',
            'name': database_name,
            'url': database_url.split('@')[1] if '@' in database_url else database_url
        }
    }

    # Render template
    print("\nRendering template...")
    html_content = template.render(context)

    # Save to file
    db_type = 'remote' if use_remote else 'local'
    output_file = output_dir / f"comprehensive_report_{academic_year}_{db_type}.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"\n[SUCCESS] Report generated: {output_file}")

    # Generate summary statistics
    print("\nSummary Statistics:")
    print(f"  Working Groups: {len(working_groups)}")
    print(f"  Successful Data Fetches: {successful_fetches}/{len(working_groups_list)}")

    total_goals = sum(len(wg.get('goals', [])) for wg in working_groups)
    print(f"  Total Goals: {total_goals}")

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

    print(f"  Total Indicators: {total_indicators}")
    print(f"  Total Evidence Items: {total_evidences}")
    print(f"  Total Plans: {total_plans}")

    total_accomplishments = sum(len(wg.get('allAccomplishments', [])) for wg in working_groups)
    print(f"  Total Accomplishments: {total_accomplishments}")

    return str(output_file)


def test_database_connection(use_remote: bool = False, env_file: Optional[str] = None) -> bool:
    """
    Test if the database connection is working

    Args:
        use_remote: If True, test remote connection; if False, test local
        env_file: Optional path to custom .env file

    Returns:
        True if connection is successful, False otherwise
    """
    try:
        # Configure connection
        database_url, database_name = configure_database_connection(use_remote, env_file)

        print(f"\nTesting connection to: {database_url}")

        # Try a simple query
        from neomodel import db
        result, _ = db.cypher_query("MATCH (n) RETURN count(n) LIMIT 1")

        if result:
            print(f"[SUCCESS] Connection successful!")
            print(f"  Database has nodes: {result[0][0] if result[0] else 0}")
            return True
        else:
            print("[FAILED] Connection failed - no response")
            return False

    except Exception as e:
        print(f"[FAILED] Connection failed: {str(e)}")
        return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate comprehensive ATI reports with configurable database connection',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use local database (default)
  python generate_comprehensive_report_configurable.py

  # Use remote database
  python generate_comprehensive_report_configurable.py --remote

  # Use custom environment file
  python generate_comprehensive_report_configurable.py --env-file /path/to/.env.custom

  # Test connection only
  python generate_comprehensive_report_configurable.py --test-connection

  # Generate for specific year
  python generate_comprehensive_report_configurable.py --year 2023-2024 --remote
        """
    )

    parser.add_argument('--year', default='2024-2025',
                       help='Academic year (default: 2024-2025)')
    parser.add_argument('--output', default='reports',
                       help='Output directory (default: reports)')
    parser.add_argument('--remote', action='store_true',
                       help='Use remote database connection')
    parser.add_argument('--env-file',
                       help='Path to custom .env file')
    parser.add_argument('--test-connection', action='store_true',
                       help='Test database connection only')
    parser.add_argument('--working-groups', nargs='+',
                       help='Specific working groups to include (default: all)')

    args = parser.parse_args()

    # Test connection if requested
    if args.test_connection:
        print("=" * 60)
        print("DATABASE CONNECTION TEST")
        print("=" * 60)

        if args.env_file:
            print(f"Using custom environment: {args.env_file}")
        elif args.remote:
            print("Testing REMOTE database connection")
        else:
            print("Testing LOCAL database connection")

        success = test_database_connection(args.remote, args.env_file)

        if not success:
            print("\nTroubleshooting tips:")
            print("1. Check if Neo4j is running:")
            print("   - For local: neo4j status")
            print("   - For remote: check server status")
            print("2. Verify credentials in .env file")
            print("3. Check firewall/network settings")
            print("4. Try: neo4j console (for local)")

        sys.exit(0 if success else 1)

    # Generate report
    print("=" * 60)
    print("ATI COMPREHENSIVE REPORT GENERATOR")
    print("=" * 60)

    if args.env_file:
        print(f"Using custom environment: {args.env_file}")
    elif args.remote:
        print("Using REMOTE database")
    else:
        print("Using LOCAL database")

    try:
        output_file = generate_comprehensive_report(
            academic_year=args.year,
            output_dir=args.output,
            use_remote=args.remote,
            env_file=args.env_file,
            working_groups_list=args.working_groups
        )

        if output_file:
            print(f"\n" + "=" * 60)
            print(f"Report generated successfully!")
            print(f"Open file: {output_file}")

    except Exception as e:
        print(f"\nError generating report: {str(e)}")
        print("\nFallback options:")
        print("1. Use --test-connection to verify database")
        print("2. Use generate_report_from_json.py for offline mode")
        print("3. Check .env files for correct credentials")
        sys.exit(1)