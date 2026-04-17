import React, { createContext, useState, useEffect } from 'react';
import { fetchStatusLevels,  } from '../services/api/get';
import { updateStatusLevel } from '../services/api/put';


export const StatusLevelContext = createContext();

export const StatusLevelProvider = ({ children }) => {
    const [statusLevels, setStatusLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadStatusLevels = async () => {
            setLoading(true);
            try {
                const levels = await fetchStatusLevels();
                setStatusLevels(levels.data || []);
            } catch (error) {
                setError('Failed to fetch status levels');
            } finally {
                setLoading(false);
            }
        };

        loadStatusLevels();
    }, []);

    // Update status level for a specific YSE
    const updateStatus = async (yse, statusLevel) => {
        try {
            await updateStatusLevel(yse, statusLevel);
            // Optionally, update the local status levels if needed (e.g., add a success notification)
        } catch (error) {
            console.error('Failed to update status level:', error);
        }
    };

    return (
        <StatusLevelContext.Provider value={{ statusLevels, loading, error, updateStatus }}>
            {children}
        </StatusLevelContext.Provider>
    );
};
