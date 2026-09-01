import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import useResource from '../../hooks/useResource';
import useInvalidateResources from '../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../context/resourceKeys';

/**
 * Assets category for the ATI Explorer. Dashboard + two-tab master-detail:
 *
 *   Stat strip — Total assets · ⚠ Elevation · TAAPs due for review.
 *   Assets tab — AssetList (scope-grouped, ⚠ badges) + AssetDetailPanel.
 *   TAAPs tab  — TaapList + TaapDetailPanel (asset-scoped coverage).
 *
 * Owns: selection per tab, the active tab, and the create flows. Edge mutations
 * inside the detail panels call back here to refresh the lists / stat counts.
 * Assets are keyed by asset_identifier; TAAPs by title.
 *
 * It does NOT own the data. All eleven reads go through useResource, so they sit
 * in the shared store on DataContext and survive leaving the area — this
 * container used to refire every one of them on each visit. The `loadX`
 * functions below are kept, with their old signatures, because the mutation
 * handlers need the refreshed list in hand to pick the next selection; they are
 * now invalidate-and-refetch against the cache rather than local setState.
 *
 * Two of the reads are foreign to this area: implementations (for the interface
 * "Remediated by" and tool "Used by" pickers) and governance (for the component
 * must_satisfy picker, filtered to guidelines). They use the shared keys, so
 * they are the same cache entries the implementation and governance areas read,
 * and those areas invalidate them on write.
 */
