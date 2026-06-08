import React from 'react';
import {
    Badge,
    Box,
    Heading,
    HStack,
    Link,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';

/**
 * Per–success-indicator view of the Assets, Interfaces, and Tools that touch it —
 * reached by working backward through the implementations that evidence the
 * indicator (Impl -remediates-> Asset, -remediates_interface-> Interface,
 * -uses_tool-> Tool). The arrays are projected onto the indicator wrapper by the
 * working-group query (get_all_by_working_group.py). Each row deep-links into the
 * Assets explorer with that item pre-selected
 * (/{campus}/ati-explorer/assets/{tab}/{identifier}).
 *
 * Props: assets, interfaces, tools — arrays of minimal maps from the query.
 */
function IndicatorAssetsPanel({ assets = [], interfaces = [], tools = [] }) {
    const { campus } = useParams();

    const linkTo = (tab, id) =>
        campus && id ? `/${campus}/ati-explorer/assets/${tab}/${encodeURIComponent(id)}` : undefined;

    const Row = ({ to, title, identifier, children }) => (
        <HStack
            justify="space-between"
            align="center"
            spacing={3}
            px={3}
            py={1.5}
            borderBottomWidth="1px"
            borderBottomColor="gray.100"
            _hover={{ bg: 'gray.50' }}
        >
            <Box minW="0" flex="1">
                {to ? (
                    <Link
                        as={RouterLink}
                        to={to}
                        fontSize="sm"
                        fontWeight="medium"
                        color="teal.700"
                        noOfLines={1}
                        _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                    >
                        {title}
                    </Link>
                ) : (
                    <Text fontSize="sm" fontWeight="medium" color="gray.800" noOfLines={1}>
                        {title}
                    </Text>
                )}
                {identifier && (
                    <Text fontSize="2xs" color="gray.400" fontFamily="mono" noOfLines={1}>
                        {identifier}
                    </Text>
                )}
            </Box>
            {children && (
                <HStack spacing={1} flexShrink={0}>
                    {children}
                </HStack>
            )}
        </HStack>
    );

    const ListBox = ({ children }) => (
        <Box borderWidth="1px" borderColor="gray.100" borderRadius="md" overflow="hidden">
            {children}
        </Box>
    );

    const Empty = ({ children }) => (
        <Text fontSize="sm" color="gray.500" fontStyle="italic" py={3}>
            {children}
        </Text>
    );

    return (
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={3}>
            <Heading as="h6" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
                Assets · Interfaces · Tools
            </Heading>

            <Tabs colorScheme="teal" size="sm" variant="line" isLazy>
                <TabList>
                    <Tab fontSize="xs" fontWeight="semibold">Assets ({assets.length})</Tab>
                    <Tab fontSize="xs" fontWeight="semibold">Interfaces ({interfaces.length})</Tab>
                    <Tab fontSize="xs" fontWeight="semibold">Tools ({tools.length})</Tab>
                </TabList>

                <TabPanels>
                    {/* Assets — remediated by this indicator's implementations */}
                    <TabPanel px={0} pt={3}>
                        {assets.length ? (
                            <ListBox>
                                {assets.map((a) => (
                                    <Row
                                        key={a.unique_id || a.asset_identifier}
                                        to={linkTo('assets', a.asset_identifier)}
                                        title={a.title || '(untitled asset)'}
                                        identifier={a.asset_identifier}
                                    >
                                        {a.scope && (
                                            <Badge colorScheme="teal" variant="subtle" fontSize="2xs" textTransform="capitalize">
                                                {a.scope}
                                            </Badge>
                                        )}
                                        {a.asset_class && (
                                            <Badge colorScheme="gray" variant="subtle" fontSize="2xs">
                                                {a.asset_class.replace(/_/g, ' ')}
                                            </Badge>
                                        )}
                                    </Row>
                                ))}
                            </ListBox>
                        ) : (
                            <Empty>No assets remediated for this indicator.</Empty>
                        )}
                    </TabPanel>

                    {/* Interfaces — remediated_interface by this indicator's implementations */}
                    <TabPanel px={0} pt={3}>
                        {interfaces.length ? (
                            <ListBox>
                                {interfaces.map((i) => (
                                    <Row
                                        key={i.unique_id || i.interface_identifier}
                                        to={linkTo('interfaces', i.interface_identifier)}
                                        title={i.title || '(untitled interface)'}
                                        identifier={i.interface_identifier}
                                    >
                                        {i.function && (
                                            <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                                                {i.function.replace(/-/g, ' ')}
                                            </Badge>
                                        )}
                                        {i.provenance && (
                                            <Badge colorScheme="gray" variant="subtle" fontSize="2xs">
                                                {i.provenance}
                                            </Badge>
                                        )}
                                    </Row>
                                ))}
                            </ListBox>
                        ) : (
                            <Empty>No interfaces remediated for this indicator.</Empty>
                        )}
                    </TabPanel>

                    {/* Tools — uses_tool by this indicator's implementations */}
                    <TabPanel px={0} pt={3}>
                        {tools.length ? (
                            <ListBox>
                                {tools.map((t) => (
                                    <Row
                                        key={t.unique_id || t.tool_identifier}
                                        to={linkTo('tools', t.tool_identifier)}
                                        title={t.title || '(untitled tool)'}
                                        identifier={t.tool_identifier}
                                    />
                                ))}
                            </ListBox>
                        ) : (
                            <Empty>No tools used for this indicator.</Empty>
                        )}
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
}

export default IndicatorAssetsPanel;
