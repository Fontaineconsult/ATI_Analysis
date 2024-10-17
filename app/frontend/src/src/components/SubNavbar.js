import React, { useContext } from 'react';
import { Flex, Button, Box } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';  // Import the useSettings hook

function SubNavbar() {
    const location = useLocation();
    const { currentWorkingGroup, updateCurrentWorkingGroup } = useSettings();  // Get working group from context

    // Define sub-nav items based on the current main component
    let subNavItems;
    if (location.pathname.includes('/ati-explorer')) {
        subNavItems = [
            { label: 'Web', path: '/ati-explorer/web', group: 'web' },
            { label: 'Instructional Materials', path: '/ati-explorer/instructional-materials', group: 'instructional-materials' },
            { label: 'Procurement', path: '/ati-explorer/procurement', group: 'procurement' },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        subNavItems = [
            { label: 'Report Overview', path: '/dashboard/report-overview' },
            { label: 'Implementations', path: '/dashboard/implementations' },
            { label: 'Settings', path: '/dashboard/settings' },
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

    const handleGroupChange = (group) => {
        updateCurrentWorkingGroup(group);  // Update the working group state
    };

    return (
        <Box as="nav" bg="gray.100" py={2} boxShadow="md"> {/* Sub-navbar styling */}
            <Flex justify="center" gap={4}>
                {subNavItems.map((item) => (
                    <Button
                        key={item.label}
                        as={Link}
                        to={item.path}
                        colorScheme={currentWorkingGroup === item.group ? 'teal' : 'gray'}  // Highlight active group
                        variant={currentWorkingGroup === item.group ? 'solid' : 'ghost'}  // Solid for active group, ghost for inactive
                        size="md"
                        fontWeight={currentWorkingGroup === item.group ? 'bold' : 'normal'}
                        _hover={{ textDecoration: 'none', bg: 'teal.100' }}  // Hover effect
                        onClick={() => handleGroupChange(item.group)}  // Handle group change on click
                    >
                        {item.label}
                    </Button>
                ))}
            </Flex>
        </Box>
    );
}

export default SubNavbar;
