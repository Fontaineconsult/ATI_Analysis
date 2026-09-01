import { createResourceStore } from './resourceStore';

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
};

describe('resourceStore', () => {
    it('fetches a key once and serves the cache thereafter', async () => {
        const store = createResourceStore();
        const fetcher = jest.fn().mockResolvedValue({ rows: 1 });

        await store.getOrFetch('a', fetcher);
        await store.getOrFetch('a', fetcher);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(store.peek('a')).toEqual({ rows: 1 });
    });

    /**
     * The property the whole store exists for. React 18 StrictMode invokes an
     * effect twice on mount; without this, every cached read in the app fires
     * two requests in development — and the Documentation index is 2.6 MB.
     */
    it('shares ONE request between concurrent callers for the same key', async () => {
        const store = createResourceStore();
        const gate = deferred();
        const fetcher = jest.fn(() => gate.promise);

        const first = store.getOrFetch('a', fetcher);
        const second = store.getOrFetch('a', fetcher);

        // The second caller gets the very same promise back — that identity IS
        // the de-duplication, and it holds before the fetcher has even run
        // (getOrFetch defers the call by a microtask).
        expect(second).toBe(first);

        gate.resolve('value');
        await expect(first).resolves.toBe('value');
        await expect(second).resolves.toBe('value');
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('keeps keys independent', async () => {
        const store = createResourceStore();
        await store.getOrFetch('a', () => Promise.resolve(1));
        await store.getOrFetch('b', () => Promise.resolve(2));
        expect([store.peek('a'), store.peek('b')]).toEqual([1, 2]);
    });

    it('distinguishes a cached null from an absent key', async () => {
        const store = createResourceStore();
        await store.getOrFetch('a', () => Promise.resolve(null));
        expect(store.peek('a')).toBeNull();
        expect(store.has('a')).toBe(true);
        expect(store.peek('missing')).toBeUndefined();
        expect(store.has('missing')).toBe(false);
    });

    it('caches nothing for a fetcher that resolves to undefined', async () => {
        const store = createResourceStore();
        const fetcher = jest.fn().mockResolvedValue(undefined);
        await store.getOrFetch('a', fetcher);
        await store.getOrFetch('a', fetcher);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('caches nothing on failure, so the next subscriber retries', async () => {
        const store = createResourceStore();
        const fetcher = jest.fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce('recovered');

        await expect(store.getOrFetch('a', fetcher)).rejects.toThrow('boom');
        expect(store.has('a')).toBe(false);

        await expect(store.getOrFetch('a', fetcher)).resolves.toBe('recovered');
    });

    it('refetches after invalidate', async () => {
        const store = createResourceStore();
        const fetcher = jest.fn().mockResolvedValue('v');

        await store.getOrFetch('a', fetcher);
        store.invalidate('a');
        await store.getOrFetch('a', fetcher);

        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('drops one namespace and leaves the others alone', async () => {
        const store = createResourceStore();
        await store.getOrFetch('report:x', () => Promise.resolve(1));
        await store.getOrFetch('report:y', () => Promise.resolve(2));
        await store.getOrFetch('plan:z', () => Promise.resolve(3));
        await store.getOrFetch('documentation:index', () => Promise.resolve(4));

        store.invalidatePrefix('report:');

        expect(store.keys().sort()).toEqual(['documentation:index', 'plan:z']);
    });

    it('clears everything', async () => {
        const store = createResourceStore();
        await store.getOrFetch('a', () => Promise.resolve(1));
        store.clear();
        expect(store.keys()).toEqual([]);
    });

    it('holds no prototype keys', () => {
        // Object.create(null): a resource legitimately keyed 'constructor' or
        // 'toString' must not collide with Object.prototype.
        const store = createResourceStore();
        expect(store.has('constructor')).toBe(false);
        expect(store.peek('toString')).toBeUndefined();
    });
});
