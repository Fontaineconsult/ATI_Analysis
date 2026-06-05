import React, { useState, useContext } from 'react';
import { Box, Flex, Text, Button, Heading } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import Plan from './Plan';
import Accomplishment from './Accomplishment';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext } from '../../../context/SettingsContext';

// A goal-level card holding either Plans or Accomplishments — both shown side-by-side, up front.
const PanelCard = ({ children }) => (
    <Box flex="1" minW="0" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={4}>
        {children}
    </Box>
);

function GoalDetails({ plans, plansWithProgressNotes, accomplishments, indicators, goalNumber }) {
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentAcademicYear, currentWorkingGroup } = useContext(SettingsContext);
    const [showNewPlan, setShowNewPlan] = useState(false);
    const [showNewAccomplishment, setShowNewAccomplishment] = useState(false);

    // completed_year / abandoned_year live on the wrapper objects projected alongside each plan.
    const goalLevelYearsById = React.useMemo(() => {
        const m = new Map();
        (plansWithProgressNotes || []).forEach((w) => {
            const id = w?.plan?.properties?.unique_id;
            if (id) m.set(id, { completed_year: w.completed_year || null, abandoned_year: w.abandoned_year || null });
        });
        return m;
    }, [plansWithProgressNotes]);

    const yearsFromEvidence = (evidence, planUniqueId) => {
        const w = (evidence?.plans_with_notes || []).find((wn) => wn?.plan?.properties?.unique_id === planUniqueId);
        if (!w) return { completed_year: null, abandoned_year: null };
        return { completed_year: w.completed_year || null, abandoned_year: w.abandoned_year || null };
    };

    const goalPlansCount = plans ? plans.length : 0;
    const indicatorPlansCount = indicators.reduce(
        (acc, indicator) => acc + (indicator.evidences[0]?.plans?.length || 0), 0,
    );
    const totalPlansCount = goalPlansCount + indicatorPlansCount;
    const accomplishmentsCount = accomplishments?.length || 0;

    const handleRefresh = () => {
        loadSingleWorkingGroupData(currentWorkingGroup);
        setShowNewPlan(false);
        setShowNewAccomplishment(false);
    };

    return (
        <Box mt={3}>
            <Flex direction={{ base: 'column', xl: 'row' }} gap={4} align="stretch">
                {/* Plans */}
                <PanelCard>
                    <Flex justify="space-between" align="center" mb={3}>
                        <Heading size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                            Plans ({totalPlansCount})
                        </Heading>
                        <Button
                            size="xs"
                            colorScheme="teal"
                            leftIcon={<FaPlus />}
                            onClick={() => setShowNewPlan(!showNewPlan)}
                            variant={showNewPlan ? 'outline' : 'solid'}
                        >
                            {showNewPlan ? 'Cancel' : 'Add Plan'}
                        </Button>
                    </Flex>

                    {showNewPlan && (
                        <Plan
                            isNew
                            goalNumber={goalNumber}
                            workingGroup={currentWorkingGroup}
                            academicYear={currentAcademicYear}
                            onSuccess={handleRefresh}
                            onCancel={() => setShowNewPlan(false)}
                        />
                    )}

                    {totalPlansCount > 0 ? (
                        <>
                            {plans?.map((goalPlan, index) => {
                                const years = goalLevelYearsById.get(goalPlan?.properties?.unique_id) || {};
                                return (
                                    <Plan
                                        key={`goal-plan-${index}`}
                                        planData={goalPlan}
                                        goalNumber={goalNumber}
                                        workingGroup={currentWorkingGroup}
                                        academicYear={currentAcademicYear}
                                        completedYear={years.completed_year || null}
                                        abandonedYear={years.abandoned_year || null}
                                        onUpdate={handleRefresh}
                                    />
                                );
                            })}
                            {indicators.map((item, index) => (
                                item.evidences[0]?.plans?.map((indicatorPlan, indIndex) => {
                                    const years = yearsFromEvidence(item.evidences[0], indicatorPlan?.properties?.unique_id);
                                    return (
                                        <Plan
                                            key={`indicator-plan-${index}-${indIndex}`}
                                            planData={indicatorPlan}
                                            goalNumber={goalNumber}
                                            workingGroup={currentWorkingGroup}
                                            academicYear={currentAcademicYear}
                                            completedYear={years.completed_year || null}
                                            abandonedYear={years.abandoned_year || null}
                                            onUpdate={handleRefresh}
                                        />
                                    );
                                })
                            ))}
                        </>
                    ) : (
                        !showNewPlan && (
                            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                                No plans available for this goal.
                            </Text>
                        )
                    )}
                </PanelCard>

                {/* Accomplishments */}
                <PanelCard>
                    <Flex justify="space-between" align="center" mb={3}>
                        <Heading size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                            Accomplishments ({accomplishmentsCount})
                        </Heading>
                        <Button
                            size="xs"
                            colorScheme="blue"
                            leftIcon={<FaPlus />}
                            onClick={() => setShowNewAccomplishment(!showNewAccomplishment)}
                            variant={showNewAccomplishment ? 'outline' : 'solid'}
                        >
                            {showNewAccomplishment ? 'Cancel' : 'Add Accomplishment'}
                        </Button>
                    </Flex>

                    {showNewAccomplishment && (
                        <Accomplishment
                            isNew
                            goalNumber={goalNumber}
                            workingGroup={currentWorkingGroup}
                            academicYear={currentAcademicYear}
                            onSuccess={handleRefresh}
                            onCancel={() => setShowNewAccomplishment(false)}
                        />
                    )}

                    {accomplishmentsCount > 0 ? (
                        accomplishments.map((accomplishment, index) => (
                            <Accomplishment
                                key={`accomplishment-${index}`}
                                accomplishmentData={accomplishment}
                                goalNumber={goalNumber}
                                workingGroup={currentWorkingGroup}
                                academicYear={currentAcademicYear}
                                onUpdate={handleRefresh}
                            />
                        ))
                    ) : (
                        !showNewAccomplishment && (
                            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                                No accomplishments available for this goal.
                            </Text>
                        )
                    )}
                </PanelCard>
            </Flex>
        </Box>
    );
}

export default GoalDetails;
