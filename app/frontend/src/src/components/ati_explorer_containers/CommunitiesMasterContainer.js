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
import { fetchAllCommunities } from '../../services/api/get';
import CommunityList from '../graph_components/people/CommunityList';
import CommunityDetailPanel from '../graph_components/people/CommunityDetailPanel';
import CommunitiesStatStrip from '../graph_components/people/CommunitiesStatStrip';
import CommunityForm from '../graph_components/people/CommunityForm';
import { filterCommunities, summarizeCommunities } from '../graph_components/people/peopleConfig';

/**
 * Communities tab of the People area. Canon shell: heading → diagnostic stat
 * strip (empty-communities tile filters) → 1:2 master-detail. Selection is
 * hybrid state + router (people/communities/:communityId = unique_id, applied
 * once on arrival). The detail panel fetches its own community and manages
 * membership; this container owns the list, filter, and add/edit modal flow.
 */
function CommunitiesMasterContainer() {
    const { campus, communityId } = useParams();
    const navigate = useNavigate();
    const { individuals, loadAllIndividuals } = useContext(UserContext);
    const [communities, setCommunities] = useState(null);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [editTarget, setEditTarget] = useState(null);
    const addModal = useDisclosure();
    const editModal = useDisclosure();

    useEffect(() => {
        if (!individuals) loadAllIndividuals();
    }, [individuals, loadAllIndividuals]);

    const loadCommunities = useCallback(async () => {
        setError(null);
        try {
            const response = await fetchAllCommunities();
            const items = response?.data?.items || [];
            setCommunities(items);
            return items;
        } catch (e) {
            setError(e?.message || 'Failed to load communities.');
            setCommunities([]);
            return [];
        }
    }, []);

    useEffect(() => { loadCommunities(); }, [loadCommunities]);

    const activePeople = useMemo(() => {
        if (!Array.isArray(individuals)) return [];
        return individuals.filter((p) => p.active === true);
    }, [individuals]);

    const stats = useMemo(
        () => summarizeCommunities(communities || [], activePeople),
        [communities, activePeople],
    );
    const visibleCommunities = useMemo(
        () => filterCommunities(communities || [], activeFilter),
        [communities, activeFilter],
    );

    const handleSelect = useCallback((community) => {
        setSelectedId(community?.unique_id || null);
        if (campus && community?.unique_id) {
            navigate(`/${campus}/ati-explorer/people/communities/${community.unique_id}`, { replace: true });
        }
    }, [campus, navigate]);

    // Apply the URL deep-link ONCE (on arrival), then let interaction drive state.
    const appliedDeepLink = useRef(false);
    useEffect(() => {
        if (appliedDeepLink.current) return;
        if (!communityId) {
            appliedDeepLink.current = true;
            return;
        }
        if ((communities || []).some((c) => c.unique_id === communityId)) {
            appliedDeepLink.current = true;
            setSelectedId(communityId);
        }
        // else: list not loaded yet — effect re-runs when communities changes
    }, [communityId, communities]);

    const handleDeleted = useCallback(() => {
        setSelectedId(null);
        if (campus) navigate(`/${campus}/ati-explorer/people/communities`, { replace: true });
    }, [campus, navigate]);

    const openEdit = useCallback((detail) => {
        setEditTarget(detail);
        editModal.onOpen();
    }, [editModal]);

    const handleSaved = useCallback(async (saved) => {
        await loadCommunities();
        if (saved?.unique_id && !selectedId) handleSelect(saved);
    }, [loadCommunities, selectedId, handleSelect]);

    const loading = communities === null;

    return (
        <Box>
            <Heading as="h2" size="lg" color="gray.800" mb={4}>Communities of Practice</Heading>

            <CommunitiesStatStrip
                total={stats.total}
                peopleInCommunity={stats.peopleInCommunity}
                emptyCommunities={stats.emptyCommunities}
                peopleInNone={stats.peopleInNone}
                loading={loading || !individuals}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            {error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            <Flex gap={6} align="flex-start">
                {/* Left: 1/3 */}
                <Box flex="1" minW="0" maxW="420px">
                    {loading ? (
                        <HStack p={4} color="gray.600" fontSize="sm">
                            <Spinner size="sm" color="teal.500" />
                            <Text>Loading communities…</Text>
                        </HStack>
                    ) : (
                        <CommunityList
                            communities={visibleCommunities}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            onAdd={addModal.onOpen}
                            emptyMessage={
                                activeFilter === 'all'
                                    ? 'No communities yet.'
                                    : 'No communities match this filter.'
                            }
                        />
                    )}
                </Box>

                {/* Right: 2/3 */}
                <Box flex="2" minW="0">
                    <CommunityDetailPanel
                        communityId={selectedId}
                        onAfterChange={loadCommunities}
                        onEdit={openEdit}
                        onDeleted={handleDeleted}
                    />
                </Box>
            </Flex>

            <CommunityForm
                isOpen={addModal.isOpen}
                onClose={addModal.onClose}
                onSaved={handleSaved}
            />
            <CommunityForm
                isOpen={editModal.isOpen}
                onClose={editModal.onClose}
                existingCommunity={editTarget}
                onSaved={handleSaved}
            />
        </Box>
    );
}

export default CommunitiesMasterContainer;
