import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import SuccessIndicator from '../graph_components/indicators/SuccessIndicator';

function EvidenceMasterContainer({ indicators }) {
    if (!indicators || indicators.length === 0) return null;

    return (
        <Box mt={6} aria-live="polite" role="region" aria-label={`(${indicators.length}) Success Indicators Listed`}>
            <Heading as="h5" size="md" mb={4}>
                Success Indicators ({indicators.length})
            </Heading>

            {indicators
                .sort((a, b) => {
                    const numA = parseFloat(a.indicator.properties.composite_key.split('-')[0]);
                    const numB = parseFloat(b.indicator.properties.composite_key.split('-')[0]);
                    return numA - numB;
                })
                .map((indicatorWrapper, index) => {
                    // Determine background color based on whether the index is odd or even
                    const bgColor = index % 2 === 0 ? 'gray.50' : 'gray.100';

                    return (
                        <SuccessIndicator
                            key={index}
                            indicatorData={indicatorWrapper?.indicator}
                            evidenceData={indicatorWrapper?.evidences[0]}
                            bgColor={bgColor}  // Pass the background color as a prop
                        />
                    );
                })}
        </Box>
    );
}

export default EvidenceMasterContainer;
