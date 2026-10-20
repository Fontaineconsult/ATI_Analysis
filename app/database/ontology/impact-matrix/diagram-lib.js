// Shared SVG drawing helpers for the process diagrams. Each builder gets its own part list.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const COLOR = {
  approve: ['#e3f4e8', '#14612d'], taap: ['#ddf1f3', '#0a5660'], deny: ['#fbe3e4', '#8c1d22'],
  hold: ['#ecebf7', '#3b3270'], step: ['#ffffff', '#1a1a1a'], decision: ['#fdf7e3', '#1a1a1a'],
  start: ['#f0efe9', '#1a1a1a'], state: ['#fdf0d5', '#7a4d00'],
};
const LINE = '#6b6b6b';

function makeCanvas() {
  const parts = [];
  const text = (x, y, lines, o = {}) => {
    const size = o.size ?? 13;
    const lh = size + 4;
    const y0 = y - ((lines.length - 1) * lh) / 2;
    parts.push(`<text x="${x}" y="${y0}" text-anchor="${o.anchor ?? 'middle'}" font-size="${size}" fill="${o.fill ?? '#1a1a1a'}">`
      + lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}" font-weight="${i === 0 && o.boldFirst ? 600 : 400}">${esc(l)}</tspan>`).join('')
      + '</text>');
  };
  /** A box centred on (cx, cy). The first line is bold. */
  const box = (cx, cy, w, h, kind, lines, o = {}) => {
    const [bg, fg] = COLOR[kind];
    parts.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${o.rx ?? 6}" fill="${bg}" stroke="${o.stroke ?? '#bdbab0'}" stroke-width="${o.stroke ? 1.6 : 1}"/>`);
    text(cx, cy + 4, lines, { boldFirst: true, fill: fg, size: o.size });
  };
  const diamond = (cx, cy, w, h, lines, size = 12) => {
    parts.push(`<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="${COLOR.decision[0]}" stroke="#bdbab0"/>`);
    text(cx, cy + 4, lines, { size });
  };
  /** An orthogonal arrow through the points. `label` (a string or lines) sits beside the first
   *  segment: above a horizontal one, beside the top of a vertical one. */
  const arrow = (pts, label, o = {}) => {
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
    parts.push(`<path d="${d}" fill="none" stroke="${LINE}" stroke-width="1.4"${o.noHead ? '' : ' marker-end="url(#head)"'}/>`);
    if (label) {
      const lines = Array.isArray(label) ? label : [label];
      const [x0, y0] = pts[0]; const [x1, y1] = pts[1];
      const horizontal = y0 === y1;
      const lx = horizontal ? (x0 + x1) / 2 : x0 + 8;
      const ly = horizontal ? y0 - 6 - (lines.length - 1) * 7.5 : y0 + 16;
      text(lx, ly, lines, { size: 11, fill: '#444444', anchor: horizontal ? 'middle' : 'start' });
    }
  };
  const svg = (W, H, title, desc, head = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="Segoe UI, system-ui, -apple-system, Helvetica, Arial, sans-serif">
  <title id="t">${esc(title)}</title>
  <desc id="d">${esc(desc)}</desc>
  <defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${LINE}"/></marker></defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${head}
  ${parts.join('\n  ')}
</svg>
`;
  return { parts, text, box, diamond, arrow, svg };
}

module.exports = { COLOR, LINE, esc, makeCanvas };
