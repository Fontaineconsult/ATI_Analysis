import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

function ReportOverviewMasterContainer() {
    return (
        <Box maxW="800px" mx="auto" p={4}>
            <Heading as="h3" size="lg" mb={4}>
                Report Overview
            </Heading>
            <p>This is the Report Overview section. You can display reports and analytics here.</p>
        </Box>
    );
}

export default ReportOverviewMasterContainer;
