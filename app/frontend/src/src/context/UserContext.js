import React, { createContext, useState, useEffect } from 'react';
import { fetchUserByEmployeeId, fetchAllIndividuals } from '../services/api/get';
import { useToast } from '@chakra-ui/react';
import adminData from './admins.json';

// Create the UserContext
export const UserContext = createContext();

// Create the UserProvider that will wrap the app
export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [individuals, setIndividuals] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();

    // Function to retrieve employee_id from URL query string
    const getEmployeeIdFromQuery = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('employee_id');
    };

    // Load admins from JSON file
    const loadAdmins = () => {
        try {
            setAdmins(adminData.admins || []);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setAdmins([]);
        }
    };

    // Check if a user is an admin based on query string
    const isUserAdmin = () => {
        const employeeId = getEmployeeIdFromQuery();
        if (!employeeId) return false;
        return admins.includes(String(employeeId));
    };

    // Set the current user
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
            localStorage.setItem('ati_current_user', JSON.stringify(userInfo));

            if (toast) {
                toast({
                    title: "User selected",
                    description: `Now notating as ${userData.name}`,
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
            }
        } else {
            setCurrentUser(null);
            localStorage.removeItem('ati_current_user');
        }
    };

    // Clear the current user
    const clearUser = () => {
        setCurrentUser(null);
        localStorage.removeItem('ati_current_user');
        if (toast) {
            toast({
                title: "User cleared",
                description: "No active user selected",
                status: "info",
                duration: 2000,
                isClosable: true,
            });
        }
    };

    // Get user by ID from individuals list
    const getUserById = (userId) => {
        if (!individuals) return null;
        return individuals.find(person =>
            person.unique_id === userId ||
            person.employee_id === userId
        );
    };

    // Load all individuals
    const loadAllIndividuals = async (forceLoad = false) => {
        try {
            if (!forceLoad && individuals) return;

            const individualsData = await fetchAllIndividuals();
            setIndividuals(individualsData.data.persons);

            // Check if current user still exists in the updated list
            if (currentUser) {
                const userStillExists = individualsData.data.persons.some(
                    person => person.unique_id === currentUser.unique_id
                );
                if (!userStillExists) {
                    clearUser();
                    if (toast) {
                        toast({
                            title: "User no longer available",
                            description: "The selected user is no longer in the system",
                            status: "warning",
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error loading individuals:', err);
            if (toast) {
                toast({
                    title: "Error loading individuals data.",
                    description: err.message,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    // Refresh individuals data
    const refreshAllIndividuals = async () => {
        try {
            const individualsData = await fetchAllIndividuals();
            setIndividuals(individualsData.data.persons);
        } catch (err) {
            if (toast) {
                toast({
                    title: "Error refreshing individuals data.",
                    description: err.message,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    // Initial load effect
    useEffect(() => {
        const initializeUser = async () => {
            setLoading(true);

            // Load admins
            loadAdmins();

            // Load individuals
            await loadAllIndividuals();

            // Try to load user from localStorage first
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

            // Try to load user from query parameter if not in localStorage
            if (!savedUser) {
                const employeeId = getEmployeeIdFromQuery();
                if (employeeId) {
                    try {
                        const person = await fetchUserByEmployeeId(employeeId);
                        setUser(person.data.person);
                    } catch (error) {
                        setError('Failed to fetch user data');
                    }
                }
            }

            setLoading(false);
        };

        initializeUser();
    }, []);

    return (
        <UserContext.Provider value={{
            // Main user properties (compatible with existing usage)
            user: currentUser,  // Aliased for backward compatibility
            currentUser,
            loading,
            error,

            // User methods
            setUser,
            clearUser,
            getUserById,

            // Admin functionality
            isUserAdmin,
            admins,

            // Individuals management
            individuals,
            loadAllIndividuals,
            refreshAllIndividuals
        }}>
            {children}
        </UserContext.Provider>
    );
};