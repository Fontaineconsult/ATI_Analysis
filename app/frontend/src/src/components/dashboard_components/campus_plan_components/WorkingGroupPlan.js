import React from 'react';
import {
    Box,
    Heading,
    HStack,
    Text,
    VStack,
} from '@chakra-ui/react';

/**
 * Renders a single working group's slice of a CampusPlan: heading, identifier,
 * indicator/lead counts, and the list of campus-plan-flagged Plans attached
 * via WorkingGroupPlan.includes_plan.
 *
 * Reusable across all three working group views (Web / Procurement /
 * Instructional Materials). The shape it expects is the WGP object the
 * /campus-plans/<campus>/<year> endpoint returns under working_group_plans.
 */
function SectionHeading({ children }) {
    return (
        <Heading as="h4" size="xs" color="gray.700" mb={2} textTransform="uppercase" letterSpacing="wide">
            {children}
        </Heading>
    );
}

function EmptyText({ children }) {
    return (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">{children}</Text>
    );
}

function WorkingGroupPlan({ wgp }) {
    if (!wgp) return null;

    return (
        <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="md">
            <HStack justify="space-between" mb={4}>
                <Heading as="h3" size="sm" color="teal.700">
                    {wgp.working_group}
                </Heading>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    {wgp.plan_identifier}
                </Text>
            </HStack>

            <VStack align="stretch" spacing={4}>
                <Box>
                    <SectionHeading>Prioritized Indicators</SectionHeading>
                    {wgp.prioritized_success_indicators.length === 0 ? (
                        <EmptyText>None selected.</EmptyText>
                    ) : (
                        <VStack align="stretch" spacing={1}>
                            {wgp.prioritized_success_indicators.map((si) => (
                                <HStack key={si.unique_id} align="baseline" spacing={2}>
                                    <Text fontFamily="mono" fontSize="xs" color="gray.500" minW="60px">
                                        {si.composite_key}
                                    </Text>
                                    <Text fontSize="sm" color="gray.800">
                                        {si.success_indicator}
                                    </Text>
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Box>

                <Box>
                    <SectionHeading>Group Leads</SectionHeading>
                    {wgp.group_leads.length === 0 ? (
                        <EmptyText>No leads assigned.</EmptyText>
                    ) : (
                        <VStack align="stretch" spacing={1}>
                            {wgp.group_leads.map((person) => (
                                <HStack key={person.unique_id} spacing={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.800">{person.name}</Text>
                                    {person.title && (
                                        <Text fontSize="sm" color="gray.500">— {person.title}</Text>
                                    )}
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Box>

                <Box>
                    <SectionHeading>Plans</SectionHeading>
                    {wgp.plans.length === 0 ? (
                        <EmptyText>No campus-plan plans yet.</EmptyText>
                    ) : (
                        <VStack align="stretch" spacing={2}>
                            {wgp.plans.map((plan) => (
                                <Box
                                    key={plan.unique_id}
                                    p={3}
                                    bg="gray.50"
                                    borderRadius="sm"
                                    borderLeftWidth="3px"
                                    borderLeftColor={plan.abandoned ? 'red.300' : 'teal.400'}
                                >
                                    <HStack justify="space-between" align="baseline" spacing={2}>
                                        <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                            {plan.name || plan.description}
                                        </Text>
                                        {plan.academic_year && (
                                            <Text fontSize="xs" color="gray.500" fontFamily="mono" whiteSpace="nowrap">
                                                {plan.academic_year}
                                                {plan.completed_year && ` · completed ${plan.completed_year}`}
                                            </Text>
                                        )}
                                    </HStack>
                                    {plan.plan_status && (
                                        <Text fontSize="xs" color="gray.600" mt={1}>
                                            Status: {plan.plan_status}
                                        </Text>
                                    )}
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </VStack>
        </Box>
    );
}

export default WorkingGroupPlan;
