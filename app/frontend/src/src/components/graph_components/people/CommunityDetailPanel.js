import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    Spinner,
    Text,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Input, Select } from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { DataContext } from '../../../context/DataContext';
import { fetchCommunity } from '../../../services/api/get';
import { addCommunityStake, removeCommunityStake, setPersonCommunities } from '../../../services/api/put';
import { deleteCommunity } from '../../../services/api/delete';
import Card from '../common/Card';
import Section from '../common/Section';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import CopyCommunityReportButton from './CopyCommunityReportButton';
import { personCommunities } from './peopleConfig';

/**
 * Right-column detail for a community of practice. Fetches its own detail by
 * unique_id (so deep links work before the list loads): identity card with
 * Edit/Delete, campuses represented, then the member roster managed through
 * the shared PersonAssignmentSelector.
 *
 * Membership writes are person-centric (set_communities replaces a PERSON's
 * membership set), so assigning/unassigning here rewrites that person's list
 * with this community added or removed — notes on their other memberships are
 * preserved.
 *
 * Props:
 *   communityId      unique_id of the selected community, or null.
 *   onAfterChange()  Called after any mutation so the container refreshes the
 *                    list (member counts, names).
 *   onEdit(detail)   Opens the edit form pre-filled with the loaded detail.
 *   onDeleted()      Called after a successful delete (clear selection).
 */
