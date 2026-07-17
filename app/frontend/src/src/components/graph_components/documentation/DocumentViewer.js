import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Text,
    Flex,
    Collapse,
    Link,
    HStack,
    VStack,
    Badge,
    IconButton,
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { updateDocument } from '../../../services/api/put';
import { addDocumentToImplementation } from '../../../services/api/post';
import { useToast } from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import DocumentForm from './DocumentForm';

function DocumentViewer({ documents, implementation_id, implementation_type }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewDocument, setIsAddingNewDocument] = useState(false);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const toast = useToast();

    const toggleEdit = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleFormSubmit = async (index, documentData, isNew) => {
        try {
            let response;

            if (isNew) {
                documentData.date_created = new Date().toISOString().split('T')[0];
                response = await addDocumentToImplementation(
                    implementation_id,
                    implementation_type,
                    documentData,
                    user?.employee_id || ''
                );
            } else {
                response = await updateDocument(
                    implementation_id,
                    implementation_type,
                    documentData,
                    user?.employee_id || ''
                );
            }

            toast({
                title: "Success",
                description: response?.message || "Operation completed successfully.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            await loadSingleWorkingGroupData(currentWorkingGroup);
            setExpandedIndex(null);
            setIsAddingNewDocument(false);
        } catch (error) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "An unexpected error occurred.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Box>
            <Button
                size="xs"
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewDocument(true);
                    setExpandedIndex(null);
                }}
                mb={3}
            >
                Add New Document
            </Button>

            {isAddingNewDocument && (
                <Box mb={3} borderWidth="1px" borderColor="teal.300" borderRadius="md" p={3} bg="teal.50">
                    <DocumentForm
                        document={null}
                        onSubmit={(documentData) => handleFormSubmit(null, documentData, true)}
                        createdBy={user?.properties || user}
                        isNewDocument={true}
                        onCancel={() => setIsAddingNewDocument(false)}
                    />
                </Box>
            )}

            {documents && documents.length > 0 ? (
                <VStack spacing={2} align="stretch">
                    {documents.map((docWrapper, index) => {
                        const document = docWrapper.document || docWrapper;
                        const createdByPerson = docWrapper.created_by?.properties || document.created_by?.properties;
                        const isExpanded = expandedIndex === index;

                        return (
                            <Box
                                key={document.properties.unique_id || index}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                bg="white"
                                _hover={{ borderColor: 'teal.300', bg: 'gray.50' }}
                                transition="all 0.2s"
                            >
                                {/* Compact view */}
                                <Flex justify="space-between" align="start">
                                    <VStack align="start" spacing={1} flex="1">
                                        {/* Title row with status badges */}
                                        <HStack spacing={2} width="full">
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                                {document.properties.name || 'Untitled Document'}
                                            </Text>
                                            {document.properties.include_in_report && (
                                                <Badge colorScheme="green" fontSize="10px">In Report</Badge>
                                            )}
                                            {document.properties.depreciated && (
                                                <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>
                                            )}
                                            {document.properties.is_administrative_review_documentation && (
                                                <Badge colorScheme="blue" fontSize="10px">Admin</Badge>
                                            )}
                                            {document.properties.is_milestone_and_measures_documentation && (
                                                <Badge colorScheme="purple" fontSize="10px">Milestone</Badge>
                                            )}
                                        </HStack>

                                        {/* Links row */}
                                        <HStack spacing={3} fontSize="xs">
                                            {document.properties.file_path && (
                                                <Link
                                                    href={document.properties.file_path}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    File <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                            {document.properties.uri_path && (
                                                <Link
                                                    href={document.properties.uri_path}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    URI <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                            {document.properties.file?.download_url && (
                                                <Link
                                                    href={document.properties.file.download_url}
                                                    isExternal
                                                    color="teal.600"
                                                    display="flex"
                                                    alignItems="center"
                                                >
                                                    {document.properties.file.original_filename || 'Download'} <ExternalLinkIcon ml={1} />
                                                </Link>
                                            )}
                                            <Text color="gray.600">
                                                Created: {document.properties.date_created || 'N/A'}
                                            </Text>
                                            {createdByPerson && (
                                                <Text color="gray.600">
                                                    By: {createdByPerson.name}
                                                </Text>
                                            )}
                                        </HStack>
                                    </VStack>

                                    <IconButton
                                        aria-label="Edit document"
                                        icon={<EditIcon />}
                                        size="xs"
                                        colorScheme={isExpanded ? "gray" : "teal"}
                                        variant={isExpanded ? "solid" : "ghost"}
                                        onClick={() => toggleEdit(index)}
                                        ml={2}
                                    />
                                </Flex>

                                {/* Collapsible edit form */}
                                <Collapse in={isExpanded} animateOpacity>
                                    <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.200">
                                        <DocumentForm
                                            document={document}
                                            onSubmit={(documentData) => handleFormSubmit(index, documentData, false)}
                                            createdBy={createdByPerson}
                                            isNewDocument={false}
                                            onCancel={() => toggleEdit(index)}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text color="gray.600" fontSize="sm">No documents available.</Text>
            )}
        </Box>
    );
}

export default DocumentViewer;