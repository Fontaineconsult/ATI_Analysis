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
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null);     // Error state
    const [selectedYear, setSelectedYear] = useState('2022-2023');  // Default year

    // Fetch data when the component mounts or when the year is updated
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch data for the selected year
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
                setLoading(false);  // Whether success or failure, stop loading
            }
        };

        loadData();
    }, [selectedYear]);  // Re-run effect when selectedYear changes

    // Function to update the selected year
    const updateYear = (newYear) => {
        setSelectedYear(newYear);
    };

    return (
        <DataContext.Provider value={{ data, loading, error, selectedYear, updateYear }}>
            {children}
        </DataContext.Provider>
    );
};
