import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Flex,
    Heading,
    HStack,
    Spinner,
    Text,
} from '@chakra-ui/react';
import { UserContext } from '../../context/UserContext';
import { fetchPersonImplementationDetails } from '../../services/api/get';
import PeopleList from '../graph_components/people/PeopleList';
import PersonDetailPanel from '../graph_components/people/PersonDetailPanel';

/**
 * People category for the ATI Explorer. Two-column layout (1/3 + 2/3).
 *
 * Left:  selectable list of active people (sourced from UserContext.individuals).
 * Right: detail panel for the selected person — current YSE assignments with
 *        attached implementation nodes, plus the assignment selector to add
 *        more YSEs.
 *
 * Owns:
 *   - Selection state (which person is active).
 *   - Detail fetch keyed on employee_id.
 *   - Refresh wiring: assignment changes call back through onChange, which
 *     re-runs the detail fetch.
 */
function PeopleMasterContainer() {
    const { individuals, loadAllIndividuals } = useContext(UserContext);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // Ensure individuals are loaded (UserContext loads on mount, but the
    // explorer can be deep-linked).
    useEffect(() => {
        if (!individuals) loadAllIndividuals();
    }, [individuals, loadAllIndividuals]);

    const activePeople = useMemo(() => {
        if (!Array.isArray(individuals)) return [];
        return individuals
            .filter((p) => p.active === true)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [individuals]);

    const loadDetail = useCallback(async (employeeId) => {
        if (!employeeId) return;
        setDetailLoading(true);
        setDetailError(null);
        try {
            const response = await fetchPersonImplementationDetails(employeeId);
            setDetail(response?.data?.person || null);
        } catch (error) {
            setDetailError(error?.message || 'Failed to load person details.');
            setDetail(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const handleSelect = useCallback((person) => {
        setSelectedPerson(person);
        loadDetail(person?.employee_id);
    }, [loadDetail]);

    const handleDetailChange = useCallback(async () => {
        if (selectedPerson?.employee_id) {
            await loadDetail(selectedPerson.employee_id);
        }
    }, [selectedPerson, loadDetail]);

    return (
        <Box>
            <HStack justify="space-between" align="baseline" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">
                    People
                </Heading>
                <Text fontSize="sm" color="gray.500">
                    {activePeople.length} active
                </Text>
            </HStack>

            <Flex gap={6} align="flex-start">
                {/* Left: 1/3 */}
                <Box flex="1" minW="0">
                    <PeopleList
                        people={activePeople}
                        selectedId={selectedPerson?.unique_id || null}
                        onSelect={handleSelect}
                        emptyMessage="No active people."
                    />
                </Box>

                {/* Right: 2/3 */}
                <Box flex="2" minW="0">
                    {detailLoading && (
                        <HStack p={4} color="gray.600" fontSize="sm">
                            <Spinner size="sm" color="teal.500" />
                            <Text>Loading {selectedPerson?.name || 'person'} details…</Text>
                        </HStack>
                    )}
                    {detailError && (
                        <Alert status="error" borderRadius="md" fontSize="sm">
                            <AlertIcon />
                            {detailError}
                        </Alert>
                    )}
                    {!detailLoading && !detailError && (
                        <PersonDetailPanel person={detail} onChange={handleDetailChange} />
                    )}
                </Box>
            </Flex>
        </Box>
    );
}

export default PeopleMasterContainer;
