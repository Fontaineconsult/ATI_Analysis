import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import PeopleMasterContainer from './PeopleMasterContainer';
import CommunitiesMasterContainer from './CommunitiesMasterContainer';
import InterviewGuidesPanel from '../graph_components/people/InterviewGuidesPanel';

/**
 * The People area of the ATI Explorer, tabbed into:
 *   - People           — the roster: roles, working groups, YSE assignments
 *   - Communities      — cross-campus communities of practice and their members
 *   - Interview Guides — stakeholder-interview preps (authored by the skill),
 *                        with closure state against their meetings' minutes
 *
 * The active tab is URL-DRIVEN (same pattern as GovernanceArea): the
 * `/ati-explorer/people...` routes render this with activeTab="people",
 * `/people/communities...` with activeTab="communities", and
 * `/people/interview-guides` with activeTab="guides". Switching tabs navigates,
 * so each tab — and each selected item within it — is deep-linkable. `isLazy`
 * mounts only the active tab's container.
 *
 * Props: activeTab — 'people' | 'communities' | 'guides' (set by the route).
 */
const TAB_PATHS = ['', '/communities', '/interview-guides'];

function PeopleArea({ activeTab = 'people' }) {
    const navigate = useNavigate();
    const { campus } = useParams();
    const tabIndex = activeTab === 'communities' ? 1 : activeTab === 'guides' ? 2 : 0;

    const handleTabChange = (index) => {
        navigate(`/${campus}/ati-explorer/people${TAB_PATHS[index] || ''}`);
    };

    return (
        <Tabs colorScheme="teal" variant="enclosed" isLazy index={tabIndex} onChange={handleTabChange}>
            <TabList>
                <Tab>People</Tab>
                <Tab>Communities</Tab>
                <Tab>Interview Guides</Tab>
            </TabList>
            <TabPanels>
                <TabPanel px={0}>
                    <PeopleMasterContainer />
                </TabPanel>
                <TabPanel px={0}>
                    <CommunitiesMasterContainer />
                </TabPanel>
                <TabPanel px={0}>
                    <InterviewGuidesPanel />
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

export default PeopleArea;
