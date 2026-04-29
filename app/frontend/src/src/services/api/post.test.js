/**
 * Tests for the POST service layer. Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

import axios from 'axios';
import { createCampusPlan } from './post';

describe('createCampusPlan', () => {
    beforeEach(() => {
        axios.post.mockReset();
    });

    it('POSTs the action-dispatch payload and returns response.data', async () => {
        const mockData = {
            status: 'success',
            data: { plan_identifier: '2025-2026-sfsu' },
            message: 'CampusPlan created.',
        };
        axios.post.mockResolvedValueOnce({ status: 201, data: mockData });

        const result = await createCampusPlan('sfsu', '2025-2026');

        expect(axios.post).toHaveBeenCalledTimes(1);
        const [url, payload] = axios.post.mock.calls[0];
        expect(url).toMatch(/\/campus-plans$/);
        expect(payload).toEqual({
            action: 'create_campus_plan',
            campus_abbrev: 'sfsu',
            year_name: '2025-2026',
        });
        expect(result).toEqual(mockData);
    });

    it('throws when axios rejects (validation error, duplicate, etc.)', async () => {
        axios.post.mockRejectedValueOnce(new Error('Request failed with status code 400'));
        await expect(createCampusPlan('sfsu', '2025-2026')).rejects.toThrow(/400/);
    });
});
