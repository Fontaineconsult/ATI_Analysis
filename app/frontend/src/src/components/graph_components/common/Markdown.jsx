import React from 'react';
import MarkdownToJsx from 'markdown-to-jsx';
import {
    Box, Heading, Text, Link, UnorderedList, OrderedList, ListItem, Code, Divider,
    Table, Thead, Tbody, Tr, Th, Td,
} from '@chakra-ui/react';

/**
 * Render a Markdown string as readable, Chakra-styled content (design-sense common primitive).
 *
 * Uses markdown-to-jsx (CJS — no ESM/jest friction, unlike react-markdown). Raw HTML is NOT
 * parsed (`disableParsingRawHTML`), so pasted/auto-generated minutes render as Markdown only —
 * no HTML injection. Element tags are mapped to Chakra components so headings/lists/tables/links
 * inherit the app's look.
 */
const overrides = {
    h1: { component: Heading, props: { as: 'h1', size: 'md', mt: 3, mb: 2, color: 'gray.800' } },
    h2: { component: Heading, props: { as: 'h2', size: 'sm', mt: 3, mb: 2, color: 'gray.800' } },
    h3: { component: Heading, props: { as: 'h3', size: 'xs', mt: 2, mb: 1, color: 'gray.700', textTransform: 'none' } },
    h4: { component: Heading, props: { as: 'h4', size: 'xs', mt: 2, mb: 1, color: 'gray.700', textTransform: 'none' } },
    p:  { component: Text, props: { fontSize: 'sm', color: 'gray.700', mb: 2 } },
    a:  { component: Link, props: { color: 'teal.600', isExternal: true } },
    ul: { component: UnorderedList, props: { fontSize: 'sm', color: 'gray.700', pl: 5, mb: 2, spacing: 1 } },
    ol: { component: OrderedList, props: { fontSize: 'sm', color: 'gray.700', pl: 5, mb: 2, spacing: 1 } },
    li: { component: ListItem },
    code: { component: Code, props: { fontSize: 'xs', colorScheme: 'gray' } },
    pre: { component: Box, props: { as: 'pre', bg: 'gray.50', p: 2, borderRadius: 'md', overflowX: 'auto', fontSize: 'xs', fontFamily: 'mono', mb: 2 } },
    blockquote: { component: Box, props: { borderLeftWidth: '3px', borderLeftColor: 'gray.300', pl: 3, color: 'gray.600', fontStyle: 'italic', my: 2 } },
    hr: { component: Divider, props: { my: 3 } },
    table: { component: Table, props: { size: 'sm', variant: 'simple', mb: 3 } },
    thead: { component: Thead },
    tbody: { component: Tbody },
    tr: { component: Tr },
    th: { component: Th, props: { fontSize: 'xs' } },
    td: { component: Td, props: { fontSize: 'xs' } },
};

export default function Markdown({ children, ...rest }) {
    if (!children) return null;
    return (
        <Box className="ati-markdown" {...rest}>
            <MarkdownToJsx options={{ disableParsingRawHTML: true, forceBlock: true, overrides }}>
                {String(children)}
            </MarkdownToJsx>
        </Box>
    );
}
