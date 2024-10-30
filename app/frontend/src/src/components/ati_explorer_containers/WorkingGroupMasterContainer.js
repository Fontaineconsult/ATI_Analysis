import React, {useContext} from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useData } from '../../hooks/useData';
import { Routes, Route } from 'react-router-dom';

// Subcomponents for different data categories
import WebData from './WebData';
import InstructionalMaterialsData from './InstructionalMaterialsData';
import ProcurementData from './ProcurementData';
import '../../styles/App.css';
import {DataContext} from "../../context/DataContext";

function WorkingGroupMasterContainer() {
    const { data, loading, error } = useContext(DataContext);

    if (loading) return <Spinner size="xl" />;
    if (error) return <Text color="red.500">Error: {error}</Text>;

    return (
        <Box className="working-group-container">
            <Routes>
                {/* Route for Web Working Group */}

                <Route path="web" element={<WebData webData={data.web} />} />

                {/* Route for Instructional Materials Working Group */}
                <Route path="instructional-materials" element={<InstructionalMaterialsData instructionalMaterialsData={data.instructionalMaterials} />} />

                {/* Route for Procurement Working Group */}
                <Route path="procurement" element={<ProcurementData procurementData={data.procurement} />} />

                {/* Fallback Route - if no specific working group is selected */}
                <Route path="*" element={<Text className="fallback-text">Please select a working group.</Text>} />
            </Routes>
        </Box>
    );
}

export default WorkingGroupMasterContainer;
