import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Select,
    Text,
    Textarea,
    Tooltip,
    useToast,
    VStack,
} from '@chakra-ui/react';

/**
 * Entity-to-parent attachment for edges that CARRY PROPERTIES.
 *
 * The sibling of EntityAttachmentSelector, which handles property-free edges. That
 * one's `onAttach(uniqueId)` signature has no room for edge properties, which is why
 * every property-carrying editor in this codebase (ParticipantsEditor,
 * RoleHoldingsEditor, the stake block in CommunityDetailPanel) was hand-rolled
 * separately. This is the component those should converge on.
 *
 * The edge's properties are described by a `fields` SCHEMA rather than hardcoded,
 * the same way governanceTypes.js describes node fields. One schema drives both the
 * add form and the read view, so the two surfaces cannot drift apart.
 *
 * Caller owns data + I/O:
 *   attached     [{ unique_id, label, badge?, removed?, ...fieldValues }]
 *   candidates   [{ unique_id, label, group? }] — `group` renders an <optgroup>;
 *                group order follows candidate order, so the caller sorts.
 *   fields       [{ name, label, type, placeholder?, rows?, mono?, display? }]
 *                  type    : 'text' | 'textarea'
 *                  display : how the value reads back —
 *                            'badge'  small badge beside the title
 *                            'quote'  indented rule-bordered block (long verbatim text)
 *                            'muted'  small gray line
 *                            'inline' plain body text (default)
 *   onAttach(uniqueId, values)   async
 *   onUpdate(uniqueId, values)   async — omit to make attached rows read-only
 *   onDetach(uniqueId)           async
 *   afterChange()                optional refetch hook
 *   flag         { when(item) -> bool, label, colorScheme, tooltip } — surfaces a
 *                per-row condition (e.g. an edge asserting more than it evidences)
 *                as a TEXT badge, never colour alone.
 *   renderExtra(item) -> ReactNode — optional slot under a row's annotation, for
 *                content belonging to the TARGET rather than to the edge (e.g. the
 *                source documents behind a cited instrument). Hidden while editing,
 *                so the editor stays the only thing on screen.
 */

const emptyValues = (fields) => Object.fromEntries(fields.map((f) => [f.name, '']));

const valuesFrom = (item, fields) =>
    Object.fromEntries(fields.map((f) => [f.name, item[f.name] || '']));

/** The edge-property form. Shared by the add composer and the per-row editor. */
function AnnotationFields({ fields, value, onChange, idPrefix }) {
    return (
        <VStack align="stretch" spacing={2}>
            {fields.map((field) => {
                const id = `${idPrefix}-${field.name}`;
                const Control = field.type === 'textarea' ? Textarea : Input;
                return (
                    <FormControl key={field.name}>
                        <FormLabel htmlFor={id} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                            {field.label}
                        </FormLabel>
                        <Control
                            id={id}
                            size="sm"
                            rows={field.type === 'textarea' ? (field.rows || 3) : undefined}
                            fontFamily={field.mono ? 'mono' : undefined}
                            placeholder={field.placeholder}
                            value={value[field.name] ?? ''}
                            onChange={(e) => onChange({ ...value, [field.name]: e.target.value })}
                        />
                    </FormControl>
                );
            })}
        </VStack>
    );
}

