import React from 'react';
import {Box, Button, Heading, Spinner, Text} from '@chakra-ui/react';
import { useData } from '../../hooks/useData';  // Import the custom hook to fetch data

// Subcomponents for different data categories
import WebData from './WebData';
import InstructionalMaterialsData from './InstructionalMaterialsData';
import ProcurementData from './ProcurementData';
import {Route, Routes} from "react-router-dom";




// Subcomponents for different data categories

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useData();  // Access data from context

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box maxW="1200px" mx="auto" p={4}>
            {/* Use Routes to define routes for different working groups */}
            <Routes>
                {/* Route for Web Working Group */}
                <Route path="web" element={<WebData webData={data.web} />} />

                {/* Route for Instructional Materials Working Group */}
                <Route path="instructional-materials" element={
                    <InstructionalMaterialsData instructionalMaterialsData={data.instructionalMaterials} />
                } />

                {/* Route for Procurement Working Group */}
                <Route path="procurement" element={
                    <ProcurementData procurementData={data.procurement} />
                } />

                {/* Fallback Route - if no specific working group is selected */}
                <Route path="*" element={<Text>Please select a working group.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;



// function NavigationBar() {
//     const { updateCurrentWorkingGroup } = useSettings();  // Access the update function
//
//     return (
//         <div>
//             <Button onClick={() => updateCurrentWorkingGroup('web')}>Web</Button>
//             <Button onClick={() => updateCurrentWorkingGroup('instructional-materials')}>Instructional Materials</Button>
//             <Button onClick={() => updateCurrentWorkingGroup('procurement')}>Procurement</Button>
//         </div>
//     );
// }


// export default WorkingGroupMasterContainer;