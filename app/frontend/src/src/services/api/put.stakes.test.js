/**
 * Tests for the community indicator-stake PUT services (has_stake_in).
 * Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { addCommunityStake, removeCommunityStake } from './put';

describe('community stake services', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('addCommunityStake PUTs the add_stake action with key and note', async () => {
        const mockData = { status: 'success', data: { community: { stakes: [{ composite_key: '7.11-ins' }] } } };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await addCommunityStake('comm-1', '7.11-ins', 'library assets');

        expect(axios.put).toHaveBeenCalledTimes(1);
        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/communities\/comm-1$/);
        expect(payload).toEqual({ action: 'add_stake', composite_key: '7.11-ins', note: 'library assets' });
        expect(result).toEqual(mockData);
    });

    it('addCommunityStake sends null for an omitted note', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success' } });
        await addCommunityStake('comm-1', '7.11-ins');
        expect(axios.put.mock.calls[0][1].note).toBeNull();
    });

    it('removeCommunityStake PUTs the remove_stake action', async () => {
        const mockData = { status: 'success', data: { community: { stakes: [] } } };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await removeCommunityStake('comm-1', '7.11-ins');

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/communities\/comm-1$/);
        expect(payload).toEqual({ action: 'remove_stake', composite_key: '7.11-ins' });
        expect(result).toEqual(mockData);
    });

    it('propagates errors', async () => {
        axios.put.mockRejectedValueOnce(new Error('boom'));
        await expect(addCommunityStake('comm-1', '7.11-ins')).rejects.toThrow('boom');
    });
});
