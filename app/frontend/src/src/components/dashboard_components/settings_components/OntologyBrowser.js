import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { fetchOntology, fetchOntologyHealth } from '../../../services/api/get';
import OntologyStatStrip from '../../graph_components/ontology/OntologyStatStrip';
import OntologyList from '../../graph_components/ontology/OntologyList';
import OntologyDetailPanel from '../../graph_components/ontology/OntologyDetailPanel';
import { HelpTip } from '../../functional_components/DescriptorHelp';

/**
 * Ontology Browser — a Settings section that DISPLAYS the assembled ontology and surfaces
 * its description coverage / drift. Read-only here: authoring lives in "Ontology Descriptions"
 * (descriptors) and the Governance → Principles tab. Reuses the shared backend the MCP server
 * exposes (GET /ontology, /ontology/health), so the browser and the agent see one ontology.
 *
 * Diagnostic-first (design-sense §1.1): the stat strip leads with what is UNDESCRIBED, and
 * the list flags gaps per node type.
 */
function OntologyBrowser() {
    const [ontology, setOntology] = useState(null);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState(null);

    // Initial load shows the spinner; refreshes (after an edit) update in place silently.
    const load = useCallback(async ({ initial = false } = {}) => {
        if (initial) setLoading(true);
        setError(null);
        try {
            const [ont, hlth] = await Promise.all([fetchOntology(), fetchOntologyHealth()]);
            setOntology(ont?.data || null);
            setHealth(hlth?.data || null);
        } catch (e) {
            setError(e?.message || 'Failed to load the ontology.');
        } finally {
            if (initial) setLoading(false);
        }
    }, []);

    useEffect(() => { load({ initial: true }); }, [load]);

    const nodeTypes = useMemo(() => ontology?.node_types || [], [ontology]);
    const selected = useMemo(
        () => nodeTypes.find((nt) => nt.label === selectedLabel) || null,
        [nodeTypes, selectedLabel],
    );

    return (
        <Box>
            <HStack justify="space-between" align="baseline" mb={1}>
                <HStack spacing={1} align="center">
                    <Heading as="h2" size="lg" color="gray.800">Ontology Browser</Heading>
                    <HelpTip nodeType="UniversalDescriptor" />
                </HStack>
                {ontology && (
                    <Text fontSize="sm" color="gray.600">
                        {ontology.counts.node_types} node types · {ontology.counts.relationship_types} relationships
                    </Text>
                )}
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={4}>
                The schema joined to its descriptions and the principles that shape it. Authoring lives in
                Ontology Descriptions and Governance → Principles.
            </Text>

            {error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            <OntologyStatStrip health={health} loading={loading} />

            {loading ? (
                <HStack p={4} color="gray.600" fontSize="sm">
                    <Spinner size="sm" color="teal.500" />
                    <Text>Loading the ontology…</Text>
                </HStack>
            ) : (
                <Flex gap={6} align="flex-start">
                    <Box flex="1" minW="0" maxW="420px">
                        <OntologyList
                            nodeTypes={nodeTypes}
                            selectedLabel={selectedLabel}
                            onSelect={(nt) => setSelectedLabel(nt.label)}
                        />
                    </Box>
                    <Box flex="2" minW="0">
                        <OntologyDetailPanel nodeType={selected} onChanged={load} />
                    </Box>
                </Flex>
            )}
        </Box>
    );
}

export default OntologyBrowser;
