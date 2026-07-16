import React, { useEffect, useMemo, useState } from 'react';
import { VStack, Box, Heading, HStack, Spinner, Text } from '@chakra-ui/react';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import { fetchAllInterfaces, fetchAllTools } from '../../../services/api/get';
import {
    assignRemediationToInterface,
    unassignRemediationFromInterface,
    assignUsageToTool,
    unassignUsageFromTool,
} from '../../../services/api/put';

// Unwrap a list endpoint's response envelope ({status, data:{items}} or {status, data:[...]}).
const items = (resp) => resp?.data?.items || resp?.data || [];

/**
 * Manage what an implementation applies to, from the implementation side — the inverse mount
 * of the entity-side flows. Lets you link/unlink the Interfaces it remediates
 * (remediates_interface) and the Tools it uses (uses_tool); the Assets shown on the panel are
 * derived from the interfaces (presented_by), so there is no direct asset edge to manage here.
 *
 * Props:
 *   implementationType / implementationUniqueId — identify this implementation for the edges.
 *   interfaces / tools — the implementation's CURRENT links (from its serialization).
 *   onChanged() — refetch hook; called after every successful attach/detach.
 */
function ImplementationRemediationManager({
    implementationType,
    implementationUniqueId,
    interfaces = [],
    tools = [],
    onChanged,
}) {
    const [allInterfaces, setAllInterfaces] = useState([]);
    const [allTools, setAllTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [ifaces, tls] = await Promise.all([fetchAllInterfaces(), fetchAllTools()]);
                if (!active) return;
                setAllInterfaces(items(ifaces));
                setAllTools(items(tls));
            } catch (e) {
                if (active) setError(e?.message || 'Failed to load interfaces and tools.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    // EntityAttachmentSelector matches attached vs candidates by unique_id, but the link
    // services key on the business identifier — so map {unique_id -> identifier}.
    const ifaceOpts = (arr) => arr.map((i) => ({
        unique_id: i.unique_id, label: i.title || i.interface_identifier, identifier: i.interface_identifier,
    }));
    const toolOpts = (arr) => arr.map((t) => ({
        unique_id: t.unique_id, label: t.title || t.tool_identifier, identifier: t.tool_identifier,
    }));

    const ifaceAttached = useMemo(() => ifaceOpts(interfaces), [interfaces]);
    const ifaceCandidates = useMemo(() => ifaceOpts(allInterfaces), [allInterfaces]);
    const ifaceId = useMemo(() => {
        const m = {};
        [...ifaceCandidates, ...ifaceAttached].forEach((i) => { m[i.unique_id] = i.identifier; });
        return m;
    }, [ifaceCandidates, ifaceAttached]);

    const toolAttached = useMemo(() => toolOpts(tools), [tools]);
    const toolCandidates = useMemo(() => toolOpts(allTools), [allTools]);
    const toolId = useMemo(() => {
        const m = {};
        [...toolCandidates, ...toolAttached].forEach((t) => { m[t.unique_id] = t.identifier; });
        return m;
    }, [toolCandidates, toolAttached]);

    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" />
                <Text>Loading interfaces and tools…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Text fontSize="sm" color="red.600">{error}</Text>;
    }

    return (
        <VStack align="stretch" spacing={6}>
            <Box>
                <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
                    Interfaces it remediates
                </Heading>
                <Text fontSize="xs" color="gray.600" mb={3}>
                    The salient surfaces this implementation remediates. The assets shown on the panel are derived
                    from these via the interface’s backing asset.
                </Text>
                <EntityAttachmentSelector
                    attached={ifaceAttached}
                    candidates={ifaceCandidates}
                    entityLabel="Interface"
                    placeholder="Select an interface to remediate…"
                    attachLabel="Link"
                    detachLabel="Unlink"
                    emptyLabel="This implementation does not remediate any interface yet."
                    onAttach={(uid) => assignRemediationToInterface(ifaceId[uid], implementationType, implementationUniqueId)}
                    onDetach={(uid) => unassignRemediationFromInterface(ifaceId[uid], implementationType, implementationUniqueId)}
                    afterChange={onChanged}
                />
            </Box>

            <Box>
                <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
                    Tools it uses
                </Heading>
                <Text fontSize="xs" color="gray.600" mb={3}>
                    The instruments this implementation uses to do the remediation work (scanners, captioning services, …).
                </Text>
                <EntityAttachmentSelector
                    attached={toolAttached}
                    candidates={toolCandidates}
                    entityLabel="Tool"
                    placeholder="Select a tool…"
                    attachLabel="Link"
                    detachLabel="Unlink"
                    emptyLabel="This implementation does not use any tool yet."
                    onAttach={(uid) => assignUsageToTool(toolId[uid], implementationType, implementationUniqueId)}
                    onDetach={(uid) => unassignUsageFromTool(toolId[uid], implementationType, implementationUniqueId)}
                    afterChange={onChanged}
                />
            </Box>
        </VStack>
    );
}

export default ImplementationRemediationManager;
