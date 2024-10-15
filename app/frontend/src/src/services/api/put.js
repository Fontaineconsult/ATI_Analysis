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


export const updateNote = async (year_success_evidence, note_dict, created_by) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/notes`, {
            year_success_evidence,
            note_dict,
            created_by,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
}