/** One attached row: read view, with an inline editor toggled per row. */
function AttachedRow({ item, fields, flag, onUpdate, onDetach, busy, entityLabel, renderExtra }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(() => valuesFrom(item, fields));
    const [saving, setSaving] = useState(false);

    const beginEdit = () => {
        setDraft(valuesFrom(item, fields));
        setEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(item.unique_id, draft);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const byDisplay = (mode) => fields.filter((f) => (f.display || 'inline') === mode && item[f.name]);
    const flagged = flag?.when?.(item);

    return (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
            <Flex align="start" gap={2}>
                <VStack align="stretch" spacing={1} flex="1" minW="0">
                    <HStack spacing={2} align="baseline" flexWrap="wrap">
                        {item.badge ? (
                            <Text fontFamily="mono" fontSize="xs" color="gray.600">
                                {item.badge}
                            </Text>
                        ) : null}
                        {byDisplay('badge').map((f) => (
                            <Badge key={f.name} colorScheme="teal" variant="subtle" fontSize="0.65rem">
                                {item[f.name]}
                            </Badge>
                        ))}
                        {flagged ? (
                            <Tooltip label={flag.tooltip}>
                                <Badge
                                    colorScheme={flag.colorScheme || 'orange'}
                                    variant="subtle"
                                    fontSize="0.65rem"
                                    cursor="help"
                                >
                                    {flag.label}
                                </Badge>
                            </Tooltip>
                        ) : null}
                        {item.removed ? (
                            <Badge colorScheme="gray" variant="subtle" fontSize="0.65rem">
                                Removed
                            </Badge>
                        ) : null}
                    </HStack>
                    <Text fontSize="sm" color="gray.800">
                        {item.label}
                    </Text>
                </VStack>
                <HStack spacing={1} flexShrink={0}>
                    {onUpdate ? (
                        <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            onClick={editing ? () => setEditing(false) : beginEdit}
                            isDisabled={busy || saving}
                        >
                            {editing ? 'Cancel' : 'Edit'}
                        </Button>
                    ) : null}
                    <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => onDetach(item.unique_id)}
                        isDisabled={busy || saving}
                    >
                        Remove
                    </Button>
                </HStack>
            </Flex>

            {!editing && byDisplay('quote').map((f) => (
                <Box key={f.name} borderLeftWidth="2px" borderColor="teal.300" pl={3} py={1} mt={2}>
                    <Text fontSize="sm" color="gray.700" fontStyle="italic" whiteSpace="pre-wrap">
                        {item[f.name]}
                    </Text>
                </Box>
            ))}

            {!editing && byDisplay('inline').map((f) => (
                <Text key={f.name} fontSize="sm" color="gray.800" mt={2} whiteSpace="pre-wrap">
                    {item[f.name]}
                </Text>
            ))}

            {!editing && byDisplay('muted').map((f) => (
                <Text key={f.name} fontSize="xs" color="gray.600" mt={2}>
                    {item[f.name]}
                </Text>
            ))}

            {!editing && renderExtra ? renderExtra(item) : null}

            {editing ? (
                <Box mt={2}>
                    <AnnotationFields
                        fields={fields}
                        value={draft}
                        onChange={setDraft}
                        idPrefix={`edit-${item.unique_id}`}
                    />
                    <HStack mt={2} justify="flex-end">
                        <Button size="xs" colorScheme="teal" onClick={handleSave} isLoading={saving} loadingText="Saving">
                            Save {entityLabel.toLowerCase()}
                        </Button>
                    </HStack>
                </Box>
            ) : null}
        </Box>
    );
}

