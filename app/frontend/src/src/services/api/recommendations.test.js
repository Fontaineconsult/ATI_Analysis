/**
 * Tests for the recommendation services (end-of-review-cycle improvement
 * tracking on a YSE). Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { addRecommendation } from './post';
import { updateRecommendation } from './put';

describe('recommendation services', () => {
    beforeEach(() => {
        axios.post.mockReset();
        axios.put.mockReset();
    });

    it('addRecommendation POSTs the add_recommendation action', async () => {
        const mockData = { status: 'success', data: { unique_id: 'r1', status: 'open' } };
        axios.post.mockResolvedValueOnce({ status: 201, data: mockData });

        const result = await addRecommendation(
            '2025-2026-7.11-ins-sfsu', 'Document the intake triage', 'Write it down.', '913678186'
        );

        const [url, payload] = axios.post.mock.calls[0];
        expect(url).toMatch(/\/evidence$/);
        expect(payload).toEqual({
            action: 'add_recommendation',
            year_success_evidence: '2025-2026-7.11-ins-sfsu',
            recommendation: 'Document the intake triage',
            detail: 'Write it down.',
            created_by_employee_id: '913678186',
        });
        expect(result).toEqual(mockData);
    });

    it('addRecommendation nulls omitted detail/creator', async () => {
        axios.post.mockResolvedValueOnce({ status: 201, data: { status: 'success' } });
        await addRecommendation('2025-2026-7.11-ins-sfsu', 'Fix it');
        const payload = axios.post.mock.calls[0][1];
        expect(payload.detail).toBeNull();
        expect(payload.created_by_employee_id).toBeNull();
    });

    it('updateRecommendation PUTs lifecycle fields', async () => {
        const mockData = { status: 'success', data: { unique_id: 'r1', status: 'addressed' } };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await updateRecommendation('r1', { status: 'addressed', resolution: 'Done.' });

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/evidence$/);
        expect(payload).toEqual({
            action: 'update_recommendation',
            unique_id: 'r1',
            status: 'addressed',
            resolution: 'Done.',
        });
        expect(result).toEqual(mockData);
    });

    it('propagates errors', async () => {
        axios.post.mockRejectedValueOnce(new Error('boom'));
        await expect(addRecommendation('y', 'x')).rejects.toThrow('boom');
    });
});
