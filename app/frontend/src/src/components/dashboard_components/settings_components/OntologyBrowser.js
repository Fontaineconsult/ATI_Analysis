import React, { useCallback, useMemo, useState } from 'react';
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
import useResource from '../../../hooks/useResource';
import { KEYS } from '../../../context/resourceKeys';
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
    const [selectedLabel, setSelectedLabel] = useState(null);

    // The tree and its health report are two keys, refreshed together after an
    // edit. The old "initial" flag distinguished first load from silent refresh;
    // the cache does that on its own — a refresh keeps the previous value on
    // screen and swaps it when the new one lands.
    const { data: ontologyResp, loading, error, reload: reloadOntology } = useResource(
        KEYS.ontologyTree, fetchOntology,
    );
    const { data: healthResp, reload: reloadHealth } = useResource(
        KEYS.ontologyHealth, fetchOntologyHealth,
    );
    const ontology = ontologyResp?.data || null;
    const health = healthResp?.data || null;

    const load = useCallback(async () => {
        await Promise.all([reloadOntology(), reloadHealth()]);
    }, [reloadOntology, reloadHealth]);

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
