/**
 * The per-type documentation rule. Most types are documented by documents and
 * webpages; a Tracking's metrics count too. Mirrors data_config.documentation_pools,
 * which the indicator report and public report use on the server.
 */
import {
    activeDocumentCount,
    allDocumentsDepreciated,
    documentationCount,
    documentationRule,
    isUndocumented,
} from './implementationConfig';
import { getIndicatorSummary } from '../indicators/indicatorHelpers';

const metric = { unique_id: 'm1', name: 'Pope Tech WAVE errors (sfsu)' };

describe('documentation rule by type', () => {
    it('counts metrics for a Tracking', () => {
        const tracking = { type: 'Tracking', supporting_metrics: [metric] };
        expect(documentationCount(tracking)).toBe(1);
        expect(isUndocumented(tracking)).toBe(false);
    });

    it('does not count metrics for other types', () => {
        const process = { type: 'Process', supporting_metrics: [metric] };
        expect(isUndocumented(process)).toBe(true);
    });

    it('never counts notes or messages', () => {
        const tracking = { type: 'Tracking', supporting_notes: [{}], supporting_messages: [{}] };
        expect(isUndocumented(tracking)).toBe(true);
    });

    it('treats metrics as live, so dead documents alone do not flag a Tracking', () => {
        const tracking = {
            type: 'Tracking',
            supporting_documents: [{ depreciated: true }],
            supporting_metrics: [metric],
        };
        expect(activeDocumentCount(tracking)).toBe(1);
        expect(allDocumentsDepreciated(tracking)).toBe(false);
    });

    it('accepts the type explicitly when the record does not carry it', () => {
        expect(isUndocumented({ supporting_metrics: [metric] }, 'Tracking')).toBe(false);
    });

    it('words the missing-documentation warning for the type', () => {
        expect(documentationRule('Tracking').undocumented).toMatch(/nothing shows what this tracking records/);
        expect(documentationRule('Process').undocumented).toMatch(/the practice is undocumented/);
        expect(documentationRule(undefined)).toBe(documentationRule('Process'));
    });
});

describe('indicator diagnostics use the same rule', () => {
    // The compound-query shape getIndicatorSummary reads.
    const wrapperWith = (type, extra = {}) => ({
        indicator: { properties: {} },
        evidences: [{ evidenceTypes: [{ type, docs: [], webs: [], metrics: [], ...extra }] }],
    });

    it('counts a Tracking with metrics as documented', () => {
        const summary = getIndicatorSummary(wrapperWith('Tracking', { metrics: [metric] }));
        expect(summary.undocumentedImplCount).toBe(0);
    });

    it('still counts a Process with only metrics as undocumented', () => {
        const summary = getIndicatorSummary(wrapperWith('Process', { metrics: [metric] }));
        expect(summary.undocumentedImplCount).toBe(1);
    });
});
