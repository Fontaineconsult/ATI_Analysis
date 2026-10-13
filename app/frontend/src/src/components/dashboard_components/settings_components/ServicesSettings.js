import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Badge,
    Box,
    Button,
    Code,
    Flex,
    Heading,
    HStack,
    SimpleGrid,
    Spinner,
    Stat,
    StatLabel,
    StatNumber,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

import Card from '../../graph_components/common/Card';
import Section from '../../graph_components/common/Section';
import { fetchServices } from '../../../services/api/get';
import {
    HELP,
    PYTHON_SOURCE_LABELS,
    availabilityOf,
    describeLastRun,
    formatRunTime,
    setupCommandFor,
    settingNamesFor,
    summarizeServices,
} from './servicesConfig';

function StatCard({ label, value, accent }) {
    return (
        <Stat
            role="group"
            aria-label={label}
            flex="1"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderTopWidth="3px"
            borderTopColor={accent}
            borderRadius="lg"
            boxShadow="sm"
            px={4}
            py={3}
        >
            <StatLabel fontSize="xs" color="gray.700">{label}</StatLabel>
            <StatNumber fontSize="2xl" color="gray.800">{value}</StatNumber>
        </Stat>
    );
}

const Mono = ({ children }) => (
    <Text as="span" fontFamily="mono" fontSize="xs" color="gray.800" wordBreak="break-all">
        {children}
    </Text>
);

