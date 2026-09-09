/**
 * Tests for the position-description service functions (all four verbs).
 * Mocks axios and fetch — no live HTTP.
 */
// Inline factory mock — axios v1 ships as ESM and CRA's Jest doesn't transform
// node_modules, so a bare `jest.mock('axios')` triggers a SyntaxError on the
// real module's import statement. Returning a factory bypasses the real load.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { getPositionDescriptions } from './get';
import { addPositionDescription } from './post';
import { updatePositionDescription } from './put';
import { deletePositionDescription } from './delete';

beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
    axios.put.mockReset();
});

describe('getPositionDescriptions', () => {
    it('GETs /position-descriptions with employee_id and unwraps items', async () => {
        const items = [{ unique_id: 'pd1', name: 'Coordinator PD' }];
        axios.get.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: { items } } });

        const result = await getPositionDescriptions('emp-1');

        expect(axios.get).toHaveBeenCalledWith(
            expect.stringMatching(/\/position-descriptions$/),
            { params: { employee_id: 'emp-1' } },
        );
        expect(result).toEqual(items);
    });

    it('returns [] when the payload carries no items', async () => {
        axios.get.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: {} } });
        expect(await getPositionDescriptions('emp-1')).toEqual([]);
    });

    it('throws when axios rejects', async () => {
        axios.get.mockRejectedValueOnce(new Error('Request failed with status code 500'));
        await expect(getPositionDescriptions('emp-1')).rejects.toThrow(/500/);
    });
});

describe('addPositionDescription', () => {
    it('POSTs the action with employee_id and the record fields', async () => {
        axios.post.mockResolvedValueOnce({ data: { status: 'success', data: { position_description: {} } } });

        await addPositionDescription('emp-1', {
            name: 'Coordinator PD',
            storage_key: 'abc123',
            original_filename: 'pd.pdf',
        });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringMatching(/\/position-descriptions$/),
            {
                action: 'add_position_description',
                employee_id: 'emp-1',
                name: 'Coordinator PD',
                storage_key: 'abc123',
                original_filename: 'pd.pdf',
            },
        );
    });

    it('throws when axios rejects', async () => {
        axios.post.mockRejectedValueOnce(new Error('Request failed with status code 400'));
        await expect(addPositionDescription('emp-1', { name: 'x' })).rejects.toThrow(/400/);
    });
});

describe('updatePositionDescription', () => {
    it('PUTs the action to the record URL with the changes', async () => {
        axios.put.mockResolvedValueOnce({ data: { status: 'success' } });

        await updatePositionDescription('pd1', { depreciated: true });

        expect(axios.put).toHaveBeenCalledWith(
            expect.stringMatching(/\/position-descriptions\/pd1$/),
            { action: 'update_position_description', depreciated: true },
        );
    });
});

describe('deletePositionDescription', () => {
    afterEach(() => {
        delete global.fetch;
    });

    it('DELETEs the record URL and returns the payload', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success', data: { deleted: 'pd1' } }),
        });

        const result = await deletePositionDescription('pd1');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringMatching(/\/position-descriptions\/pd1$/),
            { method: 'DELETE' },
        );
        expect(result.data.deleted).toBe('pd1');
    });

    it('throws the server error when the response is not ok', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'PositionDescription not found' }),
        });
        await expect(deletePositionDescription('missing')).rejects.toThrow(/not found/);
    });
});
