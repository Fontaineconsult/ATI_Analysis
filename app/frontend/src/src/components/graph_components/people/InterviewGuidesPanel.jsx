import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge, Box, Button, Flex, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack, useDisclosure, useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { useSettings } from '../../../context/SettingsContext';
import { getGoalViewUrlFromCompositeKey } from '../../../services/utils/tools';
import Markdown from '../common/Markdown';
import Section from '../common/Section';
import {
    fetchAllCommunities, fetchInterviewGuidesForCampusYear, fetchYsesByCampusForYear,
} from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import useInvalidateResources from '../../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../../context/resourceKeys';
import { deleteInterviewGuide } from '../../../services/api/delete';
import InterviewGuideForm from './InterviewGuideForm';
import FollowUpModal from './FollowUpModal';

/** Closure state of one guide: held (minutes linked) / unclosed (planned date
 * passed, no minutes) / upcoming. The unclosed state is the loose end the
 * cycle exists to surface. */
export function guideClosure(guide, today = new Date().toISOString().slice(0, 10)) {
    if (guide.resulted_in) return 'held';
    if (guide.meeting_date && guide.meeting_date < today) return 'unclosed';
    return 'upcoming';
}

const CLOSURE_BADGE = {
    held: { colorScheme: 'green', label: 'held' },
    unclosed: { colorScheme: 'orange', label: 'unclosed' },
    upcoming: { colorScheme: 'blue', label: 'upcoming' },
};

function ClosureBadge({ guide }) {
    const c = CLOSURE_BADGE[guideClosure(guide)];
    return <Badge colorScheme={c.colorScheme} variant="subtle" fontSize="2xs">{c.label}</Badge>;
}

/** A badge that is a real link. stopPropagation so a click on it never also
 *  triggers the surrounding row's open-the-guide handler. */
function LinkBadge({ to, colorScheme, label, children }) {
    return (
        <Badge
            as={RouterLink}
            to={to}
            colorScheme={colorScheme}
            variant="subtle"
            fontSize="2xs"
            textTransform="none"
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            _hover={{ textDecoration: 'underline' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
        >
            {children}
        </Badge>
    );
}

/** The guide's edge badges: each target opens its indicator's goal view (the
 *  shared URL helper every other view uses), each community its detail panel,
 *  each person their people-explorer entry. Rendered plain when the link key
 *  is missing rather than producing a dead link. */
function GuideEdgeBadges({ guide, campus }) {
    return (
        <>
            {(guide.targets || []).map((t) => (
                t.composite_key && campus ? (
                    <LinkBadge
                        key={t.year_identifier} colorScheme="blue"
                        to={getGoalViewUrlFromCompositeKey(t.composite_key, campus)}
                        label={`Open indicator ${t.composite_key}`}
                    >
                        {t.composite_key}
                    </LinkBadge>
                ) : (
                    <Badge key={t.year_identifier} colorScheme="blue" variant="subtle" fontSize="2xs" textTransform="none">
                        {t.composite_key}
                    </Badge>
                )
            ))}
            {(guide.pertains_to_communities || []).map((c) => (
                <LinkBadge
                    key={c.unique_id} colorScheme="purple"
                    to={`/${campus}/ati-explorer/people/communities/${c.unique_id}`}
                    label={`Open community ${c.name}`}
                >
                    {c.name}
                </LinkBadge>
            ))}
            {(guide.prepared_for || []).map((p) => (
                p.employee_id ? (
                    <LinkBadge
                        key={p.unique_id} colorScheme="gray"
                        to={`/${campus}/ati-explorer/people/${encodeURIComponent(p.employee_id)}`}
                        label={`Open person ${p.name}`}
                    >
                        {p.name}
                    </LinkBadge>
                ) : (
                    <Badge key={p.unique_id} colorScheme="gray" variant="subtle" fontSize="2xs" textTransform="none">
                        {p.name}
                    </Badge>
                )
            ))}
        </>
    );
}

function GuideRow({ guide, campus, onOpen }) {
    // Clickable-card pattern: the title button is the semantic control, the
    // whole-row onClick is a pointer convenience, and the badges are real
    // links — no interactive elements nested inside a role="button".
    return (
        <Box
            borderWidth="1px" borderColor="gray.200" borderRadius="md" borderLeftWidth="3px"
            borderLeftColor="teal.400" bg="white" px={3} py={2} textAlign="left"
            cursor="pointer" _hover={{ bg: 'gray.50' }}
            onClick={() => onOpen(guide)}
        >
            <HStack spacing={2.5} align="start">
                <Text
                    as="button" type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(guide); }}
                    aria-label={`Open interview guide: ${guide.title}`}
                    fontSize="sm" fontWeight="medium" color="gray.800"
                    flex="1" minW={0} noOfLines={1} textAlign="left"
                    _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '2px' }}
                >
                    {guide.title}
                </Text>
                <Text fontSize="2xs" color="gray.600" aria-hidden="true">▸</Text>
            </HStack>
            <Flex mt={1} gap={1.5} wrap="wrap" align="center">
                {guide.meeting_date && (
                    <Text fontFamily="mono" fontSize="2xs" color="gray.600">{guide.meeting_date}</Text>
                )}
                <ClosureBadge guide={guide} />
                <GuideEdgeBadges guide={guide} campus={campus} />
            </Flex>
        </Box>
    );
}

