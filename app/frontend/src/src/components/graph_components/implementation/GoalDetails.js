import React, { useState, useContext } from 'react';
import { Box, Flex, Text, Button, Heading, HStack, Collapse } from '@chakra-ui/react';
import { FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Plan from './Plan';
import GoalPlanLinks from './GoalPlanLinks';
import { getPlanStatusColor, getPlanStatusLabel } from '../../../styles/planStatusColors';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext } from '../../../context/SettingsContext';

// Lifecycle order for the status dashboard — fresh first, terminal last.
const STATUS_ORDER = ['In Progress', 'Not Started', 'On Hold', 'Completed', 'Abandoned'];

// A goal-level card. Collapsed by default to a status dashboard (counts per plan
// status); expands to the full, deep-linkable plan list. Accomplishments are not
// shown inline here, and full plan review/edit happens on the plans page.
const PanelCard = ({ children }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={3}>
        {children}
    </Box>
);

function GoalDetails({ plans, indicators, goalNumber }) {
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentAcademicYear, currentWorkingGroup } = useContext(SettingsContext);
    const [showNewPlan, setShowNewPlan] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Flatten goal-level and indicator-level plans into one list. Both shapes carry
    // their fields under `.properties`.
    const allPlans = [
        ...(plans || []),
        ...(indicators || []).flatMap((indicator) => indicator.evidences?.[0]?.plans || []),
    ];

    // Count plans per status for the dashboard view.
    const statusCounts = (() => {
        const m = new Map();
        allPlans.forEach((p) => {
            const label = getPlanStatusLabel(p?.properties || {});
            m.set(label, (m.get(label) || 0) + 1);
        });
        return [...m.entries()].sort((a, b) => {
            const ai = STATUS_ORDER.indexOf(a[0]);
            const bi = STATUS_ORDER.indexOf(b[0]);
            return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        });
    })();

    const headingId = `goal-${goalNumber}-plans-heading`;
    const listId = `goal-${goalNumber}-plans-list`;

    const handleRefresh = () => {
        loadSingleWorkingGroupData(currentWorkingGroup);
        setShowNewPlan(false);
    };

    return (
        <Box as="section" aria-labelledby={headingId} mt={2}>
            <PanelCard>
                <Flex justify="space-between" align="center" mb={2}>
                    <Heading id={headingId} as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                        Plans ({allPlans.length})
                    </Heading>
                    <HStack spacing={2}>
                        <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="gray"
                            leftIcon={expanded ? <FaChevronUp /> : <FaChevronDown />}
                            onClick={() => setExpanded(!expanded)}
                            aria-expanded={expanded}
                            aria-controls={listId}
                            isDisabled={allPlans.length === 0}
                        >
                            {expanded ? 'Hide' : 'Show'} plans
                        </Button>
                        <Button
                            size="xs"
                            colorScheme="teal"
                            leftIcon={<FaPlus />}
                            onClick={() => setShowNewPlan(!showNewPlan)}
                            variant={showNewPlan ? 'outline' : 'solid'}
                        >
                            {showNewPlan ? 'Cancel' : 'Add Plan'}
                        </Button>
                    </HStack>
                </Flex>

                {/* Status dashboard — always visible (the collapsed view). */}
                {allPlans.length > 0 ? (
                    <HStack flexWrap="wrap" spacing={2}>
                        {statusCounts.map(([label, count]) => {
                            const c = getPlanStatusColor(label);
                            return (
                                <HStack
                                    key={label}
                                    spacing={1.5}
                                    px={2}
                                    py={0.5}
                                    borderRadius="full"
                                    bg={c.bg}
                                    color={c.fg}
                                    borderWidth="1px"
                                    borderColor={c.solid}
                                >
                                    <Text fontSize="xs" fontWeight="bold">{count}</Text>
                                    <Text fontSize="2xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                                        {label}
                                    </Text>
                                </HStack>
                            );
                        })}
                    </HStack>
                ) : (
                    !showNewPlan && (
                        <Text fontSize="sm" color="gray.500">No plans for this goal.</Text>
                    )
                )}

                {showNewPlan && (
                    <Box mt={2}>
                        <Plan
                            isNew
                            goalNumber={goalNumber}
                            workingGroup={currentWorkingGroup}
                            academicYear={currentAcademicYear}
                            onSuccess={handleRefresh}
                            onCancel={() => setShowNewPlan(false)}
                        />
                    </Box>
                )}

                {/* Full list — expandable. */}
                <Collapse in={expanded} animateOpacity>
                    <Box id={listId} pt={2}>
                        <GoalPlanLinks plans={allPlans} />
                    </Box>
                </Collapse>
            </PanelCard>
        </Box>
    );
}

export default GoalDetails;
