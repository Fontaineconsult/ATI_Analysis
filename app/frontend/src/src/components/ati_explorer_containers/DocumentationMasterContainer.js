import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    AlertIcon,
    Box,
    Flex,
    Heading,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
} from '@chakra-ui/react';

import { fetchDocumentationIndex, fetchDocumentationItem } from '../../services/api/get';
import { updateDocumentationRecord } from '../../services/api/put';
import useResource from '../../hooks/useResource';
import useInvalidateResources from '../../hooks/useInvalidateResources';
import DocumentationStatStrip from '../graph_components/documentation/DocumentationStatStrip';
import DocumentationList from '../graph_components/documentation/DocumentationList';
import DocumentationDetailPanel from '../graph_components/documentation/DocumentationDetailPanel';
import useDocumentationFilters from '../graph_components/documentation/useDocumentationFilters';
import { NS } from '../../context/resourceKeys';
import {
    DOC_GROUPS,
    DOC_GROUP_ORDER,
    filterByAttachment,
    filterDocumentation,
    summarizeAttachments,
    summarizeDocumentation,
    typesInGroup,
} from '../graph_components/documentation/documentationConfig';

// Stable empty array so the memo chain below doesn't churn on every render
// while the index is still loading.
const EMPTY_ITEMS = [];

/**
 * The central Documentation area — every Document, Webpage, Note, Message and
 * Metric in the graph, as the primary subject rather than an accessory of
 * whatever points at them.
 *
 * The area is deliberately CAMPUS- AND YEAR-AGNOSTIC. Documentation nodes carry
 * no campus edge, and a single Note can be attached to records across several
 * campuses and years (the largest reaches 39). A campus filter here would be
 * fiction. Year appears per reference, where it actually lives, never as a
 * global scope.
 *
 * Two tabs rather than five, because the group is the mental model: artifacts
 * have a location and rot on their own; annotations hang off a parent and are
 * judged on whether the report can see them. Type narrowing is a chip row inside
 * the list.
 *
 * Filter state lives here, not in the list, so the stat-strip counts and the
 * rows always come from the same predicate over the same array.
 *
 * The DATA does not live here. Both reads go through useResource, so the index
 * and each opened record sit in the shared cache on DataContext rather than in
 * this component's state. That is not tidiness: the index is 2.6 MB, and while
 * it was local state it was refetched on every visit to the area and twice per
 * visit in development, because StrictMode double-invokes effects.
 */
