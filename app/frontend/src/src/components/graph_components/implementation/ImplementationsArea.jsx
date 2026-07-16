import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Wrap,
    WrapItem,
    useDisclosure,
} from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { useDescriptors } from '../../../hooks/useDescriptors';
import { HelpTip } from '../../functional_components/DescriptorHelp';
import ImplementationStatStrip from './ImplementationStatStrip';
import ImplementationList from './ImplementationList';
import ImplementationDetailPanel from './ImplementationDetailPanel';
import CreateImplementationModal from './CreateImplementation';
import { IMPLEMENTATION_TYPES, TYPE_KEYS, isValidType, typeLabel, allDocumentsDepreciated, implementationInCampus } from './implementationConfig';

const ALL = 'All';

/**
 * ATI Explorer → Implementations. Canon area shell (design-sense §3.1): heading →
 * diagnostic stat strip → category buttons (All + the seven types) → the active
 * category's ontology description → 1:2 master-detail. "All" shows every category
 * as Plans-style groups; a specific category narrows the list and shows its
 * description. The list's own filter bar scopes to the active campus by default.
 */
function ImplementationsArea() {
    const { campus, implementationType, implementationId } = useParams();
    const navigate = useNavigate();
    const { data, loading, updating, refreshImplementations } = useContext(DataContext);
    const { getNodeTypeDefinition } = useDescriptors();
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

    const byType = data?.implementations || {};

    const allImplementations = useMemo(
        () => TYPE_KEYS.flatMap((t) => byType[t] || []),
        [byType],
    );

    const [selectedType, setSelectedType] = useState(
        implementationType && isValidType(implementationType) ? implementationType : ALL,
    );
    const [selectedId, setSelectedId] = useState(null);
    // Owned here (not in the list) so the category counts + stat strip below scope to
    // the same campus the list shows. Default off: active campus only.
    const [showAllCampuses, setShowAllCampuses] = useState(false);

    // Apply the URL deep-link ONCE (on arrival), then let interaction drive state —
    // otherwise our own navigate() on each click would re-collapse the view.
    const appliedDeepLink = useRef(false);
    useEffect(() => {
        if (appliedDeepLink.current) return;
        if (implementationType && isValidType(implementationType)) setSelectedType(implementationType);
        if (implementationId) {
            if (allImplementations.some((i) => i.unique_id === implementationId)) {
                setSelectedId(implementationId);
                appliedDeepLink.current = true;
            }
            // else: data not loaded yet — effect re-runs when allImplementations changes
        } else {
            appliedDeepLink.current = true;
        }
    }, [implementationType, implementationId, allImplementations]);

    const isAll = selectedType === ALL;
    const listItems = isAll ? allImplementations : (byType[selectedType] || []);

    const selectedImpl = selectedId
        ? allImplementations.find((i) => i.unique_id === selectedId) || null
        : null;

    // Campus-scoped views for the category counts + stat strip. Default scopes to the
    // active campus (plus unassigned orphans, matching the list); "Show all Campuses"
    // widens to every campus. Keeps the counts in agreement with the list below.
    const inScope = useCallback(
        (impl) => showAllCampuses || implementationInCampus(impl, campus),
        [showAllCampuses, campus],
    );
    const scopedByType = useMemo(() => {
        const out = {};
        for (const t of TYPE_KEYS) out[t] = (byType[t] || []).filter(inScope);
        return out;
    }, [byType, inScope]);
    const scopedAll = useMemo(() => TYPE_KEYS.flatMap((t) => scopedByType[t]), [scopedByType]);

    // Diagnostic counts over the campus-scoped set (so they match the category buttons).
    const stats = useMemo(() => {
        let noEvidence = 0;
        let noOwner = 0;
        let noActiveDocs = 0;
        scopedAll.forEach((impl) => {
            if (!(impl.is_evidence_for?.length)) noEvidence += 1;
            if (!(impl.owned_by?.length)) noOwner += 1;
            if (allDocumentsDepreciated(impl)) noActiveDocs += 1;
        });
        return { total: scopedAll.length, noEvidence, noOwner, noActiveDocs };
    }, [scopedAll]);

    const definition = !isAll && getNodeTypeDefinition ? getNodeTypeDefinition(selectedType) : null;

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSelectedId(null);
        if (campus) {
            navigate(
                type === ALL
                    ? `/${campus}/ati-explorer/implementations`
                    : `/${campus}/ati-explorer/implementations/${type}`,
                { replace: true },
            );
        }
    };

    const handleSelect = (impl) => {
        setSelectedId(impl.unique_id);
        if (campus) {
            navigate(`/${campus}/ati-explorer/implementations/${impl.type}/${impl.unique_id}`, { replace: true });
        }
    };

    const handleAddClose = () => {
        onAddClose();
        if (refreshImplementations) refreshImplementations();
    };

    if (loading) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" color="teal.500" />
                <Text mt={3} fontSize="sm" color="gray.600">Loading implementations…</Text>
            </Box>
        );
    }

    return (
        <Box textAlign="left">
            <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">Implementations</Heading>
                {updating && (
                    <HStack spacing={2} color="gray.600">
                        <Spinner size="sm" color="teal.500" />
                        <Text fontSize="xs">Updating…</Text>
                    </HStack>
                )}
            </Flex>

            <ImplementationStatStrip
                total={stats.total}
                noEvidenceCount={stats.noEvidence}
                noOwnerCount={stats.noOwner}
                noActiveDocsCount={stats.noActiveDocs}
            />

            {/* Category buttons — All (grouped) + the seven types, with counts */}
            <Wrap spacing={2} mb={3}>
                <WrapItem>
                    <Button
                        size="sm"
                        variant={isAll ? 'solid' : 'outline'}
                        colorScheme={isAll ? 'teal' : 'gray'}
                        onClick={() => handleTypeSelect(ALL)}
                    >
                        All ({scopedAll.length})
                    </Button>
                </WrapItem>
                {IMPLEMENTATION_TYPES.map(({ key, label }) => {
                    const count = (scopedByType[key] || []).length;
                    const isSel = selectedType === key;
                    return (
                        <WrapItem key={key}>
                            <Button
                                size="sm"
                                variant={isSel ? 'solid' : 'outline'}
                                colorScheme={isSel ? 'teal' : 'gray'}
                                onClick={() => handleTypeSelect(key)}
                            >
                                {label}{count ? ` (${count})` : ''}
                            </Button>
                            <HelpTip nodeType={key} placement="top" />
                        </WrapItem>
                    );
                })}
            </Wrap>

            {/* Piped-in ontology description for the active category (hidden in All) */}
            {definition?.description && (
                <Box mb={4} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                    <Heading as="h3" size="sm" color="teal.700" mb={1}>
                        {definition.name || typeLabel(selectedType)}
                    </Heading>
                    <Text fontSize="sm" color="gray.700" lineHeight="tall">
                        {definition.description}
                    </Text>
                </Box>
            )}

            <Flex gap={6} align="flex-start">
                <Box flex="1" minW="0" maxW="420px">
                    <ImplementationList
                        items={listItems}
                        groupByType={isAll}
                        activeCampus={campus}
                        showAllCampuses={showAllCampuses}
                        setShowAllCampuses={setShowAllCampuses}
                        typeName={isAll ? 'implementation' : typeLabel(selectedType)}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onAdd={onAddOpen}
                        emptyMessage={
                            isAll
                                ? 'No implementations yet. Click Add to create one.'
                                : `No ${typeLabel(selectedType).toLowerCase()}s yet. Click Add to create one.`
                        }
                    />
                </Box>
                <Box flex="2" minW="0">
                    <ImplementationDetailPanel
                        implementation={selectedImpl}
                        onAfterChange={refreshImplementations}
                    />
                </Box>
            </Flex>

            {/* Create — type chosen in the modal; no YSE target here */}
            <Modal isOpen={isAddOpen} onClose={handleAddClose} size="2xl">
                <ModalOverlay />
                <ModalContent borderRadius="lg">
                    <ModalHeader fontSize="md" color="gray.800" borderBottomWidth="1px" borderColor="gray.200" pb={3}>
                        Create New Implementation
                    </ModalHeader>
                    <ModalCloseButton borderRadius="lg" />
                    <ModalBody py={4}>
                        <CreateImplementationModal
                            implementationTypes={TYPE_KEYS}
                            yearIdentifier={null}
                            onClose={handleAddClose}
                            onSuccess={() => {}}
                            currentWorkingGroup={null}
                            loadSingleWorkingGroupData={null}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default ImplementationsArea;
