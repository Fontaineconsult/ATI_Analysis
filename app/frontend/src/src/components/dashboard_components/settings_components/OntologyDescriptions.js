import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Heading,
    Text,
    Badge,
    Button,
    HStack,
    VStack,
    Spinner,
    Center,
    Input,
    InputGroup,
    InputLeftElement,
    useToast,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { fetchAllDescriptors } from '../../../services/api/get';
import { deleteDescriptor } from '../../../services/api/delete';
import EditDescriptor from './EditDescriptor';

// Kind → badge color + display order of the groups.
const KIND_META = {
    node_type: { label: 'Node Type', color: 'purple' },
    field: { label: 'Field', color: 'blue' },
    field_value: { label: 'Field Value', color: 'teal' },
};
const KIND_ORDER = ['node_type', 'field', 'field_value'];

function OntologyDescriptions() {
    const [descriptors, setDescriptors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const toast = useToast();

    const loadDescriptors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchAllDescriptors();
            setDescriptors(resp?.data?.items || []);
        } catch (e) {
            setError(e.message || 'Failed to load descriptors.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDescriptors();
    }, [loadDescriptors]);

    const openCreate = () => { setSelected(null); setIsModalOpen(true); };
    const openEdit = (descriptor) => { setSelected(descriptor); setIsModalOpen(true); };

    const handleDelete = async (descriptor) => {
        if (!window.confirm(`Delete descriptor "${descriptor.descriptor_handle}"? This cannot be undone.`)) return;
        try {
            await deleteDescriptor(descriptor.descriptor_handle);
            toast({ title: 'Descriptor deleted.', status: 'info', duration: 2000, isClosable: true });
            loadDescriptors();
        } catch (e) {
            toast({ title: 'Error deleting descriptor.', description: e.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    if (loading) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
            </Center>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Text color="red.500" fontSize="sm">{error}</Text>
            </Box>
        );
    }

    const q = query.trim().toLowerCase();
    const filtered = q
        ? descriptors.filter((d) =>
            [d.descriptor_handle, d.title, d.description_short, d.description_full]
                .some((v) => (v || '').toLowerCase().includes(q)))
        : descriptors;

    return (
        <Box textAlign="left">
            <HStack justifyContent="space-between" mb={3}>
                <Heading size="md" color="gray.800">Ontology Descriptions</Heading>
                <Button colorScheme="teal" size="sm" onClick={openCreate}>
                    Add Descriptor
                </Button>
            </HStack>

            <Text fontSize="sm" color="gray.600" mb={3}>
                Human-readable descriptions of the schema — node types, fields, and field values —
                surfaced in the app. Keyed by a handle; not connected to instance data.
            </Text>

            <InputGroup size="sm" mb={4} maxW="420px">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input placeholder="Search handle, title, or text..." value={query}
                    onChange={(e) => setQuery(e.target.value)} borderColor="gray.300"
                    _hover={{ borderColor: 'gray.400' }}
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
            </InputGroup>

            {KIND_ORDER.map((kind) => {
                const rows = filtered.filter((d) => d.descriptor_kind === kind);
                if (rows.length === 0) return null;
                const meta = KIND_META[kind];
                return (
                    <Box key={kind} mb={5}>
                        <HStack mb={2} spacing={2}>
                            <Badge colorScheme={meta.color} variant="solid" borderRadius="full" px={2}>
                                {meta.label}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">{rows.length}</Text>
                        </HStack>
                        <VStack align="stretch" spacing={2}>
                            {rows.map((d) => (
                                <Box key={d.descriptor_handle} borderWidth="1px" borderColor="gray.200"
                                    borderRadius="md" bg="white" boxShadow="sm" px={3} py={2}>
                                    <HStack justify="space-between" align="flex-start">
                                        <Box flex={1} minW="0">
                                            <HStack spacing={2} mb={1}>
                                                <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                                                    {d.title || d.descriptor_handle}
                                                </Text>
                                                {d.include_in_report && (
                                                    <Badge colorScheme="green" fontSize="2xs" variant="subtle">in report</Badge>
                                                )}
                                            </HStack>
                                            <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1}>
                                                {d.descriptor_handle}
                                            </Text>
                                            {d.description_short && (
                                                <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                                    {d.description_short}
                                                </Text>
                                            )}
                                        </Box>
                                        <HStack spacing={1} flexShrink={0}>
                                            <Button size="xs" colorScheme="teal" variant="ghost" onClick={() => openEdit(d)}>
                                                Edit
                                            </Button>
                                            <Button size="xs" colorScheme="red" variant="ghost" onClick={() => handleDelete(d)}>
                                                Delete
                                            </Button>
                                        </HStack>
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    </Box>
                );
            })}

            {filtered.length === 0 && (
                <Box p={4} textAlign="center">
                    <Text fontSize="sm" color="gray.500">
                        {descriptors.length === 0 ? 'No descriptors yet. Click "Add Descriptor" to create one.' : 'No descriptors match your search.'}
                    </Text>
                </Box>
            )}

            <EditDescriptor
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                descriptorData={selected}
                onSave={loadDescriptors}
            />
        </Box>
    );
}

export default OntologyDescriptions;
