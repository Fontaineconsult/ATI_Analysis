import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Divider,
    Heading,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spacer,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import GovernanceTypeBadge from './GovernanceTypeBadge';
import GovernanceForm from './GovernanceForm';
import { getGovernanceTypeConfig } from './governanceTypes';
import { deleteGovernance } from '../../../services/api/delete';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import DocumentForm from '../documentation/DocumentForm';
import WebsiteForm from '../documentation/WebsiteForm';
import { fetchAllDocuments, fetchAllWebpages } from '../../../services/api/get';
import { createStandaloneDocument, createStandaloneWebpage } from '../../../services/api/post';
import {
    attachDocumentToGovernance,
    detachDocumentFromGovernance,
    attachWebpageToGovernance,
    detachWebpageFromGovernance,
} from '../../../services/api/put';
import { UserContext } from '../../../context/UserContext';

// Local check that mirrors the EntityAttachmentSelector normalizer: would this
// string survive normalizeHref? Used to choose which Webpage field holds the
// actual URL (data is sometimes split with the URL in `name` and the title in
// `url`).
function looksLikeUrl(s) {
    if (!s || typeof s !== 'string') return false;
    const t = s.trim();
    if (!t) return false;
    if (/^(https?|mailto|tel|ftp):/i.test(t)) return true;
    if (t.startsWith('//')) return true;
    if (!/\s/.test(t) && /\./.test(t)) return true;
    return false;
}

/**
 * Right-column detail view for a governance item. Read view by default,
 * with Edit / Delete actions that talk back to the parent via callbacks.
 *
 * Props:
 *   item                  The governance item (or null when nothing selected).
 *   onAfterEdit(item)     Called after a successful edit so the container
 *                         can refresh and update its selected reference.
 *   onAfterDelete(item)   Called after a successful delete.
 *   placeholder           Optional ReactNode shown when item is null.
 */
