import React from 'react';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, Box, Text } from '@chakra-ui/react';
import Plan from './Plan';  // Import Plan component
import Accomplishment from './Accomplishment';  // Import Accomplishment component

function GoalDetails({ plans, accomplishments, indicators }) {
    // Calculate the total count of plans
    const goalPlansCount = plans ? plans.length : 0;
    const indicatorPlansCount = indicators.reduce((acc, indicator) => {
        return acc + (indicator.evidences[0].plans?.length || 0);
    }, 0);
    const totalPlansCount = goalPlansCount + indicatorPlansCount;

    return (
        <Box tabIndex={0} className="goal-details-wrapper">
            <h2>Plans and Accomplishments</h2>
            <Accordion allowToggle>
                {/* Accordion for Plans */}
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box className="goal-details-accordion-button">
                                Plans ({totalPlansCount})
                            </Box>
                        </AccordionButton>
                    </h2>
                    <AccordionPanel className="goal-details-panel">
                        {totalPlansCount > 0 ? (
                            <>
                                {/* Render each goalPlan */}
                                {plans.map((goalPlan, index) => (
                                    <Plan key={`goal-${index}`} planData={goalPlan} />
                                ))}
                                {/* Render each indicatorPlan for each indicator */}
                                {indicators.map((item, index) => (
                                    item.evidences[0].plans?.map((indicatorPlan, indIndex) => (
                                        <Plan
                                            key={`indicator-${index}-${indIndex}`}
                                            planData={indicatorPlan}  // Correctly passing indicatorPlan
                                        />
                                    ))
                                ))}
                            </>
                        ) : (
                            <Text className="no-content-text">No plans available for this goal.</Text>
                        )}
                    </AccordionPanel>
                </AccordionItem>

                {/* Accordion for Accomplishments */}
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box className="goal-details-accordion-button">
                                Accomplishments ({accomplishments?.length || 0})
                            </Box>
                        </AccordionButton>
                    </h2>
                    <AccordionPanel className="goal-details-panel">
                        {accomplishments && accomplishments.length > 0 ? (
                            accomplishments.map((accomplishment, index) => (
                                <Accomplishment key={index} accomplishmentData={accomplishment} />
                            ))
                        ) : (
                            <Text className="no-content-text">No accomplishments available for this goal.</Text>
                        )}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default GoalDetails;
