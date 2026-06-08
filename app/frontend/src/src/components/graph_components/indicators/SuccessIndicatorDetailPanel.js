import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Badge,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import ImplementationMasterContainer from '../implementation/ImplementationMasterContainer';
import YSEAnnotationMasterContainer from '../documentation/YSEAnnotationMasterContainer';
import ApprovalMasterContainer from '../../ati_explorer_containers/ApprovalMasterContainer';
import { useStatusLevels } from '../../../hooks/useStatusLevels';
import { UserContext } from '../../../context/UserContext';
import { useSettings } from '../../../context/SettingsContext';
import { DataContext } from '../../../context/DataContext';
import { updateStatusLevel, assignPersonAsImplementor, unassignPersonAsImplementor } from '../../../services/api/put';
import { getIndicatorSummary, getStatusColor, PRIORITY_COLORS } from './indicatorHelpers';
import IndicatorAssetsPanel from './IndicatorAssetsPanel';

// A flat, titled section card. Everything for the selected indicator is rendered inline as
// stacked sections — no modals (except the review process, which is action-gated).
const Section = ({ title, children }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={3}>
        <Heading as="h6" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
            {title}
        </Heading>
        {children}
    </Box>
);

/**
 * Right column of the goal view: the selected success indicator, flattened. The SI description is
 * the headline; status + persons + implementations + annotations are inline; the review process
 * stays behind a button. Reuses the same inner components the old modals wrapped.
 */
