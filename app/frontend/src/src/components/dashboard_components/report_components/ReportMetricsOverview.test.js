/**
 * Metrics zone — virtual-cursor structure (Path A): the zone is a named
 * section landmark, each working-group card carries a real h3, the status
 * distribution is a list whose bars are decorative (text carries the values).
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ReportMetricsOverview from './ReportMetricsOverview';

const METRICS = {
    campus: {
        reviewPending: 4, unassignedCount: 2, noActiveDocsCount: 1,
        undocumentedCount: 3, missingImplCount: 0, readyForReviewCount: 5,
        withEvidence: 30, totalIndicators: 40, avgStatusValue: 2.2,
        statusDistribution: [
            { level: 'Defined', count: 12, pct: 30 },
            { level: 'Initiated', count: 8, pct: 20 },
        ],
    },
    byWorkingGroup: [
        {
            key: 'web', name: 'Web', accent: 'blue.400', avgStatusValue: 2,
            withEvidence: 10, totalIndicators: 12, coveragePct: 83,
            trends: { improving: 3, static: 6, declining: 1 },
            reviewPending: 1, unassignedCount: 0, noActiveDocsCount: 0,
            undocumentedCount: 2, missingImplCount: 0,
        },
        {
            key: 'ins', name: 'Instructional Materials', accent: 'purple.400', avgStatusValue: 3,
            withEvidence: 15, totalIndicators: 20, coveragePct: 75,
            trends: { improving: 5, static: 9, declining: 1 },
            reviewPending: 2, unassignedCount: 1, noActiveDocsCount: 1,
            undocumentedCount: 0, missingImplCount: 1,
        },
    ],
};

const renderOverview = () =>
    render(
        <ChakraProvider>
            <ReportMetricsOverview metrics={METRICS} />
        </ChakraProvider>
    );

describe('ReportMetricsOverview accessibility structure', () => {
    it('exposes the zone as a named section landmark with a hidden h2', () => {
        renderOverview();
        const region = screen.getByRole('region', { name: 'Status Overview' });
        expect(region).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Status Overview' })).toBeInTheDocument();
    });

    it('gives each working-group card a real h3 named by the group', () => {
        renderOverview();
        expect(screen.getByRole('heading', { level: 3, name: 'Web' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'Instructional Materials' })).toBeInTheDocument();
    });

    it('renders the status distribution as a list with decorative bars', () => {
        renderOverview();
        const list = screen.getByRole('list');
        expect(within(list).getAllByRole('listitem')).toHaveLength(2);
        // The bar track is aria-hidden — only the text carries level/count/pct.
        expect(within(list).getByText('Defined')).toBeInTheDocument();
        expect(within(list).getByText('(30%)')).toBeInTheDocument();
    });

    it('announces maturity through the ladder meters', () => {
        renderOverview();
        // Campus average (full) + one compact ladder per WG card.
        expect(screen.getAllByRole('meter').length).toBeGreaterThanOrEqual(3);
    });
});
