import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import SuccessIndicator from '../graph_components/indicators/SuccessIndicator';  // Import Indicator component

function EvidenceMasterContainer({ indicators }) {
    if (!indicators || indicators.length === 0) return null;

    return (
        <Box mt={6}>
            <Heading as="h5" size="md" mb={4}>
                Success Indicators
            </Heading>

            {/* Loop through indicators and pass each indicator and its evidences to the Indicator component */}
            {indicators
                .sort((a, b) => {
                    const numA = parseFloat(a.indicator.properties.composite_key.split('-')[0]);
                    const numB = parseFloat(b.indicator.properties.composite_key.split('-')[0]);
                    return numA - numB;
                })
                .map((indicatorWrapper, index) => (
                    <SuccessIndicator
                        key={index}
                        indicatorData={indicatorWrapper.indicator}
                        statusLevel={indicatorWrapper.evidences[0]?.statusLevel}  // Pass the statusLevel data
                    />
                ))}


        </Box>
    );
}

export default EvidenceMasterContainer;
