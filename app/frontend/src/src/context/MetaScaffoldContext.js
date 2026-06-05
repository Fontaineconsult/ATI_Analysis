import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllPrinciples, fetchAllIntellectualSources } from '../services/api/get';

/**
 * Shared store for the meta-scaffold (Phase 1): Principles and the IntellectualSources that
 * ground them. Fetched ONCE here and exposed app-wide so the Governance → Principles tab reads
 * from one place. Mirrors DescriptorContext. Consume via the useMetaScaffold() hook.
 *
 * NOTE: there is no separate "schema elements" list — a Principle `shapes` UniversalDescriptors
 * (the descriptor IS the ontology-element anchor), so shape candidates come from the descriptor
 * store (useDescriptors), not from here. Governance candidates are fetched on demand in the
 * principle detail panel.
 *
 * Mutations call `reload()` to refresh the store.
 */
export const MetaScaffoldContext = createContext();

export const MetaScaffoldProvider = ({ children }) => {
    const [principles, setPrinciples] = useState([]);
    const [intellectualSources, setIntellectualSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pr, is] = await Promise.all([
                fetchAllPrinciples(),
                fetchAllIntellectualSources(),
            ]);
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

    const getPrinciple = useCallback((handle) => principlesByHandle[handle] || null, [principlesByHandle]);
    const getIntellectualSource = useCallback((uid) => intellectualSourcesById[uid] || null, [intellectualSourcesById]);

    const value = useMemo(() => ({
        principles,
        intellectualSources,
        principlesByHandle,
        intellectualSourcesById,
        loading,
        error,
        reload,
        getPrinciple,
        getIntellectualSource,
    }), [
        principles, intellectualSources, principlesByHandle, intellectualSourcesById,
        loading, error, reload, getPrinciple, getIntellectualSource,
    ]);

    return (
        <MetaScaffoldContext.Provider value={value}>
            {children}
        </MetaScaffoldContext.Provider>
    );
};
