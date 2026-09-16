import React, { useCallback, useEffect, useState } from 'react';
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
import { fetchIntellectualSource } from '../../services/api/get';
import IntellectualSourceList from '../graph_components/intellectual_sources/IntellectualSourceList';
import IntellectualSourceDetailPanel from '../graph_components/intellectual_sources/IntellectualSourceDetailPanel';
import IntellectualSourceForm from '../graph_components/intellectual_sources/IntellectualSourceForm';

/**
 * Intellectual sources master-detail, rendered inside the Governance area's third tab.
 * Selection is URL-driven on unique_id, matching the governance tab.
 *
 * Unlike PrincipleMasterContainer, the selected item is fetched rather than picked out of
 * the context list: the list read carries only edge COUNTS, so the detail panel's blocks
 * (`sources`, `informed_implementations`) need the single-item read. The list row is used
 * as an immediate placeholder so the panel does not flash empty while that lands.
 */
function IntellectualSourceMasterContainer() {
    const { campus, sourceId } = useParams();
    const navigate = useNavigate();
    const { intellectualSources, loading, error, reload } = useMetaScaffold();
    const createForm = useDisclosure();

    const [detail, setDetail] = useState(null);
    const [detailError, setDetailError] = useState(null);

    const basePath = `/${campus}/ati-explorer/intellectual-sources`;
    const listRow = sourceId
        ? intellectualSources.find((s) => s.unique_id === sourceId) || null
        : null;

    const loadDetail = useCallback(async (uid) => {
        if (!uid) { setDetail(null); setDetailError(null); return; }
        try {
            const response = await fetchIntellectualSource(uid);
            setDetail(response?.data || null);
            setDetailError(null);
        } catch (e) {
            // A failed detail read leaves the list row showing rather than an empty panel,
            // so the name and description stay readable while the edges are missing.
            setDetail(null);
            setDetailError(e?.message || 'Could not load this source.');
        }
    }, []);

    useEffect(() => { loadDetail(sourceId); }, [sourceId, loadDetail]);

    const goTo = (uid) => navigate(uid ? `${basePath}/${uid}` : basePath);

    const handleCreated = async (created) => {
        await reload();
        if (created?.unique_id) goTo(created.unique_id);
    };
    const handleEdited = async (updated) => {
        await reload();
        const uid = updated?.unique_id || sourceId;
        await loadDetail(uid);
    };
    const handleDeleted = async () => {
        await reload();
        goTo(null);
    };

    return (
        <Box>
            <HStack justify="space-between" align="baseline" mb={1}>
                <Heading as="h2" size="lg" color="gray.800">Intellectual Sources</Heading>
                <Text fontSize="sm" color="gray.600">
                    {intellectualSources.length} item{intellectualSources.length === 1 ? '' : 's'}
                </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={4}>
                Thinking the campus draws on when authoring an implementation, or when an existing
                one turns out to be behind what the field knows. Nothing here carries authority.
            </Text>

            {error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />{error}
                </Alert>
            )}
            {detailError && (
                <Alert status="warning" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />{detailError}
                </Alert>
            )}

            <Flex gap={6} align="flex-start">
                <Box flex="1" minW="0">
                    {loading ? (
                        <HStack p={4} color="gray.600" fontSize="sm">
                            <Spinner size="sm" color="pink.500" /><Text>Loading…</Text>
                        </HStack>
                    ) : (
                        <IntellectualSourceList
                            items={intellectualSources}
                            selectedId={sourceId || null}
                            onSelect={(item) => goTo(item.unique_id)}
                            onAdd={createForm.onOpen}
                            emptyMessage="No intellectual sources yet. Click Add Intellectual Source to begin."
                        />
                    )}
                </Box>

                <Box flex="2" minW="0">
                    <IntellectualSourceDetailPanel
                        item={detail || listRow}
                        onAfterEdit={handleEdited}
                        onAfterDelete={handleDeleted}
                    />
                </Box>
            </Flex>

            <IntellectualSourceForm
                isOpen={createForm.isOpen}
                onClose={createForm.onClose}
                onSaved={handleCreated}
            />
        </Box>
    );
}

export default IntellectualSourceMasterContainer;
