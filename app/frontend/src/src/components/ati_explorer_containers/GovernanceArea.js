import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import GovernanceMasterContainer from './GovernanceMasterContainer';
import PrincipleMasterContainer from './PrincipleMasterContainer';

/**
 * The Governance area of the ATI Explorer, tabbed into:
 *   - Governance Items  — laws / cases / directives / policies / memos / guidelines
 *   - Principles        — the framework's conceptual commitments, grounded in governance/theory
 *
 * The active tab is URL-DRIVEN (same pattern as the rest of the explorer): the
 * `/ati-explorer/governance...` routes render this with activeTab="governance" and the
 * `/ati-explorer/principles...` routes with activeTab="principles". Switching tabs navigates,
 * so each tab — and each selected item within it — is deep-linkable. `isLazy` mounts only the
 * active tab's container.
 *
 * Props: activeTab — 'governance' | 'principles' (set by the route).
 */
function GovernanceArea({ activeTab = 'governance' }) {
    const navigate = useNavigate();
    const { campus } = useParams();
    const tabIndex = activeTab === 'principles' ? 1 : 0;

    const handleTabChange = (index) => {
        navigate(`/${campus}/ati-explorer/${index === 1 ? 'principles' : 'governance'}`);
    };

    return (
        <Tabs colorScheme="teal" variant="enclosed" isLazy index={tabIndex} onChange={handleTabChange}>
            <TabList>
                <Tab>Governance Items</Tab>
                <Tab>Principles</Tab>
            </TabList>
            <TabPanels>
                <TabPanel px={0}>
                    <GovernanceMasterContainer />
                </TabPanel>
                <TabPanel px={0}>
                    <PrincipleMasterContainer />
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

export default GovernanceArea;
