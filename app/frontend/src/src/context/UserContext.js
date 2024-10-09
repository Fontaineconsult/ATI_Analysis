import React, { createContext, useState } from 'react';

// Create the UserContext
export const UserContext = createContext();

// Create the UserProvider that will wrap the app
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Initialize user state

    const login = () => setUser({ name: 'John Doe', loggedIn: true });
    const logout = () => setUser(null);

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};