function SuccessIndicatorDetailPanel({ wrapper }) {
    const { statusLevels } = useStatusLevels();
    const { currentWorkingGroup } = useSettings();
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { individuals, refreshAllIndividuals } = useContext(UserContext);
    const toast = useToast();
    const approval = useDisclosure();

    const s = wrapper ? getIndicatorSummary(wrapper) : null;
    const ev = wrapper?.evidences?.[0];
    const yearIdentifier = s?.yearIdentifier;

    const [localStatus, setLocalStatus] = useState(s?.statusLevel || '');
    useEffect(() => { setLocalStatus(s?.statusLevel || ''); }, [s?.statusLevel, s?.compositeKey]);

    useEffect(() => { if (!individuals) refreshAllIndividuals(); }, [individuals, refreshAllIndividuals]);

    const handleStatusChange = async (newStatus) => {
        const previous = localStatus;
        setLocalStatus(newStatus);
        try {
            await updateStatusLevel(yearIdentifier, newStatus);
            toast({ title: 'Status updated', status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
            loadSingleWorkingGroupData(currentWorkingGroup);
        } catch (e) {
            setLocalStatus(previous);
            toast({ title: 'Error updating status', description: 'Please try again.', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
        }
    };

    if (!wrapper || !s) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.500" fontSize="sm">Select a success indicator on the left to view and edit it.</Text>
            </Box>
        );
    }

    // No YSE attached for this indicator/year — show the identity but nothing to edit.
    if (!ev?.evidence || !yearIdentifier) {
        return (
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h5" fontSize="md" fontWeight="semibold" color="gray.800" mb={1}>{s.description || '(no description)'}</Heading>
                <Text fontSize="xs" color="gray.400" fontFamily="mono" mb={3}>Indicator {s.compositeKey}</Text>
                <Box p={3} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md">
                    <Text color="red.700" fontSize="sm" fontWeight="semibold">
                        No evidence is attached for this indicator in the selected year.
                    </Text>
                </Box>
            </Box>
        );
    }

    const statusValueForColor =
        statusLevels.find((l) => l.status_level === localStatus)?.status_value ?? s.statusValue;

    const assignedPersons = individuals?.filter(
        (p) => p.yearSuccessEvidences?.some((yse) => yse.year_identifier === yearIdentifier),
    ) || [];
    const candidatePersons = individuals?.filter((i) => i.active || i.non_committee_member_active) || [];

    return (
        <VStack as="section" aria-label={`Success indicator ${s.compositeKey}`} align="stretch" spacing={3}>
            {/* Header card — SI description is the headline; controls + badges below it */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={4}>
                <Heading as="h5" fontSize="lg" fontWeight="semibold" color="gray.800" lineHeight="short" mb={3}>
                    {s.description || '(no description)'}
                </Heading>

                <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <HStack spacing={2} flexWrap="wrap">
                        <Text fontSize="xs" color="gray.400" fontFamily="mono">Indicator {s.compositeKey}</Text>
                        <Badge colorScheme={getStatusColor(statusValueForColor)} borderRadius="full" px={2} fontSize="2xs">
                            {localStatus || 'No status'}
                        </Badge>
                        {s.priority && (
                            <Badge colorScheme={PRIORITY_COLORS[s.priority] || 'gray'} variant="subtle" fontSize="2xs" textTransform="capitalize">
                                {s.priority} priority
                            </Badge>
                        )}
                        {s.approved ? (
                            <Badge colorScheme="green" fontSize="2xs">Approved</Badge>
                        ) : s.readyForReview ? (
                            <Badge colorScheme="yellow" fontSize="2xs">Ready for review</Badge>
                        ) : null}
                        {s.workedThisYear && <Badge colorScheme="teal" variant="subtle" fontSize="2xs">Active this year</Badge>}
                        {s.nextYear && <Badge colorScheme="blue" variant="subtle" fontSize="2xs">Planned next year</Badge>}
                    </HStack>

                    <HStack spacing={2} flexShrink={0}>
                        <Box width="180px">
                            <DropdownSelect
                                options={statusLevels.map((level) => level.status_level)}
                                initialValue={localStatus}
                                onChange={handleStatusChange}
                            />
                        </Box>
                        <Button
                            size="sm"
                            colorScheme={s.approved ? 'green' : 'yellow'}
                            variant={s.approved ? 'solid' : 'outline'}
                            onClick={approval.onOpen}
                        >
                            {s.approved ? 'Approved' : 'Review'}
                        </Button>
                    </HStack>
                </HStack>

                <Box mt={3} pt={3} borderTopWidth="1px" borderColor="gray.100">
                    <StatusLevelLadder level={localStatus} variant="full" />
                </Box>
            </Box>

            <Section title="Responsible Persons">
                <PersonAssignmentSelector
                    assignedPersons={assignedPersons}
                    candidatePersons={candidatePersons}
                    onAssign={(personUniqueId) => assignPersonAsImplementor(personUniqueId, yearIdentifier)}
                    onUnassign={(personUniqueId) => unassignPersonAsImplementor(personUniqueId, yearIdentifier)}
                    afterChange={async () => {
                        await Promise.all([
                            loadSingleWorkingGroupData(currentWorkingGroup),
                            refreshAllIndividuals(),
                        ]);
                    }}
                />
            </Section>

            {/* ImplementationMasterContainer renders its own "Implementation Details" card. */}
            <ImplementationMasterContainer
                evidenceData={ev}
                compositeKey={s.compositeKey}
                yearIdentifier={yearIdentifier}
            />

            {/* Assets / Interfaces / Tools this indicator touches, reached through its
                implementations. Each row deep-links into the Assets explorer. */}
            <IndicatorAssetsPanel
                assets={wrapper.assets}
                interfaces={wrapper.interfaces}
                tools={wrapper.tools}
            />

            <Section title="Annotations">
                <YSEAnnotationMasterContainer
                    hasNotes={ev.has_notes}
                    hasMessages={ev.has_messages}
                    hasMetrics={ev.has_metrics}
                    plans={ev.plans}
                    year_identifier={yearIdentifier}
                />
            </Section>

            {/* Review stays behind a button (action-gated). */}
            <Modal isOpen={approval.isOpen} onClose={approval.onClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="lg" color="teal.700">Approval Process — {s.compositeKey}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <ApprovalMasterContainer evidenceData={ev} currentWorkingGroup={currentWorkingGroup} />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
}

export default SuccessIndicatorDetailPanel;
