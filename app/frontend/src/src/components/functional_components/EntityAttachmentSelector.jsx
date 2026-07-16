import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Flex,
    HStack,
    Link,
    Select,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

// Promote a raw user-entered href to something safe to drop into <a href="…">.
// Without this, an href like "www.example.com" or a bare title string gets
// treated as a relative path under the current origin (the bug that produced
// "/ati/sfsu/ati-explorer/Policy%20for…" in this app). Rules:
//  - empty/null/whitespace -> null  (caller falls back to plain text)
//  - already-scheme'd (http, https, mailto, tel, ftp) -> pass through
//  - starts with "//" -> prepend "https:" (protocol-relative)
//  - looks like a domain (contains a dot, no whitespace) -> prepend "https://"
//  - everything else -> null  (don't render as a link)
function normalizeHref(href) {
    if (!href || typeof href !== 'string') return null;
    const s = href.trim();
    if (!s) return null;
    if (/^(https?|mailto|tel|ftp):/i.test(s)) return s;
    if (s.startsWith('//')) return `https:${s}`;
    if (!/\s/.test(s) && /\./.test(s)) return `https://${s}`;
    return null;
}

/**
 * Generic entity-to-parent attachment surface. Modeled on
 * PersonAssignmentSelector but decoupled from "person" semantics so the same
 * component can manage attached Documents, Webpages, or anything else with a
 * stable {unique_id, label} pair.
 *
 * Caller owns data + I/O:
 *   attached            — array of currently-attached entities (objects with at
 *                         least unique_id and label; optional `badge` ReactNode is
 *                         rendered before the label, and optional `href` makes it a link).
 *   candidates          — array of all attachable entities (full objects); the
 *                         component filters out anything already in `attached`.
 *   onAttach(uniqueId)   — async; do the link.
 *   onDetach(uniqueId)   — async; do the unlink.
 *   afterChange()        — optional refetch hook on success.
 *
 * Copy props (defaults shown):
 *   entityLabel   "Item"     — singular noun for the "Label" column header.
 *   placeholder   "Select…"   — Select dropdown placeholder.
 *   attachLabel   "Attach"   — primary button label.
 *   detachLabel   "Remove"   — per-row button label.
 *   emptyLabel    "Nothing attached yet."
 *   noCandidates  "Nothing left to attach."
 */
function EntityAttachmentSelector({
                                      attached = [],
                                      candidates = [],
                                      onAttach,
                                      onDetach,
                                      afterChange,
                                      entityLabel = 'Item',
                                      placeholder = 'Select…',
                                      attachLabel = 'Attach',
                                      detachLabel = 'Remove',
                                      emptyLabel = 'Nothing attached yet.',
                                      noCandidates = 'Nothing left to attach.',
                                      onCreateNew,             // optional; when provided, renders a "+ New" button
                                      createNewLabel = '+ New',
                                  }) {
    const [selectedId, setSelectedId] = useState('');
    const [isAttaching, setIsAttaching] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const toast = useToast();

    const availableCandidates = useMemo(() => {
        const attachedIds = new Set(attached.map((a) => a.unique_id));
        return candidates.filter((c) => !attachedIds.has(c.unique_id));
    }, [attached, candidates]);

    const handleAttach = async () => {
        if (!selectedId) return;
        setIsAttaching(true);
        try {
            await onAttach(selectedId);
            toast({ title: `${entityLabel} attached`, status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
            setSelectedId('');
            if (afterChange) await afterChange();
        } catch (error) {
            toast({
                title: `Failed to attach ${entityLabel.toLowerCase()}`,
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setIsAttaching(false);
        }
    };

    const handleDetach = async (id) => {
        setRemovingId(id);
        try {
            await onDetach(id);
            toast({ title: `${entityLabel} removed`, status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
            if (afterChange) await afterChange();
        } catch (error) {
            toast({
                title: `Failed to remove ${entityLabel.toLowerCase()}`,
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Box>
            <Flex gap={2} mb={3}>
                <Select
                    size="sm"
                    placeholder={placeholder}
                    aria-label={placeholder || 'Select an item'}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    fontSize="sm"
                    borderColor="teal.300"
                    isDisabled={isAttaching || availableCandidates.length === 0}
                    _hover={{ borderColor: 'teal.400' }}
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                >
                    {availableCandidates.map((c) => (
                        <option key={c.unique_id} value={c.unique_id}>
                            {c.label}
                        </option>
                    ))}
                </Select>
                <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={handleAttach}
                    isLoading={isAttaching}
                    loadingText="…"
                    isDisabled={!selectedId || isAttaching}
                >
                    {attachLabel}
                </Button>
                {onCreateNew && (
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="teal"
                        onClick={onCreateNew}
                        isDisabled={isAttaching}
                    >
                        {createNewLabel}
                    </Button>
                )}
            </Flex>

            {availableCandidates.length === 0 && candidates.length > 0 && (
                <Text fontSize="xs" color="gray.600" fontStyle="italic" mb={2}>
                    {noCandidates}
                </Text>
            )}

            {attached.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    {emptyLabel}
                </Text>
            ) : (
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr bg="teal.50">
                            <Th color="teal.700" fontWeight="semibold" fontSize="xs">{entityLabel}</Th>
                            <Th color="teal.700" fontWeight="semibold" fontSize="xs" w="80px">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {attached.map((a) => (
                            <Tr key={a.unique_id} _hover={{ bg: 'gray.50' }}>
                                <Td color="gray.700" fontSize="xs">
                                    <HStack spacing={2} align="center">
                                        {a.badge}
                                        {normalizeHref(a.href) ? (
                                            <Link
                                                href={normalizeHref(a.href)}
                                                isExternal
                                                color="teal.600"
                                                display="inline-flex"
                                                alignItems="center"
                                            >
                                                {a.label}
                                                <ExternalLinkIcon ml={1} boxSize={3} />
                                            </Link>
                                        ) : (
                                            <span>{a.label}</span>
                                        )}
                                    </HStack>
                                </Td>
                                <Td>
                                    <Button
                                        size="xs"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => handleDetach(a.unique_id)}
                                        isLoading={removingId === a.unique_id}
                                        isDisabled={removingId !== null}
                                    >
                                        {detachLabel}
                                    </Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </Box>
    );
}

export default EntityAttachmentSelector;
