import { extendTheme } from '@chakra-ui/react';

const sfStateTheme = extendTheme({
    colors: {
        // Primary Brand Colors
        sfState: {
            purple: {
                DEFAULT: '#5B3080',  // SF State Purple (primary)
                50: '#F3EFFB',
                100: '#E2D7F0',
                200: '#C4AFE1',
                300: '#A788D2',
                400: '#8960C3',
                500: '#5B3080',  // Base
                600: '#4A2668',
                700: '#391D50',
                800: '#281338',
                900: '#170A20'
            },
            gold: {
                DEFAULT: '#C99700',  // SF State Gold (secondary)
                50: '#FFF9E6',
                100: '#FFEDB3',
                200: '#FFE180',
                300: '#FFD54D',
                400: '#FFC91A',
                500: '#C99700',  // Base
                600: '#A17A00',
                700: '#795C00',
                800: '#513E00',
                900: '#292000'
            }
        },

        // Extended Palette
        extended: {
            lightPurple: '#8B72A1',  // Light Purple
            darkPurple: '#362951',   // Dark Purple
            lightGold: '#F4E5BC',     // Light Gold
            darkGold: '#9C7500',      // Dark Gold
            warmGray: '#8B8680',      // Warm Gray
            coolGray: '#6C757D',      // Cool Gray
        },

        // Accent Colors
        accent: {
            teal: '#007C7A',          // Teal
            orange: '#E56A00',        // Orange
            green: '#47821C',         // Green
            blue: '#005DAA',          // Blue
            red: '#C41230',           // Red
            pink: '#E91E63',          // Pink
        },

        // Neutral Colors
        neutral: {
            black: '#000000',
            charcoal: '#333333',
            darkGray: '#666666',
            mediumGray: '#999999',
            lightGray: '#CCCCCC',
            paleGray: '#E6E6E6',
            offWhite: '#F5F5F5',
            white: '#FFFFFF'
        }
    },

    // Typography to match SF State brand
    fonts: {
        heading: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },

    fontSizes: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        md: '1rem',        // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
        '6xl': '3.75rem',  // 60px
    },

    // Component style overrides
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'medium',
                borderRadius: 'md',
            },
            variants: {
                // Custom SF State purple variant
                sfPrimary: {
                    bg: 'sfState.purple.500',
                    color: 'white',
                    _hover: {
                        bg: 'sfState.purple.600',
                        _disabled: {
                            bg: 'sfState.purple.500',
                        },
                    },
                    _active: {
                        bg: 'sfState.purple.700',
                    },
                },
                // Custom SF State gold variant
                sfSecondary: {
                    bg: 'sfState.gold.500',
                    color: 'white',
                    _hover: {
                        bg: 'sfState.gold.600',
                        _disabled: {
                            bg: 'sfState.gold.500',
                        },
                    },
                    _active: {
                        bg: 'sfState.gold.700',
                    },
                },
            },
        },
        Heading: {
            baseStyle: {
                color: 'sfState.purple.500',
            },
        },
    },

    // Spacing scale
    space: {
        px: '1px',
        0.5: '0.125rem',
        1: '0.25rem',
        1.5: '0.375rem',
        2: '0.5rem',
        2.5: '0.625rem',
        3: '0.75rem',
        3.5: '0.875rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        9: '2.25rem',
        10: '2.5rem',
        12: '3rem',
        14: '3.5rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        28: '7rem',
        32: '8rem',
        36: '9rem',
        40: '10rem',
        44: '11rem',
        48: '12rem',
        52: '13rem',
        56: '14rem',
        60: '15rem',
        64: '16rem',
        72: '18rem',
        80: '20rem',
        96: '24rem',
    },

    // Breakpoints
    breakpoints: {
        sm: '30em',
        md: '48em',
        lg: '62em',
        xl: '80em',
        '2xl': '96em',
    },
});

export default sfStateTheme;