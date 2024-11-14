import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import SuccessIndicator from '../graph_components/indicators/SuccessIndicator';
import {sortCompositeKeys} from "../../services/utils/sorters";

function EvidenceMasterContainer({ indicators }) {
    if (!indicators || indicators.length === 0) return null;

    // Inline fallback component
    const IndicatorFallback = () => (
        <Box padding={4} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
            <Text color="red.700" fontWeight="bold">Indicator data is unavailable.</Text>
        </Box>
    );

    return (
        <Box mt={6} aria-live="polite" role="region" aria-label={`(${indicators.length}) Success Indicators Listed`}>
            <Heading as="h5" size="md" mb={4}>
                Success Indicators ({indicators.length})
            </Heading>

            {indicators
                .sort(sortCompositeKeys) // Use the imported sorting function
                .map((indicatorWrapper, index) => {
                    const bgColor = index % 2 === 0 ? 'gray.50' : 'gray.100';

                    return indicatorWrapper?.indicator ? (
                        <SuccessIndicator
                            key={index}
                            indicatorData={indicatorWrapper.indicator}
                            evidenceData={indicatorWrapper.evidences[0]}
                            bgColor={bgColor}
                        />
                    ) : (
                        <IndicatorFallback key={index} />  // Render fallback if indicator is null
                    );
                })}
        </Box>
    );
}

export default EvidenceMasterContainer;
