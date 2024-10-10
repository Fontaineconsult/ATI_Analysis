import React, { createContext, useState, useEffect } from 'react';
import { fetchPrimaryData } from '../services/api/get';
// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    const [data, setData] = useState(null);       // Holds fetched data
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null);     // Error state

    // Fetch data when the component mounts (on app load)
    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchPrimaryData();
                setData(result);
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
