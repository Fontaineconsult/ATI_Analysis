import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
 * Principle slice of the ATI Explorer. URL-driven selection + MetaScaffoldContext data (same
 * pattern as SchemaElementMasterContainer). Single node type, so Add opens the form directly.
 * Deep-links: /{campus}/ati-explorer/principles/principle:closest-to-capacity.
 */
function PrincipleMasterContainer() {
    const { campus, handle } = useParams();
    const navigate = useNavigate();
    const { principles, loading, error, reload } = useMetaScaffold();
    const createForm = useDisclosure();

    const basePath = `/${campus}/ati-explorer/principles`;
    const selectedHandle = handle ? decodeURIComponent(handle) : null;
    const selectedItem = principles.find((p) => p.handle === selectedHandle) || null;

    const goTo = (h) => navigate(h ? `${basePath}/${encodeURIComponent(h)}` : basePath);

    const handleCreated = async (created) => {
        await reload();
        if (created?.handle) goTo(created.handle);
    };
    const handleEdited = async (updated) => {
        await reload();
        if (updated?.handle) goTo(updated.handle);
    };
    const handleDeleted = async () => {
        await reload();
        goTo(null);
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
                            onSelect={(item) => goTo(item.handle)}
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
