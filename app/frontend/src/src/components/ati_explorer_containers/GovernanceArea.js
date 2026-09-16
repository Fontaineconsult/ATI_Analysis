import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import GovernanceMasterContainer from './GovernanceMasterContainer';
import PrincipleMasterContainer from './PrincipleMasterContainer';
import IntellectualSourceMasterContainer from './IntellectualSourceMasterContainer';

/**
 * The Governance area of the ATI Explorer, tabbed into:
 *   - Governance Items     — laws / cases / directives / policies / memos / guidelines
 *   - Principles           — the framework's conceptual commitments, grounded in governance/theory
 *   - Intellectual Sources — the theory and method a campus reads; carries NO authority
 *
 * The three sit together because a Principle grounds DOWN into either of the other two:
 * governance grounds it in mandate, an intellectual source grounds it in theory.
 *
 * The active tab is URL-DRIVEN (same pattern as the rest of the explorer): each tab has its
 * own route slug, so both the tab and the item selected within it are deep-linkable.
 * `isLazy` mounts only the active tab's container.
 *
 * Props: activeTab — 'governance' | 'principles' | 'intellectual-sources' (set by the route).
 */
const TAB_SLUGS = ['governance', 'principles', 'intellectual-sources'];

function GovernanceArea({ activeTab = 'governance' }) {
    const navigate = useNavigate();
    const { campus } = useParams();
    // An unrecognised slug falls back to the first tab rather than rendering nothing.
    const tabIndex = Math.max(0, TAB_SLUGS.indexOf(activeTab));

    const handleTabChange = (index) => {
        navigate(`/${campus}/ati-explorer/${TAB_SLUGS[index] || TAB_SLUGS[0]}`);
    };

    return (
        <Tabs colorScheme="teal" variant="enclosed" isLazy index={tabIndex} onChange={handleTabChange}>
            <TabList>
                <Tab>Governance Items</Tab>
                <Tab>Principles</Tab>
                <Tab>Intellectual Sources</Tab>
            </TabList>
            <TabPanels>
                <TabPanel px={0}>
                    <GovernanceMasterContainer />
                </TabPanel>
                <TabPanel px={0}>
                    <PrincipleMasterContainer />
                </TabPanel>
                <TabPanel px={0}>
                    <IntellectualSourceMasterContainer />
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

export default GovernanceArea;
