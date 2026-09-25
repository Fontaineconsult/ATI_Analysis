import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Collapse,
    Divider,
    Heading,
    HStack,
    Link,
    Spacer,
    Tag,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import IntellectualSourceForm from './IntellectualSourceForm';
import SourceTextModal from '../../functional_components/SourceTextModal';
import AddSourcePageForm from './AddSourcePageForm';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import { INTELLECTUAL_SOURCE_COLOR } from './intellectualSourceTypes';
import { deleteIntellectualSource } from '../../../services/api/delete';
import { fetchAllImplementations } from '../../../services/api/get';
import {
    attachInformedImplementation,
    detachInformedImplementation,
    detachSourcePage,
    updateDocumentSourceText,
    updateWebpageSourceText,
} from '../../../services/api/put';
import useResource from '../../../hooks/useResource';
import { KEYS } from '../../../context/resourceKeys';
import { useMetaScaffold } from '../../../hooks/useMetaScaffold';

/**
 * Right-column detail for an IntellectualSource, mirroring PrincipleDetailPanel.
 *
 *   - Identity, attribution and the link out
 *   - Short description, with the full one behind a disclosure
 *   - Source Text, behind a disclosure because it can run to tens of thousands of characters
 *   - Sources (is_sourced_from) — add a page by URL, unlink one, and edit each page's own
 *     text, because a synthesized source keeps its text on the pages rather than the node
 *   - Informs — Implementations (the editable relationship block)
 *   - Grounds these principles — read-only, the reverse of Principle.derives_from
 *
 * The informs block is the one that earns the tab. A source nothing is wired to is a
 * reading list entry; a source wired to an implementation is that implementation's
 * provenance, and the answer to whether it is behind what the field knows.
 *
 * Props: item, onAfterEdit(item), onAfterDelete(item), placeholder
 */
