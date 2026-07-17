import React, { useContext, useEffect } from 'react';
import {
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
    Divider,
    Image,
    VisuallyHidden
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Routes, Route, NavLink as RouterNavLink, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from './hooks/useData';
import useRouteAnnouncer from './hooks/useRouteAnnouncer';
import { UserContext } from './context/UserContext';
import { useAuth } from './context/AuthContext';
import AtiExplorer from './components/AtiExplorer';
import Dashboard from './components/Dashboard';
import About from './components/About';
import SubNavbar from './components/SubNavbar';
import YseAvailabilityBanner from './components/functional_components/YseAvailabilityBanner';
import './styles/App.css';
import { useSettings } from "./context/SettingsContext";
import sfbrnLogoLight from './assets/img/sfbrn-logo-light.svg';

// Wrapper component that syncs the :campus URL param to SettingsContext
function CampusSyncWrapper({ children }) {
    const { campus } = useParams();
    const { updateCurrentCampus } = useSettings();

    useEffect(() => {
        if (campus) {
            updateCurrentCampus(campus);
        }
    }, [campus]);

    return children;
}

// Inner app content rendered inside /:campus routes
function AppContent() {
    const { campus } = useParams();
    const { currentAcademicYear, updateCurrentAcademicYear, campuses, getCampusName } = useSettings();
    const { updateYear } = useData();
    const {
        currentUser,
        setUser,
        individuals
    } = useContext(UserContext);
    const { authUser, enforced, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const activeIndividuals = individuals?.filter(person => person.active) || [];

    const yearOptions = [
        '2020-2021',
        '2021-2022',
        '2022-2023',
        '2023-2024',
        '2024-2025',
        '2025-2026',
    ];

    const handleYearChange = (year) => {
        updateCurrentAcademicYear(year);
        updateYear(year);
    };

    const handlePersonChange = (person) => {
        setUser(person);
    };

    const handleCampusChange = (newCampusAbbreviation) => {
        // Replace the campus segment in the current path
        // Current path is relative to basename (/ati), so it starts with /<campus>/...
        const pathAfterCampus = location.pathname.replace(/^\/[^/]+/, '');
        navigate(`/${newCampusAbbreviation}${pathAfterCampus || '/dashboard'}`);
    };

    const campusDisplayName = getCampusName(campus);
    const routeAnnouncement = useRouteAnnouncer();

    return (
        <>
            {/* Skip link — first focusable element on the page (APG: Landmarks).
                Visually hidden until keyboard focus reaches it. */}
            <Box
                as="a"
                href="#main-content"
                position="absolute"
                top="-48px"
                left={4}
                zIndex={100}
                bg="white"
                color="teal.700"
                fontWeight="semibold"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="md"
                boxShadow="lg"
                transition="top 0.15s"
                _focus={{ top: 3, outline: '2px solid', outlineColor: 'teal.500' }}
            >
                Skip to main content
            </Box>

            {/* Announces page-level navigation to screen readers — React Router
                swaps content silently otherwise. */}
            <VisuallyHidden aria-live="polite" role="status">
                {routeAnnouncement}
            </VisuallyHidden>

            {/* Header Section */}
            <Box
                bg="teal.800"
                borderBottomWidth="2px"
                borderColor="teal.900"
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
                        <Box>
                            <Heading as="h1" size="md" whiteSpace="nowrap">
                                <Image
                                    src={sfbrnLogoLight}
                                    alt={`SFBRN â€” ${campusDisplayName} ATI Annual Report`}
                                    height="24px"
                                    width="auto"
                                    draggable={false}
                                />
                            </Heading>
                            {/* Thin brand rule â€” the logo's accent trio, in the
                                lightened on-navy variants */}
                            <Box
                                mt="5px"
                                height="2px"
                                borderRadius="full"
                                bgGradient="linear(to-r, teal.400, purple.400, coral.400)"
                                aria-hidden="true"
                            />
                            <Text
                                mt="3px"
                                fontSize="2xs"
                                color="whiteAlpha.800"
                                textTransform="uppercase"
                                letterSpacing="0.18em"
                                whiteSpace="nowrap"
                            >
                                Accessible Technology Initiative
                            </Text>
                        </Box>

                        <Divider
                            orientation="vertical"
                            height="40px"
                            borderColor="whiteAlpha.400"
                        />

                        <HStack spacing={2}>
                            <Button
                                as={RouterNavLink}
                                to={`/${campus}/ati-explorer`}
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
                                as={RouterNavLink}
                                to={`/${campus}/dashboard`}
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
                                as={RouterNavLink}
                                to={`/${campus}/about`}
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

                    {/* Right side - Campus selector, Year selector, Person selector and User info */}
                    <HStack spacing={4}>
                        {/* Campus Selector */}
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
                                {campusDisplayName || 'Select Campus'}
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
                                    Campus
                                </Text>
                                {campuses.map((c) => (
                                    <MenuItem
                                        key={c.abbreviation}
                                        fontSize="sm"
                                        color="gray.700"
                                        onClick={() => handleCampusChange(c.abbreviation)}
                                        _hover={{ bg: "teal.50", color: "teal.700" }}
                                        _focus={{ bg: "teal.50" }}
                                        bg={campus === c.abbreviation ? 'teal.50' : 'transparent'}
                                        fontWeight={campus === c.abbreviation ? 'semibold' : 'normal'}
                                    >
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </Menu>

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

                        {/* Sign out â€” only meaningful when auth is enforced */}
                        {enforced && authUser && (
                            <Button
                                size="sm"
                                variant="ghost"
                                color="white"
                                fontWeight="medium"
                                onClick={logout}
                                title={`Signed in as ${authUser.display_name}`}
                                _hover={{ bg: 'whiteAlpha.200' }}
                                _active={{ bg: 'whiteAlpha.300' }}
                            >
                                Sign out
                            </Button>
                        )}
                    </HStack>
                </Flex>

                {/* SubNavbar Component */}
                <SubNavbar />
            </Box>

            {/* Main Content Container. id + tabIndex make it the skip-link target
                and the focus landing spot after page-level navigation. */}
            <Box as="main" id="main-content" tabIndex={-1} outline="none" pt={6}>
                <Container
                    maxW="container.xl"
                    px={6}
                >
                    {/* Global "no Year Success Evidence for this campus/year" banner — shows
                        on every YSE-displaying view; renders nothing when evidence exists. */}
                    <YseAvailabilityBanner />
                    <Routes>
                        <Route path="ati-explorer/*" element={<AtiExplorer />} />
                        <Route path="dashboard/*" element={<Dashboard />} />
                        <Route path="about/*" element={<About />} />
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </Container>
            </Box>
        </>
    );
}

// ChakraProvider (with the app theme) mounts at the root in index.js so that
// AuthGate/Login — rendered above <App/> — resolve theme tokens too.
function App() {
    return (
        <Box minH="100vh" bg="gray.50">
            <Routes>
                <Route path="/:campus/*" element={
                    <CampusSyncWrapper>
                        <AppContent />
                    </CampusSyncWrapper>
                } />
                <Route path="/" element={<Navigate to="/sfsu/dashboard" replace />} />
            </Routes>
        </Box>
    );
}

export default App;
