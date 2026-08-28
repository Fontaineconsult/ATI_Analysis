import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    Link,
    Spinner,
    Text,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Input, Select } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getGoalViewUrlFromCompositeKey } from '../../../services/utils/tools';
import { UserContext } from '../../../context/UserContext';
import { DataContext } from '../../../context/DataContext';
import { useSettings } from '../../../context/SettingsContext';
import { fetchCommunity, fetchGuidesForCommunity } from '../../../services/api/get';
import { addCommunityStake, removeCommunityStake, setPersonCommunities } from '../../../services/api/put';
import { deleteCommunity } from '../../../services/api/delete';
import Card from '../common/Card';
import Section from '../common/Section';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import CopyCommunityReportButton from './CopyCommunityReportButton';
import CopyCommunityStakesButton from './CopyCommunityStakesButton';
import { guideClosure } from './InterviewGuidesPanel';
import MemberCampusScopePicker from './MemberCampusScopePicker';
import { buildMembershipWrite, personCommunities } from './peopleConfig';
import { ALL_WORKING_GROUPS } from '../../../styles/workingGroupIdentity';

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
    const { campus } = useParams();
    const { individuals, refreshAllIndividuals } = useContext(UserContext);
    const { data } = useContext(DataContext);
    const { currentAcademicYear } = useSettings();
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

    // Interview preps working this community's ground (read-only card; guides
    // are managed on the People area's Interview Guides tab).
    const [guides, setGuides] = useState([]);
    useEffect(() => {
        let cancelled = false;
        if (!communityId) { setGuides([]); return undefined; }
        fetchGuidesForCommunity(communityId)
            .then((resp) => { if (!cancelled) setGuides(resp?.data?.guides || []); })
            .catch(() => { if (!cancelled) setGuides([]); });
        return () => { cancelled = true; };
    }, [communityId]);

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
            // Effective scope: the membership's own list when set, else home.
            const active = (m.active_campuses && m.active_campuses.length)
                ? m.active_campuses
                : (m.host_campus ? [m.host_campus] : []);
            active.forEach((a) => counts.set(a, (counts.get(a) || 0) + 1));
        });
        return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }, [members]);

    // Rewrite one person's membership set with this community added or removed.
    // set_communities is replace-semantics, so the person's OTHER memberships
    // (and their notes) must be carried over — the full roster provides them
    // (full, not active-only: a member may be inactive and still unassignable).
    const resolveRosterPerson = useCallback((personUniqueId) => {
        const rosterPerson = (Array.isArray(individuals) ? individuals : [])
            .find((p) => p.unique_id === personUniqueId);
        if (!rosterPerson?.employee_id) {
            throw new Error('Cannot resolve this person in the roster — refresh and try again.');
        }
        return rosterPerson;
    }, [individuals]);

    const writeMembership = useCallback(async (personUniqueId, include) => {
        const rosterPerson = resolveRosterPerson(personUniqueId);
        await setPersonCommunities(
            rosterPerson.employee_id,
            buildMembershipWrite(rosterPerson, communityId, { include }),
        );
    }, [resolveRosterPerson, communityId]);

    const handleAfterChange = useCallback(async () => {
        await Promise.all([loadDetail(), refreshAllIndividuals()]);
        if (onAfterChange) await onAfterChange();
    }, [loadDetail, refreshAllIndividuals, onAfterChange]);

    // Set one membership's campus scope (the picker's Save / Follow-home). The
    // builder carries every other membership verbatim and applies the no-freeze
    // rule; the refresh is explicit here because the picker sits outside the
    // selector's own afterChange flow.
    const writeMembershipCampuses = useCallback(async (personUniqueId, campuses) => {
        const rosterPerson = resolveRosterPerson(personUniqueId);
        await setPersonCommunities(
            rosterPerson.employee_id,
            buildMembershipWrite(rosterPerson, communityId, { include: true, campuses }),
        );
        await handleAfterChange();
    }, [resolveRosterPerson, communityId, handleAfterChange]);

    // Indicator stakes (has_stake_in). The picker is fed from the indicators payload
    // already in DataContext (WG -> goals -> SIs), flattened to composite_key + text;
    // already-staked indicators are excluded from the options.
    const stakes = useMemo(() => (Array.isArray(detail?.stakes) ? detail.stakes : []), [detail]);
    // One section per working group (registry order), indicators ordered by
    // goal.indicator number within — the flat alphabetical list hid which group
    // an indicator belonged to and interleaved 1.19 with 10.2.
    const indicatorGroups = useMemo(() => {
        const staked = new Set(stakes.map((s) => s.composite_key));
        const registryOrder = new Map(ALL_WORKING_GROUPS.map((w, idx) => [w.name, idx]));
        const groups = [];
        (Array.isArray(data?.indicators) ? data.indicators : []).forEach((wg) => {
            const options = [];
            (wg.goals || []).forEach((goal) => {
                (goal.successIndicators || []).forEach((si) => {
                    // The payload keeps removed SIs (settings manages them there);
                    // a retired indicator is not a valid new stake target.
                    if (si?.composite_key && !si.removed && !staked.has(si.composite_key)) {
                        options.push({ key: si.composite_key, text: si.success_indicator || '' });
                    }
                });
            });
            if (options.length) {
                options.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
                groups.push({ name: wg.name || 'Other', options });
            }
        });
        return groups.sort((a, b) => {
            const ai = registryOrder.has(a.name) ? registryOrder.get(a.name) : 99;
            const bi = registryOrder.has(b.name) ? registryOrder.get(b.name) : 99;
            return ai - bi || a.name.localeCompare(b.name);
        });
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
                    extraColumnHeader="Campuses"
                    renderExtraColumn={(m) => (
                        <MemberCampusScopePicker
                            member={m}
                            onSave={(campuses) => writeMembershipCampuses(m.unique_id, campuses)}
                        />
                    )}
                />
            </Card>

            <Card
                title={`Indicator Stakes (${stakes.length})`}
                action={
                    /* The review spread: the same stakes as a shareable public page,
                       grouped by review state, each row linking to its public evidence
                       report. Server-rendered, so Open is a plain full-page link —
                       React Router must never swallow it. */
                    <HStack spacing={1.5}>
                        <CopyCommunityStakesButton
                            detail={detail}
                            reviewSpreadUrl={`${window.location.origin}/ati/reports/public/community/${campus}/${currentAcademicYear}/${communityId}`}
                        />
                        <Button
                            size="xs"
                            colorScheme="teal"
                            onClick={() => {
                                const url = `${window.location.origin}/ati/reports/public/community/${campus}/${currentAcademicYear}/${communityId}`;
                                navigator.clipboard.writeText(url);
                                toast({
                                    title: 'Review spread link copied!',
                                    description: 'Shareable read-only list of the stakes and their review state.',
                                    status: 'success', duration: 2500, isClosable: true,
                                });
                            }}
                        >
                            Copy review spread
                        </Button>
                        <Button
                            size="xs"
                            variant="outline"
                            colorScheme="teal"
                            as="a"
                            href={`/ati/reports/public/community/${campus}/${currentAcademicYear}/${communityId}`}
                            target="_blank"
                            rel="noopener"
                        >
                            Open
                        </Button>
                    </HStack>
                }
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
                                {campus ? (
                                    <Link
                                        as={RouterLink}
                                        to={getGoalViewUrlFromCompositeKey(s.composite_key, campus)}
                                        display="block"
                                        textAlign="left"
                                        fontSize="xs"
                                        color="teal.700"
                                        noOfLines={2}
                                        _hover={{ textDecoration: 'underline' }}
                                        _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', borderRadius: 'sm' }}
                                    >
                                        {s.success_indicator}
                                    </Link>
                                ) : (
                                    <Text fontSize="xs" color="gray.800" noOfLines={2}>{s.success_indicator}</Text>
                                )}
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
                            maxW="420px"
                        >
                            {indicatorGroups.map((g) => (
                                <optgroup key={g.name} label={g.name}>
                                    {g.options.map((o) => (
                                        <option key={o.key} value={o.key}>
                                            {o.key} — {o.text}
                                        </option>
                                    ))}
                                </optgroup>
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

            {guides.length > 0 && (
                <Card title={`Interview Guides (${guides.length})`}
                      action={<Text fontSize="2xs" color="gray.600">managed on the Interview Guides tab</Text>}>
                    <VStack align="stretch" spacing={1.5}>
                        {guides.map((g) => {
                            const closure = guideClosure(g);
                            return (
                                <HStack key={g.unique_id} spacing={2} px={2} py={1.5}
                                        borderWidth="1px" borderColor="gray.200" borderRadius="md" align="center">
                                    <Text fontSize="sm" color="gray.800" flex="1" minW={0} noOfLines={1}>{g.title}</Text>
                                    {g.meeting_date && (
                                        <Text fontFamily="mono" fontSize="2xs" color="gray.600">{g.meeting_date}</Text>
                                    )}
                                    <Badge
                                        colorScheme={closure === 'held' ? 'green' : closure === 'unclosed' ? 'orange' : 'blue'}
                                        variant="subtle" fontSize="2xs"
                                    >
                                        {closure}
                                    </Badge>
                                </HStack>
                            );
                        })}
                    </VStack>
                </Card>
            )}

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
