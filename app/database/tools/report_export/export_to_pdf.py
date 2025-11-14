"""
HTML to PDF Export Tool for ATI Evidence Reports
Converts HTML reports to PDF format with proper styling

Required packages:
    pip install weasyprint

Note: weasyprint also requires GTK libraries. On Windows, they are included.
For other systems, see: https://weasyprint.readthedocs.io/en/stable/install.html

Alternative simpler option if weasyprint has issues:
    pip install pdfkit
    (Also requires wkhtmltopdf binary: https://wkhtmltopdf.org/downloads.html)
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
import argparse


def export_with_weasyprint(html_path: str, pdf_path: Optional[str] = None) -> str:
    """
    Export HTML to PDF using WeasyPrint (recommended)

    Args:
        html_path: Path to HTML file
        pdf_path: Optional output PDF path (defaults to same name as HTML)

    Returns:
        Path to generated PDF
    """
    try:
        from weasyprint import HTML, CSS

        html_path = Path(html_path)
        if not html_path.exists():
            raise FileNotFoundError(f"HTML file not found: {html_path}")

        # Generate PDF path if not provided
        if pdf_path is None:
            pdf_path = html_path.with_suffix('.pdf')
        else:
            pdf_path = Path(pdf_path)

        # Create output directory if it doesn't exist
        pdf_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"Converting {html_path.name} to PDF...")

        # Read HTML content
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Add print-specific CSS
        print_css = CSS(string='''
            @page {
                size: letter;
                margin: 0.75in;
            }

            /* Ensure content fits on page */
            body {
                font-size: 10pt !important;
                line-height: 1.4 !important;
            }

            /* Avoid page breaks inside elements */
            .section, .plan-item, .note-item, .message-item {
                page-break-inside: avoid;
            }

            /* Add page break before major sections if needed */
            .section {
                page-break-after: auto;
            }

            /* Ensure tables don't break across pages */
            table {
                page-break-inside: avoid;
            }

            /* Make links more visible in print */
            a {
                color: #0066cc !important;
                text-decoration: underline !important;
            }
        ''')

        # Convert to PDF
        HTML(string=html_content, base_url=str(html_path.parent)).write_pdf(
            pdf_path,
            stylesheets=[print_css]
        )

        print(f" PDF saved to: {pdf_path}")
        return str(pdf_path)

    except ImportError:
        print("WeasyPrint not installed. Trying alternative method...")
        return export_with_pdfkit(html_path, pdf_path)
    except Exception as e:
        print(f"Error with WeasyPrint: {e}")
        print("Trying alternative method...")
        return export_with_pdfkit(html_path, pdf_path)


def export_with_pdfkit(html_path: str, pdf_path: Optional[str] = None) -> str:
    """
    Export HTML to PDF using pdfkit (fallback option)

    Args:
        html_path: Path to HTML file
        pdf_path: Optional output PDF path

    Returns:
        Path to generated PDF
    """
    try:
        import pdfkit

        html_path = Path(html_path)
        if not html_path.exists():
            raise FileNotFoundError(f"HTML file not found: {html_path}")

        # Generate PDF path if not provided
        if pdf_path is None:
            pdf_path = html_path.with_suffix('.pdf')
        else:
            pdf_path = Path(pdf_path)

        # Create output directory if it doesn't exist
        pdf_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"Converting {html_path.name} to PDF using pdfkit...")

        # Configuration for wkhtmltopdf
        options = {
            'page-size': 'Letter',
            'margin-top': '0.75in',
            'margin-right': '0.75in',
            'margin-bottom': '0.75in',
            'margin-left': '0.75in',
            'encoding': "UTF-8",
            'enable-local-file-access': None,
            'print-media-type': None,
            'no-outline': None
        }

        # Convert HTML to PDF
        pdfkit.from_file(str(html_path), str(pdf_path), options=options)

        print(f" PDF saved to: {pdf_path}")
        return str(pdf_path)

    except ImportError:
        print("\nERROR: No PDF conversion library installed.")
        print("\nPlease install one of the following:")
        print("  Option 1 (Recommended): pip install weasyprint")
        print("  Option 2: pip install pdfkit")
        print("           (Also requires wkhtmltopdf from https://wkhtmltopdf.org/downloads.html)")
        sys.exit(1)
    except Exception as e:
        print(f"Error converting to PDF: {e}")
        raise


def simple_html_to_pdf(html_path: str, pdf_path: Optional[str] = None) -> str:
    """
    Simplest API - convert single HTML file to PDF

    Args:
        html_path: Path to HTML file
        pdf_path: Optional output PDF path

    Returns:
        Path to generated PDF
    """
    return export_with_weasyprint(html_path, pdf_path)


def batch_convert_html_to_pdf(html_dir: str, pdf_dir: Optional[str] = None) -> List[str]:
    """
    Convert all HTML files in a directory to PDF

    Args:
        html_dir: Directory containing HTML files
        pdf_dir: Optional output directory for PDFs (defaults to same as HTML)

    Returns:
        List of generated PDF paths
    """
    html_dir = Path(html_dir)
    if not html_dir.exists():
        raise FileNotFoundError(f"Directory not found: {html_dir}")

    # Use same directory if PDF dir not specified
    if pdf_dir is None:
        pdf_dir = html_dir
    else:
        pdf_dir = Path(pdf_dir)
        pdf_dir.mkdir(parents=True, exist_ok=True)

    # Find all HTML files
    html_files = list(html_dir.glob("*.html"))
    if not html_files:
        print(f"No HTML files found in {html_dir}")
        return []

    print(f"Found {len(html_files)} HTML files to convert")

    pdf_files = []
    for html_file in html_files:
        try:
            pdf_path = pdf_dir / html_file.with_suffix('.pdf').name
            pdf_files.append(simple_html_to_pdf(str(html_file), str(pdf_path)))
        except Exception as e:
            print(f"Failed to convert {html_file.name}: {e}")

    print(f"\n Converted {len(pdf_files)} files to PDF")
    return pdf_files


def main():
    """Command-line interface for HTML to PDF conversion"""
    parser = argparse.ArgumentParser(
        description='Convert HTML reports to PDF format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Convert single file
  python export_to_pdf.py report.html
  python export_to_pdf.py report.html output.pdf

  # Convert all HTML files in directory
  python export_to_pdf.py --batch reports/
  python export_to_pdf.py --batch reports/ --output pdfs/
        '''
    )

    parser.add_argument('input', help='HTML file or directory (with --batch)')
    parser.add_argument('output', nargs='?', help='Output PDF file or directory')
    parser.add_argument('--batch', '-b', action='store_true',
                        help='Convert all HTML files in directory')
    parser.add_argument('--method', '-m', choices=['weasyprint', 'pdfkit'],
                        default='weasyprint',
                        help='PDF conversion method (default: weasyprint)')

    args = parser.parse_args()

    try:
        if args.batch:
            # Batch conversion
            pdf_files = batch_convert_html_to_pdf(args.input, args.output)
            if pdf_files:
                print("\nGenerated PDFs:")
                for pdf in pdf_files:
                    print(f"  - {pdf}")
        else:
            # Single file conversion
            if args.method == 'pdfkit':
                pdf_path = export_with_pdfkit(args.input, args.output)
            else:
                pdf_path = simple_html_to_pdf(args.input, args.output)
            print(f"\nSuccess! PDF saved to: {pdf_path}")

    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Example usage when run directly
    if len(sys.argv) > 1:
        main()
    else:
        print("HTML to PDF Converter")
        print("=" * 50)
        print("\nUsage examples:")
        print("  python export_to_pdf.py report.html")
        print("  python export_to_pdf.py report.html output.pdf")
        print("  python export_to_pdf.py --batch reports/")
        print("\nFor help: python export_to_pdf.py --help")

        # Demo with example if running without arguments
        demo_html = Path("reports/index.html")
        if demo_html.exists():
            print(f"\nDemo: Converting {demo_html}...")
            try:
                pdf = simple_html_to_pdf(str(demo_html))
                print(f"Demo PDF created: {pdf}")
            except Exception as e:
                print(f"Demo failed: {e}")