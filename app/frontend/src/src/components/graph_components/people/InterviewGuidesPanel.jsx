import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge, Box, Button, Flex, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack, useDisclosure, useToast,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useSettings } from '../../../context/SettingsContext';
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

function GuideRow({ guide, onOpen }) {
    return (
        <Box
            borderWidth="1px" borderColor="gray.200" borderRadius="md" borderLeftWidth="3px"
            borderLeftColor="teal.400" bg="white" px={3} py={2} textAlign="left"
            cursor="pointer" _hover={{ bg: 'gray.50' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
            onClick={() => onOpen(guide)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(guide); }
            }}
            role="button" tabIndex={0}
            aria-label={`Open interview guide: ${guide.title}`}
        >
            <HStack spacing={2.5} align="start">
                <Text fontSize="sm" fontWeight="medium" color="gray.800" flex="1" minW={0} noOfLines={1}>
                    {guide.title}
                </Text>
                <Text fontSize="2xs" color="gray.600">▸</Text>
            </HStack>
            <Flex mt={1} gap={1.5} wrap="wrap" align="center">
                {guide.meeting_date && (
                    <Text fontFamily="mono" fontSize="2xs" color="gray.600">{guide.meeting_date}</Text>
                )}
                <ClosureBadge guide={guide} />
                {(guide.targets || []).map((t) => (
                    <Badge key={t.year_identifier} colorScheme="blue" variant="subtle" fontSize="2xs" textTransform="none">
                        {t.composite_key}
                    </Badge>
                ))}
                {(guide.pertains_to_communities || []).map((c) => (
                    <Badge key={c.unique_id} colorScheme="purple" variant="subtle" fontSize="2xs" textTransform="none">
                        {c.name}
                    </Badge>
                ))}
                {(guide.prepared_for || []).map((p) => (
                    <Badge key={p.unique_id} colorScheme="gray" variant="subtle" fontSize="2xs" textTransform="none">
                        {p.name}
                    </Badge>
                ))}
            </Flex>
        </Box>
    );
}

/** Read modal: the guide body rendered as Markdown, edges in the header. */
function GuideModal({ guide, onEdit, onDelete, onClose }) {
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
                        {(guide.prepared_for || []).map((p) => (
                            <Badge key={p.unique_id} colorScheme="gray" variant="subtle" fontSize="2xs" textTransform="none">{p.name}</Badge>
                        ))}
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
                        <GuideRow key={g.unique_id} guide={g} onOpen={setOpenGuide} />
                    ))}
                </VStack>
            )}

            {openGuide && (
                <GuideModal
                    guide={openGuide}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onClose={() => setOpenGuide(null)}
                />
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
