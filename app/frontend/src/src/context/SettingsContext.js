import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchCampuses } from '../services/api/get';

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
    const [currentCampus, setCurrentCampus] = useState(null);  // Campus abbreviation, set from URL
    const [campuses, setCampuses] = useState([]);  // List of {name, abbreviation}
    const [campusesLoading, setCampusesLoading] = useState(true);

    // Load campuses on mount
    useEffect(() => {
        const loadCampuses = async () => {
            try {
                const response = await fetchCampuses();
                const campusData = response.data || [];
                setCampuses(campusData);
            } catch (error) {
                console.error('Error loading campuses:', error);
            } finally {
                setCampusesLoading(false);
            }
        };
        loadCampuses();
    }, []);

    // Function to update the current academic year
    const updateCurrentAcademicYear = (newYear) => {
        setCurrentAcademicYear(newYear);
    };

    // Function to update the current working group
    const updateCurrentWorkingGroup = (newWorkingGroup) => {
        setCurrentWorkingGroup(newWorkingGroup);
    };

    // Function to update the current campus
    const updateCurrentCampus = (newCampusAbbreviation) => {
        setCurrentCampus(newCampusAbbreviation);
    };

    // Get full campus name from abbreviation
    const getCampusName = (abbreviation) => {
        const campus = campuses.find(c => c.abbreviation === abbreviation);
        return campus ? campus.name : abbreviation;
    };

    return (
        <SettingsContext.Provider value={{
            currentAcademicYear,
            updateCurrentAcademicYear,
            currentWorkingGroup,
            updateCurrentWorkingGroup,
            currentCampus,
            campuses,
            campusesLoading,
            updateCurrentCampus,
            getCampusName
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
