import React, { useEffect } from 'react';
import { Flex, Button, Box } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';
import { useSettings } from "../context/SettingsContext";

function SubNavbar() {
    const location = useLocation();
    const { updateCurrentWorkingGroup } = useSettings();

    useEffect(() => {
        if (location.pathname.includes('/ati-explorer')) {
            const path = location.pathname.split('/').pop();
            if (['web', 'instructional-materials', 'procurement'].includes(path)) {
                updateCurrentWorkingGroup(path);
            }
        }
    }, [location.pathname, updateCurrentWorkingGroup]);

    let subNavItems;
    if (location.pathname.includes('/ati-explorer')) {
        subNavItems = [
            { label: 'Web', path: '/ati-explorer/web/goal/1' },
            { label: 'Instructional Materials', path: '/ati-explorer/instructional-materials/goal/1' },
            { label: 'Procurement', path: '/ati-explorer/procurement/goal/1' },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        subNavItems = [
            { label: 'Report Overview', path: '/dashboard/report-overview' },
            // { label: 'Implementations', path: '/dashboard/implementations' },
            { label: 'Settings', path: '/dashboard/settings' },
        ];
    } else if (location.pathname.includes('/about')) {
        subNavItems = [
            // { label: 'ATI Working Group', path: '/about/ati-working-group' },
            { label: 'SF State ATI Overview', path: '/about/sf-state-ati-overview' },
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
            height="52px"
        >
            <Flex justify="center" align="center" height="100%">
                {subNavItems.map((item) => (
                    <Button
                        key={item.label}
                        as={Link}
                        to={item.path}
                        colorScheme={location.pathname === item.path ? 'teal' : 'gray'}
                        variant={location.pathname === item.path ? 'solid' : 'ghost'}
                        size="md"
                        fontWeight={location.pathname === item.path ? 'bold' : 'normal'}
                        _hover={{ textDecoration: 'none', bg: 'teal.100' }}
                        mx={2}
                    >
                        {item.label}
                    </Button>
                ))}
            </Flex>
        </Box>
    );
}

export default SubNavbar;