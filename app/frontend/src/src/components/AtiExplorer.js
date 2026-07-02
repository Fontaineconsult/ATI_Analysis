import React, { useEffect } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import WorkingGroupMasterContainer from './ati_explorer_containers/WorkingGroupMasterContainer';
import { useData } from '../hooks/useData';
import { WORKING_GROUP_LIST } from '../styles/workingGroupIdentity';
import '../styles/App.css';

function AtiExplorer() {
    const location = useLocation();
    const navigate = useNavigate();
    const { campus } = useParams();
    const { data, loading, updating, error, selectedYear } = useData();

    // Redirect from /campus/ati-explorer to its first section. (The working-group goal views
    // moved to the Dashboard; the explorer now opens on Implementations.)
    useEffect(() => {
        const atiExplorerBase = `/${campus}/ati-explorer`;
        if (location.pathname === atiExplorerBase || location.pathname === `${atiExplorerBase}/`) {
            navigate(`${atiExplorerBase}/implementations`, { replace: true });
        }
    }, [location.pathname, navigate, campus]);

    // Check if all working-group data fields are null, indicating an empty state
    const isDataEmpty = WORKING_GROUP_LIST.every((wg) => !data[wg.dataKey]);

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
