/**
 * Tests for the org-unit employs PUT services (assign/unassign employee on
 * /organizational-units). Mocks axios — no live HTTP.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        put: jest.fn(),
    },
}));

import axios from 'axios';
import { assignEmployeeToOrgUnit, unassignEmployeeFromOrgUnit } from './put';

describe('org-unit employs services', () => {
    beforeEach(() => {
        axios.put.mockReset();
    });

    it('assignEmployeeToOrgUnit PUTs the assign_employee action', async () => {
        const mockData = { status: 'success', message: 'Employee assigned.' };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await assignEmployeeToOrgUnit('department', 'J. Paul Leonard Library', 'p-123');

        expect(axios.put).toHaveBeenCalledTimes(1);
        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/organizational-units$/);
        expect(payload).toEqual({
            action: 'assign_employee',
            unit_type: 'department',
            name: 'J. Paul Leonard Library',
            person_unique_id: 'p-123',
        });
        expect(result).toEqual(mockData);
    });

    it('unassignEmployeeFromOrgUnit PUTs the unassign_employee action', async () => {
        const mockData = { status: 'success', message: 'Employee unassigned.' };
        axios.put.mockResolvedValueOnce({ status: 200, data: mockData });

        const result = await unassignEmployeeFromOrgUnit('college', 'College of Science', 'p-123');

        const [url, payload] = axios.put.mock.calls[0];
        expect(url).toMatch(/\/organizational-units$/);
        expect(payload).toEqual({
            action: 'unassign_employee',
            unit_type: 'college',
            name: 'College of Science',
            person_unique_id: 'p-123',
        });
        expect(result).toEqual(mockData);
    });

    it('propagates errors', async () => {
        axios.put.mockRejectedValueOnce(new Error('boom'));
        await expect(assignEmployeeToOrgUnit('vendor', 'Instructure', 'p-123')).rejects.toThrow('boom');
    });
});