function GovernanceDetailPanel({ item, onAfterEdit, onAfterDelete, placeholder }) {
    const editDisclosure = useDisclosure();
    const newDocDisclosure = useDisclosure();
    const newWebpageDisclosure = useDisclosure();
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();
    const { user } = useContext(UserContext);

    // Candidate caches — fetched once on first use, not per selection.
    const [documentCandidates, setDocumentCandidates] = useState([]);
    const [webpageCandidates, setWebpageCandidates] = useState([]);
    const [candidatesLoaded, setCandidatesLoaded] = useState(false);

    const refetchCandidates = useCallback(async () => {
        try {
            const [docResp, pageResp] = await Promise.all([fetchAllDocuments(), fetchAllWebpages()]);
            setDocumentCandidates(Array.isArray(docResp?.data) ? docResp.data : []);
            setWebpageCandidates(Array.isArray(pageResp?.data) ? pageResp.data : []);
            return {
                documents: Array.isArray(docResp?.data) ? docResp.data : [],
                webpages: Array.isArray(pageResp?.data) ? pageResp.data : [],
            };
        } catch (err) {
            toast({
                title: 'Failed to refresh candidates',
                description: err?.message || 'Refresh to retry.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return { documents: [], webpages: [] };
        }
    }, [toast]);

    useEffect(() => {
        if (candidatesLoaded || !item) return;
        let cancelled = false;
        (async () => {
            await refetchCandidates();
            if (!cancelled) setCandidatesLoaded(true);
        })();
        return () => { cancelled = true; };
    }, [item, candidatesLoaded, refetchCandidates]);

    const refreshAfterAttach = useCallback(async () => {
        if (onAfterEdit) await onAfterEdit(item);
    }, [onAfterEdit, item]);

    // Submitting the standalone create form: create node, refetch candidates,
    // then auto-attach the new node to the current governance item. The backend
    // returns success-only, so we match the new node by uri_path/url/name.
    const handleCreateDocument = useCallback(async (documentData) => {
        await createStandaloneDocument(documentData, user?.employee_id || null);
        const { documents } = await refetchCandidates();
        const matchKey = documentData.uri_path || documentData.file_path || documentData.name;
        const created = documents.find((d) =>
            (matchKey && d.uri_path === matchKey) ||
            (matchKey && d.file_path === matchKey) ||
            (matchKey && d.name === matchKey),
        );
        if (created && item) {
            await attachDocumentToGovernance(item.type, item.unique_id, created.unique_id);
            if (onAfterEdit) await onAfterEdit(item);
        }
        newDocDisclosure.onClose();
    }, [user, refetchCandidates, item, onAfterEdit, newDocDisclosure]);

    const handleCreateWebpage = useCallback(async (webpageData) => {
        await createStandaloneWebpage(webpageData, user?.employee_id || null);
        const { webpages } = await refetchCandidates();
        const created = webpages.find((w) => w.url === webpageData.url);
        if (created && item) {
            await attachWebpageToGovernance(item.type, item.unique_id, created.unique_id);
            if (onAfterEdit) await onAfterEdit(item);
        }
        newWebpageDisclosure.onClose();
    }, [user, refetchCandidates, item, onAfterEdit, newWebpageDisclosure]);

    if (!item) {
        return (
            placeholder || (
                <Box
                    p={8}
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="gray.300"
                    borderRadius="lg"
                    bg="gray.50"
                    textAlign="center"
                >
                    <Text color="gray.500" fontSize="sm">
                        Select a governance item on the left, or click <strong>Add Governance</strong> to create one.
                    </Text>
                </Box>
            )
        );
    }

    const config = getGovernanceTypeConfig(item.type);
    if (!config) {
        return (
            <Box p={4} color="red.500" fontSize="sm">
                Unknown governance type: {String(item.type)}
            </Box>
        );
    }

    const handleDelete = async () => {
        if (!window.confirm(`Delete this ${config.label}? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await deleteGovernance(item.type, item.unique_id);
            toast({ title: 'Deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterDelete) onAfterDelete(item);
        } catch (error) {
            toast({
                title: 'Delete failed.',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <GovernanceTypeBadge type={item.type} />
                        <Heading as="h2" size="md" color="gray.800">
                            {item.title || '(untitled)'}
                        </Heading>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>
                            Edit
                        </Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>
                            Delete
                        </Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <VStack align="stretch" spacing={3}>
                    {config.fields
                        .filter((f) => f.name !== 'title')
                        .map((field) => {
                            const value = item[field.name];
                            if (value === null || value === undefined || value === '') {
                                return (
                                    <Box key={field.name}>
                                        <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
                                            {field.label}
                                        </Text>
                                        <Text fontSize="sm" color="gray.400" fontStyle="italic">
                                            Not set
                                        </Text>
                                    </Box>
                                );
                            }
                            return (
                                <Box key={field.name}>
                                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">
                                        {field.label}
                                    </Text>
                                    <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">
                                        {String(value)}
                                    </Text>
                                </Box>
                            );
                        })}
                </VStack>
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>
                    Linked Documents
                </Heading>
                <EntityAttachmentSelector
                    entityLabel="Document"
                    placeholder="Select a document to attach…"
                    attached={(item.documents || []).map((d) => ({
                        unique_id: d.unique_id,
                        label: d.name || d.uri_path || d.file_path || '(untitled document)',
                    }))}
                    candidates={documentCandidates.map((d) => ({
                        unique_id: d.unique_id,
                        label: d.name || d.uri_path || d.file_path || '(untitled document)',
                    }))}
                    onAttach={(documentUniqueId) =>
                        attachDocumentToGovernance(item.type, item.unique_id, documentUniqueId)
                    }
                    onDetach={(documentUniqueId) =>
                        detachDocumentFromGovernance(item.type, item.unique_id, documentUniqueId)
                    }
                    afterChange={refreshAfterAttach}
                    emptyLabel="No documents linked yet."
                    onCreateNew={newDocDisclosure.onOpen}
                />
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>
                    Linked Webpages
                </Heading>
                <EntityAttachmentSelector
                    entityLabel="Webpage"
                    placeholder="Select a webpage to attach…"
                    attached={(item.webpages || []).map((w) => {
                        // Data wart: some Webpage nodes have the URL stored in
                        // `name` and the title in `url` (fields swapped). Pick
                        // whichever field actually looks like a URL.
                        const urlCandidate = looksLikeUrl(w.url) ? w.url : (looksLikeUrl(w.name) ? w.name : null);
                        return {
                            unique_id: w.unique_id,
                            label: urlCandidate || w.url || w.name || '(untitled webpage)',
                            href: urlCandidate,
                        };
                    })}
                    candidates={webpageCandidates.map((w) => ({
                        unique_id: w.unique_id,
                        label: w.name || w.url || '(untitled webpage)',
                    }))}
                    onAttach={(webpageUniqueId) =>
                        attachWebpageToGovernance(item.type, item.unique_id, webpageUniqueId)
                    }
                    onDetach={(webpageUniqueId) =>
                        detachWebpageFromGovernance(item.type, item.unique_id, webpageUniqueId)
                    }
                    afterChange={refreshAfterAttach}
                    emptyLabel="No webpages linked yet."
                    onCreateNew={newWebpageDisclosure.onOpen}
                />
            </Box>

            <GovernanceForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingItem={item}
                onSaved={(updated) => {
                    if (onAfterEdit) onAfterEdit(updated);
                }}
            />

            <Modal isOpen={newDocDisclosure.isOpen} onClose={newDocDisclosure.onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create new document</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <DocumentForm
                            document={null}
                            isNewDocument
                            createdBy={user?.employee_id || null}
                            onSubmit={handleCreateDocument}
                            onCancel={newDocDisclosure.onClose}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={newWebpageDisclosure.isOpen} onClose={newWebpageDisclosure.onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create new webpage</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <WebsiteForm
                            website={null}
                            isNewWebsite
                            createdBy={user?.employee_id || null}
                            onSubmit={handleCreateWebpage}
                            onCancel={newWebpageDisclosure.onClose}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
}

export default GovernanceDetailPanel;
