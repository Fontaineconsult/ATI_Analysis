import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import PeopleMasterContainer from './PeopleMasterContainer';
import CommunitiesMasterContainer from './CommunitiesMasterContainer';

/**
 * The People area of the ATI Explorer, tabbed into:
 *   - People       — the roster: roles, working groups, YSE assignments
 *   - Communities  — cross-campus communities of practice and their members
 *
 * The active tab is URL-DRIVEN (same pattern as GovernanceArea): the
 * `/ati-explorer/people...` routes render this with activeTab="people" and the
 * `/ati-explorer/people/communities...` routes with activeTab="communities".
 * Switching tabs navigates, so each tab — and each selected item within it —
 * is deep-linkable. `isLazy` mounts only the active tab's container.
 *
 * Props: activeTab — 'people' | 'communities' (set by the route).
 */
function PeopleArea({ activeTab = 'people' }) {
    const navigate = useNavigate();
    const { campus } = useParams();
    const tabIndex = activeTab === 'communities' ? 1 : 0;

    const handleTabChange = (index) => {
        navigate(`/${campus}/ati-explorer/people${index === 1 ? '/communities' : ''}`);
    };

    return (
        <Tabs colorScheme="teal" variant="enclosed" isLazy index={tabIndex} onChange={handleTabChange}>
            <TabList>
                <Tab>People</Tab>
                <Tab>Communities</Tab>
            </TabList>
            <TabPanels>
                <TabPanel px={0}>
                    <PeopleMasterContainer />
                </TabPanel>
                <TabPanel px={0}>
                    <CommunitiesMasterContainer />
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

export default PeopleArea;
