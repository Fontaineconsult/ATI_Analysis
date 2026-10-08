import React from 'react';
import { Box, Flex, VStack } from '@chakra-ui/react';

// List markup for things that read as lists (names, chips, stacked entries),
// without browser list styling. Every list carries an explicit role="list":
// Safari/VoiceOver drops list semantics once list-style is none.

const RESET = { listStyleType: 'none', m: 0, p: 0 };

// A wrapping horizontal list: names, chips, badges.
export function InlineList({ children, gap = 3, rowGap = 1.5, ...rest }) {
    return (
        <Flex as="ul" role="list" {...RESET} flexWrap="wrap" alignItems="center" columnGap={gap} rowGap={rowGap} {...rest}>
            {children}
        </Flex>
    );
}

// A vertical list of stacked entries: community boxes, queries, minutes.
export function StackList({ children, spacing = 2, ...rest }) {
    return (
        <VStack as="ul" role="list" {...RESET} align="stretch" spacing={spacing} {...rest}>
            {children}
        </VStack>
    );
}

// A list item laid out inline (flex), never as a block with a marker.
export function ListEntry({ children, ...rest }) {
    return (
        <Box as="li" display="flex" alignItems="center" {...rest}>
            {children}
        </Box>
    );
}
