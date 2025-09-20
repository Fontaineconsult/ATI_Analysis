import React, { createContext, useState, useContext } from 'react';

// Create the SettingsContext
export const SettingsContext = createContext();

// Custom hook to access the SettingsContext
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// SettingsProvider component that wraps the app
export const SettingsProvider = ({ children }) => {
    // Global settings state for current academic year and working group
    const [currentAcademicYear, setCurrentAcademicYear] = useState('2024-2025');  // Default year
    const [currentWorkingGroup, setCurrentWorkingGroup] = useState('web');  // Default working group

    // Function to update the current academic year
    const updateCurrentAcademicYear = (newYear) => {
        setCurrentAcademicYear(newYear);
    };

    // Function to update the current working group
    const updateCurrentWorkingGroup = (newWorkingGroup) => {
        setCurrentWorkingGroup(newWorkingGroup);
    };

    return (
        <SettingsContext.Provider value={{
            currentAcademicYear,
            updateCurrentAcademicYear,
            currentWorkingGroup,
            updateCurrentWorkingGroup
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
