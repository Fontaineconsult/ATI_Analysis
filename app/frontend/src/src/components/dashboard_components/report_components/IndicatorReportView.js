import React from 'react';
import {
    Badge,
    Box,
    Flex,
    Heading,
    HStack,
    Link,
    Tag,
    Text,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { getImplementationURL, getEditUrlFromCompositeKey } from '../../../services/utils/tools';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import EvidenceQualityPanel from './EvidenceQualityPanel';

/*
 * The single-indicator "View" report, rebuilt on the dedicated /report/indicator payload.
 * Canon-styled (design-sense): white Card/Section surfaces, teal.700 headings, the maturity
 * ladder, colorScheme badges for meaning. Every section is driven straight off the
 * server-filtered payload — no in-memory tree walking, no include_in_report logic here.
 *
 * What it surfaces that the old report never did: each implementation's owner, AMM
 * dimension classification, participant team, and remediated interfaces; the remediation
 * backbone (Assets / Interfaces / Tools / Vendors touched by the work); and TAAPs.
 */

// ── Primitives ──────────────────────────────────────────────────────────────
const Card = ({ title, action, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
        {(title || action) && (
            <HStack justify="space-between" align="baseline" mb={3}>
                {title && <Heading as="h3" size="sm" color="teal.700">{title}</Heading>}
                {action}
            </HStack>
        )}
        {children}
    </Box>
);

const Section = ({ title, count, children }) => (
    <Box>
        <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
            {title}{typeof count === 'number' ? ` (${count})` : ''}
        </Heading>
        {children}
    </Box>
);

const Empty = ({ children }) => (
    <Text fontSize="sm" color="gray.500" fontStyle="italic">{children}</Text>
);

// ── Leaf renderers ──────────────────────────────────────────────────────────
const DocLinks = ({ documents = [], webpages = [] }) => {
    if (!documents.length && !webpages.length) return null;
    return (
        <VStack align="stretch" spacing={1} pl={1}>
            {documents.map((d) => (
                <HStack key={d.unique_id} spacing={2} align="baseline" flexWrap="wrap">
                    <Link href={d.file_path || d.uri_path} isExternal color="teal.600" fontSize="xs">• {d.name || 'Document'}</Link>
                    {(d.is_administrative_review_documentation === 'True' || d.is_administrative_review_documentation === true) &&
                        <Badge colorScheme="purple" fontSize="10px">Admin Review</Badge>}
                    {(d.is_milestone_and_measures_documentation === 'True' || d.is_milestone_and_measures_documentation === true) &&
                        <Badge colorScheme="blue" fontSize="10px">Milestones</Badge>}
                    {d.depreciated && <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>}
                </HStack>
            ))}
            {webpages.map((w) => (
                <HStack key={w.unique_id} spacing={2} align="baseline" flexWrap="wrap">
                    <Link href={w.url} isExternal color="teal.600" fontSize="xs">• {w.name || w.url}</Link>
                    {w.no_longer_exists && <Badge colorScheme="red" fontSize="10px">Gone</Badge>}
                    {w.depreciated && <Badge colorScheme="orange" fontSize="10px">Deprecated</Badge>}
                </HStack>
            ))}
        </VStack>
    );
};

const NoteList = ({ items = [] }) => {
    if (!items.length) return null;
    return (
        <VStack align="stretch" spacing={1} pl={1}>
            {items.map((n) => (
                <Text key={n.unique_id} fontSize="xs" color="gray.700">
                    • {(n.dateCreated || n.date_created) && (
                        <Text as="span" color="gray.500">{n.dateCreated || n.date_created}: </Text>
                    )}{n.content}
                </Text>
            ))}
        </VStack>
    );
};

const MetricList = ({ items = [] }) => {
    if (!items.length) return null;
    return (
        <VStack align="stretch" spacing={1} pl={1}>
            {items.map((m) => (
                <Text key={m.unique_id || m.composite_key} fontSize="xs" color="gray.700">
                    • {m.name}: <Text as="span" fontWeight="semibold">{m.single_value ?? '—'}</Text>
                    {m.description && <Text as="span" color="gray.500"> — {m.description}</Text>}
                </Text>
            ))}
        </VStack>
    );
};

// ── Implementation card ─────────────────────────────────────────────────────
const REACHED_VIA_SCHEME = { remediated: 'green', interface: 'blue', tool: 'purple' };

const ImplementationCard = ({ impl, campus, navigate }) => {
    const hasDocs = impl.documents?.length || impl.webpages?.length;
    return (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50" p={4}
             borderLeftWidth="3px" borderLeftColor="teal.400">
            <HStack spacing={2} mb={1} flexWrap="wrap">
                <Badge colorScheme="teal" textTransform="uppercase" fontSize="2xs">{impl.type}</Badge>
                <Heading as="h5" size="xs" color="gray.800" cursor="pointer"
                         _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                         onClick={() => impl.unique_id && navigate(getImplementationURL(impl.type, impl.unique_id, campus))}>
                    {impl.title}
                </Heading>
            </HStack>
            {impl.description && <Text fontSize="xs" color="gray.700" mb={2}>{impl.description}</Text>}

            {/* Accountability + classification line */}
            <Wrap spacing={2} mb={hasDocs || impl.participants?.length || impl.remediates_interfaces?.length ? 2 : 0}>
                {impl.owner && (
                    <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {impl.owner.name}</Tag></WrapItem>
                )}
                {impl.accountable_working_group && (
                    <WrapItem><Tag size="sm" colorScheme="cyan" variant="subtle">Accountable: {impl.accountable_working_group}</Tag></WrapItem>
                )}
                {(impl.dimensions || []).map((d) => (
                    <WrapItem key={d.handle}><Tag size="sm" colorScheme="orange" variant="subtle">{d.name}</Tag></WrapItem>
                ))}
            </Wrap>

            {/* Participants (the working team) */}
            {impl.participants?.length > 0 && (
                <Box mb={2}>
                    <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="semibold" mb={1}>Worked on by</Text>
                    <Wrap spacing={1}>
                        {impl.participants.map((p, i) => (
                            <WrapItem key={`${p.person?.unique_id}-${i}`}>
                                <Tag size="sm" colorScheme="purple" variant="subtle">
                                    {p.person?.name}{p.role_handle ? ` · ${p.role_handle.replace(/^role:/, '')}` : ''}
                                </Tag>
                            </WrapItem>
                        ))}
                    </Wrap>
                </Box>
            )}

            {/* Remediated interfaces */}
            {impl.remediates_interfaces?.length > 0 && (
                <Box mb={2}>
                    <Text fontSize="2xs" color="gray.500" textTransform="uppercase" fontWeight="semibold" mb={1}>Remediates</Text>
                    <Wrap spacing={1}>
                        {impl.remediates_interfaces.map((iface) => (
                            <WrapItem key={iface.unique_id}>
                                <Tag size="sm" colorScheme="blue" variant="outline">{iface.title}</Tag>
                            </WrapItem>
                        ))}
                    </Wrap>
                </Box>
            )}

            <DocLinks documents={impl.documents} webpages={impl.webpages} />
            <NoteList items={impl.notes} />
            <MetricList items={impl.metrics} />
        </Box>
    );
};

// ── Remediation backbone ────────────────────────────────────────────────────
const AssetRow = ({ asset }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <HStack spacing={2} flexWrap="wrap" mb={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{asset.title}</Text>
            {asset.scope && <Badge colorScheme="gray" fontSize="10px">{asset.scope}</Badge>}
            {asset.asset_class && <Badge colorScheme="teal" fontSize="10px">{asset.asset_class.replace(/_/g, ' ')}</Badge>}
            {(asset.reached_via || []).map((v) => (
                <Badge key={v} colorScheme={REACHED_VIA_SCHEME[v] || 'gray'} variant="subtle" fontSize="10px">via {v}</Badge>
            ))}
        </HStack>
        <Text fontSize="2xs" color="gray.400" fontFamily="mono">{asset.asset_identifier}</Text>
        {asset.description && <Text fontSize="xs" color="gray.600" mt={1}>{asset.description}</Text>}
    </Box>
);

const InterfaceRow = ({ iface }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <HStack spacing={2} flexWrap="wrap" mb={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{iface.title}</Text>
            {iface.function && <Badge colorScheme="blue" fontSize="10px">{iface.function}</Badge>}
            {iface.provenance && <Badge colorScheme="gray" fontSize="10px">{iface.provenance}</Badge>}
        </HStack>
        <Text fontSize="2xs" color="gray.400" fontFamily="mono">{iface.interface_identifier}</Text>
        {iface.description && <Text fontSize="xs" color="gray.600" mt={1}>{iface.description}</Text>}
        {(iface.audience?.length > 0 || iface.coverage_domains?.length > 0) && (
            <Wrap spacing={1} mt={2}>
                {(iface.coverage_domains || []).map((c) => <WrapItem key={c}><Tag size="sm" variant="subtle" colorScheme="cyan">{c}</Tag></WrapItem>)}
                {(iface.audience || []).map((a) => <WrapItem key={a}><Tag size="sm" variant="subtle" colorScheme="gray">{a}</Tag></WrapItem>)}
            </Wrap>
        )}
    </Box>
);

const VendorRow = ({ vendor }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.800">{vendor.name}</Text>
        {vendor.location && <Text fontSize="xs" color="gray.600">{vendor.location}</Text>}
        {(vendor.sales_contact_email || vendor.technical_contact_email) && (
            <Text fontSize="2xs" color="gray.500" mt={1}>
                {vendor.sales_contact_email && <>Sales: {vendor.sales_contact_email} </>}
                {vendor.technical_contact_email && <>· Tech: {vendor.technical_contact_email}</>}
            </Text>
        )}
    </Box>
);

const RemediationBackbone = ({ report }) => {
    const { assets = [], interfaces = [], tools = [], vendors = [] } = report;
    if (!assets.length && !interfaces.length && !tools.length && !vendors.length) return null;
    return (
        <Card title="Remediation Backbone">
            <Text fontSize="xs" color="gray.500" mb={3}>
                The ICT this indicator's work touched — assets kept accessible, the interfaces remediated, the tools used, and their vendors.
            </Text>
            <VStack align="stretch" spacing={4}>
                {assets.length > 0 && (
                    <Section title="Assets" count={assets.length}>
                        <VStack align="stretch" spacing={2}>{assets.map((a) => <AssetRow key={a.unique_id} asset={a} />)}</VStack>
                    </Section>
                )}
                {interfaces.length > 0 && (
                    <Section title="Interfaces" count={interfaces.length}>
                        <VStack align="stretch" spacing={2}>{interfaces.map((i) => <InterfaceRow key={i.unique_id} iface={i} />)}</VStack>
                    </Section>
                )}
                {tools.length > 0 && (
                    <Section title="Tools" count={tools.length}>
                        <Wrap spacing={2}>
                            {tools.map((t) => <WrapItem key={t.unique_id}><Tag colorScheme="purple" variant="subtle">{t.title}</Tag></WrapItem>)}
                        </Wrap>
                    </Section>
                )}
                {vendors.length > 0 && (
                    <Section title="Vendors" count={vendors.length}>
                        <VStack align="stretch" spacing={2}>{vendors.map((v) => <VendorRow key={v.unique_id} vendor={v} />)}</VStack>
                    </Section>
                )}
            </VStack>
        </Card>
    );
};

// ── TAAPs ───────────────────────────────────────────────────────────────────
const TaapCard = ({ taap }) => (
    <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="gray.50" p={4} borderLeftWidth="3px" borderLeftColor="orange.400">
        <HStack spacing={2} mb={1} flexWrap="wrap">
            <Badge colorScheme="orange" textTransform="uppercase" fontSize="2xs">TAAP</Badge>
            <Heading as="h5" size="xs" color="gray.800">{taap.title}</Heading>
            {taap.outcome && <Badge colorScheme="gray" fontSize="10px">{taap.outcome.replace(/_/g, ' ')}</Badge>}
            {taap.active === false && <Badge colorScheme="red" fontSize="10px">Inactive</Badge>}
        </HStack>
        {taap.description && <Text fontSize="xs" color="gray.700" mb={2}>{taap.description}</Text>}
        <Wrap spacing={2} mb={2}>
            {taap.owner && <WrapItem><Tag size="sm" colorScheme="teal" variant="subtle">Owner: {taap.owner.name}</Tag></WrapItem>}
            {(taap.covers_assets || []).map((a) => <WrapItem key={a.unique_id}><Tag size="sm" colorScheme="gray" variant="subtle">Covers: {a.title}</Tag></WrapItem>)}
            {taap.review_due && <WrapItem><Tag size="sm" colorScheme="yellow" variant="subtle">Review due {taap.review_due}</Tag></WrapItem>}
        </Wrap>
        <DocLinks documents={taap.documents} webpages={taap.webpages} />
    </Box>
);

// ── Main view ───────────────────────────────────────────────────────────────
const IndicatorReportView = ({ report }) => {
    const navigate = useNavigate();
    const { campus } = useParams();

    if (!report) return null;
    const { indicator, status, yse, people, plans = [], accomplishments = [], notes = [], messages = [], metrics = [] } = report;

    const openEdit = () => {
        const editUrl = getEditUrlFromCompositeKey(indicator.composite_key, campus);
        navigate(editUrl);
    };

    return (
        <Box p={6} bg="gray.50" textAlign="left">
            <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="flex-start">
                <Box flex={{ base: 'none', lg: 3 }} w="100%" minW="0">
                    <VStack align="stretch" spacing={4}>

                        {/* Identity + status */}
                        <Card>
                            <Text fontSize="2xs" color="gray.400" fontFamily="mono" mb={1}>
                                {indicator.composite_key} · {report.year}{report.campus?.abbreviation ? ` · ${report.campus.abbreviation}` : ''}
                            </Text>
                            <Heading as="h2" size="md" color="teal.700" cursor="pointer"
                                     _hover={{ color: 'teal.600', textDecoration: 'underline' }} onClick={openEdit}>
                                Goal {indicator.goal_number}: {indicator.goal_name}
                            </Heading>
                            <Text fontSize="sm" color="gray.700" mt={2}>{indicator.success_indicator}</Text>
                            <Box mt={4} pt={3} borderTopWidth="1px" borderColor="gray.100">
                                <StatusLevelLadder level={status?.status_level || null} variant="full" />
                            </Box>
                        </Card>

                        {/* People */}
                        <Card title="People">
                            <VStack align="stretch" spacing={3}>
                                <Section title="Implementers" count={people?.implementers?.length || 0}>
                                    {people?.implementers?.length ? (
                                        <VStack align="stretch" spacing={1}>
                                            {people.implementers.map((p) => (
                                                <HStack key={p.unique_id} spacing={2} flexWrap="wrap">
                                                    <Text fontSize="sm" color="gray.800">{p.name}</Text>
                                                    {p.title && <Text fontSize="xs" color="gray.500">{p.title}</Text>}
                                                    {(p.roles || []).map((r) => (
                                                        <Badge key={r.handle} colorScheme="purple" variant="subtle" fontSize="10px">{r.name}</Badge>
                                                    ))}
                                                </HStack>
                                            ))}
                                        </VStack>
                                    ) : <Empty>No people assigned.</Empty>}
                                </Section>
                                {(people?.admin_reviewers?.length > 0 || yse?.administrative_review_complete != null) && (
                                    <Section title="Administrative Review">
                                        <HStack spacing={2} flexWrap="wrap">
                                            <Badge colorScheme={yse?.administrative_review_complete ? 'green' : 'yellow'}>
                                                {yse?.administrative_review_complete ? 'Complete' : 'Pending'}
                                            </Badge>
                                            {yse?.administrative_review_completed_date &&
                                                <Text fontSize="xs" color="gray.500">{yse.administrative_review_completed_date}</Text>}
                                            {people?.admin_reviewers?.map((r) => (
                                                <Tag key={r.unique_id} size="sm" variant="subtle" colorScheme="gray">{r.name}</Tag>
                                            ))}
                                        </HStack>
                                        {yse?.admin_review_description && yse.admin_review_description !== 'No Review' && (
                                            <Box mt={2} p={3} bg="blue.50" borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.400">
                                                <Text fontSize="xs" color="gray.700">{yse.admin_review_description}</Text>
                                            </Box>
                                        )}
                                    </Section>
                                )}
                            </VStack>
                        </Card>

                        {/* Implementations */}
                        <Card title={`Implementation Evidence (${report.implementations?.length || 0})`}>
                            {report.implementations?.length ? (
                                <VStack align="stretch" spacing={3}>
                                    {report.implementations.map((impl) => (
                                        <ImplementationCard key={`${impl.type}-${impl.unique_id}`} impl={impl} campus={campus} navigate={navigate} />
                                    ))}
                                </VStack>
                            ) : <Empty>No implementation evidence recorded for this year.</Empty>}
                        </Card>

                        {/* Remediation backbone (assets / interfaces / tools / vendors) */}
                        <RemediationBackbone report={report} />

                        {/* TAAPs */}
                        {report.taaps?.length > 0 && (
                            <Card title={`Temporary Alternate Access Plans (${report.taaps.length})`}>
                                <VStack align="stretch" spacing={3}>
                                    {report.taaps.map((t) => <TaapCard key={t.unique_id} taap={t} />)}
                                </VStack>
                            </Card>
                        )}

                        {/* Plans & accomplishments */}
                        {(plans.length > 0 || accomplishments.length > 0) && (
                            <Card title="Plans & Accomplishments">
                                <VStack align="stretch" spacing={3}>
                                    {plans.length > 0 && (
                                        <Section title="Plans" count={plans.length}>
                                            <VStack align="stretch" spacing={2}>
                                                {plans.map((p) => (
                                                    <Box key={p.unique_id} p={3} bg="gray.50" borderRadius="md" borderLeftWidth="3px" borderLeftColor="teal.300">
                                                        <HStack spacing={2} mb={1} flexWrap="wrap">
                                                            <Text fontSize="sm" fontWeight="semibold" color="gray.800">{p.name}</Text>
                                                            {p.plan_status && <Badge colorScheme={p.abandoned ? 'red' : 'blue'} fontSize="10px">{p.abandoned ? 'Abandoned' : p.plan_status}</Badge>}
                                                            {p.is_key_plan && <Badge colorScheme="purple" fontSize="10px">Key</Badge>}
                                                            {p.is_campus_plan && <Badge colorScheme="green" fontSize="10px">Campus</Badge>}
                                                        </HStack>
                                                        {p.description && <Text fontSize="xs" color="gray.700">{p.description}</Text>}
                                                    </Box>
                                                ))}
                                            </VStack>
                                        </Section>
                                    )}
                                    {accomplishments.length > 0 && (
                                        <Section title="Accomplishments" count={accomplishments.length}>
                                            <VStack align="stretch" spacing={2}>
                                                {accomplishments.map((a) => (
                                                    <Box key={a.unique_id} p={3} bg="gray.50" borderRadius="md" borderLeftWidth="3px" borderLeftColor="blue.300">
                                                        <Text fontSize="sm" fontWeight="semibold" color="gray.800">{a.name}</Text>
                                                        {a.description && <Text fontSize="xs" color="gray.700">{a.description}</Text>}
                                                    </Box>
                                                ))}
                                            </VStack>
                                        </Section>
                                    )}
                                </VStack>
                            </Card>
                        )}

                        {/* YSE-level notes / messages / metrics */}
                        {(notes.length > 0 || messages.length > 0 || metrics.length > 0) && (
                            <Card title="Notes, Messages & Metrics">
                                <VStack align="stretch" spacing={3}>
                                    {notes.length > 0 && <Section title="Notes" count={notes.length}><NoteList items={notes} /></Section>}
                                    {messages.length > 0 && <Section title="Messages" count={messages.length}><NoteList items={messages} /></Section>}
                                    {metrics.length > 0 && <Section title="Metrics" count={metrics.length}><MetricList items={metrics} /></Section>}
                                </VStack>
                            </Card>
                        )}
                    </VStack>
                </Box>

                {/* Right rail — evidence-quality criteria for the current maturity level */}
                <Box flex={{ base: 'none', lg: 1 }} w={{ base: '100%', lg: 'auto' }} minW={{ lg: '280px' }}
                     position={{ lg: 'sticky' }} top={{ lg: 6 }} alignSelf={{ lg: 'flex-start' }}>
                    {status?.status_level && <EvidenceQualityPanel currentStatusLevelName={status.status_level} />}
                </Box>
            </Flex>
        </Box>
    );
};

export default IndicatorReportView;
