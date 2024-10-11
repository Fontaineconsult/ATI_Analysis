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


export const assignApprover = async (employeeId, yearSuccessEvidence) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assign-approver`, {
            employee_id: employeeId,
            year_success_evidence: yearSuccessEvidence,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning approver:', error);
        throw error;
    }
};
