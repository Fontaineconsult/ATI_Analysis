import React from 'react';
import { ChakraProvider, Box, Flex, Heading, Button, Spacer, Container, Text } from '@chakra-ui/react';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';  // Use RouterLink to avoid nested links
import { DataProvider } from './context/DataContext';
import { useData } from './hooks/useData';
import AtiExplorer from './components/AtiExplorer';
import Dashboard from './components/Dashboard';
import About from './components/About';
import SubNavbar from './components/SubNavbar';
import './styles/App.css';
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { StatusLevelProvider } from "./context/StatusLevelContext";
import { UserProvider, UserContext } from './context/UserContext';

function App() {
    // Access the current academic year using the useSettings hook
    const { currentAcademicYear } = useSettings();

    // Access the current user using the UserContext
    const { user } = React.useContext(UserContext);

    return (
        <ChakraProvider>
            <UserProvider>
                <DataProvider>
                    <StatusLevelProvider>
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
                                    <Button as={RouterLink} to="/ati-explorer" colorScheme="teal" variant="solid" mr={4}>
                                        ATI Explorer
                                    </Button>
                                    <Button as={RouterLink} to="/dashboard" colorScheme="teal" variant="solid" mr={4}>
                                        Dashboard
                                    </Button>
                                    <Button as={RouterLink} to="/about" colorScheme="teal" variant="solid" mr={4}>
                                        About
                                    </Button>
                                </Flex>

                                <Spacer />

                                {/* Display the current academic year and user name on the right */}
                                <Flex direction="column" alignItems="flex-end">
                                    <Text fontSize="md" fontWeight="bold" aria-label="Current Academic Year">
                                        Current Year: {currentAcademicYear}
                                    </Text>
                                    <Text fontSize="md" fontWeight="bold" aria-label="Current User">
                                        {/* Show the current user's name or fallback if not available */}
                                        {user ? `Notating as: ${user.name}` : 'No Active User'}
                                    </Text>
                                </Flex>
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
                    </StatusLevelProvider>
                </DataProvider>
            </UserProvider>
        </ChakraProvider>
    );
}

export default App;
