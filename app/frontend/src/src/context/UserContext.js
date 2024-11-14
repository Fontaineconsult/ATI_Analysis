import React, { createContext, useState, useEffect } from 'react';
import { fetchUserByEmployeeId } from '../services/api/get';  // Import API call function

// Create the UserContext
export const UserContext = createContext();

// Create the UserProvider that will wrap the app
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);       // Initialize user state
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null);     // Error state

    // Function to retrieve employee_id from URL query string
    const getEmployeeIdFromQuery = () => {
        const params = new URLSearchParams(window.location.search); // Parse the query string
        return params.get('employee_id'); // Return the employee_id parameter
    };

    // Fetch user data when the component mounts
    useEffect(() => {
        const loadUser = async () => {
            const employeeId = getEmployeeIdFromQuery(); // Get employee_id from query string

            if (employeeId) {
                try {
                    const person = await fetchUserByEmployeeId(employeeId);
                    setUser(person.data.person);  // Set the user data
                } catch (error) {
                    setError('Failed to fetch user data');
                } finally {
                    setLoading(false);  // Stop loading
                }
            } else {
                setLoading(false);  // No employee_id provided, stop loading
            }
        };

        loadUser();
    }, []);  // Run only once when the component mounts

    return (
        <UserContext.Provider value={{ user, loading, error }}>
            {children}
        </UserContext.Provider>
    );
};
