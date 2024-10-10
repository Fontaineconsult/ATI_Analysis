import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

function About() {
    return (
        <Box textAlign="center"> {/* Center the content inside the component */}
            <Heading as="h2" size="xl" mb={6}>
                About the SF State ATI Explorer
            </Heading>
            <p>About about about...</p>
        </Box>
    );
}

export default About;