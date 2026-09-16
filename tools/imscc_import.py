"""Extract an IMS Common Cartridge (.imscc) export into a readable folder tree.

Usage:
    python tools/imscc_import.py path/to/course.imscc
    python tools/imscc_import.py path/to/course.imscc -o "C:/courses/Course Name"

The module structure from the cartridge manifest becomes numbered folders.
Pages and documents are copied in with their item titles as file names.
Web links become .url files (double-click to open). Discussion topics become
small HTML files. Quizzes, question banks, and LTI tool links are skipped and
listed in _import_summary.txt. Attachments under web_resources/ are copied to
"Course Files", and $IMS-CC-FILEBASE$ references inside pages are rewritten so
images and attachments resolve from the extracted folder.

Stdlib only. Works on any cartridge that follows the CC manifest layout,
including Canvas exports (wiki_content pages, assignment HTML).
"""

import argparse
import html
import os
import re
import shutil
import sys
import urllib.parse
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

FILEBASE_TOKENS = ("$IMS-CC-FILEBASE$", "%24IMS-CC-FILEBASE%24", "$IMS_CC_FILEBASE$")
FILES_DIR_NAME = "Course Files"
UNSORTED_DIR_NAME = "Content not in a module"

DISCUSSION_TEMPLATE = """<!doctype html>
<html>
<head><meta charset="utf-8"><title>{title}</title></head>
<body>
<h1>{title}</h1>
{body}
</body>
</html>
"""


def local(tag):
    """Tag name without its XML namespace."""
    return tag.rsplit("}", 1)[-1]


def children(el, name):
    return [c for c in el if local(c.tag) == name]

def first_child(el, name):
    for c in el:
        if local(c.tag) == name:
            return c
    return None


def descendants(el, name):
    return [c for c in el.iter() if local(c.tag) == name]


def safe_name(name, maxlen=80):
    """A Windows-safe single path component."""
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', " ", name or "")
    name = re.sub(r"\s+", " ", name).strip().rstrip(". ")
    return name[:maxlen].rstrip(". ") or "untitled"


def unique_path(directory, filename):
    base = Path(filename).stem
    suffix = Path(filename).suffix
    candidate = directory / filename
    n = 2
    while candidate.exists():
        candidate = directory / f"{base} ({n}){suffix}"
        n += 1
    return candidate


def classify(resource_type):
    t = (resource_type or "").lower()
    if "imsqti" in t or "assessment" in t or "question-bank" in t:
        return "quiz"
    if "imswl" in t:
        return "weblink"
    if "imsdt" in t:
        return "discussion"
    if "lti" in t:
        return "lti"
    if "learning-application-resource" in t or "associatedcontent" in t:
        return "canvas"
    if "webcontent" in t:
        return "file"
    return "other"