function IntellectualSourceDetailPanel({ item, onAfterEdit, onAfterDelete, placeholder }) {
    const editDisclosure = useDisclosure();
    const fullDisclosure = useDisclosure();
    const textDisclosure = useDisclosure();
    const [deleting, setDeleting] = useState(false);
    const [pageBeingEdited, setPageBeingEdited] = useState(null);
    const [removingPageId, setRemovingPageId] = useState(null);
    const addPageDisclosure = useDisclosure();
    const toast = useToast();
    const { principles } = useMetaScaffold();

    // The implementations read returns a map keyed by type, not a flat list, and it arrives
    // under status.data on this endpoint. Same unwrap AssetsMasterContainer does. Every type
    // the map carries is offered, rather than a hardcoded subset, so the candidates cannot
    // drift from what the server accepts.
    const { data: implResp } = useResource(KEYS.implementationsAll, fetchAllImplementations);
    const implementations = useMemo(() => {
        const grouped = implResp?.status?.data || implResp?.data || {};
        return Object.entries(grouped).flatMap(([type, list]) =>
            (Array.isArray(list) ? list : []).map((impl) => ({
                unique_id: impl.unique_id,
                title: impl.title,
                type: impl.type || type,
            })));
    }, [implResp]);

    const refresh = useCallback(async () => {
        if (onAfterEdit) await onAfterEdit(item);
    }, [onAfterEdit, item]);

    // Reverse of derives_from. The source read does not carry it, so it is derived from the
    // principles already in the meta-scaffold rather than fetched again.
    const groundedPrinciples = useMemo(() => {
        if (!item) return [];
        return (principles || []).filter((p) =>
            (p.grounded_in?.intellectual_sources || []).some((s) => s.unique_id === item.unique_id));
    }, [principles, item]);

    if (!item) {
        return (
            placeholder || (
                <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                    <Text color="gray.600" fontSize="sm">
                        Select a source on the left, or click <strong>Add Intellectual Source</strong> to create one.
                    </Text>
                </Box>
            )
        );
    }

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await deleteIntellectualSource(item.unique_id);
            toast({ title: 'Deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterDelete) onAfterDelete(item);
        } catch (error) {
            toast({ title: 'Delete failed.', description: error?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    // Unlinking a page never deletes it: the same page can be a governance instrument's
    // source or an implementation's documentation, and deleting it would take its captured
    // text with it. The confirm says so, because "Remove" next to a page reads like delete.
    const handleDetachPage = async (page) => {
        const warning = page.text_length
            ? `Unlink "${page.name || page.url}" from this source?

The page and its ${page.text_length.toLocaleString()} characters of text stay in the graph; only the link is removed.`
            : `Unlink "${page.name || page.url}" from this source?

The page stays in the graph; only the link is removed.`;
        if (!window.confirm(warning)) return;
        setRemovingPageId(page.unique_id);
        try {
            await detachSourcePage(item.unique_id, page.unique_id);
            toast({ title: 'Page unlinked.', status: 'success', duration: 2000, isClosable: true });
            await refresh();
        } catch (error) {
            toast({ title: 'Unlink failed.', description: error?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setRemovingPageId(null);
        }
    };

    const attribution = [item.author, item.publisher, item.published_date].filter(Boolean).join(' · ');
    const textLength = (item.raw_text || '').length;
    const pagesMissingText = (item.sources || []).filter((s) => !s.text_length).length;

    return (
        <VStack align="stretch" spacing={4}>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={1} flexWrap="wrap">
                            <Badge colorScheme={INTELLECTUAL_SOURCE_COLOR} variant="subtle" fontSize="2xs">
                                Intellectual source
                            </Badge>
                            <Badge colorScheme="gray" variant="outline" fontSize="2xs">No authority</Badge>
                            <Badge colorScheme={textLength ? 'green' : 'gray'} variant="subtle" fontSize="2xs">
                                {textLength ? `${textLength.toLocaleString()} characters` : 'No text on the node'}
                            </Badge>
                        </HStack>
                        <Heading as="h2" size="md" color="gray.800">{item.name}</Heading>
                        {attribution && <Text fontSize="xs" color="gray.600">{attribution}</Text>}
                        {item.citation && (
                            <Text fontSize="xs" color="gray.600" fontStyle="italic">{item.citation}</Text>
                        )}
                        {item.url && (
                            <Link href={item.url} isExternal fontSize="xs" color={`${INTELLECTUAL_SOURCE_COLOR}.700`} wordBreak="break-all">
                                {item.url} <ExternalLinkIcon mx="2px" aria-hidden="true" />
                            </Link>
                        )}
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme={INTELLECTUAL_SOURCE_COLOR} onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                {item.description_short ? (
                    <Text fontSize="sm" color="gray.800">{item.description_short}</Text>
                ) : (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">No short description set.</Text>
                )}

                {item.description_full && (
                    <Box mt={2}>
                        <Button size="xs" variant="link" colorScheme={INTELLECTUAL_SOURCE_COLOR} onClick={fullDisclosure.onToggle}>
                            {fullDisclosure.isOpen ? 'Hide full description' : 'Full description'}
                        </Button>
                        <Collapse in={fullDisclosure.isOpen} animateOpacity>
                            <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap" mt={2}>{item.description_full}</Text>
                        </Collapse>
                    </Box>
                )}
            </Box>

            {/* Source Text. Collapsed by default: a mirrored source runs to tens of thousands
                of characters and would bury every block under it. */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack mb={textLength ? 3 : 0}>
                    <Heading as="h3" size="sm" color={`${INTELLECTUAL_SOURCE_COLOR}.700`}>Source Text</Heading>
                    <Spacer />
                    {item.raw_text_captured && (
                        <Text fontSize="xs" color="gray.600">Captured {item.raw_text_captured}</Text>
                    )}
                </HStack>
                {textLength ? (
                    <>
                        <Button size="xs" variant="link" colorScheme={INTELLECTUAL_SOURCE_COLOR} onClick={textDisclosure.onToggle}>
                            {textDisclosure.isOpen ? 'Hide text' : `Read ${textLength.toLocaleString()} characters`}
                        </Button>
                        <Collapse in={textDisclosure.isOpen} animateOpacity>
                            <Box mt={3} p={3} bg="gray.50" borderRadius="md" maxH="50vh" overflowY="auto" tabIndex={0}>
                                <Text fontSize="xs" color="gray.800" whiteSpace="pre-wrap" fontFamily="mono">
                                    {item.raw_text}
                                </Text>
                            </Box>
                        </Collapse>
                    </>
                ) : (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic" mt={2}>
                        No text captured. Until it is, this source can only be read from its title.
                    </Text>
                )}
            </Box>

            {/* is_sourced_from. `url` holds the canonical location; these hold the rest, which
                is what a synthesized source drawn from several places needs. Each page carries
                its OWN text: for a synthesized source there is no node-level text and these
                pages are the text, so each one is editable here rather than only from the
                Documentation area. */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack mb={3}>
                    <Heading as="h3" size="sm" color={`${INTELLECTUAL_SOURCE_COLOR}.700`}>Sources</Heading>
                    <Spacer />
                    {pagesMissingText > 0 && (
                        <Badge fontSize="2xs" colorScheme="orange" variant="subtle">
                            {pagesMissingText} without text
                        </Badge>
                    )}
                    <Button size="xs" colorScheme={INTELLECTUAL_SOURCE_COLOR} variant="outline"
                        onClick={addPageDisclosure.onOpen}>
                        Add page
                    </Button>
                </HStack>
                {(item.sources || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                        {item.url ? 'One canonical location, recorded above.' : 'No sources recorded.'}
                    </Text>
                ) : (
                    <VStack align="stretch" spacing={3}>
                        {item.sources.map((s) => {
                            const chars = s.text_length || 0;
                            const editable = s.label === 'Webpage' || s.label === 'Document';
                            return (
                                <HStack key={s.unique_id} spacing={2} align="start">
                                    <Badge fontSize="2xs" colorScheme="gray" variant="subtle">{s.label}</Badge>
                                    <Box minW="0" flex="1">
                                        <Text fontSize="sm" color="gray.800">{s.name || '(untitled)'}</Text>
                                        {s.url && (
                                            <Link href={s.url} isExternal fontSize="xs" color="gray.600" wordBreak="break-all">
                                                {s.url} <ExternalLinkIcon mx="2px" aria-hidden="true" />
                                            </Link>
                                        )}
                                        <HStack spacing={2} mt={1}>
                                            <Badge fontSize="2xs" colorScheme={chars ? 'green' : 'gray'} variant="subtle">
                                                {chars ? `${chars.toLocaleString()} characters` : 'No text'}
                                            </Badge>
                                            {s.raw_text_captured && (
                                                <Text fontSize="2xs" color="gray.600">Captured {s.raw_text_captured}</Text>
                                            )}
                                        </HStack>
                                    </Box>
                                    <HStack spacing={1}>
                                        {editable && (
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                colorScheme={INTELLECTUAL_SOURCE_COLOR}
                                                onClick={() => setPageBeingEdited(s)}
                                            >
                                                {chars ? 'Edit text' : 'Add text'}
                                            </Button>
                                        )}
                                        <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            isLoading={removingPageId === s.unique_id}
                                            onClick={() => handleDetachPage(s)}
                                        >
                                            Remove
                                        </Button>
                                    </HStack>
                                </HStack>
                            );
                        })}
                    </VStack>
                )}
            </Box>

            {/* informs — the editable block, and the one that earns the tab. */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color={`${INTELLECTUAL_SOURCE_COLOR}.700`} mb={1}>Informs — Implementations</Heading>
                <Text fontSize="xs" color="gray.600" mb={3}>
                    What a campus wrote or revised from this source. A source informs; it never requires.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Implementation"
                    placeholder="Select an implementation…"
                    attached={(item.informed_implementations || []).map((i) => ({
                        unique_id: i.unique_id,
                        label: `${i.title || '(untitled)'}${i.retired ? ' (retired)' : ''}`,
                        badge: <Badge fontSize="2xs" colorScheme="gray" variant="subtle">{i.label}</Badge>,
                    }))}
                    candidates={implementations.map((i) => ({
                        unique_id: i.unique_id,
                        // The dropdown <option> cannot hold a badge, so the type is named inline.
                        label: `${i.type} — ${i.title || '(untitled)'}`,
                    }))}
                    onAttach={(uid) => attachInformedImplementation(item.unique_id, uid)}
                    onDetach={(uid) => detachInformedImplementation(item.unique_id, uid)}
                    afterChange={refresh}
                    emptyLabel="Informs nothing yet."
                />
            </Box>

            {/* Reverse of Principle.derives_from. Read-only here: grounding is attached from
                the principle's own panel, which is where the judgment belongs. */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color={`${INTELLECTUAL_SOURCE_COLOR}.700`} mb={3}>Grounds these principles</Heading>
                {groundedPrinciples.length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                        No principle is grounded in this source. Attach it from the principle's own panel.
                    </Text>
                ) : (
                    <HStack spacing={2} flexWrap="wrap">
                        {groundedPrinciples.map((p) => (
                            <Tag key={p.handle} size="sm" colorScheme="cyan" variant="subtle">
                                {p.name || p.handle}
                            </Tag>
                        ))}
                    </HStack>
                )}
            </Box>

            <AddSourcePageForm
                isOpen={addPageDisclosure.isOpen}
                onClose={addPageDisclosure.onClose}
                sourceUniqueId={item.unique_id}
                onSaved={refresh}
            />

            <SourceTextModal
                isOpen={Boolean(pageBeingEdited)}
                onClose={() => setPageBeingEdited(null)}
                item={pageBeingEdited}
                onSave={(uid, text) => (pageBeingEdited?.label === 'Document'
                    ? updateDocumentSourceText(uid, text)
                    : updateWebpageSourceText(uid, text))}
                onSaved={refresh}
            />

            <IntellectualSourceForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingItem={item}
                onSaved={(updated) => { if (onAfterEdit) onAfterEdit(updated || item); }}
            />
        </VStack>
    );
}

export default IntellectualSourceDetailPanel;
