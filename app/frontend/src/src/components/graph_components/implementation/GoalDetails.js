import React, { useState, useContext } from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    Box,
    Text,
    HStack,
    Button,
    Heading,
    AccordionIcon
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import Plan from './Plan';
import Accomplishment from './Accomplishment';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext } from '../../../context/SettingsContext';

function GoalDetails({ plans, plansWithProgressNotes, accomplishments, indicators, goalNumber }) {
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentAcademicYear, currentWorkingGroup } = useContext(SettingsContext);
    const [showNewPlan, setShowNewPlan] = useState(false);
    const [showNewAccomplishment, setShowNewAccomplishment] = useState(false);

    // Look up completed_year / abandoned_year for a plain plan node by
    // unique_id. The years live on the wrapper objects (plans_with_progress_notes
    // / evidence.plans_with_notes) that the compound query projects alongside
    // the bare plan node, so we hand them through to <Plan>.
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

    // Calculate the total count of plans
    const goalPlansCount = plans ? plans.length : 0;
    const indicatorPlansCount = indicators.reduce((acc, indicator) => {
        return acc + (indicator.evidences[0]?.plans?.length || 0);
    }, 0);
    const totalPlansCount = goalPlansCount + indicatorPlansCount;

    const handleRefresh = () => {
        loadSingleWorkingGroupData(currentWorkingGroup);
        setShowNewPlan(false);
        setShowNewAccomplishment(false);
    };

    return (
        <Box mt={4}>
            <Heading size="sm" mb={3} color="teal.700">Plans and Accomplishments</Heading>
            <Accordion allowToggle>
                {/* Accordion for Plans */}
                <AccordionItem
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    mb={2}
                    overflow="hidden"
                >
                    <h2>
                        <AccordionButton
                            bg="white"
                            _hover={{ bg: "gray.50" }}
                            _expanded={{ bg: "teal.50" }}
                            py={3}
                            px={4}
                        >
                            <Box flex="1" textAlign="left" fontWeight="semibold" color="teal.700">
                                Plans ({totalPlansCount})
                            </Box>
                            <AccordionIcon color="teal.600" />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel bg="white" px={4} pb={4}>
                        <HStack justify="flex-end" mb={3}>
                            <Button
                                size="xs"
                                colorScheme="teal"
                                leftIcon={<FaPlus />}
                                onClick={() => setShowNewPlan(!showNewPlan)}
                                variant={showNewPlan ? "outline" : "solid"}
                            >
                                {showNewPlan ? 'Cancel' : 'Add Plan'}
                            </Button>
                        </HStack>

                        {/* New Plan Form */}
                        {showNewPlan && (
                            <Plan
                                isNew={true}
                                goalNumber={goalNumber}
                                workingGroup={currentWorkingGroup}
                                academicYear={currentAcademicYear}
                                onSuccess={handleRefresh}
                                onCancel={() => setShowNewPlan(false)}
                            />
                        )}

                        {/* Existing Plans */}
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
                    </AccordionPanel>
                </AccordionItem>

                {/* Accordion for Accomplishments */}
                <AccordionItem
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    mb={2}
                    overflow="hidden"
                >
                    <h2>
                        <AccordionButton
                            bg="white"
                            _hover={{ bg: "gray.50" }}
                            _expanded={{ bg: "teal.50" }}
                            py={3}
                            px={4}
                        >
                            <Box flex="1" textAlign="left" fontWeight="semibold" color="teal.700">
                                Accomplishments ({accomplishments?.length || 0})
                            </Box>
                            <AccordionIcon color="teal.600" />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel bg="white" px={4} pb={4}>
                        <HStack justify="flex-end" mb={3}>
                            <Button
                                size="xs"
                                colorScheme="blue"
                                leftIcon={<FaPlus />}
                                onClick={() => setShowNewAccomplishment(!showNewAccomplishment)}
                                variant={showNewAccomplishment ? "outline" : "solid"}
                            >
                                {showNewAccomplishment ? 'Cancel' : 'Add Accomplishment'}
                            </Button>
                        </HStack>

                        {/* New Accomplishment Form */}
                        {showNewAccomplishment && (
                            <Accomplishment
                                isNew={true}
                                goalNumber={goalNumber}
                                workingGroup={currentWorkingGroup}
                                academicYear={currentAcademicYear}
                                onSuccess={handleRefresh}
                                onCancel={() => setShowNewAccomplishment(false)}
                            />
                        )}

                        {/* Existing Accomplishments */}
                        {accomplishments && accomplishments.length > 0 ? (
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
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default GoalDetails;