import React from 'react';
import { ChakraProvider, Box, Flex, Heading, Button, Spacer, Container, Text } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';
import { DataProvider } from './context/DataContext';  // Import the DataProvider
import { useData } from './hooks/useData';             // Hook to access data
import AtiExplorer from './components/AtiExplorer';
import Dashboard from './components/Dashboard';
import About from './components/About';
import SubNavbar from './components/SubNavbar';        // Import the SubNavbar
import './styles/App.css';
import {SettingsProvider} from "./context/SettingsContext";
import {useSettings} from "./context/SettingsContext";  // Import the useSettings hook
function App() {
    // Access the current academic year using the useSettings hook
    const { currentAcademicYear } = useSettings();

    return (
        <ChakraProvider>
            <DataProvider>

                    <Box className="App">
                        {/* Main Navigation Bar */}
                        <Flex
                            className="App-header"
                            as="nav"
                            bg="teal.600"
                            p={4}
                            color="white"
                            alignItems="center"
                            aria-label="Main Navigation"

                        >
                            <Flex alignItems="center">
                                <Heading as="h1" size="lg" aria-label="ATI App" mr={8}>
                                    SF State ATI Knowledge Graph
                                </Heading>
                                {/* Main Navigation Buttons */}
                                <Button colorScheme="teal" variant="solid" mr={4}>
                                    <Link to="/ati-explorer">ATI Explorer</Link>
                                </Button>
                                <Button colorScheme="teal" variant="solid" mr={4}>
                                    <Link to="/dashboard">Dashboard</Link>
                                </Button>
                                <Button colorScheme="teal" variant="solid" mr={4}>
                                    <Link to="/about">About</Link>
                                </Button>
                            </Flex>

                            <Spacer />

                            {/* Display the current academic year on the right */}
                            <Text fontSize="md" fontWeight="bold" aria-label="Current Academic Year">
                                Current Year: {currentAcademicYear}
                            </Text>
                        </Flex>

                        {/* Sub Navbar */}
                        <SubNavbar /> {/* Always displayed under the main navigation bar */}

                        {/* Main Content */}
                        <Container as="main" className="App-content" p={4} maxW="1200px" centerContent>
                            <Routes>
                                <Route path="/ati-explorer/*" element={<AtiExplorer />} />
                                <Route path="/dashboard/*" element={<Dashboard />} />
                                <Route path="/about/*" element={<About />} />
                            </Routes>
                        </Container>
                    </Box>

            </DataProvider>
        </ChakraProvider>
    );
}


export default App;
