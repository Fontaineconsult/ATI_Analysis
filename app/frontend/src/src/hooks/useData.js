import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

// Custom hook to access the data from DataContext
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

