import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    useToast,
} from '@chakra-ui/react';

import Card from '../common/Card';
import { Loading } from '../common/Loading';
import DocumentationFields from './DocumentationFields';
import { FormActions, FormShell } from '../../implementation_explorer/doc_components/docPrimitives';
import Section from '../common/Section';
import ReferencedByList from './ReferencedByList';
import { DocumentationBadgeRow, TypeBadge } from './DocumentationBadges';
import {
    DOC_TYPES,
    buildEditPayload,
    editableFieldsFor,
    getTypeLabel,
    initialEditValues,
    isNoOpPayload,
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

/**
 * What is NOT editable about where a record lives.
 *
 * The URL, URI and file path are inputs in the Fields card above — each with its
 * own open-in-a-new-tab button — so they are deliberately not repeated here.
 * What remains is the managed upload, which this form cannot change, and the
 * warning for a record nothing can reach.
 */
function LocationSection({ item }) {
    if (item.has_location === false) {
        return (
            <Section title="Location">
                <Text fontSize="sm" color="red.700">
                    No URL, file path or uploaded file. Nothing can reach this record.
                </Text>
            </Section>
        );
    }
    if (!item.file) return null;

    return (
        <Section title="Uploaded file">
            {item.file && (
                <Box>
                    <Field label="File">{item.file.original_filename}</Field>
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
 * Detail for one documentation record — and the surface you edit it on.
 *
 * The controls are exposed directly rather than behind a dialog. This area
 * exists to curate documentation, and the job it serves is "work down a
 * filtered list fixing records": a dialog puts an open and a close between you
 * and every edit and hides the list you are working through. So the fields ARE
 * the panel, and the read-only renderings of the same values are gone rather
 * than duplicated beside them.
 *
 * It is the same form contract as the document editor in the implementation
 * explorer (doc_components/DocumentsViewer): fill the fields, then Cancel or
 * Update at the bottom. It reuses that editor's own FormShell and FormActions
 * rather than restating them, so the two cannot drift apart.
 *
 * Ordering: the record and its fields first, because editing is the job here;
 * then Referenced by, which is context for the edit you just made — and, for a
 * shared record, its blast radius.
 */
function DocumentationDetailPanel({
    item, loading = false, error = null, campus, capabilities = null, onSave,
}) {
    const toast = useToast();
    const editable = Boolean(onSave);

    const fields = useMemo(
        () => (item ? editableFieldsFor(item.doc_type, capabilities) : []),
        [item, capabilities],
    );

    const [values, setValues] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset to the record whenever a different one is selected, so the form
    // never shows the previous record's values against this one.
    const recordId = item?.unique_id || null;
    useEffect(() => {
        setValues(item ? initialEditValues(item, fields) : {});
    }, [recordId, item, fields]);

    const handleFieldChange = useCallback((name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleCancel = useCallback(() => {
        if (item) setValues(initialEditValues(item, fields));
    }, [item, fields]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!item || !onSave) return;

        // Still a diff of what changed, which is invisible here but load-bearing:
        // update.py compares any date it IS given against the stored one with
        // .isoformat(), and its association arguments would connect the record to
        // a new parent. See buildEditPayload.
        const payload = buildEditPayload(item, fields, values);
        if (isNoOpPayload(payload)) {
            toast({
                title: 'Nothing to update.',
                status: 'info', duration: 2000, isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(payload);
            toast({
                title: `${getTypeLabel(item.doc_type)} updated.`,
                status: 'success', duration: 2000, isClosable: true,
            });
        } catch (err) {
            toast({
                title: 'Update failed.',
                description: err?.response?.data?.error || err?.message || 'Please try again.',
                status: 'error', duration: 3500, isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [item, fields, values, onSave, toast]);
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

            {/* The fields themselves. Every value they carry used to be
                rendered read-only here as well; showing both would mean two
                places to look and two places to disagree. What survives below is
                only what is NOT editable: the managed file, and provenance. */}
            {/* Same form contract as the implementation explorer's document
                editor, using its own shell and footer. */}
            <Card title="Fields">
                {!editable && (
                    <Text fontSize="xs" color="gray.600" mb={3} fontStyle="italic">
                        Read-only in this context.
                    </Text>
                )}
                {item.include_in_report_set === false && (
                    <Text fontSize="xs" color="gray.600" mb={3}>
                        The report flag has never been explicitly set on this record — it is
                        included by default, not by anyone's decision. Updating here makes it one.
                    </Text>
                )}

                {editable ? (
                    <FormShell onSubmit={handleSubmit}>
                        <DocumentationFields
                            fields={fields}
                            values={values}
                            onChange={handleFieldChange}
                            isDisabled={isSubmitting}
                        />
                        <FormActions
                            isSubmitting={isSubmitting}
                            onCancel={handleCancel}
                            submitLabel={`Update ${getTypeLabel(item.doc_type)}`}
                            loadingText="Updating…"
                        />
                    </FormShell>
                ) : (
                    <DocumentationFields
                        fields={fields}
                        values={values}
                        onChange={handleFieldChange}
                        isDisabled
                    />
                )}
            </Card>

            <Card title="Details">
                <LocationSection item={item} />

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

            {/* Below the editor: this is context for the record you are working
                on — what it is doing in the graph, and for a shared record the
                blast radius of the edit above. */}
            <Card title={`Referenced by (${item.reference_count || 0})`}>
                <ReferencedByList references={item.referenced_by} campus={campus} />
            </Card>
        </VStack>
    );
}

export default DocumentationDetailPanel;
