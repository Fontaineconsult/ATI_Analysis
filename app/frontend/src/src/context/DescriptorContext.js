import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllDescriptors } from '../services/api/get';

/**
 * Shared store for the ontology descriptions layer (UniversalDescriptor).
 *
 * Fetched ONCE here and exposed app-wide so any component can resolve a description by its
 * handle without its own request — the retrieval model from the ontology brief: descriptions
 * are merged onto UI in memory, keyed by handle, never refetched per element. Use the
 * `describe*` helpers (or `getDescriptor`) to look one up; the handle builders mirror
 * app/database/identifiers.py so the frontend resolves the exact keys the backend stores.
 *
 * Consume via the useDescriptors() hook (hooks/useDescriptors.js).
 */
export const DescriptorContext = createContext();

// Handle builders — keep in lockstep with the make_*_handle helpers in
// app/database/identifiers.py.
export const makeNodeTypeHandle = (label) => `node_type:${label}`;
export const makeFieldHandle = (label, field) => `field:${label}.${field}`;
export const makeFieldValueHandle = (field, value) => `field_value:${field}.${value}`;

export const DescriptorProvider = ({ children }) => {
    const [descriptors, setDescriptors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDescriptors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchAllDescriptors();
            setDescriptors(resp?.data?.items || []);
        } catch (e) {
            setError('Failed to fetch descriptors');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDescriptors();
    }, [loadDescriptors]);

    // handle -> descriptor, rebuilt only when the list changes. The whole point of the
    // handle model: O(1) lookup so descriptions stitch onto results without extra requests.
    const byHandle = useMemo(() => {
        const map = {};
        for (const d of descriptors) {
            if (d?.descriptor_handle) map[d.descriptor_handle] = d;
        }
        return map;
    }, [descriptors]);

    const getDescriptor = useCallback((handle) => byHandle[handle] || null, [byHandle]);
    const describeNodeType = useCallback((label) => byHandle[makeNodeTypeHandle(label)] || null, [byHandle]);
    const describeField = useCallback((label, field) => byHandle[makeFieldHandle(label, field)] || null, [byHandle]);
    const describeFieldValue = useCallback((field, value) => byHandle[makeFieldValueHandle(field, value)] || null, [byHandle]);

    // Legacy-shaped accessor: returns { name, description } for a node-type label, sourced from
    // its node_type descriptor. Drop-in replacement for the old context/definitions.js
    // getDefinition(); returns null when no descriptor is seeded for that label.
    const getNodeTypeDefinition = useCallback((label) => {
        const d = byHandle[makeNodeTypeHandle(label)];
        if (!d) return null;
        return {
            name: d.title || label,
            description: d.description_full || d.description_short || '',
        };
    }, [byHandle]);

    const value = useMemo(() => ({
        descriptors,
        byHandle,
        loading,
        error,
        refreshDescriptors: loadDescriptors,
        getDescriptor,
        describeNodeType,
        describeField,
        describeFieldValue,
        getNodeTypeDefinition,
    }), [descriptors, byHandle, loading, error, loadDescriptors, getDescriptor, describeNodeType, describeField, describeFieldValue, getNodeTypeDefinition]);

    return (
        <DescriptorContext.Provider value={value}>
            {children}
        </DescriptorContext.Provider>
    );
};