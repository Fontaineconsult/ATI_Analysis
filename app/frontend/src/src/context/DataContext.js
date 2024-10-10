import React, { createContext, useState, useEffect } from 'react';
import { fetchPrimaryData } from '../services/api/get';  // Import the API function

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    // Store results from multiple endpoints in a structured state
    const [data, setData] = useState({
        web: null,
        instructionalMaterials: null,
        procurement: null,
    });

    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null);     // Error state

    // Fetch data when the component mounts (on app load)
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch data for all 3 endpoints concurrently
                const [webData, instructionalMaterialsData, procurementData] = await Promise.all([
                    fetchPrimaryData("web", "2022-2023"),
                    fetchPrimaryData("instructional-materials", "2022-2023"),
                    fetchPrimaryData("procurement", "2022-2023"),
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
    }, []);  // Empty dependency array ensures this only runs on mount

    return (
        <DataContext.Provider value={{ data, loading, error }}>
            {children}
        </DataContext.Provider>
    );
};
