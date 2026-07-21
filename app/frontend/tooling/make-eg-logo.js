// Usage: npm i opentype.js && node make-eg-logo.js  (regenerates both assets)
// Generates the "Evidence Graph" lockup variants of the SFBRN logo:
//   sfbrn-logo-light-eg.svg  (white on brand navy — header)
//   sfbrn-logo-eg.svg        (charcoal on light — parity variant)
// "EVIDENCE GRAPH" is converted to outline paths (Arial) so the logo renders
// identically everywhere — SVG-in-<img> cannot load webfonts.
const fs = require('fs');
const opentype = require('opentype.js');

const ASSETS = 'C:/Users/Fonta/PycharmProjects/ATI_Analysis/app/frontend/src/src/assets/img';
const FONT = opentype.loadSync('C:/Windows/Fonts/arial.ttf');

const TEXT = 'EVIDENCE GRAPH';
const FONT_SIZE = 12.6;          // viewBox units (viewBox height 31.63)
const TRACKING = 2.2;            // extra units between glyphs ≈ 0.17em — matches
                                 // the subtitle's 0.18em letterspacing
const BASELINE_Y = 20.4;         // caps ≈9.0 tall → optically centered in 31.63

// Per-glyph placement with manual tracking; returns { d, width }.
function textToPath(text, startX) {
    let x = startX;
    const paths = [];
    for (const ch of text) {
        const glyph = FONT.charToGlyph(ch);
        paths.push(glyph.getPath(x, BASELINE_Y, FONT_SIZE).toPathData(2));
        x += (glyph.advanceWidth / FONT.unitsPerEm) * FONT_SIZE + TRACKING;
    }
    return { d: paths.filter(Boolean).join(' '), width: x - TRACKING - startX };
}

// Layout (viewBox units). SFBRN art occupies x 0–152; the graph mark closes
// the lockup on the right as a terminal element.
const DIVIDER_X = 165;
const TEXT_X = 176;

const { d: textPathD, width: textWidth } = textToPath(TEXT, TEXT_X);
const GLYPH_CX = TEXT_X + textWidth + 6 + 12.8;   // mark's leftmost node sits 6u after the text
const GLYPH_CY = 15.8;
const TOTAL_W = (GLYPH_CX + 17.5).toFixed(2);      // rightmost node + padding

// The evidence-graph mark: a hub node (the YSE) linked to three satellite
// nodes in the accent trio (the working groups), each sprouting a smaller
// second-degree node — a graph in mid-growth, like the app's data.
const SATS = [
    { dx: -6.8, dy: -6.6, key: 'blue' },
    { dx: 8.0, dy: -4.2, key: 'purple' },
    { dx: -4.6, dy: 7.4, key: 'coral' },
];
const LEAVES = [
    { from: 0, dx: -12.8, dy: -10.8 },  // off blue
    { from: 1, dx: 14.8, dy: -8.8 },    // off purple
    { from: 2, dx: 2.4, dy: 11.6 },     // off coral
];

const PALETTES = {
    light: {   // on brand navy #2A3A62 — accent steps match sfbrn-logo-light.svg
        letters: '#ffffff', divider: '#ffffff', dividerOpacity: 0.35,
        edge: '#ffffff', edgeOpacity: 0.55, hub: '#ffffff',
        blue: '#7e93bf', purple: '#9b8cc4', coral: '#e2706a',
    },
    dark: {    // on light surfaces — original brand colors
        letters: '#231f20', divider: '#231f20', dividerOpacity: 0.25,
        edge: '#231f20', edgeOpacity: 0.4, hub: '#231f20',
        blue: '#4966a4', purple: '#635098', coral: '#db5850',
    },
};

function egMarkup(p) {
    const at = (dx, dy) => [(GLYPH_CX + dx).toFixed(1), (GLYPH_CY + dy).toFixed(1)];
    const spokeEdges = SATS.map(s => {
        const [x, y] = at(s.dx, s.dy);
        return `      <line x1="${GLYPH_CX.toFixed(1)}" y1="${GLYPH_CY}" x2="${x}" y2="${y}" stroke="${p.edge}" stroke-opacity="${p.edgeOpacity}" stroke-width="0.9"/>`;
    }).join('\n');
    const leafEdges = LEAVES.map(l => {
        const s = SATS[l.from];
        const [x1, y1] = at(s.dx, s.dy);
        const [x2, y2] = at(l.dx, l.dy);
        return `      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.edge}" stroke-opacity="${(p.edgeOpacity * 0.7).toFixed(2)}" stroke-width="0.7"/>`;
    }).join('\n');
    const satNodes = SATS.map(s => {
        const [x, y] = at(s.dx, s.dy);
        return `      <circle cx="${x}" cy="${y}" r="2.1" fill="${p[s.key]}"/>`;
    }).join('\n');
    const leafNodes = LEAVES.map(l => {
        const s = SATS[l.from];
        const [x, y] = at(l.dx, l.dy);
        return `      <circle cx="${x}" cy="${y}" r="1.3" fill="${p[s.key]}" fill-opacity="0.75"/>`;
    }).join('\n');
    return `
    <!-- Evidence Graph lockup -->
    <g id="evidence-graph">
      <rect x="${DIVIDER_X}" y="3.5" width="1.3" height="24.6" rx="0.65" fill="${p.divider}" fill-opacity="${p.dividerOpacity}"/>
      <path fill="${p.letters}" d="${textPathD}"/>
${spokeEdges}
${leafEdges}
${satNodes}
${leafNodes}
      <circle cx="${GLYPH_CX.toFixed(1)}" cy="${GLYPH_CY}" r="2.5" fill="${p.hub}"/>
    </g>`;
}

// Rebuild each variant from its source file: widen the viewBox, keep the
// original inner markup verbatim, append the lockup before </svg>.
function build(srcFile, outFile, paletteKey, comment) {
    const src = fs.readFileSync(`${ASSETS}/${srcFile}`, 'utf8');
    let out = src.replace('viewBox="0 0 151.99 31.63"', `viewBox="0 0 ${TOTAL_W} 31.63"`);
    out = out.replace('</svg>', `${egMarkup(PALETTES[paletteKey])}\n</svg>`);
    out = out.replace('<?xml version="1.0" encoding="UTF-8"?>',
        `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${comment} -->`);
    fs.writeFileSync(outFile, out);
    console.log(outFile.split('/').pop(), '→ width', TOTAL_W);
}

build('sfbrn-logo-light.svg', `${ASSETS}/sfbrn-logo-light-eg.svg`, 'light',
    'Evidence Graph lockup (light/on-navy). Generated from sfbrn-logo-light.svg — text is outlined Arial caps (no font dependency). Keep in sync with sfbrn-logo-eg.svg.');
build('sfbrn-logo.svg', `${ASSETS}/sfbrn-logo-eg.svg`, 'dark',
    'Evidence Graph lockup (dark/on-light). Generated from sfbrn-logo.svg — text is outlined Arial caps (no font dependency). Keep in sync with sfbrn-logo-light-eg.svg.');
