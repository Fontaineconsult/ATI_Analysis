import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Divider,
    Flex,
    Heading,
    HStack,
    Input,
    Select,
    SimpleGrid,
    Spacer,
    Spinner,
    Tag,
    Text,
    Wrap,
    WrapItem,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { useSettings } from '../../../context/SettingsContext';
import { fetchTaapDetail } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import useInvalidateResources from '../../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../../context/resourceKeys';
import {
    assignOwnerToTaap,
    unassignOwnerFromTaap,
    assignPreparerToTaap,
    unassignPreparerFromTaap,
    assignSignerToTaap,
    unassignSignerFromTaap,
    connectTaapToYse,
    disconnectTaapFromYse,
} from '../../../services/api/put';
import { deleteTaap } from '../../../services/api/delete';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import {
    TAAP_REQUIREMENT_COUNT,
    getDistributionActionLabel,
    getOutcomeColor,
    getOutcomeLabel,
    getRequirementLabel,
    getRiskColor,
    getRiskLabel,
    getSignerRoleLabel,
    getSignerRoleOptions,
    getStatementElementLabel,
    getTaapStatusColor,
    getTaapStatusLabel,
    getUserGroupLabel,
    toISODate,
} from './assetConfig';
import TaapForm from './TaapForm';

const Card = ({ title, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
        {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
        {children}
    </Box>
);

function Field({ label, value }) {
    return (
        <Box>
            <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">{label}</Text>
            {value
                ? <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">{String(value)}</Text>
                : <Text fontSize="sm" color="gray.600" fontStyle="italic">Not set</Text>}
        </Box>
    );
}

/** A checkbox section of the form: the checked keys as tags, or "none checked". */
function KeyTags({ label, keys, labelFor, vocab, emptyText = 'None checked' }) {
    return (
        <Box>
            <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={1}>{label}</Text>
            {keys && keys.length ? (
                <Wrap spacing={1}>
                    {keys.map((k) => (
                        <WrapItem key={k}>
                            <Tag size="sm" variant="subtle" colorScheme="gray">{labelFor(k, vocab)}</Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            ) : (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">{emptyText}</Text>
            )}
        </Box>
    );
}

/**
 * Right-column TAAP detail. Fetches full detail by taap_identifier and renders the
 * form section by section: identity and grades, the covered asset and units, the
 * barriers and alternative, the checklist with its consistency flag, signers with
 * role and date, the signed copy, and the evidence links. Mutations refresh both
 * this panel and the parent list.
 *
 * Props:
 *   taapIdentifier     Selected TAAP's identifier, or null.
 *   onAfterMutate(deletedId?)  Parent refresh hook; called with the identifier on delete.
 *   onGoToAsset(assetIdentifier)  Optional: jump to the Assets tab and select.
 */
function TaapDetailPanel({ taapIdentifier, onAfterMutate, onGoToAsset }) {
    const userCtx = useContext(UserContext);
    const { vocab } = useSettings();
    const toast = useToast();
    const editDisclosure = useDisclosure();
    const { data: detailResp, loading, error, reload } = useResource(
        taapIdentifier ? KEYS.taapDetail(taapIdentifier) : null,
        () => fetchTaapDetail(taapIdentifier),
    );
    const taap = detailResp?.data || null;
    const [deleting, setDeleting] = useState(false);
    const [yseInput, setYseInput] = useState('');
    const [yseStrength, setYseStrength] = useState('');
    const [connectingYse, setConnectingYse] = useState(false);
    const [removingYse, setRemovingYse] = useState(null);
    const [signerRole, setSignerRole] = useState('');

    const candidatePersons = useMemo(
        () => (userCtx?.individuals || [])
            .filter((p) => p.active || p.non_committee_member_active)
            .map((p) => ({ unique_id: p.unique_id, name: p.name, title: p.title })),
        [userCtx],
    );

    const { invalidateNamespace } = useInvalidateResources();

    const invalidateDomain = useCallback(() => {
        [NS.taaps, NS.assets].forEach(invalidateNamespace);
    }, [invalidateNamespace]);

    const refreshAll = useCallback(async () => {
        invalidateDomain();
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [invalidateDomain, reload, onAfterMutate]);

    if (!taapIdentifier) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                    Select a TAAP on the left, or click <strong>Add TAAP</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading TAAP…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!taap) return null;

    const id = taap.taap_identifier;
    const coveredAsset = taap.covers_asset?.[0] || null;
    const requestingUnit = taap.requested_by?.[0] || null;
    const alternativeUnit = taap.alternative_provided_by?.[0] || null;
    const met = taap.requirements_met_count ?? (taap.requirements_met || []).length;

    const handleDelete = async () => {
        if (!window.confirm('Delete this TAAP? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteTaap(id);
            toast({ title: 'TAAP deleted.', status: 'success', duration: 2000, isClosable: true });
            invalidateDomain();
            if (onAfterMutate) await onAfterMutate(id);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const handleConnectYse = async () => {
        const yid = yseInput.trim();
        if (!yid) return;
        setConnectingYse(true);
        try {
            await connectTaapToYse(id, yid, yseStrength === '' ? null : Number(yseStrength), 'internal');
            setYseInput('');
            setYseStrength('');
            await refreshAll();
        } catch (e) {
            toast({ title: 'Connect failed', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setConnectingYse(false);
        }
    };

    const handleDisconnectYse = async (yid) => {
        setRemovingYse(yid);
        try {
            await disconnectTaapFromYse(id, yid);
            await refreshAll();
        } catch (e) {
            toast({ title: 'Disconnect failed', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setRemovingYse(null);
        }
    };

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity and grades */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={2} flexWrap="wrap">
                            {taap.taap_status && <Tag size="sm" colorScheme={getTaapStatusColor(taap.taap_status)} variant="subtle">{getTaapStatusLabel(taap.taap_status, vocab)}</Tag>}
                            {taap.outcome && <Tag size="sm" colorScheme={getOutcomeColor(taap.outcome)} variant="subtle">{getOutcomeLabel(taap.outcome, vocab)}</Tag>}
                            {!taap.active && <Tag size="sm" colorScheme="gray" variant="subtle">Inactive</Tag>}
                        </HStack>
                        <Heading as="h2" size="md" color="gray.800">{taap.title}</Heading>
                        <Text fontSize="xs" color="gray.600" fontFamily="mono">{id}</Text>
                    </VStack>
                    <Spacer />
                    <HStack>
                        {['signed', 'under_review', 'renewed'].includes(taap.taap_status) && (
                            // Plain anchor: the public page is server-rendered outside React Router.
                            <Button as="a" href={`/ati/reports/public/taap/${encodeURIComponent(id)}`} size="sm" variant="ghost" colorScheme="teal">
                                Public page
                            </Button>
                        )}
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">Covered Asset</Text>
                        {coveredAsset ? (
                            <Text
                                fontSize="sm"
                                color={onGoToAsset ? 'teal.600' : 'gray.800'}
                                cursor={onGoToAsset ? 'pointer' : 'default'}
                                onClick={() => onGoToAsset && onGoToAsset(coveredAsset.asset_identifier)}
                            >
                                {coveredAsset.title} ({coveredAsset.asset_identifier})
                            </Text>
                        ) : (
                            <Text fontSize="sm" color="red.400" fontStyle="italic">No covered asset (data issue).</Text>
                        )}
                    </Box>
                    <Field label="Campus" value={taap.at_campus ? `${taap.at_campus.name} (${taap.at_campus.abbreviation})` : null} />
                    <Field label="Requesting Unit" value={requestingUnit?.name} />
                    <Field label="Alternative Provided By" value={alternativeUnit?.name} />
                    <Field label="Academic Year" value={taap.in_year} />
                    <Field label="Template" value={taap.template_version} />
                    <Field label="Creation Date" value={toISODate(taap.creation_date)} />
                    <Field label="Effective Date" value={toISODate(taap.effective_date)} />
                    <Field label="Review Due" value={toISODate(taap.review_due)} />
                    <Field label="Vendor Contact" value={taap.vendor_contact} />
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">Institutional Risk</Text>
                        {taap.institutional_risk
                            ? <Tag size="sm" colorScheme={getRiskColor(taap.institutional_risk)} variant="subtle">{getRiskLabel(taap.institutional_risk, vocab)}</Tag>
                            : <Text fontSize="sm" color="gray.600" fontStyle="italic">Not set</Text>}
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">Accommodation Requirement</Text>
                        {taap.accommodation_requirement
                            ? <Tag size="sm" colorScheme={getRiskColor(taap.accommodation_requirement)} variant="subtle">{getRiskLabel(taap.accommodation_requirement, vocab)}</Tag>
                            : <Text fontSize="sm" color="gray.600" fontStyle="italic">Not set</Text>}
                    </Box>
                </SimpleGrid>
                {taap.description && (
                    <Box mt={3}>
                        <Field label="Description" value={taap.description} />
                    </Box>
                )}
            </Card>

            {/* Barriers and alternative */}
            <Card title="Barriers and alternative">
                <VStack align="stretch" spacing={3}>
                    <Field label="Known Accessibility Barriers" value={taap.known_barriers} />
                    <KeyTags label="Affected User Groups" keys={taap.affected_user_groups} labelFor={getUserGroupLabel} vocab={vocab} />
                    <Field label="Proposed Alternative" value={taap.proposed_alternative} />
                    <Field label="Product Specific Accessibility Statement" value={taap.accessibility_statement} />
                    <KeyTags label="Statement Includes" keys={taap.statement_elements} labelFor={getStatementElementLabel} vocab={vocab} />
                    <KeyTags label="Communication and Distribution" keys={taap.distribution_actions} labelFor={getDistributionActionLabel} vocab={vocab} />
                </VStack>
            </Card>

            {/* Requirements checklist */}
            <Card title={`Requirements checklist (${met} of ${TAAP_REQUIREMENT_COUNT} met)`}>
                {taap.checklist_consistent === false && (
                    <Alert status="warning" borderRadius="md" fontSize="sm" mb={3}>
                        <AlertIcon />
                        The recorded outcome does not match the number of requirements checked on the form.
                        Stored as written; settle it against the signed copy.
                    </Alert>
                )}
                <KeyTags label="Requirements Met" keys={taap.requirements_met} labelFor={getRequirementLabel} vocab={vocab} />
            </Card>

            {/* People */}
            <Card title="Approval">
                <VStack align="stretch" spacing={4}>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={1}>Signatures</Text>
                        {(taap.signed_by || []).length === 0 ? (
                            <Text fontSize="sm" color="gray.600" fontStyle="italic">No signers recorded.</Text>
                        ) : (
                            <VStack align="stretch" spacing={1}>
                                {taap.signed_by.map((s) => (
                                    <HStack key={s.unique_id} justify="space-between">
                                        <Text fontSize="sm" color="gray.800">{s.name}</Text>
                                        <HStack spacing={2}>
                                            {s.role && <Tag size="sm" variant="subtle" colorScheme="teal">{getSignerRoleLabel(s.role, vocab)}</Tag>}
                                            <Text fontSize="xs" color={s.signed_date ? 'gray.700' : 'orange.600'}>
                                                {s.signed_date ? `signed ${toISODate(s.signed_date)}` : 'signature pending'}
                                            </Text>
                                        </HStack>
                                    </HStack>
                                ))}
                            </VStack>
                        )}
                    </Box>
                    <Box>
                        <HStack mb={1} spacing={2}>
                            <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">Add or remove a signer</Text>
                            <Select size="xs" w="auto" placeholder="Role…" value={signerRole} onChange={(e) => setSignerRole(e.target.value)}>
                                {getSignerRoleOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </Select>
                        </HStack>
                        <PersonAssignmentSelector
                            assignedPersons={(taap.signed_by || []).map((p) => ({ unique_id: p.unique_id, name: p.name }))}
                            candidatePersons={candidatePersons}
                            onAssign={(uid) => assignSignerToTaap(id, uid, signerRole || null)}
                            onUnassign={(uid) => unassignSignerFromTaap(id, uid)}
                            afterChange={refreshAll}
                            placeholder="Select signer to assign"
                        />
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={1}>Accountable Owner</Text>
                        <PersonAssignmentSelector
                            assignedPersons={(taap.owned_by || []).map((p) => ({ unique_id: p.unique_id, name: p.name }))}
                            candidatePersons={candidatePersons}
                            onAssign={(uid) => assignOwnerToTaap(id, uid)}
                            onUnassign={(uid) => unassignOwnerFromTaap(id, uid)}
                            afterChange={refreshAll}
                            placeholder="Select owner to assign"
                        />
                    </Box>
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={1}>Prepared By</Text>
                        <PersonAssignmentSelector
                            assignedPersons={(taap.prepared_by || []).map((p) => ({ unique_id: p.unique_id, name: p.name }))}
                            candidatePersons={candidatePersons}
                            onAssign={(uid) => assignPreparerToTaap(id, uid)}
                            onUnassign={(uid) => unassignPreparerFromTaap(id, uid)}
                            afterChange={refreshAll}
                            placeholder="Select preparer to assign"
                        />
                    </Box>
                    <Field label="Miscellaneous Notes" value={taap.misc_notes} />
                </VStack>
            </Card>

            {/* Documents and renewal chain */}
            <Card title="Signed copy and renewals">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Field label="Signed Copy" value={taap.signed_copy ? `${taap.signed_copy.name}${taap.signed_copy.has_raw_text ? ' (text captured)' : ''}` : null} />
                    <Field label="Supersedes" value={taap.supersedes} />
                    <Field label="Superseded By" value={(taap.superseded_by || []).join(', ') || null} />
                    <Box>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold" mb={1}>Referenced Documentation</Text>
                        {(taap.references || []).length === 0 ? (
                            <Text fontSize="sm" color="gray.600" fontStyle="italic">No ACR, demo, testing or roadmap links recorded.</Text>
                        ) : (
                            <VStack align="stretch" spacing={1}>
                                {taap.references.map((r) => (
                                    <Text key={`${r.target_type}-${r.unique_id}`} fontSize="sm" color="gray.800">
                                        {r.kind}: {r.name || r.url}
                                    </Text>
                                ))}
                            </VStack>
                        )}
                    </Box>
                </SimpleGrid>
            </Card>

            {/* Evidence (YSE) */}
            <Card title="Evidence (Year Success Evidence)">
                <Flex gap={2} mb={3} flexWrap="wrap">
                    <Input
                        size="sm"
                        flex="1"
                        minW="220px"
                        placeholder="YSE identifier (e.g. 2026-2027-8.10-pro-ssu)"
                        value={yseInput}
                        onChange={(e) => setYseInput(e.target.value)}
                        borderColor="teal.300"
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                    />
                    <Select size="sm" w="auto" placeholder="Strength…" value={yseStrength} onChange={(e) => setYseStrength(e.target.value)}>
                        <option value="3">3 Full</option>
                        <option value="2">2 Partial</option>
                        <option value="1">1 Indirect</option>
                        <option value="0">0 None</option>
                    </Select>
                    <Button size="sm" colorScheme="teal" onClick={handleConnectYse} isLoading={connectingYse} isDisabled={!yseInput.trim()}>
                        Connect
                    </Button>
                </Flex>
                {(taap.is_evidence_for || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">Not linked to any evidence yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1}>
                        {taap.is_evidence_for.map((ev) => (
                            <HStack key={ev.year_identifier} justify="space-between">
                                <HStack spacing={2}>
                                    <Text fontSize="sm" color="gray.800">{ev.year_identifier}</Text>
                                    {ev.strength !== null && ev.strength !== undefined && (
                                        <Tag size="sm" variant="subtle" colorScheme="blue">strength {ev.strength}</Tag>
                                    )}
                                    {ev.control && <Tag size="sm" variant="subtle" colorScheme="gray">{ev.control}</Tag>}
                                </HStack>
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDisconnectYse(ev.year_identifier)}
                                    isLoading={removingYse === ev.year_identifier}
                                    isDisabled={removingYse !== null}
                                >
                                    Remove
                                </Button>
                            </HStack>
                        ))}
                    </VStack>
                )}
            </Card>

            <TaapForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingTaap={taap}
                onSaved={async () => { await refreshAll(); }}
            />
        </VStack>
    );
}

export default TaapDetailPanel;
