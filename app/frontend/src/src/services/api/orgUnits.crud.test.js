/**
 * Tests for the local org-unit CRUD services behind Settings → Organizations:
 * createOrgUnit (post.js, axios), fetchLocalOrgUnits (get.js, axios),
 * deleteOrgUnit (delete.js, fetch). Mocks both transports — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

import axios from 'axios';
import { createOrgUnit } from './post';
import { fetchLocalOrgUnits } from './get';
import { deleteOrgUnit } from './delete';

describe('org-unit CRUD services', () => {
    beforeEach(() => {
        axios.get.mockReset();
        axios.post.mockReset();
        global.fetch = jest.fn();
    });

    it('createOrgUnit POSTs unit_type, name, location, campus', async () => {
        const mockData = { status: 'success', data: { unit: { name: 'History' } } };
        axios.post.mockResolvedValueOnce({ status: 201, data: mockData });

        const result = await createOrgUnit('department', 'History', { location: 'HUM 301', campus: 'sfsu' });

        const [url, payload] = axios.post.mock.calls[0];
        expect(url).toMatch(/\/organizational-units$/);
        expect(payload).toEqual({
            unit_type: 'department',
            name: 'History',
            location: 'HUM 301',
            campus: 'sfsu',
        });
        expect(result).toEqual(mockData);
    });

    it('createOrgUnit sends nulls for omitted location/campus', async () => {
        axios.post.mockResolvedValueOnce({ status: 201, data: { status: 'success' } });
        await createOrgUnit('college', 'College of Science');
        expect(axios.post.mock.calls[0][1]).toEqual({
            unit_type: 'college',
            name: 'College of Science',
            location: null,
            campus: null,
        });
    });

    it('fetchLocalOrgUnits GETs the local-overview for the campus', async () => {
        const mockData = { status: 'success', data: [{ name: 'History', type: 'Department', employee_count: 2 }] };
        axios.get.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await fetchLocalOrgUnits('sfsu');

        const [url, config] = axios.get.mock.calls[0];
        expect(url).toMatch(/\/organizational-units$/);
        expect(config.params).toEqual({ type: 'local-overview', campus: 'sfsu' });
        expect(result).toEqual(mockData);
    });

    it('deleteOrgUnit DELETEs with unit_type and name in the body', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success', data: { deleted: 'History' } }),
        });

        const result = await deleteOrgUnit('department', 'History');

        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toMatch(/\/organizational-units$/);
        expect(options.method).toBe('DELETE');
        expect(JSON.parse(options.body)).toEqual({ unit_type: 'department', name: 'History' });
        expect(result.data.deleted).toBe('History');
    });

    it('deleteOrgUnit surfaces the API error on a failed response', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Department not found' }),
        });
        await expect(deleteOrgUnit('department', 'Nope')).rejects.toThrow('Department not found');
    });

    it('createOrgUnit propagates errors', async () => {
        axios.post.mockRejectedValueOnce(new Error('boom'));
        await expect(createOrgUnit('department', 'History')).rejects.toThrow('boom');
    });
});