function DocumentationMasterContainer() {
    const navigate = useNavigate();
    const location = useLocation();
    const { campus, docGroup, docType: routeDocType, docId } = useParams();

    // The index: one shared entry, fetched once and reused for the life of the
    // session. Documentation is campus- and year-agnostic, so a single key is
    // the whole cache — nothing about the current campus or year changes it.
    const { data: indexBody, loading, error } = useResource(
        'documentation:index', fetchDocumentationIndex,
    );

    // Filter state lives in the URL, not here, so a filtered view can be shared.
    // It still lives at the container level as far as the children are concerned,
    // which is what keeps the stat-strip counts and the rows in agreement.
    const {
        state: filters, setFilter, toggleType, setSort, setSearch,
        toggleAttachment, toggleAttachmentGroup, clearAttachments,
    } = useDocumentationFilters();
    const {
        filter: activeFilter, types: activeTypes, attached: activeAttachments,
        sort: sortKey, search: query,
    } = filters;

    // Selection is a route concern, so it seeds from the URL and is the only
    // thing this component still holds. It identifies a record; it is not the
    // record.
    const [selection, setSelection] = useState(
        () => (docId && routeDocType ? { docType: routeDocType, uniqueId: docId } : null),
    );

    const groupIndex = Math.max(0, DOC_GROUP_ORDER.indexOf(docGroup || 'artifacts'));
    const activeGroup = DOC_GROUP_ORDER[groupIndex];

    const items = useMemo(() => indexBody?.data?.items || EMPTY_ITEMS, [indexBody]);
    const meta = indexBody?.data?.meta || null;

    // Summary is computed over every item, so the tiles describe the whole
    // corpus rather than whichever tab happens to be open.
    const summary = useMemo(() => summarizeDocumentation(items), [items]);

    // Everything in the open tab that survives the diagnostic filter — the set the
    // attachment facet describes, and the set it then narrows.
    const groupScoped = useMemo(() => {
        const types = typesInGroup(activeGroup);
        return filterDocumentation(items, activeFilter).filter((i) => types.includes(i.doc_type));
    }, [items, activeGroup, activeFilter]);

    // Facet counts come from BEFORE the attachment selection, so a chip says how
    // many records picking it would show rather than collapsing to zero as soon
    // as something else is picked.
    const attachmentFacets = useMemo(() => summarizeAttachments(groupScoped), [groupScoped]);

    const groupItems = useMemo(
        () => filterByAttachment(groupScoped, activeAttachments),
        [groupScoped, activeAttachments],
    );

    // Counts on the type chips reflect every filter above them, so a chip never
    // promises rows the current filters have already excluded.
    const typeCounts = useMemo(() => {
        const counts = {};
        filterByAttachment(filterDocumentation(items, activeFilter), activeAttachments)
            .forEach((i) => {
                counts[i.doc_type] = (counts[i.doc_type] || 0) + 1;
            });
        return counts;
    }, [items, activeFilter, activeAttachments]);

    // One cache entry per opened record, so re-opening a record you already
    // looked at is free. The key carries both parts because the fetcher needs
    // both, and the key is what identifies a resource.
    const detailKey = selection
        ? `documentation:item:${selection.docType}:${selection.uniqueId}`
        : null;
    const { data: detailBody, loading: detailLoading, error: detailError } = useResource(
        detailKey,
        () => fetchDocumentationItem(selection.docType, selection.uniqueId),
    );

    // The index row stands in until the full record lands, so opening a record
    // paints immediately instead of flashing a spinner. A deep link to a record
    // that is not in the index (deleted, or a bad link) has no stand-in and
    // simply loads — the fetch is by id, so it does not depend on the index.
    const selectedRow = useMemo(
        () => (selection ? items.find((i) => i.unique_id === selection.uniqueId) : null),
        [items, selection],
    );
    const detail = detailBody?.data || selectedRow || null;

    // Saving a record changes the row in the index as well as the record itself
    // — the title, the badges, every derived count on the stat strip — so the
    // whole documentation namespace goes rather than the two keys involved.
    const { invalidateNamespace } = useInvalidateResources();
    const handleSave = useCallback(async (payload) => {
        await updateDocumentationRecord(selection.docType, payload);
        invalidateNamespace(NS.documentation);
    }, [selection, invalidateNamespace]);

    const handleSelect = useCallback((item) => {
        if (!item) return;
        setSelection({ docType: item.doc_type, uniqueId: item.unique_id });
        // CARRY THE SEARCH STRING. Every filter in this area lives in the query
        // string — the diagnostic filter, the type chips, the attachment facet,
        // the sort and the search box — so a navigate that drops it silently
        // clears all of them. That is what selecting a row used to do: the
        // record opened correctly and the list underneath reset to unfiltered,
        // with the facet button popping back out.
        navigate(
            `/${campus}/ati-explorer/documentation/${activeGroup}/${item.doc_type}`
            + `/${encodeURIComponent(item.unique_id)}${location.search}`,
            { replace: true },
        );
    }, [campus, activeGroup, navigate, location.search]);

    const handleGroupChange = (index) => {
        const next = DOC_GROUP_ORDER[index];
        // Build the target URL in one navigate. Calling clearTypes() and then
        // navigate() fires two navigations, and the second — having no search
        // string — would silently drop the filter, sort and query as well.
        //
        // `type` IS dropped deliberately: types are per-group, so carrying them
        // across would filter the new tab by types it cannot contain. Everything
        // else survives the tab switch, which is what you want when you are
        // working through one filter across both groups — `attached` especially,
        // since "everything we hold about our Services" is exactly the question
        // that wants both the documents and the notes.
        const params = new URLSearchParams(location.search);
        params.delete('type');
        const search = params.toString();
        navigate(
            `/${campus}/ati-explorer/documentation/${next}${search ? `?${search}` : ''}`,
        );
    };

    return (
        <Box>
            <Heading as="h2" size="lg" color="gray.800" mb={2}>Documentation</Heading>
            <Text fontSize="sm" color="gray.600" mb={4} maxW="4xl">
                Every Document, Webpage, Note, Message and Metric in the graph, across all campuses
                and years. Documentation is not campus-scoped — a single note can support records at
                several campuses at once — so nothing here is filtered by the campus you are viewing.
            </Text>

            <DocumentationStatStrip
                total={summary.total}
                deadButInReport={summary.deadButInReport}
                orphaned={summary.orphaned}
                shared={summary.shared}
                loading={loading}
                activeFilter={activeFilter}
                onFilterChange={setFilter}
            />

            {error && (
                <Alert status="error" borderRadius="md" fontSize="sm" mb={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            <Tabs
                index={groupIndex}
                onChange={handleGroupChange}
                colorScheme="teal"
                variant="enclosed"
                isLazy
            >
                <TabList>
                    {DOC_GROUP_ORDER.map((key) => {
                        const count = typesInGroup(key)
                            .reduce((sum, t) => sum + (summary.byType[t] || 0), 0);
                        return (
                            <Tab key={key} fontSize="sm">
                                {DOC_GROUPS[key].label} ({count})
                            </Tab>
                        );
                    })}
                </TabList>

                <TabPanels>
                    {DOC_GROUP_ORDER.map((key) => (
                        <TabPanel key={key} px={0}>
                            <Text fontSize="xs" color="gray.600" mb={3}>
                                {DOC_GROUPS[key].blurb}
                            </Text>
                            <Flex gap={6} align="flex-start">
                                <Box flex="1" minW="0" maxW="420px">
                                    <DocumentationList
                                        items={groupItems}
                                        group={key}
                                        activeTypes={activeTypes}
                                        onToggleType={toggleType}
                                        selectedId={selection?.uniqueId || null}
                                        onSelect={handleSelect}
                                        query={query}
                                        onQueryChange={setSearch}
                                        sortKey={sortKey}
                                        onSortChange={setSort}
                                        typeCounts={typeCounts}
                                        attachmentFacets={attachmentFacets}
                                        activeAttachments={activeAttachments}
                                        onToggleAttachment={toggleAttachment}
                                        onToggleAttachmentGroup={toggleAttachmentGroup}
                                        onClearAttachments={clearAttachments}
                                        loading={loading}
                                    />
                                </Box>
                                <Box flex="2" minW="0">
                                    <DocumentationDetailPanel
                                        item={detail}
                                        loading={detailLoading && !detail}
                                        error={detailError}
                                        campus={campus}
                                        capabilities={meta?.type_capabilities}
                                        onSave={handleSave}
                                    />
                                </Box>
                            </Flex>
                        </TabPanel>
                    ))}
                </TabPanels>
            </Tabs>

            {meta?.type_capabilities && (
                <Text fontSize="2xs" color="gray.600" mt={4}>
                    Read-only view. Editing documentation stays with the record’s parent —
                    an implementation, a governance instrument, or an evidence page.
                </Text>
            )}
        </Box>
    );
}

export default DocumentationMasterContainer;
