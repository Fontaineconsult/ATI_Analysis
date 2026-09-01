/**
 * The global "is anything loading?" signal.
 *
 * This is the piece that did not exist before every read went through one
 * store: loading state was scattered across ~48 components' private useState
 * flags, so nothing could see all of it at once and there was no global
 * indicator to plug a spinner into.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';

import { DataContext } from '../context/DataContext';
import { createResourceStore } from '../context/resourceStore';
import useIsFetching from './useIsFetching';

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};

function makeWrapper(store = createResourceStore()) {
    const Provider = ({ children }) => (
        <DataContext.Provider
            value={{
                subscribeResources: (l) => store.subscribe(l),
                inflightCount: (prefix) => store.inflightCount(prefix),
            }}
        >
            {children}
        </DataContext.Provider>
    );
    return { Provider, store };
}

describe('useIsFetching', () => {
    it('is zero when nothing is in flight', () => {
        const { Provider } = makeWrapper();
        const { result } = renderHook(() => useIsFetching(), { wrapper: Provider });
        expect(result.current).toBe(0);
    });

    it('rises and falls with a request', async () => {
        const { Provider, store } = makeWrapper();
        const gate = deferred();

        const { result } = renderHook(() => useIsFetching(), { wrapper: Provider });

        let pending;
        await act(async () => {
            pending = store.getOrFetch('k', () => gate.promise);
            // Let the store's notify reach the subscriber.
            await Promise.resolve();
        });
        expect(result.current).toBe(1);

        await act(async () => {
            gate.resolve('done');
            await pending;
        });
        await waitFor(() => expect(result.current).toBe(0));
    });

    it('counts concurrent requests, and de-duplicated ones only once', async () => {
        const { Provider, store } = makeWrapper();
        const a = deferred();
        const b = deferred();

        const { result } = renderHook(() => useIsFetching(), { wrapper: Provider });

        await act(async () => {
            store.getOrFetch('a', () => a.promise);
            store.getOrFetch('b', () => b.promise);
            // Same key as the first — shares its promise, so it is not a second
            // request and must not be counted as one.
            store.getOrFetch('a', () => a.promise);
            await Promise.resolve();
        });

        expect(result.current).toBe(2);

        await act(async () => {
            a.resolve(1);
            b.resolve(2);
            await Promise.resolve();
        });
        await waitFor(() => expect(result.current).toBe(0));
    });

    it('falls back to zero when a request fails', async () => {
        const { Provider, store } = makeWrapper();
        const gate = deferred();
        const { result } = renderHook(() => useIsFetching(), { wrapper: Provider });

        let pending;
        await act(async () => {
            pending = store.getOrFetch('k', () => gate.promise).catch(() => {});
            await Promise.resolve();
        });
        expect(result.current).toBe(1);

        await act(async () => {
            gate.reject(new Error('boom'));
            await pending;
        });
        await waitFor(() => expect(result.current).toBe(0));
    });

    /** Scoping is what makes it usable for a panel rather than only globally. */
    it('scopes to a namespace', async () => {
        const { Provider, store } = makeWrapper();
        const assets = deferred();
        const people = deferred();

        const { result: all } = renderHook(() => useIsFetching(), { wrapper: Provider });
        const { result: assetsOnly } = renderHook(() => useIsFetching('assets:'), { wrapper: Provider });

        await act(async () => {
            store.getOrFetch('assets:all', () => assets.promise);
            store.getOrFetch('people:detail:x', () => people.promise);
            await Promise.resolve();
        });

        expect(all.current).toBe(2);
        expect(assetsOnly.current).toBe(1);

        await act(async () => {
            assets.resolve([]);
            people.resolve([]);
            await Promise.resolve();
        });
        await waitFor(() => expect(all.current).toBe(0));
    });

    it('a cached read never registers as in-flight', async () => {
        const { Provider, store } = makeWrapper();
        await store.getOrFetch('k', () => Promise.resolve('v'));

        const { result } = renderHook(() => useIsFetching(), { wrapper: Provider });

        await act(async () => {
            await store.getOrFetch('k', () => Promise.resolve('v'));
        });
        // The whole point of the cache: a hit is not a request, so no spinner.
        expect(result.current).toBe(0);
    });

    it('reports zero with no provider rather than throwing', () => {
        const { result } = renderHook(() => useIsFetching());
        expect(result.current).toBe(0);
    });

    it('stops listening once unmounted', async () => {
        const { Provider, store } = makeWrapper();
        const { unmount } = renderHook(() => useIsFetching(), { wrapper: Provider });
        unmount();

        // No subscriber left; a request must not throw on notify.
        await expect(store.getOrFetch('k', () => Promise.resolve(1))).resolves.toBe(1);
    });
});
