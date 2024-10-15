import React, { createContext, useState, useEffect } from 'react';
import { fetchPrimaryData } from '../services/api/get';

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    // Store results for different working groups and years
    const [data, setData] = useState({
        web: null,
        instructionalMaterials: null,
        procurement: null,
    });
    const [loading, setLoading] = useState(true);  // Loading state for initial data
    const [updating, setUpdating] = useState(false);  // Updating state for background updates
    const [error, setError] = useState(null);      // Error state
    const [selectedYear, setSelectedYear] = useState('2022-2023');  // Default year

    useEffect(() => {
        loadData();  // Load data when the component mounts or the selected year changes
    }, [selectedYear]);

    // Function to fetch data for all working groups
    const loadData = async () => {
        try {
            setLoading(true);  // Show initial loading spinner
            // Fetch data for all working groups for the selected year
            const [webData, instructionalMaterialsData, procurementData] = await Promise.all([
                fetchPrimaryData("web", selectedYear),
                fetchPrimaryData("instructional-materials", selectedYear),
                fetchPrimaryData("procurement", selectedYear),
            ]);

            // Set the data in the state under their respective keys
            setData({
                web: webData,
                instructionalMaterials: instructionalMaterialsData,
                procurement: procurementData,
            });
        } catch (err) {
            setError(err.message);
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
                [workingGroup]: groupData,
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);  // Stop background updating
        }
    };

    // Function to update the selected year
    const updateYear = (newYear) => {
        setSelectedYear(newYear);
    };

    return (
        <DataContext.Provider value={{ data, loading, updating, error, selectedYear, updateYear, loadSingleWorkingGroupData }}>
            {children}
        </DataContext.Provider>
    );
};
