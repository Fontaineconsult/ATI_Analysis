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

    const toast = useToast();

    useEffect(() => {
        loadData();
        loadAdmins(); // Load admin data on mount
    }, [selectedYear]);

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

            console.log("Current data:", data[dataKey]);
            console.log("New data:", groupData.data);

            setData((prevData) => {
                console.log("Inside setState - Previous data:", prevData[dataKey]);
                const newData = {
                    ...prevData,
                    [dataKey]: groupData.data,
                };
                console.log("Inside setState - New data:", newData[dataKey]);
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
            isUserAdmin, // Provide the admin check function
            admins: data.admins // Provide direct access to admin list
        }}>
            {children}
        </DataContext.Provider>
    );
};