class Extractor:
    def __init__(self, zf, out_dir):
        self.zf = zf
        self.names = set(zf.namelist())
        self.out = out_dir
        self.files_dir = out_dir / FILES_DIR_NAME
        self.counters = {}
        self.used = set()
        self.copied = 0
        self.skipped = []   # (reason, label)
        self.problems = []
        self.index_lines = []

    # -- zip helpers ---------------------------------------------------------

    def member(self, href):
        """Resolve a manifest href to an actual zip member name, or None."""
        if not href:
            return None
        candidates = [href, href.lstrip("./"), urllib.parse.unquote(href)]
        for c in candidates:
            if c in self.names:
                return c
        return None

    # -- output helpers ------------------------------------------------------

    def next_number(self, directory):
        n = self.counters.get(directory, 0) + 1
        self.counters[directory] = n
        return f"{n:02d}"

    def rewrite_filebase(self, text, dest_dir):
        rel = os.path.relpath(self.files_dir, dest_dir).replace("\\", "/")
        for token in FILEBASE_TOKENS:
            text = text.replace(token, rel)
        return text

    def write_page(self, data, dest_path):
        text = data.decode("utf-8", errors="replace")
        text = self.rewrite_filebase(text, dest_path.parent)
        dest_path.write_text(text, encoding="utf-8")

    def place_file(self, member, dest_dir, title=None, numbered=True):
        """Copy one zip member into dest_dir under a readable name."""
        src_name = Path(member).name
        suffix = Path(src_name).suffix
        stem = safe_name(title) if title else safe_name(Path(src_name).stem)
        prefix = self.next_number(dest_dir) + " " if numbered else ""
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = unique_path(dest_dir, f"{prefix}{stem}{suffix}")
        data = self.zf.read(member)
        if suffix.lower() in (".html", ".htm"):
            self.write_page(data, dest)
        else:
            dest.write_bytes(data)
        self.copied += 1
        return dest

    def note_skip(self, reason, label):
        self.skipped.append((reason, label))

    def index_add(self, depth, text):
        self.index_lines.append("    " * depth + f"- {text}")

    def index_link(self, depth, title, dest):
        rel = os.path.relpath(dest, self.out).replace("\\", "/")
        self.index_add(depth, f"[{title}](<{rel}>)")

    # -- resource emitters ---------------------------------------------------

    def emit(self, resource, title, dest_dir, depth):
        kind = classify(resource["type"])
        title = title or "untitled"

        if kind == "quiz":
            self.note_skip("quiz/assessment", title)
            self.index_add(depth, f"{title} (quiz, skipped)")
            return
        if kind == "lti":
            self.note_skip("LTI tool link", title)
            self.index_add(depth, f"{title} (LTI tool link, skipped)")
            return
        if kind == "weblink":
            self.emit_weblink(resource, title, dest_dir, depth)
            return
        if kind == "discussion":
            self.emit_discussion(resource, title, dest_dir, depth)
            return
        if kind == "canvas":
            self.emit_canvas(resource, title, dest_dir, depth)
            return
        if kind == "file":
            member = self.member(resource["href"]) or self.member(
                resource["files"][0] if resource["files"] else None
            )
            if not member:
                self.problems.append(f"missing file for '{title}' ({resource['href']})")
                self.index_add(depth, f"{title} (file missing from cartridge)")
                return
            dest = self.place_file(member, dest_dir, title)
            self.index_link(depth, title, dest)
            return
        self.note_skip(f"unsupported type {resource['type']}", title)
        self.index_add(depth, f"{title} (unsupported type, skipped)")

    def emit_weblink(self, resource, title, dest_dir, depth):
        member = self.member(resource["href"]) or self.member(
            resource["files"][0] if resource["files"] else None
        )
        url = None
        if member:
            try:
                root = ET.fromstring(self.zf.read(member))
                t = first_child(root, "title")
                if t is not None and (t.text or "").strip():
                    title = t.text.strip()
                for u in descendants(root, "url"):
                    url = u.get("href")
                    break
            except ET.ParseError:
                pass
        if not url:
            self.problems.append(f"web link '{title}' had no URL")
            self.index_add(depth, f"{title} (web link, no URL found)")
            return
        dest_dir.mkdir(parents=True, exist_ok=True)
        name = f"{self.next_number(dest_dir)} {safe_name(title)}.url"
        dest = unique_path(dest_dir, name)
        dest.write_text(f"[InternetShortcut]\nURL={url}\n", encoding="utf-8")
        self.copied += 1
        self.index_add(depth, f"[{title}]({url}) (web link)")

    def emit_discussion(self, resource, title, dest_dir, depth):
        member = self.member(resource["href"]) or self.member(
            resource["files"][0] if resource["files"] else None
        )
        body = ""
        if member:
            try:
                root = ET.fromstring(self.zf.read(member))
                t = first_child(root, "title")
                if t is not None and (t.text or "").strip():
                    title = t.text.strip()
                text_el = first_child(root, "text")
                if text_el is not None:
                    body = text_el.text or ""
            except ET.ParseError:
                pass
        dest_dir.mkdir(parents=True, exist_ok=True)
        name = f"{self.next_number(dest_dir)} {safe_name(title)} (discussion).html"
        dest = unique_path(dest_dir, name)
        page = DISCUSSION_TEMPLATE.format(title=html.escape(title), body=body)
        page = self.rewrite_filebase(page, dest_dir)
        dest.write_text(page, encoding="utf-8")
        self.copied += 1
        self.index_link(depth, f"{title} (discussion)", dest)

    def emit_canvas(self, resource, title, dest_dir, depth):
        """Canvas learning-application-resource: keep the HTML, drop settings XML."""
        href = resource["href"] or ""
        if "course_settings" in href:
            return
        html_members = [
            m for f in resource["files"]
            if f.lower().endswith((".html", ".htm")) and (m := self.member(f))
        ]
        if not html_members:
            self.note_skip("app content with no page", title)
            self.index_add(depth, f"{title} (no readable page, skipped)")
            return
        dest = self.place_file(html_members[0], dest_dir, title)
        self.index_link(depth, title, dest)
        for extra in html_members[1:]:
            self.place_file(extra, dest_dir)

    # -- structure -----------------------------------------------------------

    def walk_item(self, item, dest_dir, depth, resources):
        title_el = first_child(item, "title")
        title = (title_el.text or "").strip() if title_el is not None else ""
        subitems = children(item, "item")
        ref = item.get("identifierref")

        if ref:
            resource = resources.get(ref)
            self.used.add(ref)
            if resource:
                self.emit(resource, title, dest_dir, depth)
            else:
                self.problems.append(f"item '{title}' points at unknown resource {ref}")
        if subitems:
            if title and not ref:
                sub_dir = dest_dir / f"{self.next_number(dest_dir)} {safe_name(title)}"
                self.index_add(depth, f"**{title}**")
                depth += 1
            else:
                sub_dir = dest_dir
            for sub in subitems:
                self.walk_item(sub, sub_dir, depth, resources)

    def copy_web_resources(self):
        members = [n for n in self.names if n.startswith("web_resources/") and not n.endswith("/")]
        for m in members:
            parts = [safe_name(p, maxlen=120) for p in Path(m).parts[1:]]
            if not parts:
                continue
            dest = self.files_dir.joinpath(*parts)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(self.zf.read(m))
        return len(members)

    def sweep_unreferenced(self, resources):
        unsorted_dir = self.out / UNSORTED_DIR_NAME
        header_written = False
        for ident, resource in resources.items():
            if ident in self.used:
                continue
            kind = classify(resource["type"])
            href = resource["href"] or (resource["files"][0] if resource["files"] else "")
            if kind == "quiz":
                self.note_skip("quiz/assessment", href or ident)
                continue
            if kind in ("lti", "other"):
                continue
            if kind == "file" and (not href or href.startswith("web_resources/")):
                continue  # already present under Course Files
            if kind == "canvas" and "course_settings" in href:
                continue
            if not header_written:
                self.index_add(0, f"**{UNSORTED_DIR_NAME}**")
                header_written = True
            title = Path(href).stem.replace("-", " ").replace("_", " ").strip() or ident
            self.emit(resource, title, unsorted_dir, 1)


