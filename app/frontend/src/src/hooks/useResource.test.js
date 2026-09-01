/**
 * useResource is the rule "fetched data does not live in component state",
 * expressed as a hook. These tests assert the consequences that were real
 * defects before it existed: a revisit must not refetch, a remount must not
 * flash a spinner over data already held, and an inline fetcher closure must not
 * count as a new resource.
 *
 * The store is the real one (resourceStore), wired through a hand-built
 * DataContext value rather than the full DataProvider — the provider fires the
 * dashboard's own loads on mount, which have nothing to do with this contract.
 */
// DataContext imports services/api/get, which imports axios. axios v1 ships as
// ESM and CRA's Jest does not transform node_modules, so a bare import throws
// "Cannot use import statement outside a module" — the inline-factory mock in
// CLAUDE.md is the house workaround. Nothing here makes a request.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

import React, { useState } from 'react';
import { renderHook, render, screen, act, waitFor } from '@testing-library/react';

import { DataContext } from '../context/DataContext';
import { createResourceStore } from '../context/resourceStore';
import useResource from './useResource';

/** A provider that behaves like DataContext's resource surface, store and all. */
function makeWrapper(store = createResourceStore()) {
    const listeners = new Set();
    let version = 0;

    const Provider = ({ children }) => {
        const [v, setV] = useState(version);
        listeners.add(setV);
        const value = {
            peekResource: (k) => store.peek(k),
            getOrFetchResource: (k, f) => store.getOrFetch(k, f),
            invalidateResource: (k) => {
                store.invalidate(k);
                version += 1;
                listeners.forEach((set) => set(version));
            },
            resourceVersion: v,
        };
        return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
    };
    return { Provider, store };
}

describe('useResource', () => {
    it('loads, then reports the data', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn().mockResolvedValue('payload');

        const { result } = renderHook(() => useResource('k', fetcher), { wrapper: Provider });

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toBe('payload');
        expect(result.current.error).toBeNull();
    });

    it('reports the error and does not hold stale data', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn().mockRejectedValue(new Error('nope'));

        const { result } = renderHook(() => useResource('k', fetcher), { wrapper: Provider });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('nope');
        expect(result.current.data).toBeUndefined();
    });

    /** The defect this whole change is about. */
    it('does not refetch when a component remounts', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn().mockResolvedValue('payload');

        const first = renderHook(() => useResource('k', fetcher), { wrapper: Provider });
        await waitFor(() => expect(first.result.current.data).toBe('payload'));
        first.unmount();

        const second = renderHook(() => useResource('k', fetcher), { wrapper: Provider });
        await waitFor(() => expect(second.result.current.data).toBe('payload'));

        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('paints a cached key with no loading state at all', async () => {
        const { Provider, store } = makeWrapper();
        await store.getOrFetch('k', () => Promise.resolve('already here'));

        const { result } = renderHook(() => useResource('k', jest.fn()), { wrapper: Provider });

        // Synchronous on the very first render — no spinner frame.
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe('already here');
    });

    it('treats the KEY as the resource identity, not the fetcher', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn().mockResolvedValue('payload');

        // A new inline closure every render, as a detail panel would write it.
        const { result, rerender } = renderHook(
            () => useResource('k', () => fetcher()),
            { wrapper: Provider },
        );
        await waitFor(() => expect(result.current.data).toBe('payload'));

        rerender();
        rerender();

        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('follows the key when it changes', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn((k) => Promise.resolve(`data-for-${k}`));

        const { result, rerender } = renderHook(
            ({ k }) => useResource(k, () => fetcher(k)),
            { wrapper: Provider, initialProps: { k: 'a' } },
        );
        await waitFor(() => expect(result.current.data).toBe('data-for-a'));

        rerender({ k: 'b' });
        await waitFor(() => expect(result.current.data).toBe('data-for-b'));
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('is idle with a null key, and never calls the fetcher', () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn();

        const { result } = renderHook(() => useResource(null, fetcher), { wrapper: Provider });

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeUndefined();
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('respects enabled:false', () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn();
        renderHook(() => useResource('k', fetcher, { enabled: false }), { wrapper: Provider });
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('refetches after reload()', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn()
            .mockResolvedValueOnce('first')
            .mockResolvedValueOnce('second');

        const { result } = renderHook(() => useResource('k', fetcher), { wrapper: Provider });
        await waitFor(() => expect(result.current.data).toBe('first'));

        act(() => result.current.reload());
        await waitFor(() => expect(result.current.data).toBe('second'));
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('serves two components from one request', async () => {
        const { Provider } = makeWrapper();
        const fetcher = jest.fn().mockResolvedValue('shared');

        function Reader({ label }) {
            const { data } = useResource('k', fetcher);
            return <div>{`${label}:${data || 'pending'}`}</div>;
        }

        render(
            <Provider>
                <Reader label="one" />
                <Reader label="two" />
            </Provider>,
        );

        await waitFor(() => expect(screen.getByText('one:shared')).toBeInTheDocument());
        expect(screen.getByText('two:shared')).toBeInTheDocument();
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('falls back to an uncached fetch with no provider', async () => {
        const fetcher = jest.fn().mockResolvedValue('bare');
        const { result } = renderHook(() => useResource('k', fetcher));
        await waitFor(() => expect(result.current.data).toBe('bare'));
    });
});
