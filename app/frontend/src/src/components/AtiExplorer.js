import React, { useEffect } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import WorkingGroupMasterContainer from './ati_explorer_containers/WorkingGroupMasterContainer';
import { useData } from '../hooks/useData';
import '../styles/App.css';

function AtiExplorer() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data, loading, updating, error, selectedYear } = useData();

    // Redirect from /ati-explorer to /ati-explorer/web/goal/1
    useEffect(() => {
        if (location.pathname === '/ati-explorer' || location.pathname === '/ati-explorer/') {
            navigate('/ati-explorer/web/goal/1', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Check if all data fields are null, indicating an empty state
    const isDataEmpty = !data.web && !data.instructionalMaterials && !data.procurement;

    if (loading) {
        return (
            <Box className="centered-container">
                <Spinner size="xl" />
                <p className="ati-explorer-text">Loading data for {selectedYear}...</p>
            </Box>
        );
    }

    if (!loading && isDataEmpty) {
        return (
            <Box className="centered-container">
                <h2 className="ati-explorer-heading">Data Not Available</h2>
                <p className="ati-explorer-text">
                    There is no data available for the selected year. Please select a different year.
                </p>
            </Box>
        );
    }

    if (error) {
        return <p className="ati-explorer-text" style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <Box maxW="1400px" mx="auto" p={4}>
            <WorkingGroupMasterContainer />

            {updating && (
                <Box className="update-spinner">
                    <Spinner size="sm" />
                    <p className="ati-explorer-text">Updating data in the background...</p>
                </Box>
            )}
        </Box>
    );
}

export default AtiExplorer;