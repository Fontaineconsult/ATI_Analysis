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

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YSEAnnotationMasterContainer from './YSEAnnotationMasterContainer';

const PROPS = {
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
    year_identifier: '2025-2026-7.11-ins-sfsu',
};

describe('YSEAnnotationMasterContainer', () => {
    it('renders all four tabs with label-filtered counts', () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);

        const tabs = screen.getAllByRole('tab');
        expect(tabs.map((t) => t.textContent)).toEqual(['Notes1', 'Messages2', 'Metrics1', 'Plans1']);
    });

    it('shows the metric viewer with the filtered metrics when its tab is opened', async () => {
        render(<YSEAnnotationMasterContainer {...PROPS} />);

        await userEvent.click(screen.getByRole('tab', { name: /metrics/i }));
        expect(screen.getByTestId('metric-viewer')).toHaveTextContent('1');
    });

    it('tolerates missing annotation arrays', () => {
        render(<YSEAnnotationMasterContainer year_identifier="2025-2026-7.11-ins-sfsu" />);
        const tabs = screen.getAllByRole('tab');
        expect(tabs.map((t) => t.textContent)).toEqual(['Notes0', 'Messages0', 'Metrics0', 'Plans0']);
    });
});
