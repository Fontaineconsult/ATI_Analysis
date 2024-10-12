import React from 'react';
import { Flex, Button, Box } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';

function SubNavbar() {
    const location = useLocation();

    // Define sub-nav items based on the current main component
    let subNavItems;
    if (location.pathname.includes('/ati-explorer')) {
        subNavItems = [
            { label: 'Web', path: '/ati-explorer/web' },
            { label: 'Instructional Materials', path: '/ati-explorer/instructional-materials' },
            { label: 'Procurement', path: '/ati-explorer/procurement' },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        subNavItems = [
            { label: 'User Stats', path: '/dashboard/user-stats' },
            { label: 'System Health', path: '/dashboard/system-health' },
            { label: 'Activity Logs', path: '/dashboard/activity-logs' },
        ];
    } else if (location.pathname.includes('/about')) {
        subNavItems = [
            { label: 'Team', path: '/about/team' },
            { label: 'Contact', path: '/about/contact' },
            { label: 'History', path: '/about/history' },
        ];
    } else {
        subNavItems = [];
    }

    return (
        <Box as="nav" bg="gray.100" py={2} boxShadow="md"> {/* Sub-navbar styling */}
            <Flex justify="center" gap={4}>
                {subNavItems.map((item) => (
                    <Button
                        key={item.label}
                        as={Link}
                        to={item.path}
                        colorScheme="teal"
                        variant="ghost"
                    >
                        {item.label}
                    </Button>
                ))}
            </Flex>
        </Box>
    );
}

export default SubNavbar;