function CommunityDetailPanel({ communityId, onAfterChange, onEdit, onDeleted }) {
    const { individuals, refreshAllIndividuals } = useContext(UserContext);
    const { data } = useContext(DataContext);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [stakeKey, setStakeKey] = useState('');
    const [stakeNote, setStakeNote] = useState('');
    const [stakeSaving, setStakeSaving] = useState(false);
    const toast = useToast();

    const loadDetail = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetchCommunity(communityId);
            setDetail(response?.data?.community || null);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Failed to load community.');
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    const activePeople = useMemo(() => {
        if (!Array.isArray(individuals)) return [];
        return individuals
            .filter((p) => p.active === true)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [individuals]);

    const members = useMemo(() => (Array.isArray(detail?.members) ? detail.members : []), [detail]);
    const membersWithNotes = members.filter((m) => m.note);
    const campuses = useMemo(() => {
        const counts = new Map();
        members.forEach((m) => {
            if (m.host_campus) counts.set(m.host_campus, (counts.get(m.host_campus) || 0) + 1);
        });
        return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }, [members]);

    // Rewrite one person's membership set with this community added or removed.
    // set_communities is replace-semantics, so the person's OTHER memberships
    // (and their notes) must be carried over — the full roster provides them
    // (full, not active-only: a member may be inactive and still unassignable).
    const writeMembership = useCallback(async (personUniqueId, include) => {
        const rosterPerson = (Array.isArray(individuals) ? individuals : [])
            .find((p) => p.unique_id === personUniqueId);
        if (!rosterPerson?.employee_id) {
            throw new Error('Cannot resolve this person in the roster — refresh and try again.');
        }
        const current = personCommunities(rosterPerson)
            .map((c) => ({ community_id: c.unique_id, note: c.note }));
        const without = current.filter((c) => c.community_id !== communityId);
        const next = include ? [...without, { community_id: communityId }] : without;
        await setPersonCommunities(rosterPerson.employee_id, next);
    }, [individuals, communityId]);

    const handleAfterChange = useCallback(async () => {
        await Promise.all([loadDetail(), refreshAllIndividuals()]);
        if (onAfterChange) await onAfterChange();
    }, [loadDetail, refreshAllIndividuals, onAfterChange]);

    // Indicator stakes (has_stake_in). The picker is fed from the indicators payload
    // already in DataContext (WG -> goals -> SIs), flattened to composite_key + text;
    // already-staked indicators are excluded from the options.
    const stakes = useMemo(() => (Array.isArray(detail?.stakes) ? detail.stakes : []), [detail]);
    const indicatorOptions = useMemo(() => {
        const staked = new Set(stakes.map((s) => s.composite_key));
        const flat = [];
        (Array.isArray(data?.indicators) ? data.indicators : []).forEach((wg) => {
            (wg.goals || []).forEach((goal) => {
                (goal.successIndicators || []).forEach((si) => {
                    if (si?.composite_key && !staked.has(si.composite_key)) {
                        flat.push({ key: si.composite_key, text: si.success_indicator || '' });
                    }
                });
            });
        });
        return flat.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    }, [data, stakes]);

    const handleAddStake = useCallback(async () => {
        if (!stakeKey) return;
        setStakeSaving(true);
        try {
            await addCommunityStake(communityId, stakeKey, stakeNote || null);
            setStakeKey('');
            setStakeNote('');
            await loadDetail();
            if (onAfterChange) await onAfterChange();
        } catch (e) {
            toast({
                title: 'Failed to add stake.',
                description: e?.response?.data?.error || e?.message,
                status: 'error', duration: 3000, isClosable: true, position: 'top-right',
            });
        } finally {
            setStakeSaving(false);
        }
    }, [communityId, stakeKey, stakeNote, loadDetail, onAfterChange, toast]);

    const handleRemoveStake = useCallback(async (compositeKey) => {
        try {
            await removeCommunityStake(communityId, compositeKey);
            await loadDetail();
            if (onAfterChange) await onAfterChange();
        } catch (e) {
            toast({
                title: 'Failed to remove stake.',
                description: e?.response?.data?.error || e?.message,
                status: 'error', duration: 3000, isClosable: true, position: 'top-right',
            });
        }
    }, [communityId, loadDetail, onAfterChange, toast]);

    const handleDelete = async () => {
        if (!detail) return;
        const ok = window.confirm(
            `Delete the community "${detail.name}"? Membership links are removed; people are untouched.`,
        );
        if (!ok) return;
        setDeleting(true);
        try {
            await deleteCommunity(detail.unique_id);
            toast({ title: 'Community deleted.', status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
            await refreshAllIndividuals();
            if (onAfterChange) await onAfterChange();
            if (onDeleted) onDeleted();
        } catch (e) {
            toast({
                title: 'Delete failed.',
                description: e?.message || 'Please try again.',
                status: 'error', duration: 3000, isClosable: true, position: 'top-right',
            });
        } finally {
            setDeleting(false);
        }
    };

    if (!communityId) {
        return (
            <Box
                p={8}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="lg"
                bg="gray.50"
                textAlign="center"
            >
                <Text color="gray.600" fontSize="sm">
                    Select a community on the left to see its members and campuses.
                </Text>
            </Box>
        );
    }

    if (loading && !detail) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" />
                <Text>Loading community…</Text>
            </HStack>
        );
    }

    if (error) {
        return (
            <Alert status="error" borderRadius="md" fontSize="sm">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    if (!detail) return null;

    return (
        <VStack align="stretch" spacing={4}>
            <Card>
                <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="start">
                        <Heading as="h2" size="md" color="gray.800" minW={0}>
                            {detail.name}
                        </Heading>
                        <HStack spacing={2} flexShrink={0}>
                            <CopyCommunityReportButton detail={detail} />
                            {onEdit && (
                                <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="teal"
                                    leftIcon={<EditIcon boxSize={2.5} />}
                                    onClick={() => onEdit(detail)}
                                >
                                    Edit
                                </Button>
                            )}
                            <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                leftIcon={<DeleteIcon boxSize={2.5} />}
                                onClick={handleDelete}
                                isLoading={deleting}
                            >
                                Delete
                            </Button>
                        </HStack>
                    </HStack>
                    {detail.description && (
                        <Text fontSize="sm" color="gray.700">{detail.description}</Text>
                    )}
                    {campuses.length > 0 && (
                        <Wrap spacing={2} pt={1}>
                            {campuses.map(([abbrev, count]) => (
                                <WrapItem key={abbrev}>
                                    <Badge colorScheme="teal" variant="outline" textTransform="uppercase" fontSize="2xs">
                                        {abbrev} · {count}
                                    </Badge>
                                </WrapItem>
                            ))}
                        </Wrap>
                    )}
                </VStack>
            </Card>

            <Card
                title={`Members (${members.length})`}
                action={<Text fontSize="2xs" color="gray.600">cross-campus · managed here or via set_communities</Text>}
            >
                <PersonAssignmentSelector
                    assignedPersons={members}
                    candidatePersons={activePeople}
                    onAssign={(personUniqueId) => writeMembership(personUniqueId, true)}
                    onUnassign={(personUniqueId) => writeMembership(personUniqueId, false)}
                    afterChange={handleAfterChange}
                    placeholder="Select person to add"
                    assignLabel="Add member"
                />
            </Card>

            <Card
                title={`Indicator Stakes (${stakes.length})`}
                action={<Text fontSize="2xs" color="gray.600">indicators this community's practice area has a stake in</Text>}
            >
                <VStack align="stretch" spacing={2}>
                    {stakes.length === 0 && (
                        <Text fontSize="xs" color="gray.600">
                            No indicator stakes yet — link the success indicators this community's members are the stakeholders for.
                        </Text>
                    )}
                    {stakes.map((s) => (
                        <HStack key={s.composite_key} spacing={2} px={2} py={1.5}
                                borderWidth="1px" borderColor="gray.200" borderRadius="md" align="start">
                            <Badge colorScheme="purple" variant="subtle" flexShrink={0}>{s.composite_key}</Badge>
                            <Box minW={0} flex="1">
                                <Text fontSize="xs" color="gray.800" noOfLines={2}>{s.success_indicator}</Text>
                                {s.note && <Text fontSize="2xs" color="gray.600">{s.note}</Text>}
                            </Box>
                            <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                aria-label={`Remove stake in ${s.composite_key}`}
                                onClick={() => handleRemoveStake(s.composite_key)}
                            >
                                Remove
                            </Button>
                        </HStack>
                    ))}
                    <HStack spacing={2} pt={1} align="start">
                        <Select
                            size="sm"
                            placeholder="Select indicator"
                            value={stakeKey}
                            onChange={(e) => setStakeKey(e.target.value)}
                            aria-label="Success indicator to add as a stake"
                            maxW="220px"
                        >
                            {indicatorOptions.map((o) => (
                                <option key={o.key} value={o.key}>
                                    {o.key} — {o.text.slice(0, 70)}
                                </option>
                            ))}
                        </Select>
                        <Input
                            size="sm"
                            placeholder="Why this stake (optional)"
                            value={stakeNote}
                            onChange={(e) => setStakeNote(e.target.value)}
                            aria-label="Stake note"
                        />
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleAddStake}
                            isDisabled={!stakeKey}
                            isLoading={stakeSaving}
                            flexShrink={0}
                        >
                            Add stake
                        </Button>
                    </HStack>
                </VStack>
            </Card>

            {membersWithNotes.length > 0 && (
                <Section title="Membership Notes">
                    <VStack align="stretch" spacing={1}>
                        {membersWithNotes.map((m) => (
                            <HStack key={m.unique_id} spacing={2} px={2} py={1.5}
                                    borderWidth="1px" borderColor="gray.200" borderRadius="md" align="start">
                                <Text fontSize="xs" fontWeight="semibold" color="gray.800" flexShrink={0}>
                                    {m.name}
                                </Text>
                                <Text fontSize="xs" color="gray.600" minW={0}>{m.note}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </Section>
            )}
        </VStack>
    );
}

export default CommunityDetailPanel;
