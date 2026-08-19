/**
 * UserContext — the "notating as" snapshot must stay honest against the live
 * roster. Regression: the persisted snapshot whitelist dropped can_approve_yse,
 * so real approvers (per the DB) saw a disabled Approve button; and a stale
 * pre-fix localStorage snapshot would keep dropping it forever without the
 * roster reconciliation.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../services/api/get', () => ({
    fetchAllIndividuals: jest.fn(),
    fetchUserByEmployeeId: jest.fn(),
}));

import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthContext } from './AuthContext';
import { UserContext, UserProvider } from './UserContext';
import { fetchAllIndividuals } from '../services/api/get';

const DANIEL = {
    name: 'Daniel Fontaine',
    employee_id: '913678186',
    unique_id: 'u-daniel',
    title: 'Accessibility Lead',
    email: 'df@sfsu.edu',
    active: true,
    can_approve_yse: true,
};

function Probe() {
    const { user } = useContext(UserContext);
    if (!user) return <div data-testid="probe">no user</div>;
    return (
        <div data-testid="probe" data-can-approve={String(!!user.can_approve_yse)}>
            {user.name}
        </div>
    );
}

const renderProvider = () =>
    render(
        <ChakraProvider>
            <AuthContext.Provider value={{ authUser: null, enforced: false }}>
                <UserProvider>
                    <Probe />
                </UserProvider>
            </AuthContext.Provider>
        </ChakraProvider>
    );

describe('UserContext roster reconciliation', () => {
    beforeEach(() => {
        localStorage.clear();
        fetchAllIndividuals.mockReset();
        fetchAllIndividuals.mockResolvedValue({ data: { persons: [DANIEL] } });
    });

    it('re-merges authority flags onto a stale saved snapshot missing them', async () => {
        // A pre-fix snapshot: no can_approve_yse field at all.
        localStorage.setItem('ati_current_user', JSON.stringify({
            ownerEmail: null,
            user: {
                name: 'Daniel Fontaine',
                employee_id: '913678186',
                unique_id: 'u-daniel',
                title: 'Accessibility Lead',
                email: 'df@sfsu.edu',
                active: true,
            },
        }));

        renderProvider();

        await waitFor(() =>
            expect(screen.getByTestId('probe')).toHaveAttribute('data-can-approve', 'true')
        );
        // The healed snapshot is persisted, so the fix survives a reload.
        const saved = JSON.parse(localStorage.getItem('ati_current_user'));
        expect(saved.user.can_approve_yse).toBe(true);
    });

    it('tracks roster changes (flag revoked in Settings) on refresh', async () => {
        localStorage.setItem('ati_current_user', JSON.stringify({
            ownerEmail: null,
            user: { ...DANIEL },
        }));
        fetchAllIndividuals.mockResolvedValue({
            data: { persons: [{ ...DANIEL, can_approve_yse: false }] },
        });

        renderProvider();

        await waitFor(() =>
            expect(screen.getByTestId('probe')).toHaveAttribute('data-can-approve', 'false')
        );
    });
});
