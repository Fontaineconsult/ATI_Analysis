import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
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
import Section from '../common/Section';
import ReferencedByList from './ReferencedByList';
import { DocumentationBadgeRow, TypeBadge } from './DocumentationBadges';
import {
    DOC_TYPES,
    buildEditPayload,
    changedFieldNames,
    describeIntegrityCode,
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
 * DRAFTS ARE KEPT PER RECORD, in a ref keyed by unique_id. Moving to another
 * record and back does not lose an edit, which is what makes it safe to jump
 * around a list while working — and nothing is written until you say so.
 *
 * Ordering is deliberate. "Referenced by" comes before the fields, because the
 * question this view exists to answer is what a record is doing in the graph —
 * and for a shared record, that section is also the blast radius of the edit
 * you are about to make.
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

    // One draft per record, so switching away and back keeps an unsaved edit.
    // A ref rather than state: it must survive the record changing without
    // itself causing a render, and `values` below is what renders.
    const draftsRef = useRef({});
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);

    const recordId = item?.unique_id || null;
    useEffect(() => {
        if (!recordId) { setValues({}); return; }
        const draft = draftsRef.current[recordId];
        setValues(draft || initialEditValues(item, fields));
    }, [recordId, item, fields]);

    const handleFieldChange = useCallback((name, value) => {
        setValues((prev) => {
            const next = { ...prev, [name]: value };
            if (recordId) draftsRef.current[recordId] = next;
            return next;
        });
    }, [recordId]);

    const changed = useMemo(
        () => (item && fields.length ? changedFieldNames(item, fields, values) : []),
        [item, fields, values],
    );
    const isDirty = changed.length > 0;

    const revert = useCallback(() => {
        if (!item) return;
        if (recordId) delete draftsRef.current[recordId];
        setValues(initialEditValues(item, fields));
    }, [item, fields, recordId]);

    const handleSave = useCallback(async () => {
        if (!item || !onSave) return;
        const payload = buildEditPayload(item, fields, values);
        if (isNoOpPayload(payload)) return;

        setSaving(true);
        try {
            await onSave(payload);
            if (recordId) delete draftsRef.current[recordId];
            toast({
                title: `${getTypeLabel(item.doc_type)} saved.`,
                status: 'success', duration: 2000, isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'Save failed.',
                description: e?.response?.data?.error || e?.message || 'Please try again.',
                status: 'error', duration: 3500, isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    }, [item, fields, values, onSave, recordId, toast]);

    // Ctrl/Cmd+S saves without reaching for the mouse. Scoped to this panel, and
    // it only claims the shortcut when there is actually something to save.
    const handleKeyDown = useCallback((e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && isDirty && !saving) {
            e.preventDefault();
            handleSave();
        }
    }, [isDirty, saving, handleSave]);
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
        <VStack align="stretch" spacing={4} onKeyDown={handleKeyDown}>
            <Card>
                <Wrap spacing={2} mb={2}>
                    <WrapItem><TypeBadge docType={item.doc_type} size="md" /></WrapItem>
                    <WrapItem>
                        <HStack spacing={1}>
                            <DocumentationBadgeRow item={item} />
                        </HStack>
                    </WrapItem>
                </Wrap>

                <HStack align="flex-start" justify="space-between" spacing={3} mb={1}>
                    <Heading as="h2" size="md" color="gray.800">
                        {item.title || <em>Untitled</em>}
                    </Heading>
                    {isDirty && (
                        <Badge colorScheme="orange" borderRadius="full" flexShrink={0}>
                            {changed.length} unsaved
                        </Badge>
                    )}
                </HStack>
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

            {/* The fields themselves. Every value they carry used to be
                rendered read-only here as well; showing both would mean two
                places to look and two places to disagree. What survives below is
                only what is NOT editable: the managed file, and provenance. */}
            <Card title="Fields">
                {!editable && (
                    <Text fontSize="xs" color="gray.600" mb={3} fontStyle="italic">
                        Read-only in this context.
                    </Text>
                )}
                {item.include_in_report_set === false && (
                    <Text fontSize="xs" color="gray.600" mb={3}>
                        The report flag has never been explicitly set on this record — it is
                        included by default, not by anyone's decision. Saving here makes it one.
                    </Text>
                )}
                <DocumentationFields
                    fields={fields}
                    values={values}
                    changed={changed}
                    onChange={handleFieldChange}
                    isDisabled={!editable || saving}
                />
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

            {/* Sticky, so it is reachable however far down the record you are —
                the source-text field alone can be pages long. It appears only
                when there is something to write, so it never sits there inviting
                a save that would do nothing. */}
            {editable && isDirty && (
                <HStack
                    position="sticky"
                    bottom={0}
                    zIndex={1}
                    bg="white"
                    borderWidth="1px"
                    borderColor="orange.200"
                    borderRadius="lg"
                    boxShadow="md"
                    px={4}
                    py={3}
                    spacing={3}
                    justify="space-between"
                >
                    <Text fontSize="sm" color="gray.800">
                        {changed.length} unsaved {changed.length === 1 ? 'change' : 'changes'}
                    </Text>
                    <HStack spacing={2}>
                        <Button size="sm" variant="ghost" onClick={revert} isDisabled={saving}>
                            Revert
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleSave}
                            isLoading={saving}
                            loadingText="Saving"
                        >
                            Save
                        </Button>
                    </HStack>
                </HStack>
            )}
        </VStack>
    );
}

export default DocumentationDetailPanel;
