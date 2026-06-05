import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Link,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    IconButton,
    useToast,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertDialogCloseButton,
    HStack,
    Tooltip,
    Badge,
    Wrap,
    WrapItem
} from '@chakra-ui/react';
import { DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import DocumentationMasterViewer from "../documentation/DocumentationMasterContainer";
import { unassignImplementationFromYSE } from '../../../services/api/delete';

function EvidenceTypeMasterList({ evidence, yearIdentifier, onRefresh }) {

    const { isOpen, onOpen, onClose } = useDisclosure();  // Chakra UI hook for modal control
    const [selectedEvidence, setSelectedEvidence] = useState(null);  // State to track the currently selected evidence
    const [deleteTarget, setDeleteTarget] = useState(null);  // Track which item to delete
    const [isDeleting, setIsDeleting] = useState(false);  // Loading state for delete
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();  // Alert dialog control
    const cancelRef = React.useRef();
    const toast = useToast();
    const { campus } = useParams();

    // Helper function to get documentation counts
    const getDocumentationCounts = (evidenceItem) => {
        const counts = {
            docs: evidenceItem?.docs?.length || 0,
            webs: evidenceItem?.webs?.length || 0,
            notes: evidenceItem?.notes?.length || 0,
            msgs: evidenceItem?.msgs?.length || 0,
            metrics: evidenceItem?.metrics?.length || 0
        };

        // Calculate total
        counts.total = counts.docs + counts.webs + counts.notes + counts.msgs + counts.metrics;

        return counts;
    };

    // Render documentation counts as compact badges
    const renderDocumentationCounts = (evidenceItem) => {
        const counts = getDocumentationCounts(evidenceItem);

        if (counts.total === 0) {
            return <Text fontSize="xs" color="gray.400">No documentation</Text>;
        }

        const badges = [];

        // Define short labels, colors, and full names for each type
        const typeConfig = {
            docs: { label: 'Doc', color: 'blue', fullName: 'Documents' },
            webs: { label: 'Web', color: 'purple', fullName: 'Webpages' },
            notes: { label: 'Note', color: 'yellow', fullName: 'Notes' },
            msgs: { label: 'Msg', color: 'cyan', fullName: 'Messages' },
            metrics: { label: 'Met', color: 'green', fullName: 'Metrics' }
        };

        // Add badge for each type with count > 0
        Object.entries(typeConfig).forEach(([key, config]) => {
            if (counts[key] > 0) {
                badges.push(
                    <WrapItem key={key}>
                        <Tooltip
                            label={`${counts[key]} ${config.fullName}`}
                            placement="top"
                            hasArrow
                        >
                            <Badge
                                size="sm"
                                colorScheme={config.color}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={0.5}
                                cursor="pointer"
                            >
                                {config.label}: {counts[key]}
                            </Badge>
                        </Tooltip>
                    </WrapItem>
                );
            }
        });

        return (
            <Wrap spacing={1} align="center">
                {badges}
            </Wrap>
        );
    };

    // Handle opening the modal and setting the selected evidence
    const handleViewDocumentation = (evidenceItem) => {
        setSelectedEvidence(evidenceItem);
        onOpen();  // Open the modal
    };

    // Handle delete confirmation dialog
    const handleDeleteClick = (evidenceItem) => {
        setDeleteTarget(evidenceItem);
        onDeleteOpen();
    };

    // Handle actual deletion
    const handleConfirmDelete = async () => {
        if (!deleteTarget || !yearIdentifier) {
            toast({
                title: "Error",
                description: "Missing required information for deletion",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsDeleting(true);

        try {
            // Extract the implementation type and title
            const implementationType = deleteTarget.type || deleteTarget.evidenceType?.properties?.title || 'Unknown Type';
            const implementationTitle = deleteTarget.evidenceType?.properties?.title || deleteTarget.title || 'Unknown';

            await unassignImplementationFromYSE(
                yearIdentifier,
                implementationType,
                implementationTitle
            );

            toast({
                title: "Success",
                description: `${implementationType} "${implementationTitle}" has been removed`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            // Call refresh callback if provided
            if (onRefresh) {
                onRefresh();
            }

            onDeleteClose();
        } catch (error) {
            console.error('Error deleting implementation:', error);
            toast({
                title: "Delete Failed",
                description: error.message || "There was an issue removing the implementation",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    // Count the number of evidence items
    const evidenceCount = evidence?.length || 0;

    // Inform screen readers of the list summary when it is focused
    useEffect(() => {
        if (evidenceCount === 0) return;
        const tableBox = document.getElementById('evidence-table');
        if (tableBox) {
            tableBox.setAttribute('aria-label', `Evidence table with ${evidenceCount} items`);
        }
    }, [evidenceCount]);

    if (evidenceCount === 0) {
        return <Text color="gray.500" fontSize="sm">No evidence available for this type.</Text>;
    }

    return (
        <Box mt={4}>
            <Box
                overflowX="auto"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
            >
                <Table
                    id="evidence-table"
                    variant="simple"
                    size="sm"
                    colorScheme="gray"
                >
                    <Thead bg="gray.50">
                        <Tr>
                            <Th width="15%">Type</Th>
                            <Th width="35%">Title</Th>
                            <Th width="30%">
                                <Tooltip
                                    label="Doc=Documents, Web=Webpages, Note=Notes, Msg=Messages, Met=Metrics"
                                    placement="top"
                                    hasArrow
                                >
                                    <Text as="span" cursor="help">Documentation</Text>
                                </Tooltip>
                            </Th>
                            <Th width="20%" textAlign="center">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {evidence.map((evidenceItem, index) => {
                            const evidenceType = evidenceItem.type || 'Unknown Type';
                            const evidenceTitle = evidenceItem.evidenceType?.properties?.title || 'Untitled Evidence';
                            // Deep-link the title to the implementation page, pre-selected by
                            // unique_id — the same select-and-deep-link infra ImplementationTypeOverview
                            // uses. Falls back to plain text if we can't build a target.
                            const implUniqueId = evidenceItem.evidenceType?.properties?.unique_id;
                            const implementationLink = campus && implUniqueId
                                ? `/${campus}/ati-explorer/implementations/${evidenceType}/${implUniqueId}`
                                : null;

                            return (
                                <Tr
                                    key={index}
                                    _hover={{ bg: 'gray.50' }}
                                    transition="background-color 0.2s"
                                >
                                    <Td fontWeight="medium">
                                        <Text fontSize="sm">{evidenceType}</Text>
                                    </Td>
                                    <Td>
                                        {implementationLink ? (
                                            <Link
                                                as={RouterLink}
                                                to={implementationLink}
                                                fontSize="sm"
                                                color="teal.700"
                                                fontWeight="medium"
                                                _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                                                title="Open this implementation"
                                            >
                                                {evidenceTitle}
                                            </Link>
                                        ) : (
                                            <Text fontSize="sm">{evidenceTitle}</Text>
                                        )}
                                    </Td>
                                    <Td>
                                        {renderDocumentationCounts(evidenceItem)}
                                    </Td>
                                    <Td>
                                        <HStack spacing={2} justify="center">
                                            <Tooltip label="View Documentation" placement="top">
                                                <IconButton
                                                    aria-label={`View Documentation for ${evidenceTitle}`}
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    colorScheme="teal"
                                                    variant="outline"
                                                    onClick={() => handleViewDocumentation(evidenceItem)}
                                                />
                                            </Tooltip>
                                            {yearIdentifier && (
                                                <Tooltip label="Remove this implementation" placement="top">
                                                    <IconButton
                                                        aria-label={`Remove ${evidenceTitle}`}
                                                        icon={<DeleteIcon />}
                                                        size="sm"
                                                        colorScheme="red"
                                                        variant="outline"
                                                        onClick={() => handleDeleteClick(evidenceItem)}
                                                        isLoading={isDeleting && deleteTarget === evidenceItem}
                                                    />
                                                </Tooltip>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </Box>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Remove Implementation
                        </AlertDialogHeader>
                        <AlertDialogCloseButton />

                        <AlertDialogBody>
                            Are you sure you want to remove this implementation?
                            <Box mt={2} p={3} bg="gray.50" borderRadius="md">
                                <Text fontWeight="bold" fontSize="sm">
                                    {deleteTarget?.type || deleteTarget?.evidenceType?.properties?.title || 'Unknown Type'}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    {deleteTarget?.evidenceType?.properties?.title || deleteTarget?.title || 'Untitled Evidence'}
                                </Text>
                            </Box>
                            <Text mt={3} fontSize="sm" color="orange.600">
                                This action cannot be undone.
                            </Text>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteClose} size="sm">
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleConfirmDelete}
                                ml={3}
                                size="sm"
                                isLoading={isDeleting}
                                loadingText="Removing..."
                            >
                                Remove
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Modal for viewing documentation */}
            <Modal isOpen={isOpen} onClose={onClose} size="4xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Documentation Viewer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {/* Pass the selected evidence to the DocumentationMasterViewer */}
                        <DocumentationMasterViewer documentation={selectedEvidence} />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default EvidenceTypeMasterList;