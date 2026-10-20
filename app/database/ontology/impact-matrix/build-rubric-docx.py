"""Build SFBRN-Accessible-Procurement-Rubric.docx.

The rubric prose is the Definitions section of review-matrix-tester.html, rendered from
review-matrix.js, so the document carries the same numbers as the model. Each section is
followed by a Grounding part that names the binding rules, the framework principle and the
calibration choices behind it. Prose follows app/database/ontology/writing-style.md.

    .venv314/Scripts/python app/database/ontology/impact-matrix/build-rubric-docx.py

Needs python-docx and the Playwright install under e2e/node_modules.
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = HERE / 'SFBRN-Accessible-Procurement-Rubric.docx'
PLAYWRIGHT = ROOT / 'e2e' / 'node_modules' / 'playwright'

# ---------------------------------------------------------------------------------------
# Grounding, by Definitions heading. Only rules that bind the CSU count as rules: federal
# and California law, federal standards California applies, and CSU policy. A principle is
# a commitment the framework holds (a Principle node in the graph, or one proposed in
# matrix-grounding-review.md). Calibration names the choices no rule sets.
# ---------------------------------------------------------------------------------------
GROUNDING = {
    'How a review reaches a decision': {
        'rules': [
            ('CSU ATI Procurement Process, Step 3', 'The ATI reviewer approves or denies the acquisition on the review findings. A denial is recorded with a detailed rationale, and each campus provides a way to request reconsideration.'),
            ('28 CFR 35.200', 'Web content and mobile apps that a public university provides, directly or through a vendor, must conform to WCAG 2.1 AA.'),
            ('Section 508 Standards, E202.7 (36 CFR 1194), through Gov Code 7405', 'When no conforming product meets the need, the CSU buys the product that best meets the standard, documents why, and provides the information and functions by an alternative means.'),
            ('CSU TAAP Authoring Template, instructions', 'A TAAP is needed when barriers are "severe enough to prevent users from performing essential functions". Failures "that do not prohibit core functionality do not require this process."'),
        ],
        'principles': [
            ('Time-bound alternative access when full conformance is not yet achieved', 'Where content cannot yet meet the standard, the institution provides a documented, time-limited, equally effective alternative while it remediates, and does not treat the non-conformance as acceptable. A TAAP is that alternative, never compliance.'),
            ('Deference is earned through a documented, individualized process', 'Courts and OCR defer to an institution\'s judgment only when a record shows the responsible officials considered the individual and the alternatives. Every route names its holder and every decision its reasons for that record.'),
        ],
        'calibration': 'The split into risk grade, routes and remedy step is the matrix\'s own design. No rule prescribes a hold state, a holder or a resume point.',
    },
    'Barriers and findings': {
        'rules': [
            ('28 CFR 35.205', 'A nonconformance counts as compliant only when its impact is so minimal that people with disabilities still get the same information, interactions and transactions, with substantially equivalent timeliness, privacy, independence and ease of use. The test measures the effect on a person, which is why severity attaches to the barrier and not to the failed criterion.'),
            ('Section 508 Standards, Chapter 3 (36 CFR 1194)', 'The functional performance criteria name the nine disability groups a finding records.'),
            ('WCAG 2.1, conformance requirement 3', 'Every page in a complete process must conform, so a core task is judged across its whole process.'),
            ('CSU ATI Procurement Process, Step 1', 'The requester states the product\'s "essential functionality", which is the source of the core task list.'),
        ],
        'principles': [
            ('Severity is judged by the effect on a task', 'A barrier\'s severity comes from what it does to a named group of users on a core task. Neither an ACR\'s conformance label nor a criterion\'s level says how severe a barrier is.'),
            ('The audience determines which duty governs', 'Who uses a system decides which law governs its accessibility, so a finding records the role.'),
        ],
        'calibration': 'None. The definitions restate the law\'s own tests.',
    },
    'Exposure': {
        'rules': [
            ('ADA Title II, Section 504 and CSU policy', 'No binding rule contains a user-count, criticality or exposure threshold. Exposure therefore sets how deep the review goes, how strong the evidence must be and who signs, and never whether access is owed.'),
            ('CSU ATI Procurement Process', 'The depth of review depends on how the product will be used, which is why unknown answers hold the review.'),
            ('28 CFR 35.205 and Section 504 (34 CFR 104)', 'The transactions test and the duty across academic programs ground the floors for coursework and for the only route to a service.'),
            ('28 CFR 35.200', 'Content the university provides to the public falls under the web rule, which grounds the public floor.'),
            ('ADA Title I (29 CFR 1630) and FEHA', 'Employment and hiring carry their own duty, which grounds the job-duty floor.'),
            ('CSU Executive Order 1111', 'A known user with a disability or an open accommodation request makes the barrier concrete, which grounds that floor.'),
        ],
        'principles': [
            ('Exposure sets scrutiny, not entitlement (proposed)', 'How widely a product is used decides how closely it is reviewed and who signs. It does not decide whether people with disabilities are owed access.'),
            ('Prioritization by impact under finite resources', 'Campuses direct accessibility work at the barriers with the greatest impact rather than spreading it evenly.'),
            ('Same facts, same answer (proposed)', 'Two reviewers given the same facts reach the same result. Each question maps to one group so no fact is counted twice.'),
        ],
        'calibration': 'The user count cuts (25 and 250), the band cut points (0.25 and 0.55), the equal group weights and the assignment of each floor to medium or high are pilot calibration. No rule sets them.',
    },
    'Severity': {
        'rules': [
            ('28 CFR 35.205', 'The four tests define S1. A barrier that makes a task clearly harder fails the minimal-impact test, so S2 does not conform. The university must be able to show minimal impact, so S1 needs demonstration.'),
            ('CSU TAAP Authoring Template, instructions', 'Barriers "severe enough to prevent users from performing essential functions" require a TAAP, which is the S3 line.'),
            ('Section 508 Standards, E202.7 (36 CFR 1194)', 'Section 508 has no minimal-impact exception, so for non-web technology an S1 or S2 product is acceptable only when no conforming product meets the need.'),
        ],
        'principles': [
            ('Severity is judged by the effect on a task', 'Severity derives from task impact, independent of the vendor label and the criterion level.'),
            ('Severity calls need anchors', 'Trained reviewers disagree on severity often enough that one reviewer\'s call carries known error, so each level has a written anchor and a call made from documents alone stays open to testing.'),
            ('Remedy proportionate to barrier severity', 'Formal alternative-access planning applies to barriers that block essential functions, not to every conformance flaw.'),
        ],
        'calibration': 'The accumulation thresholds (3 S2 findings stacked on one task and group, and 6 pairs at high exposure) are the matrix\'s. The reasoning is that task completion is conditional on every barrier on the task, so stacked S2 barriers block the task, and S2 barriers across most of the product exceed minimal impact in aggregate. The GSA labels minor, major and critical are used so vendor reports read across, and they are not a rule.',
    },
    'Evidence (Veracity)': {
        'rules': [
            ('CSU ATI Procurement Process, Step 2', 'The CSU asks for a current Accessibility Conformance Report for each interface before it buys, which is route 1.'),
            ('CSU ATI success indicator 1.8-pro', 'Each campus has a process to validate vendors\' conformance claims, which is the loop under route 3.'),
            ('CSU ATI Procurement Process, Step 3', 'The ATI reviewer decides on the review findings, so the findings are confirmed before the decision is made.'),
            ('28 CFR 35.205', 'The university must be able to show that a nonconformance has minimal impact, which is why S1 always needs a demonstration, an audit or ATI testing.'),
            ('Section 508 Standards, E202.7.2 (36 CFR 1194); CSU TAAP Authoring Template', 'Where conforming technology is not available, access is provided by an alternative means planned in advance. The fallback applies that remedy when conformance cannot be shown.'),
        ],
        'principles': [
            ('Vendor conformance claims require proportionate validation', 'A vendor\'s conformance report is an unverified claim. The institution checks it in proportion to the product\'s exposure, and a claim the product contradicts counts as no evidence.'),
            ('Report quality and product accessibility are separate measures', 'How far an ACR can be trusted and how accessible the product is are two measures, scored apart. A report with no reported failures is a warning sign.'),
            ('Program accessibility is a proactive, systemic duty', 'Access is planned before deployment, whether or not anyone has asked. Unproven conformance is treated as hiding a blocking barrier for that reason.'),
        ],
        'calibration': 'The floor values (any evidence at low exposure, E1 at medium, E2 at high), the two-year ACR age and the eight ACR quality checks are calibration, drawn from CSU practice rather than a rule. The reasoning that a Deny stands on weak evidence is the matrix\'s own. Vendor self-reports understate barriers and do not invent them, so a standard computed from the findings on file is a minimum.',
    },
    'Breadth': {
        'rules': [
            ('28 CFR 35.130(b)(3)', 'A university may not use methods of administration that have the effect of discriminating on the basis of disability. A product whose barriers reach most tasks and groups has that effect more widely, which is what Breadth measures.'),
            ('CSU TAAP Authoring Template, Process Outcome and Institutional Risk', 'The template grades a plan by how many requirements it meets. Breadth raises the pressure, and pressure raises how many a plan must meet.'),
        ],
        'principles': [
            ('Remedy proportionate to barrier severity', 'The weight of the remedy matches the severity of the barrier, and Breadth is the part of severity that measures reach.'),
        ],
        'calibration': 'The blocked-pair steps (2 and 4), the S2 count (3) and the cap at 2 are the matrix\'s. The assumption of Breadth 2 under the fallback with no evidence at all mirrors how unknown exposure answers map to high.',
    },
    'TAAP': {
        'rules': [
            ('CSU TAAP Authoring Template, Requirements Checklist', 'To qualify as an equally effective alternative, the plan must meet all six requirements. The six listed are the template\'s own words.'),
            ('CSU TAAP Authoring Template, Product Specific Accessibility Statement, Administrative Approval and Annual Review', 'The TAAP includes a product-specific statement posted wherever the product is in use, is signed by the Department Chair or Manager, the Dean or Division Vice President and the ADA Compliance Officer, and "must be reviewed and updated annually or when renewing the ICT".'),
            ('CSU TAAP Authoring Template, If the Vendor Fails to Meet Compliance Requirements', 'A TAAP stays valid only while the vendor is actively remediating. Without measurable progress, keeping the product needs a formal risk memo signed by executive leadership.'),
            ('CSU ATI Procurement Process, Step 3; Section 508 Standards, E202.7.2 (36 CFR 1194)', 'The TAAP provides equally effective alternate access "in a timely manner, for anyone that later reports a problem accessing the product". The duty is the institution\'s and is planned before anyone asks.'),
            ('28 CFR 35.130(b)(1); 28 CFR 35.160(b)(2); 28 CFR 35.130(e); 34 CFR 104.4(b)', 'An alternative must be as effective as what others get, timely, private and usable independently, and a person may decline it.'),
            ('CSU Executive Order 1111', 'An accommodation comes from an interactive process with one person, in response to that person\'s request. TAAP support is given on the terms the plan sets, to anyone who reports a problem, and the review never relies on accommodation.'),
            ('28 CFR 35.164 and 35.204; Section 508 Standards, E202.6', 'Only the head of the university or a designee may decide, in writing and after considering all resources available to the program, that conforming is an undue burden or a fundamental alteration. The university must still give access to the maximum extent possible. Because the decision weighs all resources of the program, the cost of one purchase on its own does not establish the burden.'),
        ],
        'principles': [
            ('Equally effective access', 'Accessible technology must give a person with a disability the same result, benefit or opportunity as others, not merely some alternative.'),
            ('Undue burden and fundamental alteration bound the duty', 'The duty has limits, but the institution must still take other action that gives people with disabilities the program\'s benefits to the maximum extent possible. That is why the exception is claimed against the TAAP standard and never at intake.'),
            ('Notice is part of access, not administration around it', 'A remedy the affected person cannot find is not a remedy, which is why the TAAP statement is posted where the product is used.'),
            ('Conformance and accommodation are parallel duties', 'Approval under a TAAP never ends the individual accommodation duty.'),
        ],
        'calibration': 'None. Every term here is the template\'s or the law\'s.',
    },
    'Risk grade': {
        'rules': [
            ('CSU TAAP Authoring Template, instructions', 'A TAAP is needed only for barriers that prevent essential functions, so S0 and S1 are Approve and S3 is Needs TAAP at every exposure.'),
            ('28 CFR 35.205; CSU Executive Order 1111, section IV', 'At medium or high exposure, barriers that make tasks clearly harder reach too many people for the impact to be minimal, so S2 is Needs TAAP there.'),
            ('Section 508 Standards, E202.7 (36 CFR 1194)', 'For non-web technology, a high-exposure S3 approval also carries a best-meets record with market research.'),
        ],
        'principles': [
            ('Remedy proportionate to barrier severity', 'The grade places the formal remedy on the barriers that block essential functions.'),
            ('Exposure sets scrutiny, not entitlement (proposed)', 'Exposure moves the S2 row only, and never makes an S3 product acceptable.'),
        ],
        'calibration': 'The Approve grade for S2 at low exposure is the matrix\'s choice. The law does not scale with exposure, and the product still fails the standard, which the approval says in writing.',
    },
    'Pressure and the TAAP standard': {
        'rules': [
            ('CSU TAAP Authoring Template, Process Outcome and Institutional Risk', 'A plan meeting all six requirements is Equally Effective with low institutional risk, one to five is a Non-Equal Alternative with moderate risk, and none is a need for individualized accommodation with high risk.'),
            ('CSU TAAP Authoring Template, Administrative Approval', 'Each signer confirms they have "evaluated the associated institutional risks" and found the plan "an acceptable interim solution." A plan below the standard is a risk the signers accept.'),
            ('28 CFR 35.130(b)(1); 34 CFR 104.4(b)', 'An alternative with fewer functions is not as effective as what others get. The law does not scale with exposure, so a plan below six requirements is an accepted risk and never a compliant result.'),
        ],
        'principles': [
            ('Remedy proportionate to barrier severity', 'The number of requirements a plan must meet rises with the reach of the barriers and the exposure of the product.'),
        ],
        'calibration': 'The counts (3 of 6 at pressure 0 or 1, 4 at 2, all 6 at 3 or more) and the denial line at pressure 3 are the matrix\'s. The template sets the risk tiers, and no rule sets how many requirements a plan must meet at each exposure. Low-pressure leniency is deliberate, because TAAP work costs staff time.',
    },
    'Warning level': {
        'rules': [
            ('CSU TAAP Authoring Template, Institutional Risk', 'The template names the institutional risk a plan carries, and the warning level is how the review tells the purchaser that risk.'),
        ],
        'principles': [
            ('Deference is earned through a documented, individualized process', 'The warning is recorded with the determination, so the risk the signers accepted is visible later.'),
        ],
        'calibration': 'The cut points (elevated at 2, high at 4) are the matrix\'s. The rule that no TAAP lowers the warning below the pressure level follows from the template, which says a TAAP manages barriers while the vendor removes them.',
    },
    'Final decision': {
        'rules': [
            ('28 CFR 35.200; Gov Code 7405 and 11135', 'Web and mobile content must conform to WCAG 2.1 AA, and California applies the Section 508 Standards to the technology the CSU buys.'),
            ('CSU ATI Procurement Process', 'The CSU buys the most accessible product that meets the business need, and the ATI reviewer approves or denies on the findings, with a recorded rationale and a reconsideration path.'),
            ('CSU Accessible Technology Initiative Policy (2024)', '"The CSU seeks to improve product accessibility through partnerships and by leveraging the procurement process."'),
            ('28 CFR 35.130(b)(1) and (b)(3); 34 CFR 104.4(b)(1)', 'A university may not give people with disabilities a less effective service, or use methods of administration that have a discriminating effect. Requiring a product some users cannot use can have that effect.'),
            ('Section 508 Standards, E202.7 (36 CFR 1194)', 'When a more accessible product meets the need, the CSU chooses it.'),
            ('CSU TAAP Authoring Template, Process Outcome; CSU Executive Order 1111, section IV.C.4', 'A plan that meets none of the six requirements is "unable to provide alternative means of access". Access would then rest on individual accommodation, which the CSU\'s Universal Design commitment aims to reduce.'),
        ],
        'principles': [
            ('Procurement as an accessibility lever', 'The institution advances accessibility at the point of purchase. A denial states its findings, the standard it applied and the route to a new review.'),
            ('Universal Design reduces accommodation', 'Designing for accessibility up front reduces the need for individual accommodations, so the review prefers the more accessible product.'),
        ],
        'calibration': 'None. Each deny condition rests on a rule above.',
    },
    'Routes': {
        'rules': [
            ('CSU ATI Procurement Process, Step 2', 'A current ACR for each interface before purchase (route 1).'),
            ('CSU ATI Procurement Process', 'The depth of review depends on how the product will be used (route 2).'),
            ('CSU ATI success indicator 1.8-pro; CSU ATI Procurement Process, Step 3', 'A process to validate vendor claims, and a decision made on confirmed findings (route 3).'),
            ('CSU TAAP Authoring Template', 'The TAAP standard a plan is held to before the remedy step resumes (route 4).'),
            ('28 CFR 35.164 and 35.204; Section 508 Standards, E202.6', 'The written determination belongs to the president or a designee, after considering all resources (route 5).'),
        ],
        'principles': [
            ('Deference is earned through a documented, individualized process', 'Each hold names who holds it and what releases it, so the record shows the review waited for a fact rather than assumed one.'),
            ('Undue burden and fundamental alteration bound the duty', 'The claim leaves the reviewer and goes to the officer the law names.'),
        ],
        'calibration': 'The numbering, the holders and the resume points are the matrix\'s design.',
    },
}


# ---------------------------------------------------------------------------------------
# HTML to docx. The Definitions markup is small: h3, p, ul/li, table, strong, code.
# ---------------------------------------------------------------------------------------
class Defs(HTMLParser):
    """Collects the Definitions markup as a list of blocks: ('h3', runs), ('p', runs),
    ('li', runs), ('table', [[runs, ...], ...])."""

    def __init__(self):
        super().__init__()
        self.blocks = []
        self.runs = None          # current paragraph runs: [(text, bold)]
        self.bold = 0
        self.table = None         # rows of cells, each cell a run list
        self.cell = None
        self.kind = None

    def handle_starttag(self, tag, attrs):
        if tag in ('h3', 'p', 'li'):
            self.kind, self.runs = tag, []
        elif tag == 'table':
            self.table = []
        elif tag == 'tr':
            self.table.append([])
        elif tag in ('td', 'th'):
            self.cell = []
            self.runs = self.cell
        elif tag == 'strong':
            self.bold += 1

    def handle_endtag(self, tag):
        if tag in ('h3', 'p', 'li'):
            self.blocks.append((tag, self.runs))
            self.runs = None
        elif tag in ('td', 'th'):
            self.table[-1].append(self.cell)
            self.cell = self.runs = None
        elif tag == 'table':
            self.blocks.append(('table', self.table))
            self.table = None
        elif tag == 'strong':
            self.bold -= 1

    def handle_data(self, data):
        if self.runs is not None and data:
            self.runs.append((data, self.bold > 0))


def add_runs(par, runs):
    for text, bold in runs:
        r = par.add_run(text)
        r.bold = bool(bold)


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    tc_pr.append(shd)


def add_table(doc, rows):
    t = doc.add_table(rows=len(rows), cols=max(len(r) for r in rows))
    t.style = 'Table Grid'
    for i, row in enumerate(rows):
        for j, cell in enumerate(row):
            c = t.cell(i, j)
            par = c.paragraphs[0]
            par.paragraph_format.space_before = Pt(2)
            par.paragraph_format.space_after = Pt(2)
            add_runs(par, [(txt, bold or i == 0) for txt, bold in cell])
            for r in par.runs:
                r.font.size = Pt(10)
            if i == 0:
                shade(c, HEADER_FILL)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def field(par, instr, placeholder=''):
    """A Word field (PAGE, TOC) in the paragraph. Word fills it on update."""
    run = par.add_run()
    begin = OxmlElement('w:fldChar'); begin.set(qn('w:fldCharType'), 'begin')
    text = OxmlElement('w:instrText'); text.set(qn('xml:space'), 'preserve'); text.text = instr
    sep = OxmlElement('w:fldChar'); sep.set(qn('w:fldCharType'), 'separate')
    shown = OxmlElement('w:t'); shown.text = placeholder
    end = OxmlElement('w:fldChar'); end.set(qn('w:fldCharType'), 'end')
    for el in (begin, text, sep, shown, end):
        run._r.append(el)


def entry(doc, label, text):
    """A labelled reference entry: bold label, hanging indent, so a reader can scan the labels."""
    par = doc.add_paragraph()
    fmt = par.paragraph_format
    fmt.left_indent = Inches(0.35)
    fmt.first_line_indent = Inches(-0.35)
    fmt.space_after = Pt(6)
    par.add_run(f'{label}. ').bold = True
    par.add_run(text)
    return par


def grounding(doc, heading):
    """Calibration under the section. Rules and principles are in the appendices."""
    g = GROUNDING.get(heading)
    if not g:
        return
    doc.add_heading('Grounding', level=3)
    par = doc.add_paragraph()
    par.add_run('Calibration. ').bold = True
    par.add_run(g['calibration'] + ' Appendix A lists the binding rules and Appendix B the principles '
                f'behind this section, each under the heading {heading}.')


def appendix(doc, letter, title, key, intro, headings):
    """An appendix grouped by the section the entries ground, in document order."""
    doc.add_page_break()
    doc.add_heading(f'Appendix {letter}. {title}', level=1)
    doc.add_paragraph(intro)
    for heading in headings:
        g = GROUNDING.get(heading)
        if not g or not g[key]:
            continue
        doc.add_heading(heading, level=2)
        for label, text in g[key]:
            entry(doc, label, text)


def figure(doc, png, caption, width=None, height=None):
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.keep_with_next = True
    par.add_run().add_picture(str(png), width=width, height=height)
    cap = doc.add_paragraph(style='Caption')
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.add_run(caption)


def landscape(doc):
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    sec.orientation = WD_ORIENT.LANDSCAPE
    sec.page_width, sec.page_height = sec.page_height, sec.page_width
    sec.left_margin = sec.right_margin = Inches(0.75)
    sec.top_margin = sec.bottom_margin = Inches(0.6)
    return sec


def portrait(doc):
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    sec.orientation = WD_ORIENT.PORTRAIT
    sec.page_width, sec.page_height = sec.page_height, sec.page_width
    sec.left_margin = sec.right_margin = sec.top_margin = sec.bottom_margin = Inches(1)
    return sec


def md_runs(text):
    """**bold** markup in rubric-core.md to runs."""
    runs = []
    for i, part in enumerate(re.split(r'\*\*', text)):
        if part:
            runs.append((part, i % 2 == 1))
    return runs


def overview_blocks():
    """The 'How a review reaches a decision' section of rubric-core.md, as blocks."""
    md = (HERE / 'rubric-core.md').read_text(encoding='utf-8')
    start = md.index('## How a review reaches a decision')
    end = md.index('## 1. Inputs and symbols')
    body = md[start:end].split('\n', 1)[1]
    blocks = []
    for chunk in re.split(r'\n\s*\n', body.strip()):
        prose, bullet = [], None
        for line in chunk.strip().split('\n'):
            if line.startswith('- '):
                if prose:
                    blocks.append(('p', md_runs(' '.join(prose))))
                    prose = []
                bullet = [line[2:].strip()]
                blocks.append(('li', bullet))
            elif bullet is not None and line.startswith('  '):
                bullet.append(line.strip())      # a wrapped bullet continues on an indented line
            else:
                bullet = None
                prose.append(line.strip())
        if prose:
            blocks.append(('p', md_runs(' '.join(prose))))
    return [(k, md_runs(' '.join(v)) if k == 'li' else v) for k, v in blocks]


def render(doc, blocks):
    for kind, payload in blocks:
        if kind == 'h3':
            doc.add_heading(''.join(t for t, _ in payload), level=1)
        elif kind == 'p':
            add_runs(doc.add_paragraph(), payload)
        elif kind == 'li':
            add_runs(doc.add_paragraph(style='List Bullet'), payload)
        elif kind == 'table':
            add_table(doc, payload)


HEADER_FILL = 'E8EEF0'
ACCENT = RGBColor(0x0A, 0x56, 0x60)


def style(doc):
    st = doc.styles
    normal = st['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.08
    for name, size, before in (('Heading 1', 18, 18), ('Heading 2', 13, 12), ('Heading 3', 11, 8)):
        h = st[name]
        h.font.name = 'Calibri'
        h.font.size = Pt(size)
        h.font.bold = True
        h.font.italic = False
        h.font.color.rgb = ACCENT
        h.paragraph_format.space_before = Pt(before)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        # Word reads the heading font from the theme unless the East Asian slot is set too.
        rpr = h.element.get_or_add_rPr()
        fonts = rpr.find(qn('w:rFonts'))
        if fonts is None:
            fonts = OxmlElement('w:rFonts'); rpr.append(fonts)
        for attr in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'):
            fonts.set(qn(attr), 'Calibri')
        for attr in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
            if fonts.get(qn(attr)) is not None:
                del fonts.attrib[qn(attr)]
    t = st['Title']
    t.font.name = 'Calibri'; t.font.size = Pt(26); t.font.bold = True; t.font.color.rgb = ACCENT
    lb = st['List Bullet']
    lb.paragraph_format.space_after = Pt(3)
    cap = st['Caption']
    cap.font.size = Pt(10); cap.font.italic = True; cap.font.bold = False
    cap.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
    cap.paragraph_format.space_after = Pt(12)
    sec = doc.sections[0]
    for side in ('left_margin', 'right_margin', 'top_margin', 'bottom_margin'):
        setattr(sec, side, Inches(1))


def footer(doc, version):
    par = doc.sections[0].footer.paragraphs[0]
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = par.add_run(f'SFBRN Accessible Procurement Rubric, matrix version {version}. Page ')
    run.font.size = Pt(9); run.font.color.rgb = RGBColor(0x44, 0x44, 0x44)
    field(par, 'PAGE', '1')
    for r in par.runs:
        r.font.size = Pt(9); r.font.color.rgb = RGBColor(0x44, 0x44, 0x44)


def update_fields_on_open(doc):
    settings = doc.settings.element
    uf = OxmlElement('w:updateFields')
    uf.set(qn('w:val'), 'true')
    settings.append(uf)


def main():
    tmp = tempfile.mkdtemp()
    subprocess.run(['node', str(HERE / 'dump-definitions.js'), str(PLAYWRIGHT), tmp], check=True)
    data = json.loads((Path(tmp) / 'defs.json').read_text(encoding='utf-8'))
    parser = Defs()
    parser.feed(data['html'])

    doc = Document()
    style(doc)
    footer(doc, data['version'])

    # ---- Title page and contents.
    for _ in range(6):
        doc.add_paragraph()
    doc.add_paragraph('SFBRN Accessible Procurement Rubric', style='Title')
    sub = doc.add_paragraph()
    sub.add_run('The unified accessibility review matrix for the San Francisco Bay Region Network, '
                'applied at requisition intake.').font.size = Pt(14)
    meta = doc.add_paragraph()
    meta.add_run(f'Review matrix version {data["version"]}. Built {date.today().isoformat()} from review-matrix.js, '
                 'the model the SFBRN campuses run.').italic = True
    doc.add_paragraph()
    doc.add_paragraph(
        'Each section states one part of the rubric, in the words the review tester shows a reviewer, '
        'followed by its grounding. Calibration names the choices no rule sets, which the pilot will test. '
        'Appendix A collects the binding rules, federal and California law, the federal standards California '
        'applies, and CSU policy. Appendix B collects the principles, the commitments the ATI framework holds. '
        'Both are grouped by the section they ground.')
    doc.add_page_break()
    contents = doc.add_paragraph()
    run = contents.add_run('Contents')
    run.bold = True; run.font.size = Pt(18); run.font.color.rgb = ACCENT
    contents.paragraph_format.space_after = Pt(8)
    field(doc.add_paragraph(), 'TOC \\o "1-2" \\h \\z \\u', 'Right-click and choose Update Field to build the contents.')

    # ---- Overview and the process figures.
    doc.add_page_break()
    doc.add_heading('How a review reaches a decision', level=1)
    render(doc, overview_blocks())
    figure(doc, Path(tmp) / 'review-process-checks.png',
           'Figure 1. The shared checks, from requisition intake to the risk grade. Routes 1 to 3 hold the review, '
           'and route 3 loops back to the Severity step.', width=Inches(5.8))
    figure(doc, Path(tmp) / 'review-process-remedy.png',
           'Figure 2. The remedy step, from a Needs TAAP risk grade to Deny or Approve with TAAP. '
           'Routes 4 and 5 hold the review.', width=Inches(5.6))
    grounding(doc, 'How a review reaches a decision')

    # ---- The rubric table, on a landscape page.
    landscape(doc)
    doc.add_heading('The rubric on one page', level=1)
    figure(doc, Path(tmp) / 'rubric-core.png',
           'Figure 3. The rubric core, generated from the same model as this document. It collects the values '
           'the sections that follow define: the risk grade for each pairing of Exposure and Severity, the '
           'Veracity floor, the TAAP standard by pressure and the warning level.',
           width=Inches(9.5))
    portrait(doc)

    # ---- The definitions, one section each.
    current = None
    section = []
    for kind, payload in parser.blocks:
        if kind == 'h3':
            if current:
                render(doc, section)
                grounding(doc, current)
            current = ''.join(t for t, _ in payload)
            section = [(kind, payload)]
        else:
            section.append((kind, payload))
    if current:
        render(doc, section)
        grounding(doc, current)

    sections = ['How a review reaches a decision'] + [''.join(t for t, _ in p) for k, p in parser.blocks if k == 'h3']
    missing = [h for h in GROUNDING if h not in sections]
    if missing:
        sys.exit(f'grounding has no section: {missing}')

    # ---- Appendices.
    appendix(doc, 'A', 'Binding rules', 'rules',
             'The rules below bind the CSU. They are federal and California law, the federal standards '
             'California applies through Government Code 7405 and 11135, and CSU policy. Each entry states '
             'what the rule says and which part of the section it carries. Guidance, settlements, cases '
             'from other institutions and peer practice are not listed, because they do not bind the CSU.',
             sections)
    appendix(doc, 'B', 'Principles', 'principles',
             'A principle is a commitment the ATI framework holds, recorded in the ATI knowledge graph with '
             'the law, policy and scholarship that ground it. Each entry states the principle and the part '
             'of the section it carries. A principle marked "proposed" was drafted for this matrix and is '
             'not yet recorded in the graph.',
             sections)
    update_fields_on_open(doc)
    shutil.rmtree(tmp, ignore_errors=True)
    doc.save(OUT)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
