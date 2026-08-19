/**
 * Tests for the ready-for-review PUT service (step one of the administrative
 * review workflow). Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { setReadyForReview } from './put';

describe('setReadyForReview', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('PUTs the set_ready_for_review action with the boolean', async () => {
        const mockData = { status: 'success', data: 'Evidence marked ready for administrative review.' };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await setReadyForReview('2025-2026-7.11-ins-sfsu', true);

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/evidence$/);
        expect(payload).toEqual({
            action: 'set_ready_for_review',
            year_success_evidence: '2025-2026-7.11-ins-sfsu',
            ready: true,
        });
        expect(result).toEqual(mockData);
    });

    it('sends ready: false to withdraw the mark', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success' } });
        await setReadyForReview('2025-2026-7.11-ins-sfsu', false);
        expect(axios.put.mock.calls[0][1].ready).toBe(false);
    });

    it('propagates errors', async () => {
        axios.put.mockRejectedValueOnce(new Error('boom'));
        await expect(setReadyForReview('2025-2026-7.11-ins-sfsu', true)).rejects.toThrow('boom');
    });
});