/** Read modal: the guide body rendered as Markdown, edges in the header.
 *  The edge badges are links; following one navigates away, which unmounts
 *  the modal with the panel. */
function GuideModal({ guide, campus, onEdit, onDelete, onFollowUp, onClose }) {
    return (
        <Modal isOpen onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={2}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800" lineHeight="1.35">{guide.title}</Text>
                    <Flex mt={2} gap={1.5} wrap="wrap" align="center">
                        {guide.meeting_date && (
                            <Text fontFamily="mono" fontSize="xs" color="gray.600">{guide.meeting_date}</Text>
                        )}
                        <ClosureBadge guide={guide} />
                        {guide.resulted_in && (
                            <Text fontSize="xs" color="gray.600">
                                → {guide.resulted_in.title}
                            </Text>
                        )}
                        {(guide.working_groups || []).map((wg) => (
                            <Badge key={wg} colorScheme="teal" variant="outline" fontSize="2xs" textTransform="none">{wg}</Badge>
                        ))}
                        <GuideEdgeBadges guide={guide} campus={campus} />
                    </Flex>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                        {guide.content
                            ? <Markdown>{guide.content}</Markdown>
                            : <Text fontSize="sm" color="gray.600" fontStyle="italic">No guide body.</Text>}
                    </Box>
                </ModalBody>
                <ModalFooter>
                    {guide.resulted_in && (
                        <Button size="sm" variant="outline" colorScheme="orange" mr={2}
                                onClick={() => onFollowUp(guide)}>
                            Follow-up
                        </Button>
                    )}
                    <Button size="sm" variant="outline" colorScheme="teal" onClick={() => onEdit(guide)}>Edit</Button>
                    <Button size="sm" variant="ghost" colorScheme="red" ml={2} onClick={() => onDelete(guide)}>Delete</Button>
                    <Box flex="1" />
                    <Button size="sm" colorScheme="teal" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/**
 * The Interview Guides tab of the People area: every prep for the current
 * campus + year, newest first, with closure state. Guides are AUTHORED by the
 * /stakeholder-interview skill (and saved via save_interview_guide.py); this
 * panel is where they're read, corrected, connected, and closed.
 */
export default function InterviewGuidesPanel() {
    const { campus } = useParams();
    const { currentAcademicYear } = useSettings();
    const toast = useToast();

    const [openGuide, setOpenGuide] = useState(null);
    const [editing, setEditing] = useState(null);
    // The follow-up view is URL-DRIVEN (?followup=<guide unique_id>), not local
    // state: its whole purpose is to send you off to an indicator and have you
    // come back, and component state does not survive that round trip. Browser
    // Back returns to this URL and the modal reopens where it was.
    const [searchParams, setSearchParams] = useSearchParams();
    const followUpGuideId = searchParams.get('followup');
    const formDisc = useDisclosure();

    // The panel itself, scoped by campus and year — both belong in the key, since
    // the fetcher is not part of a resource's identity.
    const {
        data: panelResp, loading, error, reload: reloadPanel,
    } = useResource(
        campus && currentAcademicYear ? KEYS.interviewGuides(campus, currentAcademicYear) : null,
        () => fetchInterviewGuidesForCampusYear(campus, currentAcademicYear),
    );
    const panel = panelResp?.data || null;

    // A guide write moves this listing AND the guides card on the community
    // panel, which reads guides:for-community:<id>. One namespace covers both.
    const { invalidateNamespace } = useInvalidateResources();
    const load = useCallback(async () => {
        invalidateNamespace(NS.guides);
        await reloadPanel();
    }, [invalidateNamespace, reloadPanel]);

    // Picker pools for the edit modal. Both are shared keys — communities with
    // three other screens, the YSE tree with the plan evidence picker and the YSE
    // assignment selector — so opening this panel after any of them costs nothing.
    // The narrowing to this campus stays here: the response deliberately carries
    // every campus, and the other callers want it whole.
    const { data: communitiesResp } = useResource(KEYS.communitiesAll, fetchAllCommunities);
    const communityOptions = useMemo(
        () => (communitiesResp?.data?.items || [])
            .map((c) => ({ value: c.unique_id, label: c.name })),
        [communitiesResp],
    );

    const { data: yseResp } = useResource(
        currentAcademicYear ? KEYS.ysesByCampus(currentAcademicYear) : null,
        () => fetchYsesByCampusForYear(currentAcademicYear),
    );
    const yseOptions = useMemo(() => {
        // Payload: campuses -> working_groups -> yses. Only the URL campus.
        const wrapper = yseResp?.data || yseResp;
        const forCampus = (wrapper?.campuses || []).find((c) => c.abbreviation === campus);
        const options = [];
        (forCampus?.working_groups || []).forEach((wg) => {
            (wg.yses || []).forEach((y) => {
                options.push({
                    value: y.year_identifier,
                    label: `${y.indicator_composite_key} — ${(y.indicator_description || '').slice(0, 80)}`,
                });
            });
        });
        options.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
        return options;
    }, [yseResp, campus]);

    const guides = useMemo(() => panel?.guides || [], [panel]);
    const followUpGuide = useMemo(
        () => guides.find((g) => g.unique_id === followUpGuideId) || null,
        [guides, followUpGuideId],
    );

    const handleDelete = async (guide) => {
        if (!window.confirm(`Delete the guide "${guide.title}"? People, indicators, and minutes are untouched.`)) return;
        try {
            await deleteInterviewGuide(guide.unique_id);
            toast({ title: 'Guide deleted', status: 'success', duration: 2000, isClosable: true });
            setOpenGuide(null);
            await load();
        } catch (err) {
            toast({ title: 'Delete failed', description: err?.message, status: 'error', duration: 4000, isClosable: true });
        }
    };

    const openEdit = (guide) => { setOpenGuide(null); setEditing(guide); formDisc.onOpen(); };
    const openFollowUp = (guide) => {
        setOpenGuide(null);
        setSearchParams({ followup: guide.unique_id });
    };
    const closeFollowUp = () => {
        searchParams.delete('followup');
        setSearchParams(searchParams, { replace: true });
    };

    return (
        <Section
            title={`Interview Guides${guides.length ? ` (${guides.length})` : ''}`}
            action={(
                <Text fontSize="2xs" color="gray.600">
                    {campus?.toUpperCase()} · {currentAcademicYear} · authored by /stakeholder-interview
                </Text>
            )}
        >
            {loading ? (
                <HStack color="gray.600" fontSize="sm"><Spinner size="sm" /><Text>Loading…</Text></HStack>
            ) : error ? (
                <Text fontSize="sm" color="red.500">{error}</Text>
            ) : guides.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No interview guides for this campus and year yet — prep one with the stakeholder-interview skill.
                </Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {guides.map((g) => (
                        <GuideRow key={g.unique_id} guide={g} campus={campus} onOpen={setOpenGuide} />
                    ))}
                </VStack>
            )}

            {openGuide && (
                <GuideModal
                    guide={openGuide}
                    campus={campus}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onFollowUp={openFollowUp}
                    onClose={() => setOpenGuide(null)}
                />
            )}

            {followUpGuide && (
                <FollowUpModal guide={followUpGuide} campus={campus} onClose={closeFollowUp} />
            )}

            {formDisc.isOpen && editing && (
                <InterviewGuideForm
                    isOpen={formDisc.isOpen}
                    onClose={formDisc.onClose}
                    guide={editing}
                    yseOptions={yseOptions}
                    communityOptions={communityOptions}
                    minutesCandidates={panel?.minutes_candidates || []}
                    onSaved={load}
                />
            )}
        </Section>
    );
}
