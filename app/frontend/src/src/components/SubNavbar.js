
import { Flex, Button, Box } from '@chakra-ui/react';
import React, { useEffect, useContext } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useSettings } from "../context/SettingsContext";

import {UserContext} from "../context/UserContext";

function SubNavbar() {
    const location = useLocation();
    const { campus } = useParams();
    const { updateCurrentWorkingGroup } = useSettings();
    const { isUserAdmin } = useContext(UserContext);

    useEffect(() => {
        // The working-group views now live under /dashboard/<wg>/goal/<n>. Detect the segment
        // right after 'dashboard' and sync the current working group when it's one of the three.
        if (location.pathname.includes('/dashboard')) {
            const pathSegments = location.pathname.split('/');
            const dashIndex = pathSegments.indexOf('dashboard');
            const segment = dashIndex !== -1 ? pathSegments[dashIndex + 1] : null;
            if (['web', 'instructional-materials', 'procurement'].includes(segment)) {
                updateCurrentWorkingGroup(segment);
            }
        }
    }, [location.pathname, updateCurrentWorkingGroup]);

    const campusPrefix = campus ? `/${campus}` : '';

    let subNavItems;
    if (location.pathname.includes('/ati-explorer')) {
        subNavItems = [
            { label: 'Implementations', path: `${campusPrefix}/ati-explorer/implementations` },
            { label: 'Plans', path: `${campusPrefix}/ati-explorer/plans` },
            { label: 'People', path: `${campusPrefix}/ati-explorer/people` },
            { label: 'Governance', path: `${campusPrefix}/ati-explorer/governance` },
            { label: 'Assets', path: `${campusPrefix}/ati-explorer/assets` },
        ];
    } else if (location.pathname.includes('/dashboard')) {
        // The three working groups carry the brand accent trio as their
        // identity marks (blue/purple/coral — see design-sense §2).
        subNavItems = [
            { label: 'Web', path: `${campusPrefix}/dashboard/web/goal/1`, accent: 'teal.500' },
            { label: 'Instructional Materials', path: `${campusPrefix}/dashboard/instructional-materials/goal/1`, accent: 'purple.500' },
            { label: 'Procurement', path: `${campusPrefix}/dashboard/procurement/goal/1`, accent: 'coral.500' },
            { label: 'View Reports', path: `${campusPrefix}/dashboard/reports` },
            { label: 'Copy Report', path: `${campusPrefix}/dashboard/report-overview` },
            { label: 'Campus Plan', path: `${campusPrefix}/dashboard/campus-plan` },
            { label: 'Settings', path: `${campusPrefix}/dashboard/settings` },
        ];
    } else if (location.pathname.includes('/about')) {
        subNavItems = [
            { label: 'Overview', path: `${campusPrefix}/about/overview` },
            { label: 'Executive Summary', path: `${campusPrefix}/about/executive-summary` },
            { label: 'Core Model', path: `${campusPrefix}/about/core-model` },
            { label: 'Evidence & Implementations', path: `${campusPrefix}/about/evidence` },
            { label: 'Plans & Progress', path: `${campusPrefix}/about/plans` },
            { label: 'Assets & Interfaces', path: `${campusPrefix}/about/assets` },
            { label: 'Adding Data', path: `${campusPrefix}/about/adding-data` },
            { label: 'Glossary', path: `${campusPrefix}/about/glossary` },
        ];
    } else {
        subNavItems = [];
    }

    return (
        <Box
            as="nav"
            aria-label="Section navigation"
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
                                    bg: item.accent || 'teal.500',
                                    borderRadius: 'full'
                                } : {}}
                            >
                                {item.accent && (
                                    <Box
                                        as="span"
                                        display="inline-block"
                                        w="7px"
                                        h="7px"
                                        borderRadius="full"
                                        bg={item.accent}
                                        mr={2}
                                        aria-hidden="true"
                                    />
                                )}
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
