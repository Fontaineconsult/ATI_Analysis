import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import WorkingGroupMasterContainer from './ati_explorer_containers/WorkingGroupMasterContainer';  // Import the container
import { useData } from '../hooks/useData';


function AtiExplorer() {

    const { data, loading, error, selectedYear } = useData(); // Access data and selected year

    if (loading) return <Text>Loading data for {selectedYear}...</Text>;
    if (error) return <Text>Error: {error}</Text>;

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
