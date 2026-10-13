import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Collapse,
    HStack,
    Link,
    SimpleGrid,
    Table,
    TableCaption,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

import { buildMetricView, hasDetails } from './metricViewModel';

const DIRECTION_TEXT = { improved: 'better', worsened: 'worse' };
const DIRECTION_COLOR = { improved: 'green.700', worsened: 'red.700' };

function Change({ change, direction }) {
    if (!change) return null;
    return (
        <Text as="span" fontSize="2xs" color={DIRECTION_COLOR[direction] || 'gray.700'}>
            {change}
            {direction && ` (${DIRECTION_TEXT[direction]})`}
        </Text>
    );
}

function Figure({ figure, emphasis = false }) {
    return (
        <Box
            bg={emphasis ? 'teal.50' : 'gray.50'}
            borderWidth="1px"
            borderColor={emphasis ? 'teal.200' : 'gray.200'}
            borderRadius="md"
            px={3}
            py={2}
        >
            <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wide" color="gray.700">
                {figure.label}
            </Text>
            <Text fontSize={emphasis ? 'xl' : 'lg'} fontWeight="semibold" color="gray.800" lineHeight="short">
                {figure.value}
            </Text>
            <Change change={figure.change} direction={figure.direction} />
        </Box>
    );
}

function Figures({ headline, figures }) {
    const all = headline ? [headline, ...figures] : figures;
    if (!all.length) return null;
    return (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: Math.min(all.length, 4) }} spacing={2}>
            {all.map((f, i) => (
                <Figure key={`${f.label}-${i}`} figure={f} emphasis={Boolean(headline) && i === 0} />
            ))}
        </SimpleGrid>
    );
}

function ContextLine({ items }) {
    if (!items.length) return null;
    return (
        <Wrap spacing={3}>
            {items.map((c) => (
                <WrapItem key={c.label}>
                    <Text fontSize="xs" color="gray.700">
                        <Text as="span" fontWeight="semibold">{c.label}:</Text> {c.value}
                    </Text>
                </WrapItem>
            ))}
        </Wrap>
    );
}

