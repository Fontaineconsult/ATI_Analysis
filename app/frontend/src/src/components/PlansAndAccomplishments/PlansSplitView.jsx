import React, { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import PlansList from './PlansList';
import PlanDetailPanel from './PlanDetailPanel';

/**
 * Top-level layout for the Plans tab inside PlansAccomplishmentsManager.
 * Mirrors the People and Governance master containers (1/3 left + 2/3 right).
 *
 * Owns the selectedPlanId state. The selected plan is *re-derived* from the
 * current `plans` array on every render so when the parent refreshes data
 * (via onUpdate / loadSingleWorkingGroupData) the detail panel automatically
 * picks up the latest version of the same plan instead of pointing at a
 * stale snapshot.
 *
 * Props:
 *   plans         Array of plan objects from PlansAccomplishmentsManager.
 *   onUpdate(wg)  Callback to refetch a working group's data after an edit.
 *   initialPlanId Optional deep-link id to pre-select on mount.
 */
function PlansSplitView({ plans = [], onUpdate, initialPlanId = null }) {
    const navigate = useNavigate();
    const { campus } = useParams();
    const [selectedPlanId, setSelectedPlanId] = useState(null);

    // Initial selection: deep-link id if it matches, otherwise nothing.
    useEffect(() => {
        if (!selectedPlanId && initialPlanId && plans.some((p) => p.unique_id === initialPlanId)) {
            setSelectedPlanId(initialPlanId);
        }
    }, [initialPlanId, plans, selectedPlanId]);

    // If the selected plan disappears from the list (e.g. year filter change),
    // clear the selection so the empty state shows instead of a stale detail.
    useEffect(() => {
        if (selectedPlanId && !plans.some((p) => p.unique_id === selectedPlanId)) {
            setSelectedPlanId(null);
            if (campus) navigate(`/${campus}/ati-explorer/plans`, { replace: true });
        }
    }, [plans, selectedPlanId, campus, navigate]);

    const selectedPlan = selectedPlanId
        ? plans.find((p) => p.unique_id === selectedPlanId) || null
        : null;

    // Mirrors ImplementationTypeOverview.handleImplementationSelect: update
    // local selection AND push the new URL so the browser bar / share / back
    // button all reflect the current plan.
    const handleSelect = (plan) => {
        setSelectedPlanId(plan.unique_id);
        if (campus) {
            navigate(`/${campus}/ati-explorer/plans/${plan.unique_id}`, { replace: true });
        }
    };

    const handleAfterEdit = (plan) => {
        if (onUpdate && plan?.workingGroup) {
            onUpdate(plan.workingGroup);
        }
    };

    return (
        <Box p={4}>
            <Flex gap={6} align="flex-start">
                <Box flex="1" minW="0">
                    <PlansList
                        plans={plans}
                        selectedId={selectedPlanId}
                        onSelect={handleSelect}
                        emptyMessage="No plans match the current filter."
                    />
                </Box>
                <Box flex="2" minW="0">
                    <PlanDetailPanel plan={selectedPlan} onAfterEdit={handleAfterEdit} />
                </Box>
            </Flex>
        </Box>
    );
}

export default PlansSplitView;
