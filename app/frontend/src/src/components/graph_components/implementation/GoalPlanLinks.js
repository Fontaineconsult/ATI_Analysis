import React from 'react';
import { Box, HStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getPlanStatusColor, getPlanStatusLabel } from '../../../styles/planStatusColors';

/**
 * Compact, scannable list of a goal's plans. Each plan is a single line — the
 * plan name (a deep link) plus its status pill — instead of the old fully
 * expanded inline card. Clicking the name routes to the dedicated plan detail
 * view at /{campus}/ati-explorer/plans/<id>, which pre-selects the plan from the
 * URL param (PlansAccomplishmentsManager.initialPlanId) — the same select-and-
 * deep-link mechanism the implementations explorer uses. This keeps the goal
 * view dense; full review/edit happens on the plans page.
 *
 * Props:
 *   plans  Array of plan node objects (each carrying data under `.properties`),
 *          already aggregated by the caller (goal-level + indicator-level).
 */
function GoalPlanLinks({ plans = [] }) {
    const { campus } = useParams();

    if (!plans.length) {
        return (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No plans available for this goal.
            </Text>
        );
    }

    return (
        <Box borderWidth="1px" borderColor="gray.100" borderRadius="md" overflow="hidden">
            {plans.map((plan, index) => {
                const props = plan?.properties || {};
                const statusColor = getPlanStatusColor(props);
                const statusLabel = getPlanStatusLabel(props);
                const target = campus && props.unique_id
                    ? `/${campus}/ati-explorer/plans/${props.unique_id}`
                    : undefined;

                return (
                    <HStack
                        key={props.unique_id || index}
                        justify="space-between"
                        align="center"
                        spacing={3}
                        px={3}
                        py={1.5}
                        borderBottomWidth={index < plans.length - 1 ? '1px' : 0}
                        borderBottomColor="gray.100"
                        _hover={{ bg: 'gray.50' }}
                    >
                        <Link
                            as={RouterLink}
                            to={target}
                            fontSize="sm"
                            fontWeight="medium"
                            color="teal.700"
                            noOfLines={1}
                            flex="1"
                            minW="0"
                            textAlign="left"
                            _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                        >
                            {props.name || '(untitled plan)'}
                        </Link>

                        <Box
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            bg={statusColor.bg}
                            color={statusColor.fg}
                            borderWidth="1px"
                            borderColor={statusColor.solid}
                            flexShrink={0}
                        >
                            <Text
                                fontSize="2xs"
                                fontWeight="bold"
                                textTransform="uppercase"
                                letterSpacing="wide"
                                whiteSpace="nowrap"
                                textAlign="left"
                            >
                                {statusLabel}
                            </Text>
                        </Box>
                    </HStack>
                );
            })}
        </Box>
    );
}

export default GoalPlanLinks;
