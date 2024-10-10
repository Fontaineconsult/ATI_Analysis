import React from 'react';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, Box, Heading, Text } from '@chakra-ui/react';
import Plan from './Plan';  // Import Plan component
import Accomplishment from './Accomplishment';  // Import Accomplishment component

function GoalDetails({ plans, accomplishments }) {
    return (
    <Box>
        <h2>Plans and Accomplishments</h2>
        <Accordion allowToggle>
            {/* Accordion for Plans */}
            <AccordionItem>
                <h2>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Plans ({plans?.length || 0})
                        </Box>
                    </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                    {plans && plans.length > 0 ? (
                        plans.map((plan, index) => <Plan key={index} planData={plan} />)
                    ) : (
                        <Text>No plans available for this goal.</Text>
                    )}
                </AccordionPanel>
            </AccordionItem>

            {/* Accordion for Accomplishments */}
            <AccordionItem>
                <h2>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            Accomplishments ({accomplishments?.length || 0})
                        </Box>
                    </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                    {accomplishments && accomplishments.length > 0 ? (
                        accomplishments.map((accomplishment, index) => (
                            <Accomplishment key={index} accomplishmentData={accomplishment} />
                        ))
                    ) : (
                        <Text>No accomplishments available for this goal.</Text>
                    )}
                </AccordionPanel>
            </AccordionItem>
        </Accordion>
    </Box>
    );
}

export default GoalDetails;
