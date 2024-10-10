import React from 'react';
import { Flex, Button, Box } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';
import { useData } from '../hooks/useData';  // Import the useData hook to access DataContext

function SubNavbar() {
    const location = useLocation();
    const { updateYear } = useData(); // Function to update the year in DataContext for ATI Explorer

    // Define sub-nav items based on the current main component
    let subNavItems;
    switch (location.pathname) {
        case '/ati-explorer':
            subNavItems = [
                { label: '2020-2021', year: '2020-2021' },
                { label: '2021-2022', year: '2021-2022' },
                { label: '2022-2023', year: '2022-2023' },
                { label: '2023-2024', year: '2023-2024' },
                { label: '2024-2025', year: '2024-2025' },
            ];
            break;
        case '/dashboard':
            subNavItems = [
                { label: 'User Stats', path: '/dashboard/user-stats' },
                { label: 'System Health', path: '/dashboard/system-health' },
                { label: 'Activity Logs', path: '/dashboard/activity-logs' },
            ];
            break;
        case '/about':
            subNavItems = [
                { label: 'Team', path: '/about/team' },
                { label: 'Contact', path: '/about/contact' },
                { label: 'History', path: '/about/history' },
            ];
            break;
        default:
            subNavItems = [];
            break;
    }

    return (
        <Box bg="gray.100" py={2} boxShadow="md"> {/* Sub-navbar styling */}
            <Flex justify="center" gap={4}>
                {subNavItems.map((item) => (
                    // If we are in ATI Explorer, use `onClick` to update the year
                    location.pathname === '/ati-explorer' ? (
                        <Button
                            key={item.label}
                            colorScheme="teal"
                            variant="ghost"
                            onClick={() => updateYear(item.year)}  // Call updateYear for ATI Explorer
                        >
                            {item.label}
                        </Button>
                    ) : (
                        // Otherwise, render links for navigation (e.g., Dashboard, About)
                        <Button
                            key={item.label}
                            as={Link}
                            to={item.path}  // Use `to` for navigation
                            colorScheme="teal"
                            variant="ghost"
                        >
                            {item.label}
                        </Button>
                    )
                ))}
            </Flex>
        </Box>
    );
}

export default SubNavbar;
