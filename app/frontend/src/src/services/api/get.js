import axios from 'axios';

// Function to fetch primary data from API
export const fetchPrimaryData = async (wg, ay, campus) => {
    const apiUrl = process.env.REACT_APP_API_URL;  // Pull API URL from environment

    try {
        const params = campus ? { campus } : {};
        const response = await axios.get(`${apiUrl}/evidence/${wg}/${ay}`, { params });

        if (response.status === 200) {
            return response.data;  // Return the entire response data
        } else {
            throw new Error(`Failed to fetch data: ${response.data.error}`);
        }
    } catch (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
    }
};


export const fetchYsesByCampusForYear = async (academicYear) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/evidence/yses-by-campus/${academicYear}`
        );
        if (response.status === 200) {
            return response.data;
        }
        throw new Error(`Failed to fetch YSEs by campus: ${response.data?.error}`);
    } catch (error) {
        console.error('Error fetching YSEs by campus:', error.message);
        throw error;
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

export const fetchTrends = async (previous_year, current_year, campus) => {
    try {
        let url = `${process.env.REACT_APP_API_URL}/evidence/trends?previous_year=${previous_year}&current_year=${current_year}`;
        if (campus) url += `&campus=${campus}`;
        const response = await axios.get(url);

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

export const fetchAllImplementations = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/implementations`, {
            params: { all: 'true' }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching all implementations:', error);
        throw error;
    }
}

export const fetchSubNodes = async (category) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            params: { category }
        });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch sub-nodes: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching sub-nodes:', error.message);
        throw error;
    }
}

export const fetchCampuses = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/organizational-units`, {
            params: { type: 'campuses' }
        });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch campuses: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching campuses:', error.message);
        throw error;
    }
}

export const fetchCampusPlan = async (campusAbbrev, academicYear) => {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/campus-plans/${campusAbbrev}/${academicYear}`
        );
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch campus plan: ${response.data.error}`);
        }
    } catch (error) {
        console.error('Error fetching campus plan:', error.message);
        throw error;
    }
}