function ProgramsTable({ programs }) {
    if (!programs.length) {
        return <Text fontSize="sm" color="gray.700" fontStyle="italic">This service needs no external program.</Text>;
    }
    return (
        <TableContainer whiteSpace="normal">
            <Table size="sm">
                <Thead>
                    <Tr>
                        <Th scope="col" color="gray.700">Program</Th>
                        <Th scope="col" color="gray.700">Folder</Th>
                        <Th scope="col" color="gray.700">Interpreter</Th>
                        <Th scope="col" color="gray.700">Status</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {programs.map((p, i) => (
                        <Tr key={p?.program || i}>
                            <Th scope="row" textTransform="none" letterSpacing="normal" fontWeight="normal" verticalAlign="top">
                                <Text fontSize="sm" color="gray.800">{p?.label || p?.program || 'Unknown program'}</Text>
                                {p?.module && <Mono>python -m {p.module}</Mono>}
                            </Th>
                            <Td verticalAlign="top">
                                {p?.dir ? <Mono>{p.dir}</Mono> : <Text fontSize="xs" color="gray.700" fontStyle="italic">not set</Text>}
                                {p?.dir_setting && <Text fontSize="2xs" color="gray.700">{p.dir_setting}</Text>}
                            </Td>
                            <Td verticalAlign="top">
                                {p?.python ? <Mono>{p.python}</Mono> : <Text fontSize="xs" color="gray.700" fontStyle="italic">unknown</Text>}
                                {p?.python_source && (
                                    <Text fontSize="2xs" color="gray.700">
                                        {PYTHON_SOURCE_LABELS[p.python_source] || p.python_source}
                                    </Text>
                                )}
                            </Td>
                            <Td verticalAlign="top">
                                {p?.configured ? (
                                    <Badge colorScheme="green" fontSize="2xs">Configured</Badge>
                                ) : (
                                    <>
                                        <Badge colorScheme="red" fontSize="2xs">Not configured</Badge>
                                        {p?.problem && <Text fontSize="xs" color="red.700" mt={1}>{p.problem}</Text>}
                                    </>
                                )}
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
}

function ConfigureSection({ service }) {
    const names = settingNamesFor(service);
    const command = setupCommandFor(service);
    if (!names.length) return null;
    return (
        <Section title="Configure">
            <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" color="gray.800">
                    Set {names.length === 1 ? 'this setting' : 'these settings'} to the program&apos;s folder:{' '}
                    {names.map((n, i) => (
                        <React.Fragment key={n}>{i > 0 && ', '}<Code fontSize="xs">{n}</Code></React.Fragment>
                    ))}
                </Text>
                <Text fontSize="xs" color="gray.700">{HELP.local}</Text>
                {command && (
                    <Box>
                        <Text fontSize="xs" color="gray.700" mb={1}>{HELP.server}</Text>
                        <Code display="block" whiteSpace="pre-wrap" fontSize="xs" p={2}>{command}</Code>
                    </Box>
                )}
            </VStack>
        </Section>
    );
}

function ServiceCard({ service }) {
    const availability = availabilityOf(service);
    const programs = Array.isArray(service?.programs) ? service.programs : [];
    return (
        <Card>
            <Flex justify="space-between" align="start" gap={3} mb={1} wrap="wrap">
                <Heading as="h3" size="sm" color="teal.700">{service?.name || 'Unnamed service'}</Heading>
                <Badge colorScheme={availability.colorScheme}>{availability.label}</Badge>
            </Flex>
            {service?.description && <Text fontSize="sm" color="gray.800">{service.description}</Text>}
            {service?.entry && <Mono>{service.entry}</Mono>}
            {service?.problem && (
                <Alert status="error" mt={2} borderRadius="md" fontSize="sm">
                    <AlertIcon />{service.problem}
                </Alert>
            )}
            <VStack align="stretch" spacing={3} mt={3}>
                <Section title="Programs"><ProgramsTable programs={programs} /></Section>
                {!service?.available && <ConfigureSection service={service} />}
                <Section title="Last run">
                    <Text fontSize="sm" color="gray.800">{describeLastRun(service?.last_run)}</Text>
                    <Text fontSize="2xs" color="gray.700" mt={1}>{HELP.lastRun}</Text>
                </Section>
            </VStack>
        </Card>
    );
}

/**
 * Last line of defence: an entry shaped in a way nothing above anticipated
 * blanks only its own card, never the page or the other services.
 */
class ServiceCardBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.error('Could not display a service:', error);
    }

    render() {
        if (this.state.failed) {
            return (
                <Alert status="warning" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    {this.props.name || 'A service'} could not be displayed. The others are unaffected.
                </Alert>
            );
        }
        return this.props.children;
    }
}

/**
 * Settings > Services: every service in app/services and whether it can run on
 * this server. Read-only and admin-only (the server enforces it). It reports
 * an incomplete configuration; it never fails because of one.
 */
export default function ServicesSettings() {
    const [state, setState] = useState({ loading: true, data: null, error: null, forbidden: false });

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const resp = await fetchServices();
            setState({ loading: false, data: resp?.data || null, error: null, forbidden: false });
        } catch (err) {
            const code = err?.response?.status;
            setState({
                loading: false,
                data: null,
                forbidden: code === 403 || code === 401,
                error: code === 403 || code === 401 ? null
                    : (err?.response?.data?.error || err?.message || 'Could not load services.'),
            });
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const services = Array.isArray(state.data?.services) ? state.data.services : [];
    const summary = summarizeServices(services);

    return (
        // textAlign: App.css centers .App text; this is a reading page.
        <Box p={6} textAlign="left">
            <Flex justify="space-between" align="start" gap={4} mb={2} wrap="wrap">
                <Box>
                    <Heading as="h2" size="md" color="gray.800">Services</Heading>
                    <Text fontSize="sm" color="gray.700" mt={1} maxW="3xl">{HELP.page}</Text>
                </Box>
                <Button
                    size="sm"
                    colorScheme="teal"
                    variant="outline"
                    leftIcon={<RepeatIcon />}
                    onClick={load}
                    isLoading={state.loading}
                    loadingText="Checking"
                    isDisabled={state.forbidden}
                >
                    Recheck
                </Button>
            </Flex>

            {state.forbidden && (
                <Alert status="info" borderRadius="md" fontSize="sm" mt={4}>
                    <AlertIcon />Only admins can see services.
                </Alert>
            )}

            {state.error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mt={4}>
                    <AlertIcon />{state.error}
                </Alert>
            )}

            {state.loading && !state.data && (
                <HStack mt={6} spacing={2}><Spinner size="sm" /><Text fontSize="sm" color="gray.700">Checking services…</Text></HStack>
            )}

            {state.data && (
                <VStack align="stretch" spacing={4} mt={4}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                        <StatCard label="Services" value={summary.total} accent="teal.400" />
                        <StatCard label="Available" value={summary.available} accent="green.400" />
                        <StatCard
                            label="Not configured"
                            value={summary.unavailable}
                            accent={summary.unavailable > 0 ? 'red.400' : 'gray.300'}
                        />
                    </SimpleGrid>

                    {state.data.problem && (
                        <Alert status="error" borderRadius="md" fontSize="sm">
                            <AlertIcon />{state.data.problem}
                        </Alert>
                    )}

                    <Text fontSize="xs" color="gray.700">
                        {state.data.checked_at ? `Checked ${formatRunTime(state.data.checked_at)}. ` : ''}
                        {HELP.recheck}
                    </Text>

                    {services.length === 0 && !state.data.problem && (
                        <Text fontSize="sm" color="gray.700" fontStyle="italic">No services are registered.</Text>
                    )}
                    {services.map((s, i) => (
                        <ServiceCardBoundary key={s?.name || i} name={s?.name}>
                            <ServiceCard service={s} />
                        </ServiceCardBoundary>
                    ))}
                </VStack>
            )}
        </Box>
    );
}
