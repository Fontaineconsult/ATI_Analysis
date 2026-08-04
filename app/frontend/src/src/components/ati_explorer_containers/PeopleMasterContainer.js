import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { UserContext } from '../../context/UserContext';
import { fetchPersonImplementationDetails } from '../../services/api/get';
import PeopleList from '../graph_components/people/PeopleList';
import PersonDetailPanel from '../graph_components/people/PersonDetailPanel';
import PeopleStatStrip from '../graph_components/people/PeopleStatStrip';
import PersonForm from '../graph_components/people/PersonForm';
import { filterPeople, summarizePeople } from '../graph_components/people/peopleConfig';

/**
 * People category for the ATI Explorer. Canon area shell (design-sense §3.1):
 * heading → diagnostic stat strip (tiles double as roster filters) → 1:2
 * master-detail. Selection is hybrid state + router (the ImplementationsArea
 * idiom): the URL mirrors the selected person's employee_id with
 * `replace: true`, and a deep link is applied once on arrival.
 *
 * Owns:
 *   - Selection state + URL mirroring (people/:personId = employee_id).
 *   - The stat-strip filter, so tile counts agree with the visible list.
 *   - Detail fetch keyed on employee_id; refresh wiring after any mutation.
 *   - The add/edit PersonForm modal flow.
 */
function PeopleMasterContainer() {
    const { campus, personId } = useParams();
    const navigate = useNavigate();
    const { individuals, loadAllIndividuals, refreshAllIndividuals } = useContext(UserContext);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const addModal = useDisclosure();
    const editModal = useDisclosure();

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

    const stats = useMemo(() => summarizePeople(activePeople), [activePeople]);
    const visiblePeople = useMemo(
        () => filterPeople(activePeople, activeFilter),
        [activePeople, activeFilter],
    );

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
        if (campus && person?.employee_id) {
            navigate(
                `/${campus}/ati-explorer/people/${encodeURIComponent(person.employee_id)}`,
                { replace: true },
            );
        }
    }, [campus, navigate, loadDetail]);

    // Apply the URL deep-link ONCE (on arrival), then let interaction drive
    // state — otherwise our own navigate() on each click would re-run it.
    const appliedDeepLink = useRef(false);
    useEffect(() => {
        if (appliedDeepLink.current) return;
        if (!personId) {
            appliedDeepLink.current = true;
            return;
        }
        const person = activePeople.find((p) => p.employee_id === personId);
        if (person) {
            appliedDeepLink.current = true;
            setSelectedPerson(person);
            loadDetail(person.employee_id);
        }
        // else: roster not loaded yet — effect re-runs when activePeople changes
    }, [personId, activePeople, loadDetail]);

    const handleDetailChange = useCallback(async () => {
        if (selectedPerson?.employee_id) {
            await loadDetail(selectedPerson.employee_id);
        }
    }, [selectedPerson, loadDetail]);

    // After a create/edit save: refresh the roster; re-fetch the open detail so
    // header fields (name, campus, working groups) reflect the edit.
    const handleSaved = useCallback(async (employeeId) => {
        await refreshAllIndividuals();
        if (employeeId && selectedPerson?.employee_id === employeeId) {
            await loadDetail(employeeId);
        }
    }, [refreshAllIndividuals, selectedPerson, loadDetail]);

    return (
        <Box>
            <Heading as="h2" size="lg" color="gray.800" mb={4}>People</Heading>

            <PeopleStatStrip
                total={stats.total}
                approvers={stats.approvers}
                noWorkingGroup={stats.noWorkingGroup}
                roleNotInPd={stats.roleNotInPd}
                loading={!individuals}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            <Flex gap={6} align="flex-start">
                {/* Left: 1/3 */}
                <Box flex="1" minW="0" maxW="420px">
                    <PeopleList
                        people={visiblePeople}
                        selectedId={selectedPerson?.unique_id || null}
                        onSelect={handleSelect}
                        onAdd={addModal.onOpen}
                        emptyMessage={
                            activeFilter === 'all'
                                ? 'No active people.'
                                : 'No people match this filter.'
                        }
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
                        <PersonDetailPanel
                            person={detail}
                            onChange={handleDetailChange}
                            onEdit={editModal.onOpen}
                        />
                    )}
                </Box>
            </Flex>

            <PersonForm
                isOpen={addModal.isOpen}
                onClose={addModal.onClose}
                onSaved={handleSaved}
            />
            <PersonForm
                isOpen={editModal.isOpen}
                onClose={editModal.onClose}
                existingPerson={detail || selectedPerson}
                onSaved={handleSaved}
            />
        </Box>
    );
}

export default PeopleMasterContainer;
