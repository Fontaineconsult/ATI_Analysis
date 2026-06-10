import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout } from '../services/api/auth';
import { registerUnauthorizedHandler } from '../setupAxios';

// Identity state for the whole app. Sits ABOVE every data-fetching provider
// (see index.js) so nothing fires API calls until AuthGate lets it mount.
//
// `enforced` mirrors the server's AUTH_ENFORCED kill-switch: when false (dev),
// the AuthGate is transparent and no login screen ever appears.
export const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [enforced, setEnforced] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const initialize = async () => {
            try {
                const me = await fetchMe();
                if (!cancelled) {
                    setEnforced(me.enforced);
                    setAuthUser(me.user);
                }
            } catch (error) {
                // Server unreachable — fail closed (login screen) rather than
                // rendering an app whose every request will error anyway.
                console.error('Auth initialization failed:', error);
            } finally {
                if (!cancelled) setAuthLoading(false);
            }
        };
        initialize();
        // Session died mid-use (expiry, server restart with new key, etc.):
        // drop auth state so the gate shows the login screen again.
        registerUnauthorizedHandler(() => setAuthUser(null));
        return () => {
            cancelled = true;
            registerUnauthorizedHandler(null);
        };
    }, []);

    const login = useCallback(async (username, password) => {
        const user = await apiLogin(username, password);
        setAuthUser(user);
        return user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } finally {
            setAuthUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ authUser, enforced, authLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
