import React, { useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Flex,
    Heading,
    HStack,
    Spinner,
    Text,
    useDisclosure,
} from '@chakra-ui/react';
import { useMetaScaffold } from '../../hooks/useMetaScaffold';
import PrincipleList from '../graph_components/principles/PrincipleList';
import PrincipleDetailPanel from '../graph_components/principles/PrincipleDetailPanel';
import PrincipleForm from '../graph_components/principles/PrincipleForm';

/**
 * Principles master-detail, rendered inside the Governance area's "Principles" tab. Selection
 * is IN-MEMORY (the tab has no route of its own); data + reload come from MetaScaffoldContext.
 */
function PrincipleMasterContainer() {
    const { principles, loading, error, reload } = useMetaScaffold();
    const [selectedHandle, setSelectedHandle] = useState(null);
    const createForm = useDisclosure();

    const selectedItem = principles.find((p) => p.handle === selectedHandle) || null;

    const handleCreated = async (created) => {
        await reload();
        if (created?.handle) setSelectedHandle(created.handle);
    };
    const handleEdited = async (updated) => {
        await reload();
        if (updated?.handle) setSelectedHandle(updated.handle);
    };
    const handleDeleted = async () => {
        await reload();
        setSelectedHandle(null);
    };

    return (
        <Box>
            <HStack justify="space-between" align="baseline" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">Principles</Heading>
                <Text fontSize="sm" color="gray.500">
                    {principles.length} item{principles.length === 1 ? '' : 's'}
                </Text>
            </HStack>

            {error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />{error}
                </Alert>
            )}

            <Flex gap={6} align="flex-start">
                <Box flex="1" minW="0">
                    {loading ? (
                        <HStack p={4} color="gray.600" fontSize="sm">
                            <Spinner size="sm" color="teal.500" /><Text>Loading…</Text>
                        </HStack>
                    ) : (
                        <PrincipleList
                            items={principles}
                            selectedHandle={selectedHandle}
                            onSelect={(item) => setSelectedHandle(item.handle)}
                            onAdd={createForm.onOpen}
                            emptyMessage="No principles yet. Click Add Principle to begin."
                        />
                    )}
                </Box>

                <Box flex="2" minW="0">
                    <PrincipleDetailPanel
                        item={selectedItem}
                        onAfterEdit={handleEdited}
                        onAfterDelete={handleDeleted}
                    />
                </Box>
            </Flex>

            <PrincipleForm
                isOpen={createForm.isOpen}
                onClose={createForm.onClose}
                onSaved={handleCreated}
            />
        </Box>
    );
}

export default PrincipleMasterContainer;