def read_manifest(zf):
    root = ET.fromstring(zf.read("imsmanifest.xml"))
    resources = {}
    for res in descendants(root, "resource"):
        resources[res.get("identifier")] = {
            "type": res.get("type", ""),
            "href": res.get("href"),
            "files": [f.get("href") for f in children(res, "file") if f.get("href")],
        }
    organization = None
    orgs = first_child(root, "organizations")
    if orgs is not None:
        organization = first_child(orgs, "organization")
    course_title = None
    metadata = first_child(root, "metadata")
    if metadata is not None:
        for t in descendants(metadata, "title"):
            s = first_child(t, "string")
            text = (s.text if s is not None else t.text) or ""
            if text.strip():
                course_title = text.strip()
                break
    return course_title, organization, resources


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Extract an IMSCC cartridge into a readable folder tree."
    )
    parser.add_argument("cartridge", help="path to the .imscc (or .zip) export")
    parser.add_argument("-o", "--out", help="output folder (default: next to the cartridge)")
    parser.add_argument("--force", action="store_true",
                        help="replace the output folder if it already exists")
    args = parser.parse_args(argv)

    cartridge = Path(args.cartridge)
    if not cartridge.is_file():
        print(f"error: {cartridge} does not exist", file=sys.stderr)
        return 1
    try:
        zf = zipfile.ZipFile(cartridge)
    except zipfile.BadZipFile:
        print(f"error: {cartridge} is not a zip archive", file=sys.stderr)
        return 1
    with zf:
        if "imsmanifest.xml" not in zf.namelist():
            print("error: no imsmanifest.xml at the archive root; not a Common Cartridge",
                  file=sys.stderr)
            return 1
        course_title, organization, resources = read_manifest(zf)

        out = Path(args.out) if args.out else cartridge.with_name(
            safe_name(course_title or cartridge.stem)
        )
        if out.exists() and any(out.iterdir()):
            if args.force:
                shutil.rmtree(out)
            else:
                print(f"error: {out} already exists; pass --force to replace it",
                      file=sys.stderr)
                return 1
        out.mkdir(parents=True, exist_ok=True)

        ex = Extractor(zf, out)
        if course_title:
            ex.index_lines.append(f"# {course_title}\n")
        attachment_count = ex.copy_web_resources()

        if organization is not None:
            for item in children(organization, "item"):
                ex.walk_item(item, out, 0, resources)
        ex.sweep_unreferenced(resources)

        (out / "INDEX.md").write_text("\n".join(ex.index_lines) + "\n", encoding="utf-8")

        summary = [f"Cartridge: {cartridge.name}"]
        if course_title:
            summary.append(f"Course: {course_title}")
        summary.append(f"Content items extracted: {ex.copied}")
        summary.append(f"Attachments copied to '{FILES_DIR_NAME}': {attachment_count}")
        if ex.skipped:
            summary.append("")
            summary.append("Skipped:")
            summary.extend(f"  - [{reason}] {label}" for reason, label in ex.skipped)
        if ex.problems:
            summary.append("")
            summary.append("Problems:")
            summary.extend(f"  - {p}" for p in ex.problems)
        (out / "_import_summary.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")

        print("\n".join(summary))
        print(f"\nExtracted to: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
