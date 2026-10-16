"""The document's visual system, in one place.

The register is an official report: a serif display face for headings, a plain sans
for body and tables, one dark ink colour, one accent, thin rules, generous white space,
and a single-hue status scale so a reader can see maturity at a glance without a
legend. Nothing decorative. Change values here, never in the renderer.
"""
from __future__ import annotations

from docx.shared import Pt, RGBColor, Inches

# ---- Type --------------------------------------------------------------------
HEADING_FONT = "Georgia"
BODY_FONT = "Calibri"
MONO_FONT = "Consolas"

SIZE_TITLE = Pt(30)
SIZE_SUBTITLE = Pt(16)
SIZE_H1 = Pt(20)
SIZE_H2 = Pt(15)
SIZE_H3 = Pt(12)
SIZE_H4 = Pt(10.5)
SIZE_BODY = Pt(10.5)
SIZE_SMALL = Pt(9)
SIZE_TABLE = Pt(9)
SIZE_STAT = Pt(26)
SIZE_KICKER = Pt(9)

# ---- Colour ------------------------------------------------------------------
INK = RGBColor(0x1A, 0x20, 0x2C)          # body text
NAVY = RGBColor(0x0B, 0x25, 0x45)         # headings, cover rule, table header
NAVY_HEX = "0B2545"                       # the same, for XML attributes
STEEL = RGBColor(0x2E, 0x5C, 0x8A)        # accent: kickers, links, h3
STEEL_HEX = "2E5C8A"                      # the same, for XML attributes
SLATE = RGBColor(0x5A, 0x67, 0x7D)        # meta text, captions
HAIRLINE = "CBD2D9"                       # table rules (hex, for XML)
TINT = "F4F6F8"                           # table header fill / zebra
TINT_STRONG = "E9EDF2"                    # stat strip fill
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

# Status scale: the app's own ramp (app/frontend/src/src/services/utils/statusColors.js),
# the Chakra .50/.100/.200 tint as the fill and the AA-safe text colour on it, so a
# status reads the same on paper as on screen. (fill hex, text colour)
STATUS_FILL = {
    "Not Started": ("FFF5F5", RGBColor(0xC5, 0x30, 0x30)),   # red.50 / red.600
    "Initiated":   ("FFFAF0", RGBColor(0x9C, 0x42, 0x21)),   # orange.50 / orange.700
    "Defined":     ("FFFFF0", RGBColor(0x97, 0x5A, 0x16)),   # yellow.50 / yellow.700
    "Established": ("F0FFF4", RGBColor(0x2F, 0x7A, 0x2F)),   # green.50 / deepened green.400
    "Managed":     ("C6F6D5", RGBColor(0x24, 0x6F, 0x24)),   # green.100 / green.600
    "Optimizing":  ("9AE6B4", RGBColor(0x15, 0x77, 0x44)),   # green.200 / green.700
    "Unset":       ("F7FAFC", RGBColor(0x4A, 0x55, 0x68)),   # gray.50 / gray.600
}

# ---- Page --------------------------------------------------------------------
LOGO_WIDTH = Inches(1.9)                  # the SFBRN wordmark on the cover
PAGE_MARGIN = Inches(1.0)
PAGE_MARGIN_TOP = Inches(0.9)
HEADER_DISTANCE = Inches(0.45)

# ---- Spacing (points) --------------------------------------------------------
SPACE_AFTER_BODY = Pt(6)
SPACE_BEFORE_H1 = Pt(24)
SPACE_BEFORE_H2 = Pt(18)
SPACE_BEFORE_H3 = Pt(14)
SPACE_BEFORE_H4 = Pt(10)
LINE_SPACING = 1.15

# ---- Strings -----------------------------------------------------------------
PROGRAM_NAME = "Accessible Technology Initiative"
REPORT_TITLE = "Annual Status Report"
SYSTEM_NAME = "California State University"