function MetricTable({ table }) {
    return (
        <Box overflowX="auto">
            <Table size="sm" variant="simple">
                <TableCaption placement="top" textAlign="left" m={0} px={0} pt={0}
                    fontSize="xs" color="gray.700" fontWeight="semibold">
                    {table.caption}
                </TableCaption>
                <Thead>
                    <Tr>
                        <Th scope="col" color="gray.700"><Box as="span" srOnly>Item</Box></Th>
                        {table.columns.map((c) => (
                            <Th key={c.label} scope="col" isNumeric={c.numeric} color="gray.700">{c.label}</Th>
                        ))}
                    </Tr>
                </Thead>
                <Tbody>
                    {table.rows.map((row) => (
                        <Tr key={row.key}>
                            <Th scope="row" fontWeight="normal" textTransform="none" letterSpacing="normal"
                                fontSize="sm" color="gray.800">
                                {row.label}
                            </Th>
                            {row.cells.map((cell, i) => (
                                <Td key={table.columns[i].label} isNumeric={table.columns[i].numeric}
                                    fontSize="sm" color="gray.800">
                                    {cell}
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
}

function Section({ section }) {
    return (
        <>
            <ContextLine items={section.context} />
            <Figures headline={null} figures={section.figures} />
            {section.tables.map((t) => <MetricTable key={t.caption} table={t} />)}
        </>
    );
}

function RawJson({ raw }) {
    if (raw === null || raw === undefined) return null;
    return (
        <Box
            as="pre"
            tabIndex={0}
            aria-label="Stored value as JSON"
            fontFamily="mono"
            fontSize="xs"
            color="gray.800"
            bg="gray.50"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            p={3}
            maxH="320px"
            overflow="auto"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
        >
            {typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)}
        </Box>
    );
}

function RecordFields({ view }) {
    if (!view.description && !view.comment && !view.links.length) return null;
    return (
        <VStack align="stretch" spacing={1}>
            {view.description && <Text fontSize="xs" color="gray.700">{view.description}</Text>}
            {view.comment && <Text fontSize="xs" color="gray.700" fontStyle="italic">{view.comment}</Text>}
            {view.links.map((l) => (
                <Text key={`${l.label}-${l.text}`} fontSize="xs" color="gray.700">
                    <Text as="span" fontWeight="semibold">{l.label}:</Text>{' '}
                    {l.href ? (
                        <Link href={l.href} isExternal color="teal.700" textDecoration="underline">
                            {l.text} <ExternalLinkIcon mx="2px" />
                        </Link>
                    ) : (
                        <Text as="span" fontFamily="mono">{l.text}</Text>
                    )}
                </Text>
            ))}
        </VStack>
    );
}

/** One line, for lists: the headline and its date. */
function MetricRow({ view }) {
    const lead = view.headline || view.figures[0];
    return (
        <HStack spacing={2} fontSize="xs" color="gray.800" flexWrap="wrap">
            {view.kind === 'empty' && (
                <Text fontStyle="italic" color="gray.700">{view.emptyMessage || 'No stored value.'}</Text>
            )}
            {lead && (
                <Text>
                    <Text as="span" color="gray.700">{lead.label}:</Text>{' '}
                    <Text as="span" fontWeight="semibold">{lead.value}</Text>
                </Text>
            )}
            {lead && <Change change={lead.change} direction={lead.direction} />}
            {view.measuredOn && <Text color="gray.700">· {view.measuredOn}</Text>}
        </HStack>
    );
}

/**
 * Any Metric, displayed the same way everywhere in the app.
 *
 * Props:
 *   metric        The metric in whatever shape the caller has it: a
 *                 documentation item, an implementation metric, or a raw node.
 *   variant       'row' (one line, for lists), 'card' (default, for tabs) or
 *                 'full' (detail panels; details start open).
 *   showRecord    Show description, comment and links. Off where the host
 *                 already shows them, such as an edit form.
 *
 * What it shows comes from buildMetricView: a template for the metric's
 * value_schema, else shape inference over the JSON, else single_value. Add a
 * template to metricTemplates.js to change how a kind of metric reads; never
 * add a component.
 */
export default function MetricDisplay({ metric, variant = 'card', showRecord = true }) {
    const view = useMemo(() => buildMetricView(metric), [metric]);
    const [open, setOpen] = useState(variant === 'full');

    if (variant === 'row') return <MetricRow view={view} />;

    const details = hasDetails(view);
    const meta = [
        view.schemaLabel && { label: 'Kind', value: view.schemaLabel },
        view.measuredOn && { label: 'Measured on', value: view.measuredOn },
    ].filter(Boolean);

    return (
        <VStack align="stretch" spacing={3}>
            <ContextLine items={[...meta, ...view.context]} />

            {view.kind === 'empty' ? (
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                    {view.emptyMessage || 'No stored value.'}
                </Text>
            ) : (
                <>
                    <Figures headline={view.headline} figures={view.figures} />
                    {view.tables.map((t) => <MetricTable key={t.caption} table={t} />)}
                </>
            )}

            {details && view.kind !== 'empty' && (
                <Box>
                    <Button
                        size="xs"
                        variant="outline"
                        colorScheme="teal"
                        onClick={() => setOpen((v) => !v)}
                        aria-expanded={open}
                    >
                        {open ? 'Less detail' : 'More detail'}
                    </Button>
                    <Collapse in={open} animateOpacity unmountOnExit>
                        <VStack align="stretch" spacing={3} mt={3}>
                            <Section section={view.details} />
                            {view.kind === 'inferred' && (
                                <Badge alignSelf="flex-start" colorScheme="gray" fontSize="2xs">
                                    No template for this value; laid out from its shape
                                </Badge>
                            )}
                            <RawJson raw={view.raw} />
                        </VStack>
                    </Collapse>
                </Box>
            )}

            {showRecord && <RecordFields view={view} />}
        </VStack>
    );
}
