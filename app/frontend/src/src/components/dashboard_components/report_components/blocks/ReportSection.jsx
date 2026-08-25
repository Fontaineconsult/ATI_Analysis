import React from 'react';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';

/**
 * Titled section wrapper for the report and approval presentations.
 *
 * Unifies IndicatorReportView's ReportSection (which had the a11y wiring — `as="section"` +
 * `aria-labelledby` for landmark nav, count-in-title) and ApprovalPage's Section (which had
 * the banded teal header and a subtitle line, but had dropped the a11y attrs — a regression
 * this component closes for good, since neither page hand-rolls a section any more).
 *
 * `banded` selects the look; the semantics never vary:
 *   banded=false — the report's flat white card, heading row, p={5}
 *   banded=true  — the approval page's teal.50 header band with the body below
 *
 * NOT the same thing as graph_components/common/Section.jsx, which is an h4-level inner
 * block for detail panels. This is the page-level h2 wrapper.
 */
const ReportSection = ({ id, title, subtitle, count, action, banded = false, children, ...rest }) => {
    const heading = (
        <Heading as="h2" id={id} size="sm" color={banded ? 'gray.800' : 'teal.700'}>
            {title}{typeof count === 'number' ? ` (${count})` : ''}
        </Heading>
    );

    if (!banded) {
        return (
            <Box as="section" aria-labelledby={id} bg="white" borderWidth="1px"
                borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
                <HStack justify="space-between" align="baseline" mb={subtitle ? 1 : 3}>
                    {heading}
                    {action}
                </HStack>
                {subtitle && <Text fontSize="xs" color="gray.600" mb={3}>{subtitle}</Text>}
                {children}
            </Box>
        );
    }

    return (
        <Box as="section" aria-labelledby={id} bg="white" borderWidth="1px"
            borderColor="gray.200" borderRadius="lg" boxShadow="sm" overflow="hidden" {...rest}>
            <Box bg="teal.50" px={3.5} py={2} borderBottomWidth="1px" borderColor="teal.100">
                {/* count renders in the title in both modes — one convention */}
                <HStack justify="space-between" align="baseline" flexWrap="wrap">
                    {heading}
                    {action}
                </HStack>
                {subtitle && <Text fontSize="xs" color="gray.600" mt={0.5}>{subtitle}</Text>}
            </Box>
            <Box p={3}>{children}</Box>
        </Box>
    );
};

export default ReportSection;
