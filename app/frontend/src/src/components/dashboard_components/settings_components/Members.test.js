/**
 * Smoke tests for Settings → Members: the diagnostic stat strip, the search
 * filter, and column sorting on the roster table. The edit modal has its own
 * suite (EditIndividual.test.js) and is stubbed out here.
 */
jest.mock('./EditIndividual', () => () => null);
jest.mock('../../../services/api/put', () => ({
    updateIndividual: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Members from './Members';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';

const PEOPLE = [
    {
        name: 'Zoe Adams', employee_id: 'e1', email: 'zoe@x.edu', ati_role: 'Coordinator',
        host_campus: 'sfsu', active: true, can_approve_yse: true, workingGroups: [{ name: 'Web' }],
        ati_involvement: 'member',
    },
    {
        name: 'Amir Khan', employee_id: 'e2', email: 'amir@x.edu', ati_role: null,
        host_campus: null, active: false, can_approve_yse: false, workingGroups: [],
        ati_involvement: 'contributor',
    },
];

// A TAAP signer: current, but a contact, so hidden from the default view.
const SIGNER = {
    name: 'Sam Signer', employee_id: null, email: null, ati_role: null,
    host_campus: 'ssu', active: true, can_approve_yse: false, workingGroups: [],
    ati_involvement: 'contact',
};

const renderMembers = (individuals = PEOPLE) =>
    render(
        <DataContext.Provider value={{ data: {}, loading: false }}>
            <UserContext.Provider value={{ loadAllIndividuals: jest.fn(), individuals }}>
                <Members />
            </UserContext.Provider>
        </DataContext.Provider>
    );

const rosterNames = () => screen.getAllByRole('row')
    .slice(1)
    .map((tr) => tr.querySelector('td')?.textContent);

describe('Members settings section', () => {
    it('renders the roster with the diagnostic counts', () => {
        renderMembers();

        expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();
        // Stat strip counts current people: 1 member, 0 contributors (Amir is no longer
        // in role), 0 contacts, 1 approver, 1 participant without a campus.
        expect(screen.getByText('Approvers')).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);
        expect(screen.getByText('Contributors', { selector: 'dt' })).toBeInTheDocument();
        expect(screen.getByText('No campus')).toBeInTheDocument();
        // Default sort is name-ascending.
        expect(rosterNames()).toEqual(['Amir Khan', 'Zoe Adams']);
    });

    it('sorts by a clicked column and toggles direction', async () => {
        renderMembers();

        const nameHeader = screen.getByRole('button', { name: 'Name' });
        await userEvent.click(nameHeader);          // already asc → toggles to desc
        expect(rosterNames()).toEqual(['Zoe Adams', 'Amir Khan']);
        expect(nameHeader.closest('th')).toHaveAttribute('aria-sort', 'descending');

        await userEvent.click(screen.getByRole('button', { name: 'Approver' }));
        // Boolean sort: approvers first ascending.
        expect(rosterNames()).toEqual(['Zoe Adams', 'Amir Khan']);
    });

    it('filters the roster by search without touching the stat strip', async () => {
        renderMembers();

        await userEvent.type(screen.getByLabelText('Search members'), 'zoe');
        expect(rosterNames()).toEqual(['Zoe Adams']);
        // The strip still reads over the full roster.
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(3);

        await userEvent.clear(screen.getByLabelText('Search members'));
        await userEvent.type(screen.getByLabelText('Search members'), 'nobody');
        expect(screen.getByText(/No people match this view/)).toBeInTheDocument();
    });

    it('hides contacts by default and lists them in the Contacts view', async () => {
        renderMembers([...PEOPLE, SIGNER]);
        expect(rosterNames()).toEqual(['Amir Khan', 'Zoe Adams']);

        await userEvent.selectOptions(screen.getByLabelText('Show people by involvement'), 'contact');
        expect(rosterNames()).toEqual(['Sam Signer']);
        expect(screen.getByLabelText('Involvement — Sam Signer')).toHaveValue('contact');
    });

    it('shows the empty state when there is no roster', () => {
        renderMembers([]);
        expect(screen.getByText('No members yet.')).toBeInTheDocument();
    });
});
