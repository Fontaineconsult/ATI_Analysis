import axios from "axios";

export const updateStatusLevel = async (yse, statusLevel) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/status-levels`, {
            yse,
            status_level: statusLevel
        });
    } catch (error) {
        console.error('Error updating status level:', error);
        throw error;
    }
};