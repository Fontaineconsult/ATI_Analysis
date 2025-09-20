import React, { createContext, useState, useEffect } from 'react';
import { fetchPrimaryData, fetchCurrentYearIndicator, fetchAllIndividuals } from '../services/api/get';
import { useToast } from '@chakra-ui/react';


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
        individuals: null,
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2024-2025');

    const toast = useToast();

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [webData, instructionalMaterialsData, procurementData, indicatorsData] = await Promise.all([
                fetchPrimaryData("web", selectedYear),
                fetchPrimaryData("instructional-materials", selectedYear),
                fetchPrimaryData("procurement", selectedYear),
                fetchCurrentYearIndicator(selectedYear),
            ]);

            setData((prevData) => ({
                ...prevData,
                web: webData.data,
                instructionalMaterials: instructionalMaterialsData.data,
                procurement: procurementData.data,
                indicators: indicatorsData.data,
            }));
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

            console.log("Current data:", data[dataKey]);
            console.log("New data:", groupData.data);

            setData((prevData) => {
                console.log("Inside setState - Previous data:", prevData[dataKey]);
                const newData = {
                    ...prevData,
                    [dataKey]: groupData.data,
                };
                console.log("Inside setState - New data:", newData[dataKey]);
                return newData;
            });

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

    // Function to load all individuals, with check to avoid redundant API calls
    const loadAllIndividuals = async (forceLoad = false) => {
        try {
            if (!forceLoad && data.individuals) return; // Avoid loading if data is already present unless forced
            setUpdating(true);
            const individualsData = await fetchAllIndividuals();

            setData((prevData) => ({
                ...prevData,
                individuals: individualsData.data.persons,
            }));
        } catch (err) {
            toast({
                title: "Error loading individuals data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    // Function to refresh individuals data, always calls the API
    const refreshAllIndividuals = async () => {
        try {
            setUpdating(true);
            const individualsData = await fetchAllIndividuals();

            setData((prevData) => ({
                ...prevData,
                individuals: individualsData.data.persons,
            }));
        } catch (err) {
            toast({
                title: "Error refreshing individuals data.",
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
            loadAllIndividuals,  // Add loadAllIndividuals to the context
            refreshAllIndividuals,  // Add refreshAllIndividuals to the context
        }}>
            {children}
        </DataContext.Provider>
    );
};
