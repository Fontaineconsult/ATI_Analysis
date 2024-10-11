import axios from 'axios';

// Function to fetch primary data from API
export const fetchPrimaryData = async (wg, ay) => {
    const apiUrl = process.env.REACT_APP_API_URL;  // Pull API URL from environment

    try {
        const response = await axios.get(`${apiUrl}/working-group/${wg}/${ay}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch data');
    }
};


export const fetchStatusLevels = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/status-levels`);
        return response.data.status_levels;
    } catch (error) {
        console.error('Error fetching status levels:', error);
        throw error;
    }
};