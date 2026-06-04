import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Flex,
    Heading,
    HStack,
    Spinner,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from '@chakra-ui/react';
import {
    fetchAllAssets,
    fetchElevationSignalAssets,
    fetchAllTaaps,
    fetchTaapsDueForReview,
    fetchVendorsList,
    fetchAllInterfaces,
    fetchUncoveredInterfaces,
    fetchAllImplementations,
    fetchAllTools,
    fetchAllComponents,
    fetchAllGovernance,
} from '../../services/api/get';
import AssetStatStrip from '../graph_components/assets/AssetStatStrip';
import AssetList from '../graph_components/assets/AssetList';
import AssetForm from '../graph_components/assets/AssetForm';
import AssetDetailPanel from '../graph_components/assets/AssetDetailPanel';
import TaapList from '../graph_components/assets/TaapList';
import TaapForm from '../graph_components/assets/TaapForm';
import TaapDetailPanel from '../graph_components/assets/TaapDetailPanel';
import VendorList from '../graph_components/assets/VendorList';
import VendorForm from '../graph_components/assets/VendorForm';
import VendorDetailPanel from '../graph_components/assets/VendorDetailPanel';
import InterfaceList from '../graph_components/assets/InterfaceList';
import InterfaceForm from '../graph_components/assets/InterfaceForm';
import InterfaceDetailPanel from '../graph_components/assets/InterfaceDetailPanel';
import ToolList from '../graph_components/assets/ToolList';
import ToolForm from '../graph_components/assets/ToolForm';
import ToolDetailPanel from '../graph_components/assets/ToolDetailPanel';
import ComponentList from '../graph_components/assets/ComponentList';
import ComponentForm from '../graph_components/assets/ComponentForm';
import ComponentDetailPanel from '../graph_components/assets/ComponentDetailPanel';
import { toISODate } from '../graph_components/assets/assetConfig';

/**
 * Assets category for the ATI Explorer. Dashboard + two-tab master-detail:
 *
 *   Stat strip — Total assets · ⚠ Elevation · TAAPs due for review.
 *   Assets tab — AssetList (scope-grouped, ⚠ badges) + AssetDetailPanel.
 *   TAAPs tab  — TaapList + TaapDetailPanel (asset-scoped coverage).
 *
 * Owns: data loading for both domains, selection per tab, the active tab, and
 * the create flows. Edge mutations inside the detail panels call back here to
 * refresh the lists / stat counts. Assets are keyed by asset_identifier; TAAPs
 * by title.
 */