function AssetsMasterContainer() {
    // Deep-link: /{campus}/ati-explorer/assets/:assetTab/:itemId arrives with a tab
    // and item to open (e.g. from a success indicator's Assets/Interfaces/Tools panel).
    const { campus, assetTab, itemId } = useParams();
    const navigate = useNavigate();

    const [tabIndex, setTabIndex] = useState(0);

    // Tab order must match the <Tab> order below. Tab changes push the slug into
    // the URL so the address bar always names the visible tab (deep-linkable,
    // back/forward switches tabs via the assetTab effect below).
    const TAB_SLUGS = ['assets', 'taaps', 'vendors', 'interfaces', 'tools', 'components'];
    const handleTabChange = (index) => {
        setTabIndex(index);
        navigate(`/${campus}/ati-explorer/assets/${TAB_SLUGS[index]}`);
    };

    // Stable empty list, so the derivations below don't churn while loading.
    const EMPTY = useMemo(() => [], []);
    const itemsOf = (resp) => resp?.data?.items || [];

    // ---- Assets ----
    const assetsRes = useResource(KEYS.assetsAll, fetchAllAssets);
    const elevationRes = useResource(KEYS.assetsElevation, fetchElevationSignalAssets);

    const assets = useMemo(() => itemsOf(assetsRes.data) || EMPTY, [assetsRes.data, EMPTY]);
    const elevationSet = useMemo(
        () => new Set(itemsOf(elevationRes.data).map((a) => a.asset_identifier)),
        [elevationRes.data],
    );
    const assetsLoading = assetsRes.loading || elevationRes.loading;
    const assetsError = assetsRes.error || elevationRes.error;
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [assetFormOpen, setAssetFormOpen] = useState(false);

    // ---- TAAPs ----
    const taapsRes = useResource(KEYS.taapsAll, fetchAllTaaps);
    // "Due as of" is a different answer tomorrow, so the date is in the key.
    // Fixed at mount rather than recomputed per render — a session left open
    // across midnight re-keys on its next mount, which is soon enough.
    const today = useMemo(() => toISODate(new Date()), []);
    const taapsDueRes = useResource(KEYS.taapsDue(today), () => fetchTaapsDueForReview(today));

    const taaps = useMemo(() => itemsOf(taapsRes.data) || EMPTY, [taapsRes.data, EMPTY]);
    const taapsLoading = taapsRes.loading;
    const taapsError = taapsRes.error;
    const taapsDueCount = itemsOf(taapsDueRes.data).length;
    const [selectedTaapTitle, setSelectedTaapTitle] = useState(null);
    const [taapFormOpen, setTaapFormOpen] = useState(false);
    const [taapPresetAsset, setTaapPresetAsset] = useState(null);

    // ---- Vendors ----
    const vendorsRes = useResource(KEYS.vendorsList, fetchVendorsList);
    const vendors = useMemo(() => itemsOf(vendorsRes.data) || EMPTY, [vendorsRes.data, EMPTY]);
    const vendorsLoading = vendorsRes.loading;
    const vendorsError = vendorsRes.error;
    const [selectedVendorName, setSelectedVendorName] = useState(null);
    const [vendorFormOpen, setVendorFormOpen] = useState(false);

    // ---- Interfaces ----
    const interfacesRes = useResource(KEYS.interfacesAll, fetchAllInterfaces);
    const uncoveredRes = useResource(KEYS.interfacesUncovered, fetchUncoveredInterfaces);

    const interfaces = useMemo(
        () => itemsOf(interfacesRes.data) || EMPTY, [interfacesRes.data, EMPTY],
    );
    const uncoveredSet = useMemo(
        () => new Set(itemsOf(uncoveredRes.data).map((i) => i.interface_identifier)),
        [uncoveredRes.data],
    );
    const interfacesLoading = interfacesRes.loading || uncoveredRes.loading;
    const interfacesError = interfacesRes.error || uncoveredRes.error;
    const [selectedInterfaceId, setSelectedInterfaceId] = useState(null);
    const [interfaceFormOpen, setInterfaceFormOpen] = useState(false);

    // ---- Tools ----
    const toolsRes = useResource(KEYS.toolsAll, fetchAllTools);
    const tools = useMemo(() => itemsOf(toolsRes.data) || EMPTY, [toolsRes.data, EMPTY]);
    const toolsLoading = toolsRes.loading;
    const toolsError = toolsRes.error;
    const [selectedToolId, setSelectedToolId] = useState(null);
    const [toolFormOpen, setToolFormOpen] = useState(false);

    // ---- Components ----
    const componentsRes = useResource(KEYS.componentsAll, fetchAllComponents);
    const components = useMemo(
        () => itemsOf(componentsRes.data) || EMPTY, [componentsRes.data, EMPTY],
    );
    const componentsLoading = componentsRes.loading;
    const componentsError = componentsRes.error;
    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [componentFormOpen, setComponentFormOpen] = useState(false);

    // ---- Foreign reads: implementations and governance ----
    // Remediating implementation types only (these carry remediates_interface),
    // flattened for the Interface "Remediated by" and Tool "Used by" pickers.
    const REMEDIATING_TYPES = useMemo(() => ['Process', 'Project', 'Procedure', 'Service'], []);
    const implementationsRes = useResource(KEYS.implementationsAll, fetchAllImplementations);
    const implementations = useMemo(() => {
        const grouped = implementationsRes.data?.status?.data || implementationsRes.data?.data || {};
        return REMEDIATING_TYPES.flatMap((t) => (grouped[t] || []).map((impl) => ({
            unique_id: impl.unique_id,
            title: impl.title,
            type: impl.type || t,
        })));
    }, [implementationsRes.data, REMEDIATING_TYPES]);

    // Guidelines come from the governance store (type === 'guideline'); used as the
    // candidate list for a component's must_satisfy picker.
    const governanceRes = useResource(KEYS.governanceAll, fetchAllGovernance);
    const guidelines = useMemo(() => {
        const raw = governanceRes.data?.data;
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
        return list
            .filter((g) => g.type === 'guideline')
            .map((g) => ({ unique_id: g.unique_id, title: g.title }));
    }, [governanceRes.data]);

    // ---- Refresh helpers ----
    // Same names and same contract as the loaders they replace: invalidate, refetch,
    // and RESOLVE WITH THE LIST, because every caller below picks the next selection
    // out of it. A create/delete can move the elevation and uncovered signals too, so
    // those are reloaded alongside their list rather than left to go stale.
    const { reload: reloadAssets } = assetsRes;
    const { reload: reloadElevation } = elevationRes;
    const loadAssets = useCallback(async () => {
        const [allResp] = await Promise.all([reloadAssets(), reloadElevation()]);
        return itemsOf(allResp);
    }, [reloadAssets, reloadElevation]);

    const { reload: reloadTaaps } = taapsRes;
    const loadTaaps = useCallback(async () => itemsOf(await reloadTaaps()), [reloadTaaps]);

    const { reload: reloadTaapsDue } = taapsDueRes;
    const loadTaapsDue = useCallback(async () => { await reloadTaapsDue(); }, [reloadTaapsDue]);

    const { reload: reloadVendors } = vendorsRes;
    const loadVendors = useCallback(async () => itemsOf(await reloadVendors()), [reloadVendors]);

    const { reload: reloadInterfaces } = interfacesRes;
    const { reload: reloadUncovered } = uncoveredRes;
    const loadInterfaces = useCallback(async () => {
        const [allResp] = await Promise.all([reloadInterfaces(), reloadUncovered()]);
        return itemsOf(allResp);
    }, [reloadInterfaces, reloadUncovered]);

    const { reload: reloadTools } = toolsRes;
    const loadTools = useCallback(async () => itemsOf(await reloadTools()), [reloadTools]);

    const { reload: reloadComponents } = componentsRes;
    const loadComponents = useCallback(
        async () => itemsOf(await reloadComponents()), [reloadComponents],
    );


    // Apply the deep-link tab + selection when the URL params are present. Detail
    // panels fetch their own detail by identifier, so this works even before the
    // matching list finishes loading. Manual tab/selection changes don't touch the
    // URL, so this only fires on arrival.
    useEffect(() => {
        if (!assetTab) return;
        const id = itemId ? decodeURIComponent(itemId) : null;
        switch (assetTab) {
            case 'assets': setTabIndex(0); if (id) setSelectedAssetId(id); break;
            case 'taaps': setTabIndex(1); if (id) setSelectedTaapTitle(id); break;
            case 'vendors': setTabIndex(2); if (id) setSelectedVendorName(id); break;
            case 'interfaces': setTabIndex(3); if (id) setSelectedInterfaceId(id); break;
            case 'tools': setTabIndex(4); if (id) setSelectedToolId(id); break;
            case 'components': setTabIndex(5); if (id) setSelectedComponentId(id); break;
            default: break;
        }
    }, [assetTab, itemId]);

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
    // A vendor is served by TWO endpoints under two keys: /vendors (this tab's
    // list) and /organizational-units?type=vendors (the candidate picker in
    // AssetForm, ToolForm and the asset panel). Reloading only the first would
    // leave a vendor created here missing from every picker until a reload —
    // the exact staleness that caching a list buys you if you skip this.
    const { invalidateNamespace } = useInvalidateResources();

    const handleVendorCreated = async (created) => {
        invalidateNamespace(NS.orgUnits);
        const list = await loadVendors();
        if (created?.name) setSelectedVendorName(created.name);
        else if (list.length) setSelectedVendorName(list[0].name);
    };

    const handleVendorMutate = async (deletedName) => {
        invalidateNamespace(NS.orgUnits);
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

            <Tabs index={tabIndex} onChange={handleTabChange} colorScheme="teal" variant="enclosed" isLazy>
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
