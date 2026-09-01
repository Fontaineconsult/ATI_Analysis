import React from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Divider,
    HStack,
    Heading,
    Link,
    Text,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

import Card from '../common/Card';
import { Loading } from '../common/Loading';
import Section from '../common/Section';
import ReferencedByList from './ReferencedByList';
import { DocumentationBadgeRow, TypeBadge } from './DocumentationBadges';
import {
    DOC_TYPES,
    describeIntegrityCode,
    getTypeLabel,
} from './documentationConfig';

function Field({ label, children, mono = false }) {
    if (children === null || children === undefined || children === '') return null;
    return (
        <Box mb={2}>
            <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wide" color="gray.600">
                {label}
            </Text>
            <Text fontSize="sm" color="gray.800" fontFamily={mono ? 'mono' : undefined} wordBreak="break-word">
                {children}
            </Text>
        </Box>
    );
}

function LocationSection({ item }) {
    const locator = item.url || item.uri_path || item.file_path;
    const isUrl = /^https?:\/\//i.test(locator || '');

    if (item.has_location === false) {
        return (
            <Section title="Location">
                <Text fontSize="sm" color="red.700">
                    No URL, file path or uploaded file. Nothing can reach this record.
                </Text>
            </Section>
        );
    }
    if (!locator && !item.file) return null;

    return (
        <Section title="Location">
            {locator && (
                isUrl ? (
                    <Link
                        href={locator}
                        isExternal
                        fontSize="sm"
                        color="teal.700"
                        textDecoration="underline"
                        wordBreak="break-all"
                    >
                        {locator} <ExternalLinkIcon mx="2px" boxSize={3} />
                    </Link>
                ) : (
                    <Text fontSize="sm" fontFamily="mono" color="gray.800" wordBreak="break-all">
                        {locator}
                    </Text>
                )
            )}
            {item.file && (
                <Box mt={2} pt={2} borderTopWidth="1px" borderTopColor="gray.200">
                    <Field label="Uploaded file">{item.file.original_filename}</Field>
                    <HStack spacing={3}>
                        <Link
                            href={item.file.download_url}
                            fontSize="sm"
                            color="teal.700"
                            textDecoration="underline"
                        >
                            Download
                        </Link>
                        {item.file.size != null && (
                            <Text fontSize="xs" color="gray.600">
                                {Math.round(item.file.size / 1024)} KB
                            </Text>
                        )}
                    </HStack>
                    {/* Content-addressed storage: one blob can back several records,
                        so replacing or removing it is never a local decision. */}
                    {item.file.shared_by > 1 && (
                        <Text fontSize="xs" color="orange.700" mt={1}>
                            This file is attached to {item.file.shared_by} records.
                        </Text>
                    )}
                </Box>
            )}
        </Section>
    );
}

/**
 * Detail for one documentation record.
 *
 * Ordering is deliberate. "Referenced by" comes before content, because the
 * question this view exists to answer is what a record is doing in the graph —
 * and for a shared record, that section is also the blast radius.
 */
