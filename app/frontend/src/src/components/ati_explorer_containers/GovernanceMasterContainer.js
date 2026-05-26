import React, { useCallback, useEffect, useState } from 'react';
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
import { fetchAllGovernance } from '../../services/api/get';
import GovernanceList from '../graph_components/governance/GovernanceList';
import GovernanceDetailPanel from '../graph_components/governance/GovernanceDetailPanel';
import GovernanceTypePicker from '../graph_components/governance/GovernanceTypePicker';
import GovernanceForm from '../graph_components/governance/GovernanceForm';

/**
 * Governance category for the ATI Explorer. Two-column layout (1/3 + 2/3).
 *
 * Left  — GovernanceList: filterable list of all governance items with an
 *         "Add Governance" button that opens the type picker.
 * Right — GovernanceDetailPanel: read/edit/delete view of the selected
 *         item, or a friendly placeholder when nothing is selected.
 *
 * Owns:
 *   - Loading + selection state.
 *   - Add flow: type picker → form modal → refresh.
 *   - Edit/delete callbacks → refresh + reconcile selection.
 */
function GovernanceMasterContainer() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const typePicker = useDisclosure();
    const [pendingType, setPendingType] = useState(null);
    const createForm = useDisclosure();

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchAllGovernance();
            const list = response?.data?.items || [];
            setItems(list);
            return list;
        } catch (e) {
            setError(e?.message || 'Failed to load governance items.');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const selectedItem = items.find((it) => it.unique_id === selectedId) || null;

    const handleAddClick = () => {
        setPendingType(null);
        typePicker.onOpen();
    };

    const handlePickType = (typeKey) => {
        setPendingType(typeKey);
        typePicker.onClose();
        createForm.onOpen();
    };

    const handleCreated = async (created) => {
        const list = await loadAll();
        if (created?.unique_id) {
            setSelectedId(created.unique_id);
        } else if (list.length > 0) {
            // fall back to first item if API didn't return the created node
            setSelectedId(list[0].unique_id);
        }
    };

    const handleEdited = async (updated) => {
        await loadAll();
        if (updated?.unique_id) setSelectedId(updated.unique_id);
    };

    const handleDeleted = async (deletedItem) => {
        const list = await loadAll();
        if (selectedId === deletedItem.unique_id) {
            setSelectedId(list[0]?.unique_id || null);
        }
    };

    return (
        <Box>
            <HStack justify="space-between" align="baseline" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">
                    Governance
                </Heading>
                <Text fontSize="sm" color="gray.500">
                    {items.length} item{items.length === 1 ? '' : 's'}
                </Text>
            </HStack>

            {error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            <Flex gap={6} align="flex-start">
                <Box flex="1" minW="0">
                    {loading ? (
                        <HStack p={4} color="gray.600" fontSize="sm">
                            <Spinner size="sm" color="teal.500" />
                            <Text>Loading governance…</Text>
                        </HStack>
                    ) : (
                        <GovernanceList
                            items={items}
                            selectedId={selectedId}
                            onSelect={(item) => setSelectedId(item.unique_id)}
                            onAdd={handleAddClick}
                            emptyMessage="No governance items yet. Click Add Governance to begin tracking."
                        />
                    )}
                </Box>

                <Box flex="2" minW="0">
                    <GovernanceDetailPanel
                        item={selectedItem}
                        onAfterEdit={handleEdited}
                        onAfterDelete={handleDeleted}
                    />
                </Box>
            </Flex>

            <GovernanceTypePicker
                isOpen={typePicker.isOpen}
                onClose={typePicker.onClose}
                onPick={handlePickType}
            />

            <GovernanceForm
                isOpen={createForm.isOpen}
                onClose={createForm.onClose}
                governanceType={pendingType}
                onSaved={handleCreated}
            />
        </Box>
    );
}

export default GovernanceMasterContainer;
