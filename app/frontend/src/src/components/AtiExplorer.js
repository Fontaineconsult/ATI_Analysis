import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import WorkingGroupMasterContainer from './ati_explorer_containers/WorkingGroupMasterContainer';  // Import the container

function AtiExplorer() {
    return (
        <Box maxW="1200px" mx="auto" p={4}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                ATI Explorer
            </Heading>

            {/* Render the WorkingGroupMasterContainer inside ATI Explorer */}
            <WorkingGroupMasterContainer />
        </Box>
    );
}

export default AtiExplorer;
