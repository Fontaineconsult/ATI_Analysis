import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Flex,
    Select,
    Tag,
    TagCloseButton,
    TagLabel,
    Text,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { STEWARDSHIP_CAPACITIES, HOLDER_TYPES } from './assetConfig';
import { fetchDepartments, fetchColleges } from '../../../services/api/get';
import { assignStewardToAsset, unassignStewardFromAsset } from '../../../services/api/put';

/**
 * One §508 stewardship capacity (procured/developed/maintained/used). Shows the
 * currently-assigned holders (Person or OrgUnit, tagged) and a Person|Org-Unit
 * toggle + select to assign more. Unassign uses each holder's own type, not the
 * toggle, since a capacity can hold both kinds at once.
 */
function CapacityRow({ assetIdentifier, capacity, holders, people, orgUnits, onChanged }) {
    const toast = useToast();
    const [holderType, setHolderType] = useState('person');
    const [selected, setSelected] = useState('');
    const [busy, setBusy] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const candidates = holderType === 'person' ? people : orgUnits;
    const assignedIds = useMemo(() => new Set((holders || []).map((h) => h.unique_id)), [holders]);
    const available = useMemo(() => candidates.filter((c) => !assignedIds.has(c.unique_id)), [candidates, assignedIds]);

    const handleAssign = async () => {
        if (!selected) return;
        setBusy(true);
        try {
            await assignStewardToAsset(assetIdentifier, capacity.key, holderType, selected);
            setSelected('');
            if (onChanged) await onChanged();
        } catch (e) {
            toast({ title: 'Assign failed', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async (holder) => {
        setRemovingId(holder.unique_id);
        try {
            const ht = holder.type === 'org_unit' ? 'org_unit' : 'person';
            await unassignStewardFromAsset(assetIdentifier, capacity.key, ht, holder.unique_id);
            if (onChanged) await onChanged();
        } catch (e) {
            toast({ title: 'Remove failed', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Box>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={1}>
                {capacity.label}
            </Text>

            {(holders || []).length === 0 ? (
                <Text fontSize="sm" color="gray.400" fontStyle="italic" mb={2}>None assigned.</Text>
            ) : (
                <Wrap spacing={2} mb={2}>
                    {holders.map((h) => (
                        <WrapItem key={`${h.type}-${h.unique_id}`}>
                            <Tag size="md" colorScheme={h.type === 'org_unit' ? 'blue' : 'teal'} variant="subtle">
                                <TagLabel>{h.name}{h.type === 'org_unit' ? ' (unit)' : ''}</TagLabel>
                                <TagCloseButton
                                    onClick={() => handleRemove(h)}
                                    isDisabled={removingId !== null}
                                />
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            )}

            <Flex gap={2}>
                <ButtonGroup isAttached size="xs" variant="outline">
                    {HOLDER_TYPES.map((ht) => (
                        <Button
                            key={ht.key}
                            colorScheme={holderType === ht.key ? 'teal' : 'gray'}
                            variant={holderType === ht.key ? 'solid' : 'outline'}
                            onClick={() => { setHolderType(ht.key); setSelected(''); }}
                        >
                            {ht.label}
                        </Button>
                    ))}
                </ButtonGroup>
                <Select
                    size="xs"
                    placeholder={`Select ${holderType === 'person' ? 'person' : 'org unit'}…`}
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    isDisabled={busy || available.length === 0}
                    flex="1"
                >
                    {available.map((c) => <option key={c.unique_id} value={c.unique_id}>{c.name}</option>)}
                </Select>
                <Button size="xs" colorScheme="teal" onClick={handleAssign} isLoading={busy} isDisabled={!selected}>
                    Assign
                </Button>
            </Flex>
        </Box>
    );
}

/**
 * §508 stewardship editor — the four capacities for one asset. Person candidates
 * come from UserContext; org-unit candidates merge Departments + Colleges (both
 * inherit OrgUnit server-side).
 */
function StewardshipCard({ asset, onChanged }) {
    const userCtx = useContext(UserContext);
    const people = useMemo(
        () => (userCtx?.individuals || []).map((p) => ({ unique_id: p.unique_id, name: p.name })),
        [userCtx],
    );
    const [orgUnits, setOrgUnits] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [deps, cols] = await Promise.all([fetchDepartments(), fetchColleges()]);
                const merged = [...((deps?.data) || []), ...((cols?.data) || [])]
                    .map((u) => ({ unique_id: u.unique_id, name: u.name }));
                if (!cancelled) setOrgUnits(merged);
            } catch (_) { /* non-fatal */ }
        })();
        return () => { cancelled = true; };
    }, []);

    const stewardship = asset?.stewardship || {};

    return (
        <VStack align="stretch" spacing={4}>
            {STEWARDSHIP_CAPACITIES.map((cap) => (
                <CapacityRow
                    key={cap.key}
                    assetIdentifier={asset.asset_identifier}
                    capacity={cap}
                    holders={stewardship[cap.key] || []}
                    people={people}
                    orgUnits={orgUnits}
                    onChanged={onChanged}
                />
            ))}
        </VStack>
    );
}

export default StewardshipCard;
