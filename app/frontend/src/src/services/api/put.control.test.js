/**
 * Tests for the evidence-control PUT service (internal/external flag on the
 * is_evidence_for link). Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { setEvidenceControl } from './put';

describe('setEvidenceControl', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('PUTs the set_evidence_control action', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: { control: 'external' } } });

        const result = await setEvidenceControl('9999-9999_1_web_sfsu', 'Process', 'abc123', 'external');

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/implementations$/);
        expect(payload).toEqual({
            action: 'set_evidence_control',
            year_success_identifier: '9999-9999_1_web_sfsu',
            implementation_type: 'Process',
            unique_id: 'abc123',
            control: 'external',
        });
        expect(result.data).toEqual({ control: 'external' });
    });

    it('sends null to clear the flag', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: { control: null } } });
        await setEvidenceControl('9999-9999_1_web_sfsu', 'Process', 'abc123', null);
        expect(axios.put.mock.calls[0][1].control).toBeNull();
    });

    it('propagates errors', async () => {
        axios.put.mockRejectedValueOnce(new Error('boom'));
        await expect(setEvidenceControl('y', 'Process', 'abc123', 'internal')).rejects.toThrow('boom');
    });
});
