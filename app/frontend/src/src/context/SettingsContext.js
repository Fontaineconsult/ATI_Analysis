import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchCampuses, fetchSettings } from '../services/api/get';
import { setVocab } from '../components/graph_components/assets/vocabRegistry';

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
    const [currentAcademicYear, setCurrentAcademicYear] = useState('2025-2026');  // Default year
    const [currentWorkingGroup, setCurrentWorkingGroup] = useState('web');  // Default working group
    const [currentCampus, setCurrentCampus] = useState(null);  // Campus abbreviation, set from URL
    const [campuses, setCampuses] = useState([]);  // List of {name, abbreviation}
    const [campusesLoading, setCampusesLoading] = useState(true);

    // Display vocabularies pulled from data_config.py via GET /settings (single
    // source of truth). Mirrored into the module-level registry so the pure
    // label/colour helpers resolve without context; also kept in state so hook
    // consumers (forms, lists) re-render once it arrives.
    const [vocab, setVocabState] = useState({});
    const [vocabLoading, setVocabLoading] = useState(true);

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

    // Load vocabularies on mount
    useEffect(() => {
        const loadVocab = async () => {
            try {
                const response = await fetchSettings();
                const data = response.data || {};
                setVocab(data);          // module registry (for pure helpers/badges)
                setVocabState(data);     // React state (for hook consumers)
            } catch (error) {
                console.error('Error loading settings vocabularies:', error);
            } finally {
                setVocabLoading(false);
            }
        };
        loadVocab();
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
            getCampusName,
            vocab,
            vocabLoading
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
