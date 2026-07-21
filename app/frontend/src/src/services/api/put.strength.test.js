/**
 * Tests for the evidence-strength PUT services. Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { assignImplementationToYSE, copyEvidenceToCampuses, setEvidenceStrength } from './put';

describe('setEvidenceStrength', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('PUTs the set_evidence_strength action', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: { strength: 3 } } });

        const result = await setEvidenceStrength('9999-9999_1_web_sfsu', 'Process', 'abc123', 3);

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/implementations$/);
        expect(payload).toEqual({
            action: 'set_evidence_strength',
            year_success_identifier: '9999-9999_1_web_sfsu',
            implementation_type: 'Process',
            unique_id: 'abc123',
            strength: 3,
        });
        expect(result.data).toEqual({ strength: 3 });
    });

    it('sends null to clear the rating', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: { strength: null } } });
        await setEvidenceStrength('9999-9999_1_web_sfsu', 'Process', 'abc123', null);
        expect(axios.put.mock.calls[0][1].strength).toBeNull();
    });
});

describe('assignImplementationToYSE with strength', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('includes strength when given', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success' } });
        await assignImplementationToYSE('9999-9999_1_web_sfsu', 'Process', 'My Process', 2);
        expect(axios.put.mock.calls[0][1]).toMatchObject({
            action: 'assign_implementation_to_yse',
            strength: 2,
        });
    });

    it('omits strength when not given (unrated link)', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success' } });
        await assignImplementationToYSE('9999-9999_1_web_sfsu', 'Process', 'My Process');
        expect(axios.put.mock.calls[0][1]).not.toHaveProperty('strength');
    });
});

describe('copyEvidenceToCampuses', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('PUTs the copy action with targets and include_people', async () => {
        axios.put.mockResolvedValueOnce({
            status: 200,
            data: { status: 'success', data: { ssu: { created: 2, already_linked: 0, skipped_missing_indicator: 0, people_added: 3 } } },
        });

        const result = await copyEvidenceToCampuses('Process', 'abc123', '2025-2026', 'sfsu', ['ssu', 'csueb'], true);

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/implementations$/);
        expect(payload).toEqual({
            action: 'copy_evidence_to_campuses',
            implementation_type: 'Process',
            unique_id: 'abc123',
            year_name: '2025-2026',
            source_campus: 'sfsu',
            target_campuses: ['ssu', 'csueb'],
            include_people: true,
        });
        expect(result.data.ssu.created).toBe(2);
    });

    it('passes include_people false through', async () => {
        axios.put.mockResolvedValueOnce({ status: 200, data: { status: 'success', data: {} } });
        await copyEvidenceToCampuses('Process', 'abc123', '2025-2026', 'sfsu', ['ssu'], false);
        expect(axios.put.mock.calls[0][1].include_people).toBe(false);
    });
});
