/**
 * Tabs + live counts for the YSE Annotations section, including the Metrics tab
 * (regression: hasMetrics used to be passed in by the detail panel and silently
 * dropped — no tab ever rendered). The heavy viewers are stubbed; this suite
 * asserts the container's own responsibilities: label-filtering each wrapper
 * list and surfacing counts.
 */
jest.mock('./NoteViewer', () => ({ __esModule: true, default: () => <div data-testid="note-viewer" /> }));
jest.mock('./MessageViewer', () => ({ __esModule: true, default: () => <div data-testid="message-viewer" /> }));
jest.mock('./MetricViewer', () => ({ __esModule: true, default: ({ metrics }) => <div data-testid="metric-viewer">{metrics.length}</div> }));
jest.mock('../implementation/PlanViewer', () => ({ __esModule: true, default: () => <div data-testid="plan-viewer" /> }));
jest.mock('../../dashboard_components/report_components/RecommendationsPanel', () => ({
    __esModule: true,
    default: ({ recommendations }) => <div data-testid="recommendations-panel">{recommendations.length}</div>,
}));
jest.mock('../../dashboard_components/report_components/ConcernsPanel', () => ({
    __esModule: true,
    default: ({ concerns }) => <div data-testid="concerns-panel">{concerns.length}</div>,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YSEAnnotationMasterContainer from './YSEAnnotationMasterContainer';

const QUERIES = [
    { unique_id: 'q1', question: 'Who owns the orientation segment?', status: 'open',
      category: 'information_gap', raised_by: 'Daniel Fontaine', answerable_by: [] },
    // Settled questions are history; the tab counts what is still outstanding.
    { unique_id: 'q2', question: 'What workshops exist?', status: 'settled',
      category: 'information_gap', answer: 'A semester calendar.', answerable_by: [] },
];

const PROPS = {
    queries: QUERIES,
    hasNotes: [
        { note: { labels: ['Note'], properties: { name: 'n1' } } },
        { note: { labels: ['SomethingElse'], properties: { name: 'x' } } },
    ],
    hasMessages: [
        { message: { labels: ['Message'], properties: { name: 'm1' } } },
        { message: { labels: ['Message'], properties: { name: 'm2' } } },
    ],
    hasMetrics: [
        { metric: { labels: ['Metric'], properties: { name: 'k1' } } },
    ],
    plans: [{ labels: ['Plan'], properties: { name: 'p1' } }],
    recommendations: [
        { recommendation: { properties: { unique_id: 'r1', recommendation: 'Fix intake docs', status: 'open' } }, created_by: null },
    ],
    concerns: [
        { concern: { properties: { unique_id: 'c1', concern: 'Nobody owns turnaround', status: 'open' } }, raised_by: null },
        { concern: { properties: { unique_id: 'c2', concern: 'LMS role undefined', status: 'converted' } }, raised_by: null },
    ],
    year_identifier: '2025-2026-7.11-ins-sfsu',
};

describe('YSEAnnotationMasterContainer', () => {
    it('renders all tabs with label-filtered counts', () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);

        const tabs = screen.getAllByRole('tab');
        expect(tabs.map((t) => t.textContent)).toEqual([
            'Notes1', 'Messages2', 'Metrics1', 'Plans1', 'Concerns2', 'Recommendations1',
            'Queries1',
        ]);
    });

    it('shows the metric viewer with the filtered metrics when its tab is opened', async () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);

        await userEvent.click(screen.getByRole('tab', { name: /metrics/i }));
        expect(screen.getByTestId('metric-viewer')).toHaveTextContent('1');
    });

    it('tolerates missing annotation arrays', () => {
        render(<YSEAnnotationMasterContainer year_identifier="2025-2026-7.11-ins-sfsu" />);
        const tabs = screen.getAllByRole('tab');
        expect(tabs.map((t) => t.textContent)).toEqual([
            'Notes0', 'Messages0', 'Metrics0', 'Plans0', 'Concerns0', 'Recommendations0',
            'Queries0',
        ]);
    });

    it('counts only OUTSTANDING queries — a settled one is history, not work', () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);
        expect(screen.getByRole('tab', { name: /queries/i }).textContent).toBe('Queries1');
    });

    it('shows both open and settled questions when the tab is opened', async () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);
        await userEvent.click(screen.getByRole('tab', { name: /queries/i }));
        expect(screen.getByText(/who owns the orientation segment/i)).toBeInTheDocument();
        expect(screen.getByText(/what workshops exist/i)).toBeInTheDocument();
    });

    it('shows the recommendations panel with the filtered items when its tab is opened', async () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);

        await userEvent.click(screen.getByRole('tab', { name: /recommendations/i }));
        expect(screen.getByTestId('recommendations-panel')).toHaveTextContent('1');
    });

    it('shows the concerns panel with the filtered items when its tab is opened', async () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);

        await userEvent.click(screen.getByRole('tab', { name: /concerns/i }));
        expect(screen.getByTestId('concerns-panel')).toHaveTextContent('2');
    });
});
