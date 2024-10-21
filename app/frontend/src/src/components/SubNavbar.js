import React from 'react';
import { Flex, Button, Box } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';

function SubNavbar() {
    const location = useLocation();  // Get the current location

    // Define sub-nav items based on the current main component (path)
    let subNavItems;
    if (location.pathname.includes('/ati-explorer')) {
        subNavItems = [
            { label: 'Web', path: '/ati-explorer/web' },
            { label: 'Instructional Materials', path: '/ati-explorer/instructional-materials' },
            { label: 'Procurement', path: '/ati-explorer/procurement' },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        subNavItems = [
            { label: 'Report Overview', path: '/dashboard/report-overview' },
            { label: 'Implementations', path: '/dashboard/implementations' },
            { label: 'Settings', path: '/dashboard/settings' },
        ];
    } else if (location.pathname.includes('/about')) {
        subNavItems = [
            { label: 'ATI Working Group', path: '/about/ati-working-group' },
            { label: 'SF State ATI Overview', path: '/about/sf-state-ati-overview' },
            // { label: 'History', path: '/about/history' },
        ];
    } else {
        subNavItems = [];
    }

    return (
        <Box
            as="nav"
            bg="gray.100"
            py={2}
            boxShadow="md"
            position="relative"
            height="52px" // Fixed height
        > {/* Sub-navbar styling */}
            <Flex justify="center" align="center" height="100%">
                {subNavItems.map((item) => (
                    <Button
                        key={item.label}
                        as={Link}
                        to={item.path}
                        colorScheme={location.pathname === item.path ? 'teal' : 'gray'}  // Highlight if current path matches
                        variant={location.pathname === item.path ? 'solid' : 'ghost'}  // Solid for active, ghost for inactive
                        size="md"
                        fontWeight={location.pathname === item.path ? 'bold' : 'normal'}  // Bold for active
                        _hover={{ textDecoration: 'none', bg: 'teal.100' }}  // Hover effect
                        mx={2} // Margin between buttons
                    >
                        {item.label}
                    </Button>
                ))}
            </Flex>
        </Box>
    );
}

export default SubNavbar;
