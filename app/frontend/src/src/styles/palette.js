/**
 * Central color palette.
 *
 * Single source of truth for semantic color tokens used across components.
 * Two layers:
 *
 *  - `palette.semantic`  — meaning-based names (status colors, severity, etc.)
 *                          The right way to reference colors in components:
 *                          `palette.semantic.statusInProgress.fg`.
 *
 *  - `palette.raw`       — raw hex values, kept here so semantic tokens have
 *                          a single place to read from. Avoid referencing raw
 *                          colors in components; use a semantic token.
 *
 * Each semantic status entry has three values to support multiple use cases:
 *   solid  — the primary color (for dots, bars, bold text)
 *   bg     — a tinted background suitable for filled pills
 *   fg     — a darker tone for text rendered on top of `bg`
 *
 * If you need a new semantic token, add it here rather than hardcoding the
 * hex anywhere else.
 */

const raw = {
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray100: '#F3F4F6',

    blue500: '#3182CE',
    blue700: '#2B6CB0',
    blue50:  '#EBF8FF',

    green500: '#38A169',
    green700: '#276749',
    green50:  '#F0FFF4',

    orange500: '#DD6B20',
    orange700: '#9C4221',
    orange50:  '#FFFAF0',

    red500: '#E53E3E',
    red700: '#9B2C2C',
    red50:  '#FFF5F5',
};

const semantic = {
    statusNotStarted: { solid: raw.gray500,   bg: raw.gray100,   fg: raw.gray600   },
    statusInProgress: { solid: raw.blue500,   bg: raw.blue50,    fg: raw.blue700   },
    statusCompleted:  { solid: raw.green500,  bg: raw.green50,   fg: raw.green700  },
    statusOnHold:     { solid: raw.orange500, bg: raw.orange50,  fg: raw.orange700 },
    statusAbandoned:  { solid: raw.red500,    bg: raw.red50,     fg: raw.red700    },
};

const palette = { raw, semantic };

export { palette };
export default palette;