function AnnotatedAttachmentSelector({
    attached = [],
    candidates = [],
    fields = [],
    flag,
    renderExtra,
    onAttach,
    onUpdate,
    onDetach,
    afterChange,
    entityLabel = 'Item',
    selectLabel = 'Item',
    placeholder = 'Select…',
    addLabel = '+ Link an item',
    attachLabel = 'Link',
    emptyLabel = 'Nothing linked yet.',
    noCandidates = 'Nothing left to link.',
    idPrefix = 'annotated',
}) {
    const toast = useToast();
    const [adding, setAdding] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [draft, setDraft] = useState(() => emptyValues(fields));
    const [busy, setBusy] = useState(false);

    const available = useMemo(() => {
        const taken = new Set(attached.map((a) => a.unique_id));
        return candidates.filter((c) => !taken.has(c.unique_id));
    }, [attached, candidates]);

    // Preserve caller-supplied group order rather than sorting here — the caller
    // knows the canonical ordering (e.g. the working-group registry's).
    const grouped = useMemo(() => {
        const groups = [];
        const byLabel = new Map();
        available.forEach((c) => {
            const key = c.group || '';
            if (!byLabel.has(key)) {
                const bucket = { label: key, items: [] };
                byLabel.set(key, bucket);
                groups.push(bucket);
            }
            byLabel.get(key).items.push(c);
        });
        return groups;
    }, [available]);

    const report = (title, error) => {
        toast({
            title,
            description: error?.message,
            status: error ? 'error' : 'success',
            duration: error ? 4000 : 2000,
            isClosable: true,
            position: 'top-right',
        });
    };

    const resetComposer = () => {
        setAdding(false);
        setSelectedId('');
        setDraft(emptyValues(fields));
    };

    const handleAttach = async () => {
        if (!selectedId) return;
        setBusy(true);
        try {
            await onAttach(selectedId, draft);
            report(`${entityLabel} linked`);
            resetComposer();
            if (afterChange) await afterChange();
        } catch (error) {
            report(`Failed to link ${entityLabel.toLowerCase()}`, error);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = onUpdate
        ? async (uniqueId, values) => {
            try {
                await onUpdate(uniqueId, values);
                report(`${entityLabel} updated`);
                if (afterChange) await afterChange();
            } catch (error) {
                report(`Failed to update ${entityLabel.toLowerCase()}`, error);
                throw error;
            }
        }
        : undefined;

    const handleDetach = async (uniqueId) => {
        setBusy(true);
        try {
            await onDetach(uniqueId);
            report(`${entityLabel} unlinked`);
            if (afterChange) await afterChange();
        } catch (error) {
            report(`Failed to unlink ${entityLabel.toLowerCase()}`, error);
        } finally {
            setBusy(false);
        }
    };

    const selectId = `${idPrefix}-target`;

    return (
        <Box>
            <VStack align="stretch" spacing={2}>
                {attached.length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                        {emptyLabel}
                    </Text>
                ) : (
                    attached.map((item) => (
                        <AttachedRow
                            key={item.unique_id}
                            item={item}
                            fields={fields}
                            flag={flag}
                            renderExtra={renderExtra}
                            onUpdate={handleUpdate}
                            onDetach={handleDetach}
                            busy={busy}
                            entityLabel={entityLabel}
                        />
                    ))
                )}
            </VStack>

            {adding ? (
                <Box mt={3} borderWidth="1px" borderColor="teal.200" borderRadius="md" p={3}>
                    <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
                        {addLabel.replace(/^\+\s*/, '')}
                    </Heading>
                    <FormControl mb={2}>
                        <FormLabel htmlFor={selectId} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                            {selectLabel}
                        </FormLabel>
                        <Select
                            id={selectId}
                            size="sm"
                            placeholder={placeholder}
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            isDisabled={busy || available.length === 0}
                        >
                            {grouped.map((group) => (
                                group.label ? (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.items.map((c) => (
                                            <option key={c.unique_id} value={c.unique_id}>{c.label}</option>
                                        ))}
                                    </optgroup>
                                ) : (
                                    group.items.map((c) => (
                                        <option key={c.unique_id} value={c.unique_id}>{c.label}</option>
                                    ))
                                )
                            ))}
                        </Select>
                    </FormControl>
                    {fields.length > 0 ? (
                        <AnnotationFields
                            fields={fields}
                            value={draft}
                            onChange={setDraft}
                            idPrefix={`${idPrefix}-new`}
                        />
                    ) : null}
                    <HStack mt={2} justify="flex-end">
                        <Button size="sm" variant="ghost" onClick={resetComposer} isDisabled={busy}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleAttach}
                            isLoading={busy}
                            loadingText="Linking"
                            isDisabled={!selectedId || busy}
                        >
                            {attachLabel}
                        </Button>
                    </HStack>
                </Box>
            ) : (
                <>
                    {available.length === 0 && candidates.length > 0 ? (
                        <Text fontSize="xs" color="gray.600" fontStyle="italic" mt={3}>
                            {noCandidates}
                        </Text>
                    ) : (
                        <Button
                            mt={3}
                            size="sm"
                            variant="outline"
                            colorScheme="teal"
                            onClick={() => setAdding(true)}
                            isDisabled={available.length === 0}
                        >
                            {addLabel}
                        </Button>
                    )}
                </>
            )}
        </Box>
    );
}

export default AnnotatedAttachmentSelector;
