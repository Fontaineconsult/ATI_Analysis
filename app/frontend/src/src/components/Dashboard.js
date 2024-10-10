import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

function Dashboard() {
    return (
        <Box maxW="800px" mx="auto" p={4} textAlign="center"> {/* Horizontally centered content */}
            <Heading as="h2" size="xl" mb={6}>
                Dashboard
            </Heading>
            <p>Here’s your personalized dashboard...</p>
        </Box>
    );
}

export default Dashboard;
