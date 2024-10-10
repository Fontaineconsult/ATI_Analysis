import axios from 'axios';

// Function to fetch primary data from API
export const fetchPrimaryData = async (wg, ay) => {
    const apiUrl = process.env.REACT_APP_API_URL;  // Pull API URL from environment

    try {
        const response = await axios.get(`${apiUrl}working-group/${wg}/${ay}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch data');
    }
};
