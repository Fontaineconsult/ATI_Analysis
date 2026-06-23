import React from 'react';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Heading,
} from '@chakra-ui/react';
import StatusLevels from './StatusLevelDefs';
import Members from './members';

/*
 * Reference material for the View Reports landing — the maturity-level legend and the active
 * committee roster. Previously these lived in the xl-only right rail (hidden on most screens);
 * here they sit below the metrics in a collapsed-by-default accordion, so they're reclaimed
 * at every breakpoint without lengthening the landing. Each panel's component self-loads from
 * its context; the Accordion mounts panel content, so those load effects still fire.
 */
function ReportReferenceRow() {
    return (
        <Box bg="white" borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor="gray.200" mb={6}>
            <Accordion allowMultiple defaultIndex={[]}>
                <AccordionItem border="none">
                    <AccordionButton _hover={{ bg: 'gray.50' }} borderTopRadius="lg">
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="sm" color="teal.700">Status Level Definitions</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <StatusLevels />
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none" borderTopWidth="1px" borderTopColor="gray.100">
                    <AccordionButton _hover={{ bg: 'gray.50' }}>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="sm" color="teal.700">Active Committee Members</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Members />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default ReportReferenceRow;
