import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ChakraProvider, Box, Flex, Heading, Button, Spacer, Container } from '@chakra-ui/react'; // Import Chakra components
import './styles/App.css'; // Import your custom styles
import Home from './components/Home';
import About from './components/About';
import Dashboard from './components/Dashboard';
import AtiExplorer from './components/AtiExplorer';
import { UserContext } from './context/UserContext'; // Import UserContext

function App() {
    const { user } = useContext(UserContext); // Access context (just as a placeholder)

    return (
        <ChakraProvider>
            <Box className="App">
                {/* Navigation Bar */}
                <Flex
                    className="App-header"
                    as="nav"
                    bg="teal.600"  /* Background color with good contrast */
                    p={4}
                    color="white"
                    alignItems="center"
                    aria-label="Main Navigation"  // ARIA label for screen readers
                >
                    <Flex alignItems="center">
                        <Heading as="h1" size="lg" aria-label="ATI App" mr={8}>
                            ATI App
                        </Heading>

                        {/* Navigation Buttons - Start */}
                        <Flex>
                            {/* ATI Explorer Button */}
                            <Button colorScheme="teal" variant="solid" mr={4}>
                                <Link to="/ati-explorer">ATI Explorer</Link>
                            </Button>

                            {/* Add new navigation buttons below (Example: Dashboard) */}
                            <Button colorScheme="teal" variant="solid" mr={4}>
                                <Link to="/dashboard">Dashboard</Link>
                            </Button>

                            {/* Add more buttons as needed here */}
                            <Button colorScheme="teal" variant="solid" mr={4}>
                                <Link to="/about">About</Link>
                            </Button>
                        </Flex>
                        {/* Navigation Buttons - End */}
                    </Flex>

                    <Spacer /> {/* This ensures the buttons are aligned to the left */}
                </Flex>

                {/* Main content area with max-width and horizontally centered layout */}
                <Container as="main" className="App-content" p={4} maxW="1200px" centerContent>
                    <Routes>
                        <Route path="/ati-explorer" element={<AtiExplorer />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                </Container>
            </Box>
        </ChakraProvider>
    );
}

export default App;
