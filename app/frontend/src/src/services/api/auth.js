import axios from 'axios';

// Auth endpoints live on their own blueprint (/ati/auth/v1), separate from the
// data API. In dev the relative path goes through the CRA proxy (same-origin,
// so SameSite=Lax cookies just work); production sets the absolute URL.
const AUTH_BASE = process.env.REACT_APP_AUTH_API_URL || '/ati/auth/v1';

// POST /login — resolves to the user payload; throws with error 'invalid_credentials' on 401.
export const login = async (username, password) => {
    const response = await axios.post(`${AUTH_BASE}/login`, { username, password });
    return response.data.data.user;
};

// POST /logout — idempotent.
export const logout = async () => {
    await axios.post(`${AUTH_BASE}/logout`);
};

// GET /me — returns { enforced, user } where user is null when anonymous.
// A 401 here just means "not logged in (and enforcement is on)" — normalize it
// rather than treating it as an error.
export const fetchMe = async () => {
    try {
        const response = await axios.get(`${AUTH_BASE}/me`);
        return response.data.data;
    } catch (error) {
        if (error?.response?.status === 401) {
            return { enforced: true, user: null };
        }
        throw error;
    }
};