function DocumentationDetailPanel({ item, loading = false, error = null, campus }) {
    if (loading) {
        return <Card><Loading label="Loading record…" /></Card>;
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md" fontSize="sm">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    if (!item) {
        return (
            <Box
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="lg"
                bg="gray.50"
                p={10}
                textAlign="center"
            >
                <Text fontSize="sm" color="gray.600">
                    Select a record to view its details and everything that references it.
                </Text>
            </Box>
        );
    }

    const typeConfig = DOC_TYPES[item.doc_type] || {};
    const shared = (item.parent_count || 0) > 1;

    return (
        <VStack align="stretch" spacing={4}>
            <Card>
                <Wrap spacing={2} mb={2}>
                    <WrapItem><TypeBadge docType={item.doc_type} size="md" /></WrapItem>
                    <WrapItem>
                        <HStack spacing={1}>
                            <DocumentationBadgeRow item={item} />
                        </HStack>
                    </WrapItem>
                </Wrap>

                <Heading as="h2" size="md" color="gray.800" mb={1}>
                    {item.title || <em>Untitled</em>}
                </Heading>
                <Text fontSize="2xs" color="gray.600" fontFamily="mono" mb={3}>
                    {item.unique_id}
                </Text>

                <Divider mb={3} />

                <Field label="Description">{item.description}</Field>
                {item.doc_type === 'messages' && <Field label="Message type">{item.message_type}</Field>}
                {item.doc_type === 'metrics' && (
                    <>
                        <Field label="Metric type">{item.metric_type}</Field>
                        <Field label="Value">{item.single_value}</Field>
                        <Field label="Comment">{item.comment}</Field>
                    </>
                )}
                {(item.doc_type === 'notes' || item.doc_type === 'messages') && (
                    <Field label="Created">{item.date_created}</Field>
                )}

                {typeConfig.incompleteConcept && (
                    <Alert status="info" borderRadius="md" fontSize="xs" mt={2}>
                        <AlertIcon />
                        {getTypeLabel(item.doc_type)} is not a finished concept in the ontology yet —
                        thin or missing data here is unfinished modelling, not a record to reconcile.
                    </Alert>
                )}
            </Card>

            {/* Blast radius, stated before anything that looks editable. The count
                is of records, not of edges, because records are what change. */}
            {shared && (
                <Alert status="warning" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    <Box>
                        <Text fontWeight="medium">
                            Attached to {item.parent_count} records.
                        </Text>
                        <Text fontSize="xs" mt={1}>
                            This is one shared node, not a copy per record. Anything that changes it
                            changes what all {item.parent_count} of them show — there is no way to
                            change it for just one.
                        </Text>
                    </Box>
                </Alert>
            )}

            {Boolean(item.integrity?.length) && (
                <Card title="Data integrity">
                    <Text fontSize="xs" color="gray.600" mb={2}>
                        The values below were read defensively. What is stored is shown as-is so the
                        defect stays visible rather than being quietly normalised.
                    </Text>
                    <VStack align="stretch" spacing={1}>
                        {item.integrity.map((code) => {
                            const field = String(code).split(':')[1];
                            const stored = field ? item.stored?.[field] : undefined;
                            return (
                                <HStack key={code} spacing={2} fontSize="sm">
                                    <Text color="yellow.800">{describeIntegrityCode(code)}</Text>
                                    {stored !== undefined && (
                                        <Text color="gray.600" fontFamily="mono" fontSize="xs">
                                            stored as {JSON.stringify(stored)}
                                        </Text>
                                    )}
                                </HStack>
                            );
                        })}
                    </VStack>
                </Card>
            )}

            <Card title={`Referenced by (${item.reference_count || 0})`}>
                <ReferencedByList references={item.referenced_by} campus={campus} />
            </Card>

            <Card title="Details">
                <LocationSection item={item} />

                {(item.content || item.content_preview) && (
                    <Section title="Content">
                        <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">
                            {item.content || item.content_preview}
                        </Text>
                        {!item.content && item.content_length > 240 && (
                            <Text fontSize="xs" color="gray.600" mt={1}>
                                Preview only — {item.content_length} characters in full.
                            </Text>
                        )}
                    </Section>
                )}

                <Section title="Report status">
                    <Text fontSize="sm" color="gray.800">
                        {item.include_in_report === false
                            ? 'Excluded from reports.'
                            : 'Included in reports.'}
                    </Text>
                    {item.include_in_report_set === false && (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                            Never explicitly set — this is the default, not a decision anyone made.
                        </Text>
                    )}
                </Section>

                <Section title="Provenance">
                    <Field label="Maintained by">{item.maintained_by?.name}</Field>
                    <Field label="Created by">{item.created_by?.name}</Field>
                    <Field label="Deprecated on">{item.depreciated_date}</Field>
                    <Field label="Text captured">{item.raw_text_captured}</Field>
                    {!item.maintained_by && !item.created_by
                        && !item.depreciated_date && !item.raw_text_captured && (
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">
                            No provenance recorded.
                        </Text>
                    )}
                </Section>
            </Card>
        </VStack>
    );
}

export default DocumentationDetailPanel;
