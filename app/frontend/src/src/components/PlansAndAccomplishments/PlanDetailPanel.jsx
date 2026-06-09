import React from 'react';
import {
    Badge,
    Box,
    Button,
    Divider,
    Grid,
    GridItem,
    Heading,
    HStack,
    Text,
    useToast,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { LinkIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import PlanEditForm from './PlanEditForm';
import PlanProgressNotes from './PlanProgressNotes';
import PlanAsanaSubtasks from './PlanAsanaSubtasks';
import AssociatedYearSuccessEvidence from './AssociatedYearSuccessEvidence';
import { getPlanStatusColorScheme } from '../../styles/planStatusColors';

/**
 * Right-column detail/edit view for the plans split layout. Composes the
 * existing PlanEditForm (which already handles the related-YSE sidebar and
 * the abandoned/completed state) and PlanProgressNotes alongside a header
 * with the plan's identity badges.
 *
 * Props:
 *   plan          The selected plan object (or null).
 *   onAfterEdit() Called after a successful edit so the container can refetch.
 *   placeholder   Optional ReactNode for the empty state.
 */
function PlanDetailPanel({ plan, onAfterEdit, placeholder }) {
    const { campus } = useParams();
    const toast = useToast();

    // Mirror of ImplementationTypeOverview.copyImplementationLink — same
    // `/ati/...` prefix because that's the Flask app's mount path. Reuses
    // the same toast feedback shape.
    const copyPlanLink = () => {
        if (!plan?.unique_id || !campus) return;
        const url = `${window.location.origin}/ati/${campus}/ati-explorer/plans/${plan.unique_id}`;
        navigator.clipboard.writeText(url);
        toast({
            title: 'Link copied!',
            description: 'Direct link to this plan copied to clipboard',
            status: 'success',
            duration: 2000,
            isClosable: true,
        });
    };

    if (!plan) {
        return (
            placeholder || (
                <Box
                    p={10}
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor="gray.300"
                    borderRadius="lg"
                    bg="gray.50"
                    textAlign="center"
                >
                    <Text color="gray.500" fontSize="sm">
                        Select a plan on the left to view and edit it.
                    </Text>
                </Box>
            )
        );
    }

    const statusColor = getPlanStatusColorScheme(plan);

    return (
        <VStack align="stretch" spacing={4}>
            {/* Header */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack justify="space-between" align="start" mb={2}>
                    <Heading as="h2" size="md" color="gray.800" flex="1" minW="0">
                        {plan.name || '(untitled plan)'}
                    </Heading>
                    <HStack spacing={2}>
                        <Badge colorScheme={statusColor} fontSize="xs" px={2} py={1} borderRadius="md">
                            {plan.abandoned ? 'Abandoned' : (plan.plan_status || 'Not Started')}
                        </Badge>
                        <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            leftIcon={<LinkIcon />}
                            onClick={copyPlanLink}
                            title="Copy direct link to this plan"
                        >
                            Copy link
                        </Button>
                    </HStack>
                </HStack>

                <Wrap spacing={2} mt={2}>
                    {plan.workingGroup && (
                        <WrapItem>
                            <Badge colorScheme="teal" variant="subtle" fontSize="2xs" textTransform="uppercase">
                                {plan.workingGroup}
                            </Badge>
                        </WrapItem>
                    )}
                    {plan.goalNumber != null && (
                        <WrapItem>
                            <Badge colorScheme="gray" variant="subtle" fontSize="2xs">
                                Goal {plan.goalNumber}
                            </Badge>
                        </WrapItem>
                    )}
                    {plan.is_key_plan && (
                        <WrapItem><Badge colorScheme="purple" fontSize="2xs">Key Plan</Badge></WrapItem>
                    )}
                    {plan.is_campus_plan && (
                        <WrapItem><Badge colorScheme="green" fontSize="2xs">Campus Plan</Badge></WrapItem>
                    )}
                    {plan.completed_year && (
                        <WrapItem>
                            <Badge colorScheme="green" variant="outline" fontSize="2xs">
                                Completed {plan.completed_year}
                            </Badge>
                        </WrapItem>
                    )}
                    {plan.abandoned_year && (
                        <WrapItem>
                            <Badge colorScheme="red" variant="outline" fontSize="2xs">
                                Abandoned {plan.abandoned_year}
                            </Badge>
                        </WrapItem>
                    )}
                </Wrap>
            </Box>

            {/* Edit form (scalar fields only — YSE list is its own section below) */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>
                    Details
                </Heading>
                <Divider mb={4} borderColor="gray.200" />
                <PlanEditForm
                    key={plan.unique_id}
                    plan={plan}
                    onClose={() => { /* In the split view there's nothing to close. */ }}
                    onSuccess={() => {
                        if (onAfterEdit) onAfterEdit(plan);
                    }}
                />
            </Box>

            {/* Associated Year Success Evidence — campus board with assign/unassign */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>
                    Associated Year Success Evidence
                </Heading>
                <Divider mb={4} borderColor="gray.200" />
                <AssociatedYearSuccessEvidence
                    key={plan.unique_id}
                    plan={plan}
                    onChanged={() => { if (onAfterEdit) onAfterEdit(plan); }}
                />
            </Box>

            {/* Asana subtasks (read-only mirror; Asana owns these) */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>
                    Asana Subtasks
                </Heading>
                <Divider mb={4} borderColor="gray.200" />
                <PlanAsanaSubtasks key={plan.unique_id} planUniqueId={plan.unique_id} />
            </Box>

            {/* Progress notes */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>
                    Progress Notes
                </Heading>
                <Divider mb={4} borderColor="gray.200" />
                <PlanProgressNotes
                    key={plan.unique_id}
                    planUniqueId={plan.unique_id}
                    planName={plan.name}
                    progressNotesData={plan.progress_notes || []}
                />
            </Box>
        </VStack>
    );
}

export default PlanDetailPanel;
