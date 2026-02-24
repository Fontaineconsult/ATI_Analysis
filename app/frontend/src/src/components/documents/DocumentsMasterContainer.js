import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Flex,
    VStack,
    Text,
    Button,
    Heading,
    Badge,
    Spinner,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { fetchAllDocumentation } from '../../services/api/get';
import DocumentDetailPanel from './DocumentDetailPanel';

const DOCUMENT_TYPES = [
    { key: 'documents', label: 'Documents' },
    { key: 'webpages', label: 'Webpages' },
    { key: 'notes', label: 'Notes' },
    { key: 'messages', label: 'Messages' },
    { key: 'metrics', label: 'Metrics' },
];

function DocumentsMasterContainer() {
    const { documentType, documentId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState(documentType || 'documents');
    const [selectedItemId, setSelectedItemId] = useState(documentId || null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (documentType && DOCUMENT_TYPES.some(t => t.key === documentType)) {
            setSelectedType(documentType);
        }
    }, [documentType]);

    useEffect(() => {
        if (documentId) {
            setSelectedItemId(documentId);
        }
    }, [documentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await fetchAllDocumentation();
            setData(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeSelect = (typeKey) => {
        setSelectedType(typeKey);
        setSelectedItemId(null);
        navigate(`/ati-explorer/documents/${typeKey}`);
    };

    const handleItemSelect = (item) => {
        setSelectedItemId(item.unique_id);
        navigate(`/ati-explorer/documents/${selectedType}/${item.unique_id}`, { replace: true });
    };

    // Redirect to default type if none specified
    useEffect(() => {
        if (!documentType) {
            navigate(`/ati-explorer/documents/documents`, { replace: true });
        }
    }, [documentType, navigate]);

    if (loading) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" color="teal.500" />
                <Text mt={4} color="gray.600">Loading documentation...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="lg">
                <AlertIcon />
                Error loading documentation: {error}
            </Alert>
        );
    }

    const items = data?.[selectedType] || [];
    const selectedItem = selectedItemId
        ? items.find(i => i.unique_id === selectedItemId) || null
        : null;

    // Auto-select first item if none selected
    if (!selectedItem && items.length > 0 && !selectedItemId) {
        // Defer to avoid setState during render
        setTimeout(() => {
            setSelectedItemId(items[0].unique_id);
        }, 0);
    }

    const getItemLabel = (item) => {
        return item.name || item.url || item.composite_key || 'Untitled';
    };

    return (
        <Box maxW="1400px" mx="auto" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
                <Box>
                    <Heading size="lg" color="gray.800">Document Explorer</Heading>
                    <Text color="gray.600" mt={2}>Browse all documentation and their relationships</Text>
                </Box>
            </Flex>

            {/* Type selector buttons */}
            <Flex wrap="wrap" gap={3} mb={6}>
                {DOCUMENT_TYPES.map(({ key, label }) => (
                    <Button
                        key={key}
                        onClick={() => handleTypeSelect(key)}
                        colorScheme={selectedType === key ? "teal" : "gray"}
                        variant={selectedType === key ? "solid" : "outline"}
                        size="sm"
                        borderRadius="lg"
                        _hover={{
                            boxShadow: 'md',
                            transform: 'translateY(-1px)'
                        }}
                        transition="all 0.2s"
                    >
                        {label} ({data?.[key]?.length || 0})
                    </Button>
                ))}
            </Flex>

            {/* Two-panel layout */}
            <Flex h="70vh" gap={6}>
                {/* Left Panel - Item List */}
                <Box
                    w="35%"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="white"
                    p={6}
                    overflowY="auto"
                    boxShadow="sm"
                >
                    <Heading size="md" color="teal.700" mb={4} fontWeight="bold">
                        {DOCUMENT_TYPES.find(t => t.key === selectedType)?.label} ({items.length})
                    </Heading>
                    {items.length > 0 ? (
                        <VStack align="stretch" spacing={3}>
                            {items.map((item) => {
                                const isSelected = selectedItem?.unique_id === item.unique_id;
                                const refCount = item.referenced_by?.length || 0;
                                return (
                                    <Button
                                        key={item.unique_id}
                                        variant={isSelected ? 'solid' : 'outline'}
                                        colorScheme="teal"
                                        size="sm"
                                        justifyContent="space-between"
                                        onClick={() => handleItemSelect(item)}
                                        textAlign="left"
                                        whiteSpace="normal"
                                        h="auto"
                                        py={3}
                                        px={4}
                                        bg={isSelected ? 'teal.500' : 'white'}
                                        _hover={{
                                            bg: isSelected ? 'teal.600' : 'gray.50',
                                            boxShadow: 'md',
                                        }}
                                        transition="all 0.2s"
                                    >
                                        <VStack align="start" spacing={1} flex="1">
                                            <Text
                                                fontSize="sm"
                                                color={isSelected ? 'white' : 'gray.700'}
                                                noOfLines={2}
                                            >
                                                {getItemLabel(item)}
                                            </Text>
                                            <Badge
                                                colorScheme={refCount > 0 ? "teal" : "gray"}
                                                fontSize="xs"
                                                px={2}
                                                py={1}
                                                borderRadius="md"
                                            >
                                                {refCount} implementation{refCount !== 1 ? 's' : ''}
                                            </Badge>
                                        </VStack>
                                    </Button>
                                );
                            })}
                        </VStack>
                    ) : (
                        <Alert status="info" borderRadius="lg" fontSize="sm">
                            <AlertIcon />
                            No {DOCUMENT_TYPES.find(t => t.key === selectedType)?.label?.toLowerCase()} found
                        </Alert>
                    )}
                </Box>

                {/* Right Panel - Detail View */}
                <Box
                    flex="1"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="white"
                    p={6}
                    overflowY="auto"
                    boxShadow="sm"
                >
                    <DocumentDetailPanel
                        item={selectedItem}
                        documentType={selectedType}
                    />
                </Box>
            </Flex>
        </Box>
    );
}

export default DocumentsMasterContainer;
