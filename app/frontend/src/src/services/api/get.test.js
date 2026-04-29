/**
 * Tests for the GET service layer. Mocks axios — no live HTTP.
 *
 * Per-function pattern:
 *   - mockResolvedValue → assert URL/params + returned shape
 *   - mockRejectedValue → assert error propagation
 */
// Inline factory mock — axios v1 ships as ESM and CRA's Jest doesn't transform
// node_modules, so a bare `jest.mock('axios')` triggers a SyntaxError on the
// real module's import statement. Returning a factory bypasses the real load.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

import axios from 'axios';
import { fetchCampusPlan } from './get';

describe('fetchCampusPlan', () => {
    beforeEach(() => {
        axios.get.mockReset();
    });

    it('GETs /campus-plans/<campus>/<year> and returns response.data', async () => {
        const mockData = {
            status: 'success',
            data: {
                plan_identifier: '2025-2026-sfsu',
                academic_year: '2025-2026',
                campus: { abbreviation: 'sfsu', name: 'San Francisco State University' },
                working_group_plans: [],
            },
        };
        axios.get.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await fetchCampusPlan('sfsu', '2025-2026');

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringMatching(/\/campus-plans\/sfsu\/2025-2026$/)
        );
        expect(result).toEqual(mockData);
    });

    it('throws when axios rejects (network error, 404, etc.)', async () => {
        axios.get.mockRejectedValueOnce(new Error('Request failed with status code 404'));
        await expect(fetchCampusPlan('sfsu', '9999-9999')).rejects.toThrow(/404/);
    });

    it('URL-encodes campus and year as path segments', async () => {
        axios.get.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: {} } });
        await fetchCampusPlan('csueb', '2024-2025');
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/campus-plans/csueb/2024-2025')
        );
    });
});