function AssetsMasterContainer() {
    const [tabIndex, setTabIndex] = useState(0);

    // Assets
    const [assets, setAssets] = useState([]);
    const [elevationSet, setElevationSet] = useState(new Set());
    const [assetsLoading, setAssetsLoading] = useState(true);
    const [assetsError, setAssetsError] = useState(null);
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [assetFormOpen, setAssetFormOpen] = useState(false);

    // TAAPs
    const [taaps, setTaaps] = useState([]);
    const [taapsLoading, setTaapsLoading] = useState(true);
    const [taapsError, setTaapsError] = useState(null);
    const [selectedTaapTitle, setSelectedTaapTitle] = useState(null);
    const [taapFormOpen, setTaapFormOpen] = useState(false);
    const [taapPresetAsset, setTaapPresetAsset] = useState(null);

    // Vendors
    const [vendors, setVendors] = useState([]);
    const [vendorsLoading, setVendorsLoading] = useState(true);
    const [vendorsError, setVendorsError] = useState(null);
    const [selectedVendorName, setSelectedVendorName] = useState(null);
    const [vendorFormOpen, setVendorFormOpen] = useState(false);

    // Interfaces
    const [interfaces, setInterfaces] = useState([]);
    const [uncoveredSet, setUncoveredSet] = useState(new Set());
    const [interfacesLoading, setInterfacesLoading] = useState(true);
    const [interfacesError, setInterfacesError] = useState(null);
    const [selectedInterfaceId, setSelectedInterfaceId] = useState(null);
    const [interfaceFormOpen, setInterfaceFormOpen] = useState(false);

    // Remediating implementations (Process/Project/Procedure/Service), flattened for
    // the Interface "Remediated by" and Tool "Used by" pickers.
    const [implementations, setImplementations] = useState([]);

    // Tools
    const [tools, setTools] = useState([]);
    const [toolsLoading, setToolsLoading] = useState(true);
    const [toolsError, setToolsError] = useState(null);
    const [selectedToolId, setSelectedToolId] = useState(null);
    const [toolFormOpen, setToolFormOpen] = useState(false);

    // Components
    const [components, setComponents] = useState([]);
    const [componentsLoading, setComponentsLoading] = useState(true);
    const [componentsError, setComponentsError] = useState(null);
    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [componentFormOpen, setComponentFormOpen] = useState(false);

    // WCAG guidelines (governance items of type 'guideline'), for the component must_satisfy picker.
    const [guidelines, setGuidelines] = useState([]);

    // Stat
    const [taapsDueCount, setTaapsDueCount] = useState(0);

    const loadAssets = useCallback(async () => {
        setAssetsLoading(true);
        setAssetsError(null);
        try {
            const [allResp, elevResp] = await Promise.all([fetchAllAssets(), fetchElevationSignalAssets()]);
            const list = allResp?.data?.items || [];
            const elevated = (elevResp?.data?.items || []).map((a) => a.asset_identifier);
            setAssets(list);
            setElevationSet(new Set(elevated));
            return list;
        } catch (e) {
            setAssetsError(e?.message || 'Failed to load assets.');
            return [];
        } finally {
            setAssetsLoading(false);
        }
    }, []);

    const loadTaaps = useCallback(async () => {
        setTaapsLoading(true);
        setTaapsError(null);
        try {
            const resp = await fetchAllTaaps();
            const list = resp?.data?.items || [];
            setTaaps(list);
            return list;
        } catch (e) {
            setTaapsError(e?.message || 'Failed to load TAAPs.');
            return [];
        } finally {
            setTaapsLoading(false);
        }
    }, []);

    const loadTaapsDue = useCallback(async () => {
        try {
            const today = toISODate(new Date());
            const resp = await fetchTaapsDueForReview(today);
            setTaapsDueCount((resp?.data?.items || []).length);
        } catch (_) {
            setTaapsDueCount(0);
        }
    }, []);

    const loadVendors = useCallback(async () => {
        setVendorsLoading(true);
        setVendorsError(null);
        try {
            const resp = await fetchVendorsList();
            const list = resp?.data?.items || [];
            setVendors(list);
            return list;
        } catch (e) {
            setVendorsError(e?.message || 'Failed to load vendors.');
            return [];
        } finally {
            setVendorsLoading(false);
        }
    }, []);

    const loadInterfaces = useCallback(async () => {
        setInterfacesLoading(true);
        setInterfacesError(null);
        try {
            const [allResp, uncovResp] = await Promise.all([fetchAllInterfaces(), fetchUncoveredInterfaces()]);
            const list = allResp?.data?.items || [];
            const uncovered = (uncovResp?.data?.items || []).map((i) => i.interface_identifier);
            setInterfaces(list);
            setUncoveredSet(new Set(uncovered));
            return list;
        } catch (e) {
            setInterfacesError(e?.message || 'Failed to load interfaces.');
            return [];
        } finally {
            setInterfacesLoading(false);
        }
    }, []);

    // Remediating implementation types only (these carry remediates_interface).
    const REMEDIATING_TYPES = ['Process', 'Project', 'Procedure', 'Service'];
    const loadImplementations = useCallback(async () => {
        try {
            const resp = await fetchAllImplementations();
            const grouped = resp?.status?.data || resp?.data || {};
            const flat = REMEDIATING_TYPES.flatMap((t) =>
                (grouped[t] || []).map((impl) => ({
                    unique_id: impl.unique_id,
                    title: impl.title,
                    type: impl.type || t,
                })),
            );
            setImplementations(flat);
        } catch (_) {
            setImplementations([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadTools = useCallback(async () => {
        setToolsLoading(true);
        setToolsError(null);
        try {
            const resp = await fetchAllTools();
            const list = resp?.data?.items || [];
            setTools(list);
            return list;
        } catch (e) {
            setToolsError(e?.message || 'Failed to load tools.');
            return [];
        } finally {
            setToolsLoading(false);
        }
    }, []);

    const loadComponents = useCallback(async () => {
        setComponentsLoading(true);
        setComponentsError(null);
        try {
            const resp = await fetchAllComponents();
            const list = resp?.data?.items || [];
            setComponents(list);
            return list;
        } catch (e) {
            setComponentsError(e?.message || 'Failed to load components.');
            return [];
        } finally {
            setComponentsLoading(false);
        }
    }, []);

    // Guidelines come from the governance store (type === 'guideline'); used as the
    // candidate list for a component's must_satisfy picker.
    const loadGuidelines = useCallback(async () => {
        try {
            const resp = await fetchAllGovernance();
            const raw = resp?.data;
            const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
            setGuidelines(
                list.filter((g) => g.type === 'guideline').map((g) => ({ unique_id: g.unique_id, title: g.title })),
            );
        } catch (_) {
            setGuidelines([]);
        }
    }, []);

    useEffect(() => {
        loadAssets();
        loadTaaps();
        loadTaapsDue();
        loadVendors();
        loadInterfaces();
        loadImplementations();
        loadTools();
        loadComponents();
        loadGuidelines();
    }, [loadAssets, loadTaaps, loadTaapsDue, loadVendors, loadInterfaces, loadImplementations, loadTools, loadComponents, loadGuidelines]);

    // ---- Asset handlers ----
    const handleAssetCreated = async (created) => {
        const list = await loadAssets();
        if (created?.asset_identifier) setSelectedAssetId(created.asset_identifier);
        else if (list.length) setSelectedAssetId(list[0].asset_identifier);
    };

    const handleAssetMutate = async (deletedId) => {
        const list = await loadAssets();
        await loadTaapsDue();
        if (deletedId && deletedId === selectedAssetId) {
            setSelectedAssetId(null);
        }
        return list;
    };

    // ---- TAAP handlers ----
    const handleTaapCreated = async (created) => {
        const list = await loadTaaps();
        await loadTaapsDue();
        if (created?.title) setSelectedTaapTitle(created.title);
        else if (list.length) setSelectedTaapTitle(list[0].title);
    };

    const handleTaapMutate = async (deletedTitle) => {
        const list = await loadTaaps();
        await loadTaapsDue();
        if (deletedTitle && deletedTitle === selectedTaapTitle) {
            setSelectedTaapTitle(null);
        }
        return list;
    };

    // ---- Vendor handlers ----
    const handleVendorCreated = async (created) => {
        const list = await loadVendors();
        if (created?.name) setSelectedVendorName(created.name);
        else if (list.length) setSelectedVendorName(list[0].name);
    };

    const handleVendorMutate = async (deletedName) => {
        const list = await loadVendors();
        if (deletedName && deletedName === selectedVendorName) {
            setSelectedVendorName(null);
        }
        return list;
    };

    // ---- Interface handlers ----
    const handleInterfaceCreated = async (created) => {
        const list = await loadInterfaces();
        if (created?.interface_identifier) setSelectedInterfaceId(created.interface_identifier);
        else if (list.length) setSelectedInterfaceId(list[0].interface_identifier);
    };

    const handleInterfaceMutate = async (deletedId) => {
        const list = await loadInterfaces();
        if (deletedId && deletedId === selectedInterfaceId) {
            setSelectedInterfaceId(null);
        }
        return list;
    };

    // ---- Tool handlers ----
    const handleToolCreated = async (created) => {
        const list = await loadTools();
        if (created?.tool_identifier) setSelectedToolId(created.tool_identifier);
        else if (list.length) setSelectedToolId(list[0].tool_identifier);
    };

    const handleToolMutate = async (deletedId) => {
        const list = await loadTools();
        if (deletedId && deletedId === selectedToolId) {
            setSelectedToolId(null);
        }
        return list;
    };

    // ---- Component handlers ----
    const handleComponentCreated = async (created) => {
        const list = await loadComponents();
        if (created?.component_identifier) setSelectedComponentId(created.component_identifier);
        else if (list.length) setSelectedComponentId(list[0].component_identifier);
    };

    const handleComponentMutate = async (deletedId) => {
        const list = await loadComponents();
        if (deletedId && deletedId === selectedComponentId) {
            setSelectedComponentId(null);
        }
        return list;
    };

    // ---- Cross-tab navigation ----
    const goToTaaps = (title) => {
        setTabIndex(1);
        if (title) setSelectedTaapTitle(title);
    };
    const goToAsset = (assetIdentifier) => {
        setTabIndex(0);
        if (assetIdentifier) setSelectedAssetId(assetIdentifier);
    };
    const goToInterface = (interfaceIdentifier) => {
        setTabIndex(3);
        if (interfaceIdentifier) setSelectedInterfaceId(interfaceIdentifier);
    };
    const addTaapForAsset = (assetIdentifier) => {
        setTaapPresetAsset(assetIdentifier);
        setTabIndex(1);
        setTaapFormOpen(true);
    };

    return (
        <Box>
            <Heading as="h2" size="lg" color="gray.800" mb={4}>Assets</Heading>

            <AssetStatStrip
                totalAssets={assets.length}
                elevationCount={elevationSet.size}
                taapsDueCount={taapsDueCount}
                loading={assetsLoading}
            />

            <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="teal" variant="enclosed" isLazy>
                <TabList>
                    <Tab fontSize="sm">Assets</Tab>
                    <Tab fontSize="sm">TAAPs</Tab>
                    <Tab fontSize="sm">Vendors</Tab>
                    <Tab fontSize="sm">Interfaces</Tab>
                    <Tab fontSize="sm">Tools</Tab>
                    <Tab fontSize="sm">Components</Tab>
                </TabList>

                <TabPanels>
                    {/* Assets */}
                    <TabPanel px={0}>
                        {assetsError && (
                            <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                                <AlertIcon />{assetsError}
                            </Alert>
                        )}
                        <Flex gap={6} align="flex-start">
                            <Box flex="1" minW="0">
                                {assetsLoading ? (
                                    <HStack p={4} color="gray.600" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" /><Text>Loading assets…</Text>
                                    </HStack>
                                ) : (
                                    <AssetList
                                        items={assets}
                                        selectedId={selectedAssetId}
                                        elevationSet={elevationSet}
                                        onSelect={(item) => setSelectedAssetId(item.asset_identifier)}
                                        onAdd={() => setAssetFormOpen(true)}
                                        emptyMessage="No assets yet. Click Add Asset to begin tracking."
                                    />
                                )}
                            </Box>
                            <Box flex="2" minW="0">
                                <AssetDetailPanel
                                    assetIdentifier={selectedAssetId}
                                    onAfterMutate={handleAssetMutate}
                                    onAddTaapForAsset={addTaapForAsset}
                                    onGoToTaaps={goToTaaps}
                                />
                            </Box>
                        </Flex>
                    </TabPanel>

                    {/* TAAPs */}
                    <TabPanel px={0}>
                        {taapsError && (
                            <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                                <AlertIcon />{taapsError}
                            </Alert>
                        )}
                        <Flex gap={6} align="flex-start">
                            <Box flex="1" minW="0">
                                {taapsLoading ? (
                                    <HStack p={4} color="gray.600" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" /><Text>Loading TAAPs…</Text>
                                    </HStack>
                                ) : (
                                    <TaapList
                                        items={taaps}
                                        selectedTitle={selectedTaapTitle}
                                        onSelect={(t) => setSelectedTaapTitle(t.title)}
                                        onAdd={() => { setTaapPresetAsset(null); setTaapFormOpen(true); }}
                                        emptyMessage="No TAAPs yet. Click Add TAAP to begin tracking."
                                    />
                                )}
                            </Box>
                            <Box flex="2" minW="0">
                                <TaapDetailPanel
                                    title={selectedTaapTitle}
                                    onAfterMutate={handleTaapMutate}
                                    onGoToAsset={goToAsset}
                                />
                            </Box>
                        </Flex>
                    </TabPanel>

                    {/* Vendors */}
                    <TabPanel px={0}>
                        {vendorsError && (
                            <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                                <AlertIcon />{vendorsError}
                            </Alert>
                        )}
                        <Flex gap={6} align="flex-start">
                            <Box flex="1" minW="0">
                                {vendorsLoading ? (
                                    <HStack p={4} color="gray.600" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" /><Text>Loading vendors…</Text>
                                    </HStack>
                                ) : (
                                    <VendorList
                                        items={vendors}
                                        selectedName={selectedVendorName}
                                        onSelect={(v) => setSelectedVendorName(v.name)}
                                        onAdd={() => setVendorFormOpen(true)}
                                        emptyMessage="No vendors yet. Click Add Vendor to begin tracking."
                                    />
                                )}
                            </Box>
                            <Box flex="2" minW="0">
                                <VendorDetailPanel
                                    vendorName={selectedVendorName}
                                    onAfterMutate={handleVendorMutate}
                                    onReselect={setSelectedVendorName}
                                    onGoToAsset={goToAsset}
                                />
                            </Box>
                        </Flex>
                    </TabPanel>

                    {/* Interfaces */}
                    <TabPanel px={0}>
                        {interfacesError && (
                            <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                                <AlertIcon />{interfacesError}
                            </Alert>
                        )}
                        <Flex gap={6} align="flex-start">
                            <Box flex="1" minW="0">
                                {interfacesLoading ? (
                                    <HStack p={4} color="gray.600" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" /><Text>Loading interfaces…</Text>
                                    </HStack>
                                ) : (
                                    <InterfaceList
                                        items={interfaces}
                                        selectedId={selectedInterfaceId}
                                        uncoveredSet={uncoveredSet}
                                        onSelect={(item) => setSelectedInterfaceId(item.interface_identifier)}
                                        onAdd={() => setInterfaceFormOpen(true)}
                                        emptyMessage="No interfaces yet. Click Add Interface to begin tracking."
                                    />
                                )}
                            </Box>
                            <Box flex="2" minW="0">
                                <InterfaceDetailPanel
                                    interfaceIdentifier={selectedInterfaceId}
                                    assets={assets}
                                    implementations={implementations}
                                    onAfterMutate={handleInterfaceMutate}
                                    onGoToAsset={goToAsset}
                                />
                            </Box>
                        </Flex>
                    </TabPanel>

                    {/* Tools */}
                    <TabPanel px={0}>
                        {toolsError && (
                            <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                                <AlertIcon />{toolsError}
                            </Alert>
                        )}
                        <Flex gap={6} align="flex-start">
                            <Box flex="1" minW="0">
                                {toolsLoading ? (
                                    <HStack p={4} color="gray.600" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" /><Text>Loading tools…</Text>
                                    </HStack>
                                ) : (
                                    <ToolList
                                        items={tools}
                                        selectedId={selectedToolId}
                                        onSelect={(item) => setSelectedToolId(item.tool_identifier)}
                                        onAdd={() => setToolFormOpen(true)}
                                        emptyMessage="No tools yet. Click Add Tool to begin tracking."
                                    />
                                )}
                            </Box>
                            <Box flex="2" minW="0">
                                <ToolDetailPanel
                                    toolIdentifier={selectedToolId}
                                    assets={assets}
                                    vendors={vendors}
                                    implementations={implementations}
                                    onAfterMutate={handleToolMutate}
                                    onGoToAsset={goToAsset}
                                />
                            </Box>
                        </Flex>
                    </TabPanel>

                    {/* Components */}
                    <TabPanel px={0}>
                        {componentsError && (
                            <Alert status="error" borderRadius="md" fontSize="sm" mb={3}>
                                <AlertIcon />{componentsError}
                            </Alert>
                        )}
                        <Flex gap={6} align="flex-start">
                            <Box flex="1" minW="0">
                                {componentsLoading ? (
                                    <HStack p={4} color="gray.600" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" /><Text>Loading components…</Text>
                                    </HStack>
                                ) : (
                                    <ComponentList
                                        items={components}
                                        selectedId={selectedComponentId}
                                        onSelect={(item) => setSelectedComponentId(item.component_identifier)}
                                        onAdd={() => setComponentFormOpen(true)}
                                        emptyMessage="No components yet. Click Add Component to begin tracking."
                                    />
                                )}
                            </Box>
                            <Box flex="2" minW="0">
                                <ComponentDetailPanel
                                    componentIdentifier={selectedComponentId}
                                    interfaces={interfaces}
                                    guidelines={guidelines}
                                    onAfterMutate={handleComponentMutate}
                                    onGoToInterface={goToInterface}
                                />
                            </Box>
                        </Flex>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <AssetForm
                isOpen={assetFormOpen}
                onClose={() => setAssetFormOpen(false)}
                onSaved={handleAssetCreated}
            />

            <TaapForm
                isOpen={taapFormOpen}
                onClose={() => { setTaapFormOpen(false); setTaapPresetAsset(null); }}
                assets={assets}
                presetAssetIdentifier={taapPresetAsset}
                onSaved={handleTaapCreated}
            />

            <VendorForm
                isOpen={vendorFormOpen}
                onClose={() => setVendorFormOpen(false)}
                onSaved={handleVendorCreated}
            />

            <InterfaceForm
                isOpen={interfaceFormOpen}
                onClose={() => setInterfaceFormOpen(false)}
                assets={assets}
                onSaved={handleInterfaceCreated}
            />

            <ToolForm
                isOpen={toolFormOpen}
                onClose={() => setToolFormOpen(false)}
                assets={assets}
                onSaved={handleToolCreated}
            />

            <ComponentForm
                isOpen={componentFormOpen}
                onClose={() => setComponentFormOpen(false)}
                interfaces={interfaces}
                onSaved={handleComponentCreated}
            />
        </Box>
    );
}

export default AssetsMasterContainer;
