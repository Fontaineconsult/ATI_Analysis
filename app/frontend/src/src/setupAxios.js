// Global axios configuration — imported FIRST in index.js so every service
// module (services/api/*.js all use the default axios instance) inherits it.
//
// 1. withCredentials: the session cookie rides along on every API call.
// 2. 401 interceptor: any API response of 401 means the session is gone
//    (expired, logged out elsewhere, enforcement flipped on) — notify the
//    AuthProvider so the AuthGate drops back to the login screen.
import axios from 'axios';

axios.defaults.withCredentials = true;

let unauthorizedHandler = null;

// AuthProvider registers its state-reset here; keeps this module free of any
// React/router coupling.
export const registerUnauthorizedHandler = (fn) => {
    unauthorizedHandler = fn;
};

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        // /me and /login legitimately return 401 for "anonymous"/"bad creds" —
        // those are handled locally by the auth service, not as a session drop.
        if (status === 401 && !url.includes('/auth/v1/') && unauthorizedHandler) {
            unauthorizedHandler();
        }
        return Promise.reject(error);
    }
);
