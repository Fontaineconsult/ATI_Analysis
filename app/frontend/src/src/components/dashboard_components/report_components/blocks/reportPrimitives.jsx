import React from 'react';
import {
    Box,
    Heading,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
} from '@chakra-ui/react';

/*
 * Shared presentation primitives for the get_indicator_report renderings.
 *
 * Extracted verbatim from IndicatorReportView so the report page and the approval page
 * (and any future presentation of the same payload) inherit one set of text/table
 * treatments instead of each carrying a private copy. The grays here are deliberate:
 * gray.700 is the text floor (11.99:1 on white — the app's contrast requirement is
 * 8:1, raised from AA on 2026-08-25; gray.600's 7.53:1 no longer clears it).
 */

export const SubLabel = ({ children }) => (
    <Text fontSize="2xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wide">
        {children}
    </Text>
);

/** A true SUBSECTION heading (h3 under the section's h2) wearing the SubLabel
 *  look — for named subsections screen-reader users should be able to jump to.
 *  Row labels (e.g. "Maturity") stay SubLabel: they label a value, not a region. */
export const SubHeading = ({ children }) => (
    <Heading as="h3" fontSize="2xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wide">
        {children}
    </Heading>
);

export const Empty = ({ children }) => (
    <Text fontSize="sm" color="gray.700" fontStyle="italic">{children}</Text>
);

export const Dash = () => <Text as="span" color="gray.700">—</Text>;

/** Subtle data table — muted uppercase headers, thin horizontal row rules, no vertical lines. */
export const TH_SX = {
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'gray.700',
    fontWeight: 'bold', px: 2, py: 1.5, borderBottomWidth: '1px', borderColor: 'gray.200',
    textAlign: 'left', whiteSpace: 'nowrap',
};
export const TD_SX = {
    fontSize: 'xs', color: 'gray.700', px: 2, py: 2,
    borderBottomWidth: '1px', borderColor: 'gray.100', verticalAlign: 'top',
};

export const DataTable = ({ columns, rows }) => {
    if (!rows.length) return null;
    return (
        <Box overflowX="auto">
            <Table size="sm" variant="unstyled" sx={{ tableLayout: 'auto' }}>
                <Thead>
                    <Tr>{columns.map((c, i) => <Th key={i} sx={TH_SX}>{c}</Th>)}</Tr>
                </Thead>
                <Tbody>
                    {rows.map((cells, ri) => (
                        <Tr key={ri}>{cells.map((cell, ci) => <Td key={ci} sx={TD_SX}>{cell}</Td>)}</Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};
