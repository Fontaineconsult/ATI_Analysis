import axios from 'axios';

// Function to fetch primary data from API
export const fetchPrimaryData = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:5000/data-api/v1/working-group/web/2022-2023');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch data');
    }
};
