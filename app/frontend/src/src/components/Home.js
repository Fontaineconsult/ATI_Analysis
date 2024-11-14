import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

function Home() {
    return (
        <Box maxW="800px" mx="auto" p={4} textAlign="center"> {/* Horizontally centered content */}
            <Heading as="h2" size="xl" mb={6}>
                Welcome to the SF State ATI Graph Database Application
            </Heading>
            <p>This application manages the SF State ATI documentation requirements</p>
        </Box>
    );
}

export default Home;