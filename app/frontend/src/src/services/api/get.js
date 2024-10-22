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




// Fetch user data by employee_id
export const fetchUserByEmployeeId = async (employeeId) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/persons?employee_id=${employeeId}`);
        return response.data.person;  // Assuming the response contains the "person" object
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

// Fetch current year indicator data
export const fetchCurrentYearIndicator = async (currentYear) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/indicators?academic_year=${currentYear}`);
        return response.data;  // Expected response is a list of three objects
    } catch (error) {
        console.error('Error fetching current year indicator:', error);
        throw error;
    }
};