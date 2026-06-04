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
import SchemaElementList from '../graph_components/schema_elements/SchemaElementList';
import SchemaElementDetailPanel from '../graph_components/schema_elements/SchemaElementDetailPanel';
import SchemaElementForm from '../graph_components/schema_elements/SchemaElementForm';

/**
 * SchemaElement slice of the ATI Explorer. URL-DRIVEN selection (the meta-scaffold's intentional
 * departure from Governance): the selected handle comes from the `:handle` route param, selecting
 * is a navigate(), and data comes from MetaScaffoldContext (shared, not self-fetched). Deep-links
 * like /{campus}/ati-explorer/schema-elements/label:Tool open that element directly.
 */
function SchemaElementMasterContainer() {
    const { campus, handle } = useParams();
    const navigate = useNavigate();
    const { schemaElements, loading, error, reload } = useMetaScaffold();
    const createForm = useDisclosure();

    const basePath = `/${campus}/ati-explorer/schema-elements`;
    const selectedHandle = handle ? decodeURIComponent(handle) : null;
    const selectedItem = schemaElements.find((e) => e.handle === selectedHandle) || null;

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
        goTo(null);  // back to the bare list; user re-selects
    };

    return (
        <Box>
            <HStack justify="space-between" align="baseline" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">Schema Elements</Heading>
                <Text fontSize="sm" color="gray.500">
                    {schemaElements.length} item{schemaElements.length === 1 ? '' : 's'}
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
                        <SchemaElementList
                            items={schemaElements}
                            selectedHandle={selectedHandle}
                            onSelect={(item) => goTo(item.handle)}
                            onAdd={createForm.onOpen}
                            emptyMessage="No schema elements yet. Click Add Schema Element to begin."
                        />
                    )}
                </Box>

                <Box flex="2" minW="0">
                    <SchemaElementDetailPanel
                        item={selectedItem}
                        onAfterEdit={handleEdited}
                        onAfterDelete={handleDeleted}
                    />
                </Box>
            </Flex>

            <SchemaElementForm
                isOpen={createForm.isOpen}
                onClose={createForm.onClose}
                onSaved={handleCreated}
            />
        </Box>
    );
}

export default SchemaElementMasterContainer;
