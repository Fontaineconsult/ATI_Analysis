import React, { useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    IconButton,
    Input,
    Select,
    Switch,
    Text,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { fetchAllRoles } from '../../../services/api/get';
import { setPersonRoleHoldings } from '../../../services/api/put';

/**
 * The person's TOTAL roles — every role they HOLD or have PARTICIPATED in (via the
 * implementations they worked on). Each row carries the position-description (PD) flag.
 *
 * The point of the view: a role the person actually does (held or worked) that is NOT in
 * their PD is flagged ⚠ — the invisible-labor signal. Turning "In PD" on for a worked-but-
 * unheld role formalizes it (creates a holding). Participation counts are read-only context
 * here (managed on the implementation's Participants control). Save persists the held set
 * (replace-semantics).
 *
 * Props: employeeId, roles (held, from person.roles), participatedRoleHandles (flat list of
 * role handles from the person's worked_on edges), onChange() (refetch).
 */
function RoleHoldingsEditor({ employeeId, roles = [], participatedRoleHandles = [], onChange }) {
    const toast = useToast();
    const [catalog, setCatalog] = useState([]);
    const [rows, setRows] = useState([]);
    const [picker, setPicker] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const resp = await fetchAllRoles();
                if (!cancelled) setCatalog(resp?.data?.items || []);
            } catch (_) { /* non-fatal */ }
        })();
        return () => { cancelled = true; };
    }, []);

    // Build the combined list from held ∪ participated, with participation counts.
    useEffect(() => {
        const nameByHandle = new Map(catalog.map((r) => [r.handle, r.name]));
        const heldByHandle = new Map((roles || []).map((r) => [r.handle, r]));
        const workCount = {};
        (participatedRoleHandles || []).forEach((h) => { workCount[h] = (workCount[h] || 0) + 1; });

        const handles = new Set([...heldByHandle.keys(), ...Object.keys(workCount)]);
        const built = [...handles].map((h) => {
            const held = heldByHandle.get(h);
            return {
                role_handle: h,
                name: held?.name || nameByHandle.get(h) || h,
                held: !!held,
                in_position_description: held ? !!held.in_position_description : false,
                pd_description: held?.pd_description || '',
                work_count: workCount[h] || 0,
            };
        });
        built.sort((a, b) =>
            (Number(b.held) - Number(a.held)) || (b.work_count - a.work_count) || a.name.localeCompare(b.name));
        setRows(built);
    }, [roles, participatedRoleHandles, catalog]);

    const present = useMemo(() => new Set(rows.map((r) => r.role_handle)), [rows]);
    const available = useMemo(() => catalog.filter((o) => !present.has(o.handle)), [catalog, present]);

    const updateRow = (handle, patch) =>
        setRows((prev) => prev.map((r) => (r.role_handle === handle ? { ...r, ...patch } : r)));

    // Turning "In PD" on for a worked-but-unheld role formalizes it (it becomes held).
    const togglePd = (row, checked) =>
        updateRow(row.role_handle, { in_position_description: checked, held: row.held || checked });

    // Drop the holding. A worked role stays as read-only context; a manually-added role leaves.
    const unhold = (row) => {
        if (row.work_count > 0) {
            updateRow(row.role_handle, { held: false, in_position_description: false, pd_description: '' });
        } else {
            setRows((prev) => prev.filter((r) => r.role_handle !== row.role_handle));
        }
    };

    const addRole = () => {
        const opt = catalog.find((o) => o.handle === picker);
        if (!opt) return;
        setRows((prev) => [...prev, {
            role_handle: opt.handle, name: opt.name, held: true, in_position_description: false, pd_description: '', work_count: 0,
        }]);
        setPicker('');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const held = rows.filter((r) => r.held);
            await setPersonRoleHoldings(employeeId, held.map((r) => ({
                role_handle: r.role_handle,
                in_position_description: r.in_position_description,
                pd_description: r.pd_description?.trim() || null,
            })));
            toast({ title: 'Roles saved', status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
            if (onChange) await onChange();
        } catch (e) {
            toast({ title: 'Failed to save roles', description: e?.message, status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <VStack align="stretch" spacing={3}>
            <Text fontSize="2xs" color="gray.600">
                Every role this person holds or has worked in. Flag whether each is in their position description — roles done but not in the PD are the invisible-labor signal.
            </Text>

            {rows.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">No roles held or worked in yet.</Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {rows.map((r) => {
                        const doingNotInPd = (r.held || r.work_count > 0) && !r.in_position_description;
                        return (
                            <Box key={r.role_handle} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50" p={3}>
                                <HStack justify="space-between" align="start">
                                    <HStack spacing={2} flexWrap="wrap" minW="0">
                                        <Text fontSize="sm" fontWeight="semibold" color="gray.800">{r.name}</Text>
                                        {r.held && <Badge colorScheme="teal" variant="subtle" fontSize="2xs">held</Badge>}
                                        {r.work_count > 0 && (
                                            <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                                                × {r.work_count} work{r.work_count === 1 ? '' : 's'}
                                            </Badge>
                                        )}
                                        {doingNotInPd && (
                                            <Badge colorScheme="orange" variant="subtle" fontSize="2xs"
                                                   title="Does this role but it is not in their position description — invisible accessibility labor">
                                                ⚠ not in PD
                                            </Badge>
                                        )}
                                    </HStack>
                                    <HStack spacing={3} flexShrink={0}>
                                        <HStack spacing={1}>
                                            <Text fontSize="2xs" color="gray.600" fontWeight="semibold" textTransform="uppercase">In PD</Text>
                                            <Switch size="sm" colorScheme="teal" isChecked={r.in_position_description}
                                                    onChange={(e) => togglePd(r, e.target.checked)} />
                                        </HStack>
                                        {r.held && (
                                            <IconButton aria-label="Remove holding" icon={<CloseIcon boxSize={2} />} size="xs"
                                                        variant="ghost" colorScheme="red" onClick={() => unhold(r)} />
                                        )}
                                    </HStack>
                                </HStack>
                                {r.held && (
                                    <Input
                                        mt={2}
                                        size="sm"
                                        bg="white"
                                        placeholder="How does the PD address it? (or note that it doesn't)"
                                        value={r.pd_description}
                                        onChange={(e) => updateRow(r.role_handle, { pd_description: e.target.value })}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </VStack>
            )}

            <Flex gap={2}>
                <Select size="sm" placeholder="Add another role…" value={picker}
                        onChange={(e) => setPicker(e.target.value)} isDisabled={available.length === 0}>
                    {available.map((o) => <option key={o.handle} value={o.handle}>{o.name}</option>)}
                </Select>
                <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={addRole} isDisabled={!picker}>
                    Add
                </Button>
            </Flex>

            <Flex justify="flex-end">
                <Button size="sm" colorScheme="teal" onClick={handleSave} isLoading={saving} loadingText="Saving…">
                    Save roles
                </Button>
            </Flex>
        </VStack>
    );
}

export default RoleHoldingsEditor;
