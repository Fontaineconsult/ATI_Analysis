/**
 * Settings > Services. The page must render whatever the server reports,
 * including incomplete configurations and partial payloads, and never fail.
 */
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ServicesSettings from './ServicesSettings';
import { fetchServices } from '../../../services/api/get';
import { describeLastRun, setupCommandFor, summarizeServices } from './servicesConfig';

// Hoisted above the imports by Jest.
jest.mock('../../../services/api/get', () => ({
    fetchServices: jest.fn(),
}));

const AVAILABLE = {
    name: 'pope_tech_integration',
    available: true,
    description: 'Pope Tech scan snapshots into Metric nodes',
    entry: 'app.services.pope_tech_integration.service:pull_metric_snapshots',
    problem: null,
    programs: [{
        program: 'POPE_TECH',
        label: 'PopeTechIntegrator (Pope Tech WAVE scans)',
        module: 'pope_tech.query_cli',
        dir_setting: 'ATI_SERVICE_POPE_TECH_DIR',
        python_setting: 'ATI_SERVICE_POPE_TECH_PYTHON',
        configured: true,
        dir: 'C:\\PopeTechIntegrator',
        python: 'C:\\PopeTechIntegrator\\.venv\\Scripts\\python.exe',
        python_source: 'default .venv',
        problem: null,
    }],
    last_run: { runs: 4, latest: '2026-10-12T19:28:01Z', latest_files: 3, problem: null },
};

const UNCONFIGURED = {
    ...AVAILABLE,
    name: 'udoit_scans',
    available: false,
    programs: [{
        ...AVAILABLE.programs[0],
        program: 'UDOIT',
        label: 'UDOIT orchestrator',
        dir_setting: 'ATI_SERVICE_UDOIT_DIR',
        configured: false,
        dir: null,
        python: null,
        problem: 'ATI_SERVICE_UDOIT_DIR is not set',
    }],
    last_run: { runs: 0, latest: null, latest_files: 0, problem: null },
};

const respond = (services, extra = {}) => ({
    status: 'success',
    data: { checked_at: '2026-10-13T08:00:00Z', services, ...extra },
});

const renderPage = () => render(<ChakraProvider><ServicesSettings /></ChakraProvider>);

beforeEach(() => {
    fetchServices.mockReset();
});

describe('ServicesSettings', () => {
    it('shows counts, availability and the program table', async () => {
        fetchServices.mockResolvedValue(respond([AVAILABLE, UNCONFIGURED]));
        renderPage();

        expect(await screen.findByText('pope_tech_integration')).toBeInTheDocument();
        // Stat strip: each card is a labelled group.
        const stat = (label) => within(screen.getByRole('group', { name: label })).getByRole('definition');
        expect(stat('Services')).toHaveTextContent('2');
        expect(stat('Available')).toHaveTextContent('1');
        expect(stat('Not configured')).toHaveTextContent('1');
        expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Not configured').length).toBeGreaterThan(0);
        expect(screen.getByText('C:\\PopeTechIntegrator')).toBeInTheDocument();
        expect(screen.getAllByText("the program's own .venv")).toHaveLength(2);
        expect(screen.getByText(/Last run folder 2026-10-12 19:28 UTC, 3 files\. 4 runs in total\./)).toBeInTheDocument();
    });

    it('tells an admin exactly what to set for an unconfigured service', async () => {
        fetchServices.mockResolvedValue(respond([UNCONFIGURED]));
        renderPage();

        expect(await screen.findByText('ATI_SERVICE_UDOIT_DIR is not set')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Configure' })).toBeInTheDocument();
        expect(screen.getByText(/ATI_SERVICE_UDOIT_DIR = '<folder>'/)).toBeInTheDocument();
        expect(screen.getByText('No runs yet.')).toBeInTheDocument();
    });

    it('rechecks on request', async () => {
        fetchServices.mockResolvedValue(respond([AVAILABLE]));
        renderPage();
        await screen.findByText('pope_tech_integration');

        await userEvent.click(screen.getByRole('button', { name: /Recheck/ }));
        await waitFor(() => expect(fetchServices).toHaveBeenCalledTimes(2));
    });

    it('says the page is admin-only on a 403', async () => {
        fetchServices.mockRejectedValue({ response: { status: 403, data: { error: 'admin_required' } } });
        renderPage();
        expect(await screen.findByText('Only admins can see services.')).toBeInTheDocument();
    });

    it('shows a load failure without breaking', async () => {
        fetchServices.mockRejectedValue(new Error('Network Error'));
        renderPage();
        expect(await screen.findByText('Network Error')).toBeInTheDocument();
    });

    it('renders a registry failure the server reported', async () => {
        fetchServices.mockResolvedValue(respond([], { problem: 'Could not read the service registry: boom' }));
        renderPage();
        expect(await screen.findByText('Could not read the service registry: boom')).toBeInTheDocument();
    });

    it('survives partial and malformed payloads', async () => {
        fetchServices.mockResolvedValue(respond([
            {},                                         // nothing at all
            { name: 'half', programs: [null, {}] },     // programs missing every field
            { name: 'odd', programs: 'not a list', last_run: { problem: 'Could not read run folders: denied' } },
        ]));
        renderPage();
        expect(await screen.findByText('Unnamed service')).toBeInTheDocument();
        expect(screen.getByText('half')).toBeInTheDocument();
        expect(screen.getByText('Could not read run folders: denied')).toBeInTheDocument();
    });

    it('contains a card that fails to render to that card', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        // A description that is an object cannot render as text: React throws.
        fetchServices.mockResolvedValue(respond([{ name: 'bad', description: { nested: true } }, AVAILABLE]));
        renderPage();
        expect(await screen.findByText(/bad could not be displayed/)).toBeInTheDocument();
        expect(screen.getByText('pope_tech_integration')).toBeInTheDocument();
        console.error.mockRestore();
    });

    it('handles an empty registry', async () => {
        fetchServices.mockResolvedValue(respond([]));
        renderPage();
        expect(await screen.findByText('No services are registered.')).toBeInTheDocument();
    });
});

describe('servicesConfig', () => {
    it('summarises whatever arrives', () => {
        expect(summarizeServices([AVAILABLE, UNCONFIGURED])).toEqual({ total: 2, available: 1, unavailable: 1 });
        expect(summarizeServices(undefined)).toEqual({ total: 0, available: 0, unavailable: 0 });
    });

    it('builds the setup command from the setting names', () => {
        expect(setupCommandFor(UNCONFIGURED)).toBe(".\\Setup-AtiIis.ps1 -ServiceSettings @{ ATI_SERVICE_UDOIT_DIR = '<folder>' }");
        expect(setupCommandFor({})).toBeNull();
    });

    it('describes run folders honestly', () => {
        expect(describeLastRun(undefined)).toBe('Run history unavailable.');
        expect(describeLastRun({ runs: 1, latest: '2026-10-12T19:28:01Z', latest_files: 1 }))
            .toBe('Last run folder 2026-10-12 19:28 UTC, 1 file. 1 run in total.');
    });
});
