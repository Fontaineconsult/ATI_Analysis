import React, { createContext, useState, useEffect } from 'react';
import { fetchPrimaryData, fetchCurrentYearIndicator } from '../services/api/get'; // Import fetchCurrentYearIndicator
import { useToast } from '@chakra-ui/react'; // Import useToast from Chakra UI

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        web: null,
        instructionalMaterials: null,
        procurement: null,
        indicators: null,  // Add indicators state
    });
    const [loading, setLoading] = useState(true);  // Loading state for initial data
    const [updating, setUpdating] = useState(false);  // Updating state for background updates
    const [error, setError] = useState(null);      // Error state
    const [selectedYear, setSelectedYear] = useState('2022-2023');  // Default year

    const toast = useToast(); // Chakra UI toast hook

    useEffect(() => {
        loadData();  // Load data when the component mounts or the selected year changes
    }, [selectedYear]);

    // Function to fetch data for all working groups and indicators
    const loadData = async () => {
        try {
            setLoading(true);  // Show initial loading spinner
            // Fetch data for all working groups for the selected year
            const [webData, instructionalMaterialsData, procurementData, indicatorsData] = await Promise.all([
                fetchPrimaryData("web", selectedYear),
                fetchPrimaryData("instructional-materials", selectedYear),
                fetchPrimaryData("procurement", selectedYear),
                fetchCurrentYearIndicator(selectedYear),  // Fetch indicators data
            ]);

            // Set the data in the state under their respective keys
            setData({
                web: webData.data,
                instructionalMaterials: instructionalMaterialsData.data,
                procurement: procurementData.data,
                indicators: indicatorsData.data,  // Store indicators data
            });

        } catch (err) {
            setError(err.message);
            // Show error toast notification
            toast({
                title: "Error loading data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);  // Stop initial loading
        }
    };

    // Function to fetch data for a single working group (background update)
    const loadSingleWorkingGroupData = async (workingGroup) => {
        try {
            setUpdating(true);  // Trigger background updating state
            const groupData = await fetchPrimaryData(workingGroup, selectedYear);

            // Update only the specific working group data in the state
            setData((prevData) => ({
                ...prevData,
                [workingGroup]: groupData.data,
            }));

        } catch (err) {
            setError(err.message);
            // Show error toast notification
            toast({
                title: `Error updating ${workingGroup} data.`,
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);  // Stop background updating
        }
    };

    // Function to refresh only the indicators data
    const refreshIndicators = async () => {
        try {
            setUpdating(true);  // Trigger background updating state for indicators refresh
            const indicatorsData = await fetchCurrentYearIndicator(selectedYear);  // Fetch indicators data

            // Update only the indicators data in the state
            setData((prevData) => ({
                ...prevData,
                indicators: indicatorsData.data,  // Update only indicators
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
            setUpdating(false);  // Stop background updating after refresh
        }
    };


    // Function to update the selected year
    const updateYear = (newYear) => {
        setSelectedYear(newYear);
        // Show notification for changing the year
        toast({
            title: `Year changed to ${newYear}`,
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    };

    return (
        <DataContext.Provider value={{ data,
            loading,
            updating,
            error,
            selectedYear,
            updateYear,
            loadSingleWorkingGroupData,
            refreshIndicators}}>
            {children}
        </DataContext.Provider>
    );
};
