import React, { useEffect, useState } from 'react';
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
import { HelpBox } from '../../functional_components/DescriptorHelp';
import { fetchStewardedIct } from '../../../services/api/get';

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
 *
 * When a yearIdentifier is given, a fourth, DERIVED section loads: the ICT
 * footprint behind the indicator's internally-controlled evidence — the
 * implementations' owners/participants → their employing Department/College →
 * every Asset those units/people steward under §508. This answers "what ICT
 * does the responsible unit answer for?" even before remediates/uses_tool
 * wiring exists.
 */
function IndicatorAssetsPanel({ assets = [], interfaces = [], tools = [], yearIdentifier = null }) {
    const { campus } = useParams();

    const [stewarded, setStewarded] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setStewarded(null);
        if (!yearIdentifier) return undefined;
        (async () => {
            try {
                const resp = await fetchStewardedIct(yearIdentifier);
                if (!cancelled) setStewarded(resp?.data || null);
            } catch (_) { /* non-fatal: the derived section just doesn't render */ }
        })();
        return () => { cancelled = true; };
    }, [yearIdentifier]);

    const stewardedAssets = stewarded?.assets || [];
    const stewardUnits = (stewarded?.units || []).map((u) => u.name).join(', ');

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
                    <Text fontSize="2xs" color="gray.600" fontFamily="mono" noOfLines={1}>
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
        <Text fontSize="sm" color="gray.600" fontStyle="italic" py={3}>
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
                    <Tab fontSize="xs" fontWeight="semibold">Remediated ({assets.length})</Tab>
                    <Tab fontSize="xs" fontWeight="semibold">Interfaces ({interfaces.length})</Tab>
                    <Tab fontSize="xs" fontWeight="semibold">Tools ({tools.length})</Tab>
                    {stewardedAssets.length > 0 && (
                        <Tab fontSize="xs" fontWeight="semibold">Unit portfolio ({stewardedAssets.length})</Tab>
                    )}
                </TabList>

                <TabPanels>
                    {/* Assets — remediated by this indicator's implementations */}
                    <TabPanel px={0} pt={3}>
                        <HelpBox nodeType="Asset" />
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
                        <HelpBox nodeType="Interface" />
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
                        <HelpBox nodeType="Tool" />
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

                    {/* Unit portfolio — DERIVED: internal evidence → owners/participants →
                        their units → the ICT those units/people steward under §508.
                        Every asset is stewarded by definition; this tab differs from
                        "Remediated" by RELATIONSHIP — who answers for the asset, not
                        whether this indicator's work touches it. Portfolio assets with
                        no remediation wiring here are the indicator's exposure. */}
                    {stewardedAssets.length > 0 && (
                        <TabPanel px={0} pt={3}>
                            <Text fontSize="xs" color="gray.600" mb={2}>
                                The §508 portfolio of the responsible unit{stewarded?.units?.length === 1 ? '' : 's'}
                                {stewardUnits ? ` (${stewardUnits})` : ''} behind this indicator&apos;s
                                internally-controlled evidence. Assets marked <b>no work wired</b> are
                                answered for here but untouched by this indicator&apos;s implementations.
                            </Text>
                            <ListBox>
                                {stewardedAssets.map((a) => {
                                    const remediatedHere = assets.some(
                                        (r) => r.asset_identifier === a.asset_identifier
                                    );
                                    return (
                                        <Row
                                            key={a.asset_identifier}
                                            to={linkTo('assets', a.asset_identifier)}
                                            title={a.title || '(untitled asset)'}
                                            identifier={a.asset_identifier}
                                        >
                                            {a.scope && (
                                                <Badge colorScheme="teal" variant="subtle" fontSize="2xs" textTransform="capitalize">
                                                    {a.scope}
                                                </Badge>
                                            )}
                                            {(a.stewards || []).map((s) => (
                                                <Badge
                                                    key={s.name}
                                                    colorScheme={s.holder_type === 'Person' ? 'gray' : 'blue'}
                                                    variant="subtle"
                                                    fontSize="2xs"
                                                    title={`${s.name} — ${s.capacities.join(', ')}`}
                                                >
                                                    {s.capacities.join(' · ')}
                                                </Badge>
                                            ))}
                                            {remediatedHere ? (
                                                <Badge colorScheme="green" variant="subtle" fontSize="2xs"
                                                       title="This indicator's implementations remediate this asset">
                                                    remediated
                                                </Badge>
                                            ) : (
                                                <Badge colorScheme="orange" variant="subtle" fontSize="2xs"
                                                       title="Answered for by the responsible unit, but no implementation on this indicator is wired to it">
                                                    no work wired
                                                </Badge>
                                            )}
                                        </Row>
                                    );
                                })}
                            </ListBox>
                        </TabPanel>
                    )}
                </TabPanels>
            </Tabs>
        </Box>
    );
}

export default IndicatorAssetsPanel;
