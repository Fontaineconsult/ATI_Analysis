// App-wide Chakra theme. Lives in its own module (not App.js) because the
// ChakraProvider must mount at the ROOT in index.js — AuthGate/Login render
// above <App/>, and any Chakra styling (e.g. the brand gradient) crashes if
// it resolves tokens without a provider in scope.
import { extendTheme } from '@chakra-ui/react';

// Darkest-necessary solid shade per colorScheme for ≥4.5:1 with white text.
// Schemes absent here (teal = brand blue, purple = brand purple) pass at their
// Chakra defaults.
const SOLID_AA_SHADE = {
    red: 600,
    orange: 700,
    yellow: 700,
    green: 600,
    blue: 600,
    cyan: 800,
    pink: 600,
    gray: 600,
    coral: 600,
};

// Outline/ghost text shade per colorScheme — the light schemes' default `.600`
// text misses 4.5:1 on white.
const TEXT_AA_SHADE = {
    yellow: 700,
    orange: 700,
    cyan: 800,
};

// Badge outline text defaults to `${c}.500`, which fails AA at badge sizes for
// most schemes.
const BADGE_OUTLINE_AA_SHADE = {
    red: 600,
    orange: 700,
    yellow: 700,
    green: 600,
    blue: 600,
    cyan: 800,
    pink: 600,
    gray: 600,
    coral: 600,
};

const theme = extendTheme({
    fontSizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem"
    },

    colors: {
        // SFBRN brand blue (#4966A4 from sfbrn-logo.svg), published under the
        // `teal` key so every existing teal.* / colorScheme="teal" usage picks
        // it up without touching each component. Desaturated on purpose — this
        // is a data-heavy app, so chrome stays quiet and saturated color is
        // reserved for status/severity meaning.
        teal: {
            50: "#F4F6FB",
            100: "#E4E9F4",
            200: "#C9D3E8",
            300: "#A7B7D7",
            400: "#7E93BF",
            500: "#4966A4",
            600: "#40598F",
            700: "#354A7A",
            800: "#2A3A62",
            900: "#202C4A"
        },
        // SFBRN accent purple (#635098), published over Chakra's `purple` so
        // existing colorScheme="purple" usages harmonize with the logo.
        purple: {
            50: "#F6F4FA",
            100: "#E9E5F3",
            200: "#D3CCE6",
            300: "#B6AAD4",
            400: "#8F7DB9",
            500: "#635098",
            600: "#574686",
            700: "#483A70",
            800: "#3A2F5A",
            900: "#2B2343"
        },
        // SFBRN accent coral (#DB5850). Identity/chrome accents only (working
        // group marks, the brand rule) — never status/severity, where it would
        // blur into the danger reds.
        coral: {
            50: "#FCF1F0",
            100: "#F9DEDC",
            200: "#F2BDB9",
            300: "#EA9A94",
            400: "#E27970",
            500: "#DB5850",
            600: "#C24A43",
            700: "#A03C36",
            800: "#7E2F2A",
            900: "#5C221F"
        },
        // The full logo palette, addressable directly (brand.coral is near the
        // danger reds — decorative use would blur error semantics; see
        // claude_files/design-sense.md).
        brand: {
            blue: "#4966A4",
            purple: "#635098",
            coral: "#DB5850",
            charcoal: "#231F20"
        }
    },

    components: {
        // Chakra's default Stat label is gray.500 and its helpText renders at
        // 0.8 opacity — both land under WCAG AA 4.5:1 at stat-strip sizes.
        Stat: {
            baseStyle: {
                label: { color: 'gray.600' },
                helpText: { color: 'gray.600', opacity: 1 },
            },
        },
        // White text on Chakra's `.500` solids (and `.600` text in outline/ghost
        // for the light schemes) misses AA at our button/badge sizes. Shift each
        // failing colorScheme one or two stops darker; `teal` (brand blue) and
        // `purple` already pass at their defaults and keep the brand look.
        Badge: {
            variants: {
                solid: (props) => {
                    const shade = SOLID_AA_SHADE[props.colorScheme];
                    return shade ? { bg: `${props.colorScheme}.${shade}`, color: 'white' } : {};
                },
                outline: (props) => {
                    const shade = BADGE_OUTLINE_AA_SHADE[props.colorScheme];
                    return shade ? { color: `${props.colorScheme}.${shade}` } : {};
                },
            },
        },
        Button: {
            variants: {
                solid: (props) => {
                    const c = props.colorScheme;
                    const shade = SOLID_AA_SHADE[c];
                    if (!shade) return {};
                    return {
                        bg: `${c}.${shade}`,
                        color: 'white',
                        _hover: { bg: `${c}.${Math.min(shade + 100, 900)}` },
                        _active: { bg: `${c}.${Math.min(shade + 200, 900)}` },
                    };
                },
                outline: (props) => {
                    const shade = TEXT_AA_SHADE[props.colorScheme];
                    return shade ? { color: `${props.colorScheme}.${shade}` } : {};
                },
                ghost: (props) => {
                    const shade = TEXT_AA_SHADE[props.colorScheme];
                    return shade ? { color: `${props.colorScheme}.${shade}` } : {};
                },
            },
        },
    },
});

export default theme;
