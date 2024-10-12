import React from 'react';
import { ChakraProvider, Box, Flex, Heading, Button, Spacer, Container, Text, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
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
    const { currentAcademicYear, updateCurrentAcademicYear } = useSettings();
    const { updateYear } = useData();  // Access the updateYear method to fetch new data

    // Access the current user using the UserContext
    const { user } = React.useContext(UserContext);

    // Year options for the dropdown
    const yearOptions = [
        '2020-2021',
        '2021-2022',
        '2022-2023',
        '2023-2024',
        '2024-2025',
    ];

    const handleYearChange = (year) => {
        updateCurrentAcademicYear(year);  // Update global year state
        updateYear(year);  // Fetch new data for the selected year
    };

    return (
        <ChakraProvider>
            <UserProvider>

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

                                {/* Year Dropdown Menu */}
                                <Menu>
                                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="teal">
                                        {currentAcademicYear || 'Select Year'}
                                    </MenuButton>
                                    <MenuList>
                                        {yearOptions.map((year) => (
                                            <MenuItem
                                                key={year}
                                                onClick={() => handleYearChange(year)}
                                            >
                                                {year}
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </Menu>

                                {/* Display the current user name on the right */}
                                <Flex direction="column" alignItems="flex-end" ml={4}>
                                    <Text fontSize="md" fontWeight="bold" aria-label="Current User">
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

            </UserProvider>
        </ChakraProvider>
    );
}

export default App;
