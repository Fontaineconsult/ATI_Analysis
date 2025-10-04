import React, { createContext, useState, useEffect } from 'react';
import {fetchPrimaryData, fetchCurrentYearIndicator, fetchAllIndividuals, fetchTrends} from '../services/api/get';
import { useToast } from '@chakra-ui/react';
import {year_difference} from "../services/utils/tools";
import adminData from './admins.json'; // Import the admin data

const transformWorkingGroup = (workingGroup) => {
    const mapping = {
        'instructional-materials': 'instructionalMaterials',
        'web': 'web',
        'procurement': 'procurement'
    };
    return mapping[workingGroup] || workingGroup;
};

// Create a context
export const DataContext = createContext();

// DataProvider component to wrap the app
export const DataProvider = ({ children }) => {
    const [data, setData] = useState({
        web: null,
        instructionalMaterials: null,
        procurement: null,
        indicators: null,
        individuals: null,
        admins: [], // Add admins to the data state
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2024-2025');
    const [currentUser, setCurrentUser] = useState(null); // Add user state

    const toast = useToast();

    useEffect(() => {
        loadData();
        loadAdmins(); // Load admin data on mount
        loadAllIndividuals()
    }, [selectedYear]);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('ati_current_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setCurrentUser(userData);
            } catch (err) {
                console.error('Error loading saved user:', err);
                localStorage.removeItem('ati_current_user');
            }
        }
    }, []);

    // Function to load admin data from JSON file
    const loadAdmins = () => {
        try {
            // Set the admin data from the imported JSON
            setData((prevData) => ({
                ...prevData,
                admins: adminData.admins || []
            }));
        } catch (err) {
            console.error('Error loading admin data:', err);
            toast({
                title: "Error loading admin data.",
                description: "Could not load administrator list.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            // Set empty array as fallback
            setData((prevData) => ({
                ...prevData,
                admins: []
            }));
        }
    };

    // Helper function to check if a user is an admin based on query string
    const isUserAdmin = () => {
        // Get the query string from the current URL
        const urlParams = new URLSearchParams(window.location.search);
        const employeeId = urlParams.get('employee_id');

        // Check if the employee_id from query string is in the admins list
        if (!employeeId) return false;

        return data.admins.includes(String(employeeId));
    };

    // Function to set the current user
    const setUser = (userData) => {
        if (userData) {
            const userInfo = {
                name: userData.name,
                employee_id: userData.employee_id,
                unique_id: userData.unique_id,
                title: userData.title,
                email: userData.email,
                active: userData.active
            };
            setCurrentUser(userInfo);
            // Save to localStorage for persistence
            localStorage.setItem('ati_current_user', JSON.stringify(userInfo));

            toast({
                title: "User selected",
                description: `Now notating as ${userData.name}`,
                status: "success",
                duration: 2000,
                isClosable: true,
            });
        } else {
            setCurrentUser(null);
            localStorage.removeItem('ati_current_user');
        }
    };

    // Function to clear the current user
    const clearUser = () => {
        setCurrentUser(null);
        localStorage.removeItem('ati_current_user');
        toast({
            title: "User cleared",
            description: "No active user selected",
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    };

    // Function to get user by ID from individuals list
    const getUserById = (userId) => {
        if (!data.individuals) return null;
        return data.individuals.find(person =>
            person.unique_id === userId ||
            person.employee_id === userId
        );
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [webData, instructionalMaterialsData, procurementData, indicatorsData, yoyTrends] = await Promise.all([
                fetchPrimaryData("web", selectedYear),
                fetchPrimaryData("instructional-materials", selectedYear),
                fetchPrimaryData("procurement", selectedYear),
                fetchCurrentYearIndicator(),
                fetchTrends(year_difference(selectedYear),selectedYear)
            ]);

            setData((prevData) => ({
                ...prevData,
                web: webData.data,
                instructionalMaterials: instructionalMaterialsData.data,
                procurement: procurementData.data,
                indicators: indicatorsData.data,
                yoyTrends: yoyTrends.data
            }));
        } catch (err) {
            setError(err.message);
            toast({
                title: "Error loading data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSingleWorkingGroupData = async (workingGroup) => {
        const dataKey = transformWorkingGroup(workingGroup);
        try {
            setUpdating(true);
            const groupData = await fetchPrimaryData(workingGroup, selectedYear);

            setData((prevData) => {
                const newData = {
                    ...prevData,
                    [dataKey]: groupData.data,
                };
                return newData;
            });

        } catch (err) {
            setError(err.message);
            toast({
                title: `Error updating ${workingGroup} data.`,
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    const refreshIndicators = async () => {
        try {
            setUpdating(true);
            const indicatorsData = await fetchCurrentYearIndicator(selectedYear);

            setData((prevData) => ({
                ...prevData,
                indicators: indicatorsData.data,
            }));
        } catch (err) {
            toast({
                title: "Error refreshing indicators data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    // Function to load all individuals, with check to avoid redundant API calls
    const loadAllIndividuals = async (forceLoad = false) => {
        try {
            if (!forceLoad && data.individuals) return; // Avoid loading if data is already present unless forced
            setUpdating(true);
            const individualsData = await fetchAllIndividuals();

            setData((prevData) => ({
                ...prevData,
                individuals: individualsData.data.persons,
            }));

            // Check if current user still exists in the updated list
            if (currentUser) {
                const userStillExists = individualsData.data.persons.some(
                    person => person.unique_id === currentUser.unique_id
                );
                if (!userStillExists) {
                    clearUser();
                    toast({
                        title: "User no longer available",
                        description: "The selected user is no longer in the system",
                        status: "warning",
                        duration: 3000,
                        isClosable: true,
                    });
                }
            }
        } catch (err) {
            toast({
                title: "Error loading individuals data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    // Function to refresh individuals data, always calls the API
    const refreshAllIndividuals = async () => {
        try {
            setUpdating(true);
            const individualsData = await fetchAllIndividuals();

            setData((prevData) => ({
                ...prevData,
                individuals: individualsData.data.persons,
            }));
        } catch (err) {
            toast({
                title: "Error refreshing individuals data.",
                description: err.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setUpdating(false);
        }
    };

    const updateYear = (newYear) => {
        setSelectedYear(newYear);
        toast({
            title: `Year changed to ${newYear}`,
            status: "info",
            duration: 2000,
            isClosable: true,
        });
    };

    return (
        <DataContext.Provider value={{
            data,
            loading,
            updating,
            error,
            selectedYear,
            updateYear,
            loadSingleWorkingGroupData,
            refreshIndicators,
            loadAllIndividuals,
            refreshAllIndividuals,
            isUserAdmin,
            admins: data.admins,
            // User-related exports
            currentUser,
            setUser,
            clearUser,
            getUserById
        }}>
            {children}
        </DataContext.Provider>
    );
};