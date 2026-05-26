
import { Flex, Button, Box } from '@chakra-ui/react';
import React, { useEffect, useContext } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useSettings } from "../context/SettingsContext";

import {UserContext} from "../context/UserContext";

function SubNavbar() {
    const location = useLocation();
    const { campus } = useParams();
    const { updateCurrentWorkingGroup, currentWorkingGroup } = useSettings();
    const { isUserAdmin } = useContext(UserContext);

    useEffect(() => {
        if (location.pathname.includes('/ati-explorer')) {
            const pathSegments = location.pathname.split('/');
            // Get the segment after 'ati-explorer'
            const atiExplorerIndex = pathSegments.indexOf('ati-explorer');
            if (atiExplorerIndex !== -1 && pathSegments[atiExplorerIndex + 1]) {
                const workingGroup = pathSegments[atiExplorerIndex + 1];

                if (['web', 'instructional-materials', 'procurement'].includes(workingGroup)) {
                    console.log("UPDATING", workingGroup);
                    console.log("Current working group before update:", currentWorkingGroup);
                    updateCurrentWorkingGroup(workingGroup);
                }
            }
        }
    }, [location.pathname, updateCurrentWorkingGroup]);

    const campusPrefix = campus ? `/${campus}` : '';

    let subNavItems;
    if (location.pathname.includes('/ati-explorer')) {
        subNavItems = [
            { label: 'Web', path: `${campusPrefix}/ati-explorer/web/goal/1` },
            { label: 'Instructional Materials', path: `${campusPrefix}/ati-explorer/instructional-materials/goal/1` },
            { label: 'Procurement', path: `${campusPrefix}/ati-explorer/procurement/goal/1` },
            { label: 'Implementations', path: `${campusPrefix}/ati-explorer/implementations` },
            { label: 'Plans', path: `${campusPrefix}/ati-explorer/plans` },
            { label: 'People', path: `${campusPrefix}/ati-explorer/people` },
            { label: 'Governance', path: `${campusPrefix}/ati-explorer/governance` },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        subNavItems = [
            { label: 'View Reports', path: `${campusPrefix}/dashboard/reports` },
            { label: 'Copy Report', path: `${campusPrefix}/dashboard/report-overview` },
            { label: 'Campus Plan', path: `${campusPrefix}/dashboard/campus-plan` },
            { label: 'Settings', path: `${campusPrefix}/dashboard/settings` },
        ];
    } else if (location.pathname.includes('/about')) {
        subNavItems = [
            { label: 'ATI Overview', path: `${campusPrefix}/about/sf-state-ati-overview` },
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
