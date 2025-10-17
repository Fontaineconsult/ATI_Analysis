import React, { createContext, useState, useEffect } from 'react';
import {fetchPrimaryData, fetchCurrentYearIndicator, fetchTrends, fetchAllImplementations} from '../services/api/get';
import { useToast } from '@chakra-ui/react';
import {year_difference} from "../services/utils/tools";

const transformWorkingGroup = (workingGroup) => {
    const mapping = {
        'instructional-materials': 'instructionalMaterials',
        'web': 'web',
        'procurement': 'procurement'
    };
    return mapping[workingGroup] || workingGroup;
};

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        web: null,
        instructionalMaterials: null,
        procurement: null,
        indicators: null,
        implementations: {}
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2024-2025');

    // Add a simple version counter to force re-renders
    const [dataVersion, setDataVersion] = useState(0);

    const toast = useToast();

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [webData, instructionalMaterialsData, procurementData, indicatorsData, yoyTrends, implementationsData] = await Promise.all([
                fetchPrimaryData("web", selectedYear),
                fetchPrimaryData("instructional-materials", selectedYear),
                fetchPrimaryData("procurement", selectedYear),
                fetchCurrentYearIndicator(),
                fetchTrends(year_difference(selectedYear), selectedYear),
                fetchAllImplementations()
            ]);

            setData({
                web: webData.data,
                instructionalMaterials: instructionalMaterialsData.data,
                procurement: procurementData.data,
                indicators: indicatorsData.data,
                yoyTrends: yoyTrends.data,
                implementations: implementationsData.status?.data || implementationsData.data || {}
            });

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error loading data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSingleWorkingGroupData = async (workingGroup) => {
        const dataKey = transformWorkingGroup(workingGroup);
        try {
            setUpdating(true);
            const groupData = await fetchPrimaryData(workingGroup, selectedYear);

            setData((prevData) => ({
                ...prevData,
                [dataKey]: groupData.data,
            }));

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);

        } catch (err) {
            setError(err.message);
            toast({
                title: `Error updating ${workingGroup} data.`,
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    const refreshIndicators = async () => {
        try {
            setUpdating(true);
            const indicatorsData = await fetchCurrentYearIndicator(selectedYear);

            setData((prevData) => ({
                ...prevData,
                indicators: indicatorsData.data,
            }));

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);
        } catch (err) {
            toast({
                title: "Error refreshing indicators data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    const updateYear = (newYear) => {
        setSelectedYear(newYear);
        toast({
            title: `Year changed to ${newYear}`,
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    };

    const refreshImplementations = async () => {
        try {
            setUpdating(true);
            const [webData, instructionalMaterialsData, procurementData, implementationsData] = await Promise.all([
                fetchPrimaryData("web", selectedYear),
                fetchPrimaryData("instructional-materials", selectedYear),
                fetchPrimaryData("procurement", selectedYear),
                fetchAllImplementations()
            ]);

            setData((prevData) => ({
                ...prevData,
                web: webData.data,
                instructionalMaterials: instructionalMaterialsData.data,
                procurement: procurementData.data,
                implementations: implementationsData.status?.data || implementationsData.data || {}
            }));

            // Increment version to trigger re-renders
            setDataVersion(v => v + 1);
        } catch (err) {
            toast({
                title: "Error refreshing implementations.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <DataContext.Provider value={{
            data,
            loading,
            updating,
            error,
            selectedYear,
            updateYear,
            loadSingleWorkingGroupData,
            refreshIndicators,
            refreshImplementations,
            dataVersion  // Expose version for components to use as a dependency or key
        }}>
            {children}
        </DataContext.Provider>
    );
}

export default DataProvider;