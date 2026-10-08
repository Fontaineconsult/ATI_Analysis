import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import WgCommunitiesSection, { WgPeopleSection } from './WgCommunitiesSection';
import { getGoalViewUrlFromCompositeKey, getPersonUrl } from '../../../services/utils/tools';

const renderWithChakra = (ui) => render(
    <MemoryRouter><ChakraProvider>{ui}</ChakraProvider></MemoryRouter>,
);

const leads = [{ unique_id: 'l1', name: 'Tim Hensel' }];
const members = [
    { name: 'Tim Hensel', employee_id: '1', campus: 'ssu' },
    { name: 'Kyle Falbo', employee_id: '2', campus: 'ssu', title: 'Educational Technology Application Expert' },
    { name: 'Laura Alamillo', employee_id: '3', campus: 'ssu' },
    { name: 'Pat Elsewhere', employee_id: '4', campus: 'sfsu' },
];

describe('WgPeopleSection members row', () => {
    it('lists this campus members, leaving out leads and other campuses', () => {
        renderWithChakra(<WgPeopleSection leads={leads} members={members} campusAbbrev="ssu" />);
        expect(screen.getByText('Members (2)')).toBeInTheDocument();
        expect(screen.getByText('Kyle Falbo')).toBeInTheDocument();
        expect(screen.getByText('Laura Alamillo')).toBeInTheDocument();
        expect(screen.queryByText('Pat Elsewhere')).not.toBeInTheDocument();
        // the lead appears once, in the Leads row
        expect(screen.getAllByText('Tim Hensel')).toHaveLength(1);
    });

    it('says so when the campus has no members beyond the leads', () => {
        renderWithChakra(<WgPeopleSection leads={leads} members={[members[0]]} campusAbbrev="ssu" />);
        expect(screen.getByText('Members (0)')).toBeInTheDocument();
        expect(screen.getByText('none at this campus')).toBeInTheDocument();
    });
});

describe('person links', () => {
    it('links leads and members to their person pages', () => {
        renderWithChakra(
            <WgPeopleSection
                leads={[{ unique_id: 'l1', name: 'Sandra Ayala', employee_id: '100' }]}
                members={[{ name: 'Kyle Falbo', employee_id: '200', campus: 'ssu' }]}
                campusAbbrev="ssu"
            />,
        );
        expect(screen.getByRole('link', { name: 'Sandra Ayala' })).toHaveAttribute('href', getPersonUrl('100', 'ssu'));
        expect(screen.getByRole('link', { name: 'Kyle Falbo' })).toHaveAttribute('href', getPersonUrl('200', 'ssu'));
    });

    it('links community members to their person pages', () => {
        renderWithChakra(
            <WgCommunitiesSection
                communities={[{
                    name: 'Library', stake_count: 0, stakes: [],
                    leads: [{ name: 'Laura Alamillo', employee_id: '300', campus: 'ssu', active_campuses: ['ssu'] }],
                }]}
                campusAbbrev="ssu"
            />,
        );
        expect(screen.getByRole('link', { name: 'Laura Alamillo' })).toHaveAttribute('href', getPersonUrl('300', 'ssu'));
    });

    it('leaves a name unlinked when it has no employee_id', () => {
        renderWithChakra(<WgPeopleSection leads={[{ unique_id: 'l1', name: 'No Id' }]} campusAbbrev="ssu" />);
        expect(screen.getByText('No Id')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'No Id' })).not.toBeInTheDocument();
    });
});

describe('WgCommunitiesSection community stakes', () => {
    const communities = [{
        name: 'Academic Technology',
        stake_count: 2,
        stakes: [
            { composite_key: '6.7-ins', success_indicator: 'Track remediation.' },
            { composite_key: '6.8-ins', success_indicator: 'Develop a process to prioritize and remediate inaccessible course content.' },
        ],
        leads: [],
    }];

    it('renders each stake as a link to its goal view on this campus', () => {
        renderWithChakra(<WgCommunitiesSection communities={communities} campusAbbrev="ssu" />);
        const link = screen.getByRole('link', { name: /6\.8-ins/ });
        expect(link).toHaveAttribute('href', getGoalViewUrlFromCompositeKey('6.8-ins', 'ssu'));
        expect(link).toHaveAttribute('title', communities[0].stakes[1].success_indicator);
        expect(screen.getByRole('link', { name: /6\.7-ins/ })).toBeInTheDocument();
    });

    it('renders stakes as plain text when there is no campus to link into', () => {
        renderWithChakra(<WgCommunitiesSection communities={communities} />);
        expect(screen.getByText('6.8-ins')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /6\.8-ins/ })).not.toBeInTheDocument();
    });

    it('says so when no community holds a stake', () => {
        renderWithChakra(<WgCommunitiesSection communities={[]} campusAbbrev="ssu" />);
        expect(screen.getByText("No community holds a stake in this group's indicators.")).toBeInTheDocument();
    });
});

describe('list semantics', () => {
    it('marks leads and members up as labelled lists', () => {
        renderWithChakra(<WgPeopleSection leads={leads} members={members} campusAbbrev="ssu" />);
        const leadList = screen.getByRole('list', { name: 'Leads' });
        expect(within(leadList).getAllByRole('listitem')).toHaveLength(1);
        const memberList = screen.getByRole('list', { name: 'Members at SSU' });
        expect(within(memberList).getAllByRole('listitem')).toHaveLength(2);
    });

    it('marks the community stack, its people and its stakes up as lists', () => {
        renderWithChakra(
            <WgCommunitiesSection
                communities={[{
                    name: 'Academic Technology',
                    stake_count: 2,
                    stakes: [{ composite_key: '6.7-ins' }, { composite_key: '6.8-ins' }],
                    leads: [{ name: 'Kyle Falbo', employee_id: '2', campus: 'ssu' }],
                }]}
                campusAbbrev="ssu"
            />,
        );
        const stakes = screen.getByRole('list', { name: 'Academic Technology indicator stakes' });
        expect(within(stakes).getAllByRole('listitem')).toHaveLength(2);
        const people = screen.getByRole('list', { name: 'Academic Technology people' });
        expect(within(people).getAllByRole('listitem')).toHaveLength(1);
        // the community box is itself an item of the outer stack
        expect(stakes.closest('li').parentElement).toHaveAttribute('role', 'list');
    });
});
