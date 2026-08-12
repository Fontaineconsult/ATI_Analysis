/**
 * Tests for the governance -> indicator-framework link services: `informs` (Goal)
 * and `drives` (SuccessIndicator). Mocks axios — no live HTTP.
 *
 * The behaviour worth pinning is the citation passthrough on `drives`: a key that
 * is present-but-empty means "clear this field" and a key that is absent means
 * "leave it alone", so the service must forward exactly the keys it was given —
 * no defaulting the trio to empty strings.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import {
    attachGoalToGovernance,
    detachGoalFromGovernance,
    attachIndicatorToGovernance,
    detachIndicatorFromGovernance,
    updateGovernanceIndicatorCitation,
} from './put';
import { fetchGovernanceLinkTargets } from './get';

const ok = (data) => ({ status: 200, data: { status: 'success', data } });

describe('informs — governance to Goal', () => {
    beforeEach(() => axios.put.mockReset());

    it.each([
        ['attachGoalToGovernance', attachGoalToGovernance, 'attach_goal'],
        ['detachGoalFromGovernance', detachGoalFromGovernance, 'detach_goal'],
    ])('%s PUTs the %s action', async (_name, fn, action) => {
        axios.put.mockResolvedValueOnce(ok({ item: {} }));

        await fn('law', 'gov-1', 'goal-1');

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/governance$/);
        expect(payload).toEqual({
            action,
            type: 'law',
            governance_unique_id: 'gov-1',
            goal_unique_id: 'goal-1',
        });
    });

    it('propagates errors', async () => {
        axios.put.mockRejectedValueOnce(new Error('boom'));
        await expect(attachGoalToGovernance('law', 'gov-1', 'goal-1')).rejects.toThrow('boom');
    });
});

describe('drives — governance to SuccessIndicator', () => {
    beforeEach(() => axios.put.mockReset());

    it('attaches with the full citation', async () => {
        axios.put.mockResolvedValueOnce(ok({ item: {} }));

        await attachIndicatorToGovernance('guideline', 'gov-9', 'si-4', {
            provision: 'SC 1.2.4',
            quote: 'Captions are provided for all live audio content.',
            note: 'live-caption coverage',
        });

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/governance$/);
        expect(payload).toEqual({
            action: 'attach_indicator',
            type: 'guideline',
            governance_unique_id: 'gov-9',
            indicator_unique_id: 'si-4',
            provision: 'SC 1.2.4',
            quote: 'Captions are provided for all live audio content.',
            note: 'live-caption coverage',
        });
    });

    it('forwards only the keys given, so an absent key leaves that field alone', async () => {
        axios.put.mockResolvedValueOnce(ok({ item: {} }));

        await updateGovernanceIndicatorCitation('law', 'gov-1', 'si-1', { note: 'just the note' });

        const [, payload] = axios.put.mock.calls[0];
        expect(payload).toEqual({
            action: 'update_indicator_citation',
            type: 'law',
            governance_unique_id: 'gov-1',
            indicator_unique_id: 'si-1',
            note: 'just the note',
        });
        expect(payload).not.toHaveProperty('provision');
        expect(payload).not.toHaveProperty('quote');
    });

    it('forwards an empty string, which is the clear-this-field signal', async () => {
        axios.put.mockResolvedValueOnce(ok({ item: {} }));

        await updateGovernanceIndicatorCitation('law', 'gov-1', 'si-1', { provision: '' });

        const [, payload] = axios.put.mock.calls[0];
        expect(payload.provision).toBe('');
    });

    it('attaches with no citation at all', async () => {
        axios.put.mockResolvedValueOnce(ok({ item: {} }));

        await attachIndicatorToGovernance('memo', 'gov-2', 'si-2');

        const [, payload] = axios.put.mock.calls[0];
        expect(payload).toEqual({
            action: 'attach_indicator',
            type: 'memo',
            governance_unique_id: 'gov-2',
            indicator_unique_id: 'si-2',
        });
    });

    it('detaches by indicator id', async () => {
        axios.put.mockResolvedValueOnce(ok({ item: {} }));

        await detachIndicatorFromGovernance('case', 'gov-3', 'si-3');

        const [, payload] = axios.put.mock.calls[0];
        expect(payload).toEqual({
            action: 'detach_indicator',
            type: 'case',
            governance_unique_id: 'gov-3',
            indicator_unique_id: 'si-3',
        });
    });

    it('propagates errors', async () => {
        axios.put.mockRejectedValueOnce(new Error('nope'));
        await expect(attachIndicatorToGovernance('law', 'g', 's', {})).rejects.toThrow('nope');
    });
});

describe('fetchGovernanceLinkTargets', () => {
    beforeEach(() => axios.get.mockReset());

    it('GETs the link-targets route and returns the payload', async () => {
        axios.get.mockResolvedValueOnce(ok({
            goals: [{ unique_id: 'g1' }],
            success_indicators: [{ unique_id: 's1', composite_key: '1.1-web' }],
        }));

        const result = await fetchGovernanceLinkTargets();

        expect(axios.get.mock.calls[0][0]).toMatch(/\/governance\/link-targets$/);
        expect(result.data.goals).toHaveLength(1);
        expect(result.data.success_indicators[0].composite_key).toBe('1.1-web');
    });

    it('propagates errors', async () => {
        axios.get.mockRejectedValueOnce(new Error('down'));
        await expect(fetchGovernanceLinkTargets()).rejects.toThrow('down');
    });
});
