import axios from 'axios';

// Function to fetch primary data from API
export const fetchPrimaryData = async (wg, ay) => {
    const apiUrl = process.env.REACT_APP_API_URL;  // Pull API URL from environment

    try {
        const response = await axios.get(`${apiUrl}/evidence/${wg}/${ay}`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch data: ${response.data.error}`);
        }
    } catch (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
};


export const fetchStatusLevels = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/evidence/status-levels`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch status levels: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching status levels:', error.message);
        throw error;
    }
};



export const fetchUserByEmployeeId = async (employeeId) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/individuals?employee_id=${employeeId}`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch user: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching user:', error.message);
        throw error;
    }
};


export const fetchCurrentYearIndicator = async (currentYear) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/indicators/${currentYear}`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch current year indicator: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching current year indicator:', error.message);
        throw error;
    }
};

export const fetchAllIndividuals = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/individuals`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch individuals: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching individuals:', error.message);
        throw error;
    }
}

export const fetchTrends = async (previous_year, current_year) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/evidence/trends?previous_year=${previous_year}&current_year=${current_year}`);

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch individuals: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching individuals:', error.message);
        throw error;
    }
}

export const fetchImplementation = async (implementation_type, title) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/implementations`, {
            params: {
                implementation_type,
                title
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching implementation:', error);
        throw error;
    }
}

export const fetchImplementationsByType = async (implementation_type) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/implementations`, {
            params: { implementation_type }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching implementations by type:', error);
        throw error;
    }
}