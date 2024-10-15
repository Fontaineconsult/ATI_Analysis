import React from 'react';
import {Box, Button, Heading, Spinner, Text} from '@chakra-ui/react';
import { useData } from '../../hooks/useData';  // Import the custom hook to fetch data
import { useSettings } from '../../context/SettingsContext';  // Import the custom hook to access settings

// Subcomponents for different data categories
import WebData from './WebData';
import InstructionalMaterialsData from './InstructionalMaterialsData';
import ProcurementData from './ProcurementData';

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useData();  // Access data from context
    const { currentWorkingGroup } = useSettings();  // Access the current working group from SettingsContext

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            {/* Conditionally render components based on the current working group */}
            {currentWorkingGroup === 'web' && <WebData webData={data.web} />}
            {currentWorkingGroup === 'instructional-materials' && (
                <InstructionalMaterialsData instructionalMaterialsData={data.instructionalMaterials} />
            )}
            {currentWorkingGroup === 'procurement' && (
                <ProcurementData procurementData={data.procurement} />
            )}
        </Box>
    );
}


function NavigationBar() {
    const { updateCurrentWorkingGroup } = useSettings();  // Access the update function

    return (
        <div>
            <Button onClick={() => updateCurrentWorkingGroup('web')}>Web</Button>
            <Button onClick={() => updateCurrentWorkingGroup('instructional-materials')}>Instructional Materials</Button>
            <Button onClick={() => updateCurrentWorkingGroup('procurement')}>Procurement</Button>
        </div>
    );
}


export default WorkingGroupMasterContainer;