import { useContext } from 'react';
import { StatusLevelContext } from '../context/StatusLevelContext';

// Custom hook to access status levels and update functionality
export const useStatusLevels = () => {
    const context = useContext(StatusLevelContext);
    if (!context) {
        throw new Error('useStatusLevels must be used within a StatusLevelProvider');
    }
    return context;
};
