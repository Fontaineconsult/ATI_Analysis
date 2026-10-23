"""Extract the facts of a vendor ACR with Claude.

Reads a PDF, Word, HTML or text ACR, sends it to Claude with extraction-prompt.md and the
structure in extraction-schema.json, and writes <acr>.extraction.json next to the input.
Claude records what the report says. It grades nothing; apply_rules.js applies the rubric.

    .venv/Scripts/python app/database/ontology/impact-matrix/vpat-analysis/extract_acr.py <acr file> [--out <path>] [--effort high]

Needs ANTHROPIC_API_KEY, or an `ant auth login` profile.
"""
import argparse
import base64
import json
import sys
from pathlib import Path

import anthropic

HERE = Path(__file__).resolve().parent
MODEL = "claude-opus-5-5"
PROMPT = (HERE / "extraction-prompt.md").read_text(encoding="utf-8")
SCHEMA = json.loads((HERE / "extraction-schema.json").read_text(encoding="utf-8"))


def docx_text(path: Path) -> str:
    """The paragraphs and tables of a Word ACR in document order, tables as pipe rows."""
    import docx
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    doc = docx.Document(str(path))
    out = []
    for child in doc.element.body.iterchildren():
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = Paragraph(child, doc).text.strip()
            if text:
                out.append(text)
        elif tag == "tbl":
            for row in Table(child, doc).rows:
                out.append(" | ".join(cell.text.strip().replace("\n", " ") for cell in row.cells))
            out.append("")
    return "\n".join(out)


def document_block(path: Path) -> list:
    """The ACR as message content. A PDF goes as a document block, so Claude reads its pages
    and page numbers; other formats go as text, without page numbers."""
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        data = base64.standard_b64encode(path.read_bytes()).decode("ascii")
        return [{"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": data},
                 "title": path.name}]
    if suffix == ".docx":
        text = docx_text(path)
    elif suffix in (".html", ".htm", ".txt", ".md"):
        text = path.read_text(encoding="utf-8", errors="replace")
    else:
        sys.exit(f"Unsupported file type {suffix}. Use PDF, DOCX, HTML or text.")
    return [{"type": "document", "source": {"type": "text", "media_type": "text/plain", "data": text},
             "title": path.name}]


def extract(path: Path, effort: str) -> dict:
    client = anthropic.Anthropic()
    content = document_block(path) + [{
        "type": "text",
        "text": "Extract this ACR into the schema. Page numbers are null when the document has none.",
    }]
    # Server-side fallback reruns the request on another model if a safety classifier
    # declines it, so a vendor document that trips a classifier still gets read.
    with client.beta.messages.stream(
        model=MODEL,
        max_tokens=64000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=[{"type": "text", "text": PROMPT, "cache_control": {"type": "ephemeral"}}],
        output_config={"effort": effort, "format": {"type": "json_schema", "schema": SCHEMA}},
        messages=[{"role": "user", "content": content}],
    ) as stream:
        message = stream.get_final_message()

    if message.stop_reason == "refusal":
        details = message.stop_details
        sys.exit(f"Claude declined the request ({getattr(details, 'category', None)}). Request id {message._request_id}.")
    if message.stop_reason == "max_tokens":
        sys.exit("The extraction ran past the output limit. Split the ACR by product or table and run each part.")
    text = next(b.text for b in message.content if b.type == "text")
    data = json.loads(text)
    data["_source"] = {
        "file": path.name,
        "model": message.model,
        "request_id": message._request_id,
        "input_tokens": message.usage.input_tokens,
        "output_tokens": message.usage.output_tokens,
    }
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("acr", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--effort", default="high", choices=["low", "medium", "high", "xhigh", "max"])
    args = parser.parse_args()
    if not args.acr.exists():
        sys.exit(f"No such file: {args.acr}")
    out = args.out or args.acr.with_suffix(".extraction.json")
    try:
        data = extract(args.acr, args.effort)
    except anthropic.AuthenticationError:
        sys.exit("No valid Anthropic credential. Set ANTHROPIC_API_KEY or run `ant auth login`.")
    except TypeError as e:
        # The SDK raises TypeError before sending when it finds no credential at all.
        if "authentication" not in str(e):
            raise
        sys.exit("No Anthropic credential found. Set ANTHROPIC_API_KEY or run `ant auth login`.")
    except anthropic.RateLimitError as e:
        sys.exit(f"Rate limited. Retry after {e.response.headers.get('retry-after', '60')} seconds.")
    except anthropic.APIStatusError as e:
        sys.exit(f"API error {e.status_code}: {e.message}")
    except anthropic.APIConnectionError:
        sys.exit("Could not reach the Anthropic API.")
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    rows = data.get("rows", [])
    print(f"wrote {out}: {len(rows)} rows, {data['_source']['input_tokens']} input and "
          f"{data['_source']['output_tokens']} output tokens")


if __name__ == "__main__":
    main()
