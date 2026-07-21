/**
 * Tests for the retirement lifecycle PUT service. Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { retireImplementation } from './put';

describe('retireImplementation', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('PUTs the retire action with date and note', async () => {
        const mockData = {
            status: 'success',
            data: { retired: true, retired_date: '2026-07-01', retired_note: 'superseded' },
            message: 'Process retired successfully',
        };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await retireImplementation('Process', 'abc123', {
            retired: true,
            retired_date: '2026-07-01',
            retired_note: 'superseded',
        });

        expect(axios.put).toHaveBeenCalledTimes(1);
        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/implementations$/);
        expect(payload).toEqual({
            action: 'retire_implementation',
            implementation_type: 'Process',
            unique_id: 'abc123',
            retired: true,
            retired_date: '2026-07-01',
            retired_note: 'superseded',
        });
        expect(result).toEqual(mockData);
    });

    it('PUTs the un-retire action with retired: false', async () => {
        axios.put.mockResolvedValueOnce({
            status: 200,
            data: { status: 'success', data: { retired: false, retired_date: null, retired_note: null } },
        });

        await retireImplementation('Guidance', 'xyz789', { retired: false });

        const [, payload] = axios.put.mock.calls[0];
        expect(payload.action).toBe('retire_implementation');
        expect(payload.retired).toBe(false);
        expect(payload.retired_date).toBeUndefined();
        expect(payload.retired_note).toBeUndefined();
    });

    it('throws when axios rejects', async () => {
        axios.put.mockRejectedValueOnce(new Error('Request failed with status code 400'));
        await expect(retireImplementation('Process', 'abc123', { retired: true })).rejects.toThrow(/400/);
    });
});
