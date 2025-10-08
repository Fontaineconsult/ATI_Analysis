import React, { useEffect, useContext } from 'react';
import { Flex, Button, Box } from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';
import { useSettings } from "../context/SettingsContext";
import { DataContext } from '../context/DataContext';
import {UserContext} from "../context/UserContext";

function SubNavbar() {
    const location = useLocation();
    const { updateCurrentWorkingGroup } = useSettings();
    const { isUserAdmin } = useContext(UserContext);

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
            { label: 'Implementations', path: '/ati-explorer/implementations' },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        subNavItems = [
            { label: 'View Reports', path: '/dashboard/reports' },
            { label: 'Copy Report', path: '/dashboard/report-overview' },
            // { label: 'Implementations', path: '/dashboard/implementations' },
            { label: 'Settings', path: '/dashboard/settings', requiresAdmin: true },
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
            bg="white"
            borderBottomWidth="1px"
            borderColor="gray.200"
            boxShadow="sm"
            position="relative"
            height="48px"
        >
            <Flex
                justify="center"
                align="center"
                height="100%"
                px={6}
            >
                {subNavItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    const isDisabled = item.requiresAdmin && !isUserAdmin();

                    return (
                        <React.Fragment key={item.label}>
                            <Button
                                as={isDisabled ? undefined : Link}
                                to={isDisabled ? undefined : item.path}
                                size="sm"
                                variant="ghost"
                                position="relative"
                                px={4}
                                isDisabled={isDisabled}
                                color={isDisabled ? 'gray.400' : (isActive ? 'teal.700' : 'gray.600')}
                                fontWeight={isActive ? 'semibold' : 'normal'}
                                fontSize="sm"
                                bg={isActive && !isDisabled ? 'teal.50' : 'transparent'}
                                cursor={isDisabled ? 'not-allowed' : 'pointer'}
                                opacity={isDisabled ? 0.6 : 1}
                                _hover={isDisabled ? {} : {
                                    textDecoration: 'none',
                                    bg: isActive ? 'teal.100' : 'gray.50',
                                    color: isActive ? 'teal.800' : 'gray.700'
                                }}
                                _active={isDisabled ? {} : {
                                    bg: isActive ? 'teal.100' : 'gray.100'
                                }}
                                transition="all 0.2s"
                                borderRadius="md"
                                _after={isActive && !isDisabled ? {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: '-1px',
                                    left: '10%',
                                    right: '10%',
                                    height: '2px',
                                    bg: 'teal.500',
                                    borderRadius: 'full'
                                } : {}}
                            >
                                {item.label}
                            </Button>
                            {index < subNavItems.length - 1 && (
                                <Box
                                    width="1px"
                                    height="20px"
                                    bg="gray.200"
                                    mx={3}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </Flex>
        </Box>
    );
}

export default SubNavbar;