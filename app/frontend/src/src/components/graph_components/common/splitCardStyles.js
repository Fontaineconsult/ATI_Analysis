/**
 * Shared chrome for the campus-plan "split" cards — the prioritized-indicator,
 * plan, query, and meeting-minutes cards. Each is a two-region card: a slightly
 * darker top band (status / data / actions) sits over a white name row, divided
 * by a hairline, with a soft drop shadow on the whole card.
 *
 * Centralized so the four card types stay visually identical — in particular the
 * top/bottom backgrounds match across Queries and Meeting Minutes. Spread these
 * onto Chakra <Box>es; layer a `borderLeftWidth`/`borderLeftColor` accent on the
 * outer box where a card carries a status color (design-sense §8 debt #1 — inline
 * tokens until the design system is lifted into the theme).
 *
 *   <Box {...splitCardOuter} borderLeftWidth="3px" borderLeftColor={accent}>
 *     <Box {...splitCardTop}>    …status · data · actions… </Box>
 *     <Box {...splitCardBottom}> …name… </Box>
 *   </Box>
 */
export const splitCardOuter = {
    bg: 'white',
    borderWidth: '1px',
    borderColor: 'gray.200',
    borderRadius: 'md',
    boxShadow: 'sm',
    overflow: 'hidden', // clip the darker top band to the rounded corners
};

export const splitCardTop = {
    bg: 'gray.50',
    borderBottomWidth: '1px',
    borderBottomColor: 'gray.200',
    px: 3,
    py: 2,
};

export const splitCardBottom = {
    px: 3,
    py: 2,
};
