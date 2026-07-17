import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchUserByEmployeeId, fetchAllIndividuals } from '../services/api/get';
import { useToast } from '@chakra-ui/react';
import { AuthContext } from './AuthContext';

// Create the UserContext
export const UserContext = createContext();

// Create the UserProvider that will wrap the app.
// Identity (who is logged in) lives in AuthContext; this context tracks the
// "notating as" attribution Person — a deliberately separate concern, since an
// admin may record notes on someone else's behalf.
export const UserProvider = ({ children }) => {
    const { authUser, enforced } = useContext(AuthContext);
    const [currentUser, setCurrentUser] = useState(null);
    const [individuals, setIndividuals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();

    // Function to retrieve employee_id from URL query string
    const getEmployeeIdFromQuery = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('employee_id');
    };

    // Admin status is server-driven (AUTH_ADMINS env on the backend, surfaced
    // through /me). With the auth kill-switch off (dev), everything is open.
    const isUserAdmin = () => {
        if (!enforced) return true;
        return !!authUser?.is_admin;
    };

    // The persisted "notating as" selection is tagged with the email of the
    // account that made it (ownerEmail), so one account's manual choice never
    // leaks into another account's session, and a stale pre-login selection can
    // never override the logged-in person. Legacy flat entries (no ownerEmail)
    // are treated as owner-unknown and superseded on first login.
    const STORAGE_KEY = 'ati_current_user';

    const readSavedSelection = () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && 'user' in parsed) return parsed;
            return { ownerEmail: null, user: parsed };  // legacy flat shape
        } catch (err) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    };

    // Apply a notating-as selection. `notify` shows the toast — used for explicit
    // action from the switcher UI; the auto-default at login applies silently.
    const applyUser = (userData, { notify = false } = {}) => {
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
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ ownerEmail: authUser?.email ?? null, user: userInfo })
            );

            if (notify && toast) {
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
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    // Public setter used by the "notating as" switcher UI — always notifies.
    const setUser = (userData) => applyUser(userData, { notify: true });

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

    // Load the individuals roster once on mount (used by the switcher and by the
    // "does the selected person still exist" reconciliation).
    useEffect(() => {
        loadAllIndividuals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Resolve the "notating as" attribution. Re-runs whenever the logged-in
    // identity changes (login, logout, /me rehydrate on refresh, account switch)
    // so attribution always follows the person actually logged in — never a
    // stale prior selection.
    useEffect(() => {
        setLoading(true);
        const saved = readSavedSelection();

        // Enforced + logged in: identity drives the default. Honor a manual
        // override only when THIS account is the one that made it.
        if (authUser) {
            if (saved && saved.ownerEmail === authUser.email) {
                setCurrentUser(saved.user);
            } else if (authUser.person) {
                applyUser(authUser.person);   // silent auto-default to the logged-in person
            } else {
                applyUser(null);              // logged in but no linked Person → no attribution
            }
            setLoading(false);
            return;
        }

        // No identity (dev login-bypass, or /me not yet resolved): legacy
        // behavior — restore a saved selection, else honor ?employee_id=.
        if (saved) {
            setCurrentUser(saved.user);
            setLoading(false);
            return;
        }
        const employeeId = getEmployeeIdFromQuery();
        if (employeeId) {
            fetchUserByEmployeeId(employeeId)
                .then((person) => applyUser(person.data.person))
                .catch(() => setError('Failed to fetch user data'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser?.email]);

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

            // Admin functionality (server-driven via AuthContext)
            isUserAdmin,

            // Individuals management
            individuals,
            loadAllIndividuals,
            refreshAllIndividuals
        }}>
            {children}
        </UserContext.Provider>
    );
};