/**
 * Metrics zone — virtual-cursor structure (Path A): the zone is a named
 * section landmark, each working-group card carries a real h3, the status
 * distribution is a list whose bars are decorative (text carries the values).
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import ReportMetricsOverview from './ReportMetricsOverview';
import { FILTER_LIST } from './reportFilters';

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

describe('attention tiles as filter toggles', () => {
    const renderWithFilters = (props = {}) =>
        render(
            <ChakraProvider>
                <ReportMetricsOverview metrics={METRICS} activeFilters={[]} {...props} />
            </ChakraProvider>
        );

    it('stays non-interactive when no toggle handler is supplied', () => {
        renderOverview();
        expect(screen.queryByRole('button', { name: /Pending Review/ })).not.toBeInTheDocument();
    });

    it('renders each tile as a toggle button naming its count and meaning', () => {
        renderWithFilters({ onToggleFilter: jest.fn() });
        const tile = screen.getByRole('button', { name: /Ready for Review: 5 queued for sign-off/ });
        expect(tile).toHaveAttribute('aria-pressed', 'false');
    });

    it('marks an active tile pressed and offers to remove it', () => {
        renderWithFilters({ onToggleFilter: jest.fn(), activeFilters: ['ready-for-review'] });
        const tile = screen.getByRole('button', { name: /Ready for Review/ });
        expect(tile).toHaveAttribute('aria-pressed', 'true');
        expect(tile).toHaveAccessibleName(/Activate to remove/);
    });

    it('reports the filter key it was clicked for', async () => {
        const onToggleFilter = jest.fn();
        renderWithFilters({ onToggleFilter });
        await userEvent.click(screen.getByRole('button', { name: /Ready for Review/ }));
        expect(onToggleFilter).toHaveBeenCalledWith('ready-for-review');
    });

    it('does not double-announce the numbers it already reads in its label', () => {
        renderWithFilters({ onToggleFilter: jest.fn() });
        // The visible spans are aria-hidden; the button's own label carries the values.
        expect(screen.getAllByRole('button', { name: /⚠ Unassigned: 2 no person assigned/ })).toHaveLength(1);
    });

    it('renders one tile per registered filter', () => {
        renderWithFilters({ onToggleFilter: jest.fn() });
        expect(screen.getAllByRole('button')).toHaveLength(FILTER_LIST.length);
    });
});
