import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

function SettingsMasterContainer() {
    return (
        <Box maxW="800px" mx="auto" p={4}>
            <Heading as="h3" size="lg" mb={4}>
                Settings
            </Heading>
            <p>Here you can manage system settings and preferences for the dashboard and user accounts.</p>
        </Box>
    );
}

export default SettingsMasterContainer;
