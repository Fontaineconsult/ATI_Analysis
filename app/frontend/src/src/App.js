import React, { useContext } from 'react';
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
    HStack,
    Divider
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import { useData } from './hooks/useData';
import { UserContext } from './context/UserContext';
import AtiExplorer from './components/AtiExplorer';
import Dashboard from './components/Dashboard';
import About from './components/About';
import SubNavbar from './components/SubNavbar';
import './styles/App.css';
import { useSettings } from "./context/SettingsContext";

// Theme extension
import { extendTheme } from '@chakra-ui/react'





const theme = extendTheme({
    fontSizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem"
    },

    colors: {
        teal: {
            50: "#E6FFFA",
            100: "#B2F5EA",
            200: "#81E6D9",
            300: "#4FD1C5",
            400: "#38B2AC",
            500: "#319795",
            600: "#2C7A7B",
            700: "#285E61",
            800: "#234E52",
            900: "#1D4044"
        }
    }
})

function App() {
    const { currentAcademicYear, updateCurrentAcademicYear } = useSettings();
    const { updateYear } = useData();
    const {
        currentUser,
        setUser,
        individuals
    } = useContext(UserContext);

    const activeIndividuals = individuals?.filter(person => person.active) || [];

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

    const handlePersonChange = (person) => {
        setUser(person);
    };

    return (
        <ChakraProvider theme={theme}>
            {/* Main App Container */}
            <Box minH="100vh" bg="gray.50">
                {/* Header Section */}
                <Box
                    bgGradient="linear(to-r, teal.600, teal.500, teal.400)"
                    borderBottomWidth="2px"
                    borderColor="teal.700"
                    boxShadow="md"
                    position="sticky"
                    top={0}
                    zIndex={10}
                >
                    <Flex
                        as="nav"
                        px={6}
                        py={3}
                        justify="space-between"
                        align="center"
                        aria-label="Main Navigation"
                    >
                        {/* Left side - Logo and Navigation */}
                        <HStack spacing={6} align="center">
                            <Heading
                                as="h1"
                                size="md"
                                color="white"
                                fontWeight="bold"
                                whiteSpace="nowrap"
                                textShadow="1px 1px 2px rgba(0,0,0,0.1)"
                            >
                                SF State ATI Annual Report
                            </Heading>

                            <Divider
                                orientation="vertical"
                                height="24px"
                                borderColor="whiteAlpha.400"
                            />

                            <HStack spacing={2}>
                                <Button
                                    as={RouterLink}
                                    to="/ati-explorer"
                                    size="sm"
                                    variant="ghost"
                                    color="white"
                                    fontWeight="medium"
                                    _hover={{
                                        bg: 'whiteAlpha.200',
                                        transform: 'translateY(-1px)',
                                        boxShadow: 'sm'
                                    }}
                                    _activeLink={{
                                        bg: 'whiteAlpha.300',
                                        fontWeight: 'bold'
                                    }}
                                    transition="all 0.2s"
                                >
                                    ATI Explorer
                                </Button>
                                <Button
                                    as={RouterLink}
                                    to="/dashboard"
                                    size="sm"
                                    variant="ghost"
                                    color="white"
                                    fontWeight="medium"
                                    _hover={{
                                        bg: 'whiteAlpha.200',
                                        transform: 'translateY(-1px)',
                                        boxShadow: 'sm'
                                    }}
                                    _activeLink={{
                                        bg: 'whiteAlpha.300',
                                        fontWeight: 'bold'
                                    }}
                                    transition="all 0.2s"
                                >
                                    Dashboard
                                </Button>
                                <Button
                                    as={RouterLink}
                                    to="/about"
                                    size="sm"
                                    variant="ghost"
                                    color="white"
                                    fontWeight="medium"
                                    _hover={{
                                        bg: 'whiteAlpha.200',
                                        transform: 'translateY(-1px)',
                                        boxShadow: 'sm'
                                    }}
                                    _activeLink={{
                                        bg: 'whiteAlpha.300',
                                        fontWeight: 'bold'
                                    }}
                                    transition="all 0.2s"
                                >
                                    About
                                </Button>
                            </HStack>
                        </HStack>

                        {/* Right side - Year selector, Person selector and User info */}
                        <HStack spacing={4}>
                            {/* Year Selector */}
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    size="sm"
                                    bg="white"
                                    color="teal.700"
                                    fontWeight="medium"
                                    _hover={{
                                        bg: 'gray.50',
                                        transform: 'translateY(-1px)'
                                    }}
                                    _active={{
                                        bg: 'gray.100',
                                        transform: 'translateY(0)'
                                    }}
                                    boxShadow="sm"
                                    transition="all 0.2s"
                                >
                                    {currentAcademicYear || 'Select Year'}
                                </MenuButton>
                                <MenuList
                                    bg="white"
                                    borderColor="gray.200"
                                    boxShadow="lg"
                                    py={1}
                                >
                                    <Text
                                        px={3}
                                        py={2}
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        color="gray.600"
                                        textTransform="uppercase"
                                        letterSpacing="wide"
                                    >
                                        Report Year
                                    </Text>
                                    {yearOptions.map((year) => (
                                        <MenuItem
                                            key={year}
                                            fontSize="sm"
                                            color="gray.700"
                                            onClick={() => handleYearChange(year)}
                                            _hover={{ bg: "teal.50", color: "teal.700" }}
                                            _focus={{ bg: "teal.50" }}
                                            bg={currentAcademicYear === year ? 'teal.50' : 'transparent'}
                                            fontWeight={currentAcademicYear === year ? 'semibold' : 'normal'}
                                        >
                                            {year}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>

                            {/* Person Selector */}
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    size="sm"
                                    bg="white"
                                    color="teal.700"
                                    fontWeight="medium"
                                    minW="150px"
                                    _hover={{
                                        bg: 'gray.50',
                                        transform: 'translateY(-1px)'
                                    }}
                                    _active={{
                                        bg: 'gray.100',
                                        transform: 'translateY(0)'
                                    }}
                                    boxShadow="sm"
                                    transition="all 0.2s"
                                    aria-label="Select person"
                                >
                                    {currentUser ? currentUser.name : 'Select Person'}
                                </MenuButton>
                                <MenuList
                                    bg="white"
                                    borderColor="gray.200"
                                    boxShadow="lg"
                                    py={1}
                                    maxH="300px"
                                    overflowY="auto"
                                >
                                    <Text
                                        px={3}
                                        py={2}
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        color="gray.600"
                                        textTransform="uppercase"
                                        letterSpacing="wide"
                                    >
                                        Committee Members
                                    </Text>
                                    <Divider />
                                    {activeIndividuals.map((person) => (
                                        <MenuItem
                                            key={person.unique_id}
                                            fontSize="sm"
                                            color="gray.700"
                                            onClick={() => handlePersonChange(person)}
                                            _hover={{ bg: "teal.50", color: "teal.700" }}
                                            _focus={{ bg: "teal.50" }}
                                            bg={currentUser?.unique_id === person.unique_id ? 'teal.50' : 'transparent'}
                                            fontWeight={currentUser?.unique_id === person.unique_id ? 'semibold' : 'normal'}
                                        >
                                            {person.name}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>

                            <Divider
                                orientation="vertical"
                                height="24px"
                                borderColor="whiteAlpha.400"
                            />

                            {/* User information */}
                            <Box
                                bg="whiteAlpha.200"
                                px={3}
                                py={1.5}
                                borderRadius="md"
                                backdropFilter="blur(10px)"
                            >
                                <Text
                                    fontSize="xs"
                                    color="whiteAlpha.800"
                                    lineHeight="1"
                                    mb={0.5}
                                >
                                    Notating as
                                </Text>
                                <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="white"
                                    aria-label="Current User"
                                    lineHeight="1.2"
                                >
                                    {currentUser ? currentUser.name : 'No Active User'}
                                </Text>
                            </Box>
                        </HStack>
                    </Flex>

                    {/* SubNavbar Component */}
                    <SubNavbar />
                </Box>

                {/* Main Content Container */}
                <Box as="main" pt={6}>
                    <Container
                        maxW="container.xl"
                        px={6}
                    >
                        <Routes>
                            <Route path="/ati-explorer/*" element={<AtiExplorer />} />
                            <Route path="/dashboard/*" element={<Dashboard />} />
                            <Route path="/about/*" element={<About />} />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Container>
                </Box>
            </Box>
        </ChakraProvider>
    );
}

export default App;