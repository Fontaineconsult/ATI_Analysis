import React from 'react';
import {
    ChakraProvider,
    Box,
    Flex,
    Heading,
    Button,
    Container,
    Text,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Routes, Route, Link as RouterLink } from 'react-router-dom';
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

// In your theme file or App.js
import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
        fontSizes: {
            xs: "0.65rem",
            sm: "0.775rem",
            md: "0.875rem",
            lg: "1rem",
            xl: "1.125rem",
            "2xl": "1.25rem",
            "3xl": "1.5rem",
            "4xl": "1.875rem"
        }
    })




function App() {
    const { currentAcademicYear, updateCurrentAcademicYear } = useSettings();
    const { updateYear } = useData();
    const { user } = React.useContext(UserContext);

    const yearOptions = [
        '2020-2021',
        '2021-2022',
        '2022-2023',
        '2023-2024',
        '2024-2025',
    ];

    const handleYearChange = (year) => {
        updateCurrentAcademicYear(year);
        updateYear(year);
    };

    return (
        <ChakraProvider >
                    {/* Main App Container */}
                    <Box className="App">
                        {/* Header Section */}
                        <Box className="header-container">
                            <Flex as="nav" className="nav-bar" aria-label="Main Navigation">
                                <Flex className="nav-items-container">
                                    <Heading as="h1" className="app-title">
                                        SF State ATI Annual Report
                                    </Heading>
                                    <Button
                                        as={RouterLink}
                                        to="/ati-explorer"
                                        colorScheme="teal"
                                        variant="solid"
                                        className="nav-button"
                                    >
                                        ATI Explorer
                                    </Button>
                                    <Button
                                        as={RouterLink}
                                        to="/dashboard"
                                        colorScheme="teal"
                                        variant="solid"
                                        className="nav-button"
                                    >
                                        Dashboard
                                    </Button>
                                    <Button
                                        as={RouterLink}
                                        to="/about"
                                        colorScheme="teal"
                                        variant="solid"
                                        className="nav-button"
                                    >
                                        About
                                    </Button>
                                </Flex>

                                {/* Year selection and user information */}
                                <Flex alignItems="center">
                                    <Menu>
                                        <MenuButton
                                            as={Button}
                                            rightIcon={<ChevronDownIcon />}
                                            colorScheme="teal"
                                        >
                                            {currentAcademicYear || 'Select Year'}
                                        </MenuButton>
                                        <MenuList bg="white" color="gray.800" border="1px solid" borderColor="gray.200">
                                            {yearOptions.map((year) => (
                                                <MenuItem
                                                    key={year}
                                                    onClick={() => handleYearChange(year)}
                                                    _hover={{ bg: "teal.50" }}      // Light teal background on hover
                                                    _focus={{ bg: "teal.100" }}      // Slightly darker teal on focus
                                                    _active={{ bg: "teal.200" }}     // Even darker teal when active
                                                >
                                                    {year}
                                                </MenuItem>
                                            ))}
                                        </MenuList>
                                    </Menu>

                                    {/* Display the current user name */}
                                    <Flex className="user-info">
                                        <Text fontSize="md" fontWeight="bold" aria-label="Current User">
                                            {user ? `Notating as: ${user.name}` : 'No Active User'}
                                        </Text>
                                    </Flex>
                                </Flex>
                            </Flex>

                            {/* SubNavbar Component */}
                            <SubNavbar />
                        </Box>

                        {/* Main Content Container */}
                        <Box className="main-content">
                            <Container
                                as="main"
                                className="App-content"
                                centerContent
                            >
                                <Routes>
                                    <Route path="/ati-explorer/*" element={<AtiExplorer />} />
                                    <Route path="/dashboard/*" element={<Dashboard />} />
                                    <Route path="/about/*" element={<About />} />
                                </Routes>
                            </Container>
                        </Box>
                    </Box>

        </ChakraProvider>
    );
}

export default App;
