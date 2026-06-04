import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    fetchAllSchemaElements,
    fetchAllPrinciples,
    fetchAllIntellectualSources,
} from '../services/api/get';

/**
 * Shared store for the meta-scaffold (Phase 1): SchemaElements, Principles, and the
 * IntellectualSources that ground principles. Fetched ONCE here and exposed app-wide so the
 * two slice containers (and Phase 2's trace-up) read from one place rather than self-fetching.
 * Mirrors DescriptorContext. Consume via the useMetaScaffold() hook.
 *
 * Mutations in the slices call `reload()` to refresh the whole store (so e.g. a SchemaElement's
 * `shaped_by` backref updates when a Principle attaches it).
 */
export const MetaScaffoldContext = createContext();

export const MetaScaffoldProvider = ({ children }) => {
    const [schemaElements, setSchemaElements] = useState([]);
    const [principles, setPrinciples] = useState([]);
    const [intellectualSources, setIntellectualSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [se, pr, is] = await Promise.all([
                fetchAllSchemaElements(),
                fetchAllPrinciples(),
                fetchAllIntellectualSources(),
            ]);
            setSchemaElements(se?.data?.items || []);
            setPrinciples(pr?.data?.items || []);
            setIntellectualSources(is?.data?.items || []);
        } catch (e) {
            setError('Failed to fetch meta-scaffold data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    // handle/id -> item maps, rebuilt only when their list changes. The handle is the stable,
    // URL-meaningful key (SchemaElement/Principle); IntellectualSource keys on unique_id.
    const schemaElementsByHandle = useMemo(() => {
        const m = {};
        for (const e of schemaElements) if (e?.handle) m[e.handle] = e;
        return m;
    }, [schemaElements]);

    const principlesByHandle = useMemo(() => {
        const m = {};
        for (const p of principles) if (p?.handle) m[p.handle] = p;
        return m;
    }, [principles]);

    const intellectualSourcesById = useMemo(() => {
        const m = {};
        for (const s of intellectualSources) if (s?.unique_id) m[s.unique_id] = s;
        return m;
    }, [intellectualSources]);

    const getSchemaElement = useCallback((handle) => schemaElementsByHandle[handle] || null, [schemaElementsByHandle]);
    const getPrinciple = useCallback((handle) => principlesByHandle[handle] || null, [principlesByHandle]);
    const getIntellectualSource = useCallback((uid) => intellectualSourcesById[uid] || null, [intellectualSourcesById]);

    const value = useMemo(() => ({
        schemaElements,
        principles,
        intellectualSources,
        schemaElementsByHandle,
        principlesByHandle,
        intellectualSourcesById,
        loading,
        error,
        reload,
        getSchemaElement,
        getPrinciple,
        getIntellectualSource,
    }), [
        schemaElements, principles, intellectualSources,
        schemaElementsByHandle, principlesByHandle, intellectualSourcesById,
        loading, error, reload, getSchemaElement, getPrinciple, getIntellectualSource,
    ]);

    return (
        <MetaScaffoldContext.Provider value={value}>
            {children}
        </MetaScaffoldContext.Provider>
    );
};
