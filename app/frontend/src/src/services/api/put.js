import axios from "axios";
import {
    assignApproverPayload,
    updateIndicatorRemovedStatus,
    generateUpdateStatusLevelPayload,
    updateIndividualPayload,
    updatePlanPayload,
    updateNotePayload,
    updateMessagePayload,
    assignResponsiblePerson,
    unassignResponsiblePersonPayload, assignResponsiblePersonPayload
} from "../response_templates";

export const updateStatusLevel = async (yse, statusLevel) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/evidence/status-levels`,
            generateUpdateStatusLevelPayload(yse, statusLevel)

        );
    } catch (error) {
        console.error('Error updating status level:', error);
        throw error;
    }
};


export const assignApprover = async (employeeId, yearSuccessEvidence) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/evidence`,
            assignApproverPayload(employeeId, yearSuccessEvidence)
        );
        return response.data;
    } catch (error) {
        console.error('Error assigning approver:', error);
        throw error;
    }
};


export const updateNote = async (year_success_evidence, note_dict, created_by) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/documents/notes`, updateNotePayload(year_success_evidence, note_dict, created_by));
        return response.data;
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
}

export const updateMessage = async (year_success_evidence, message_dict, created_by) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/documents/messages`, updateMessagePayload(year_success_evidence, message_dict, created_by));
        return response.data;
    } catch (error) {
        console.error('Error updating message:', error);
        throw error;
    }
}

export const updateRemovedStatus = async (composite_key, removed) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/indicators`,
            updateIndicatorRemovedStatus(composite_key, removed)
        );
    } catch (error) {
        console.error('Error updating removed status:', error);
        throw error;
    }
}

export class attachYearSuccessEvidence {
}

export class detachYearSuccessEvidence {
}


export const updateIndividual = async (individual) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/individuals`, updateIndividualPayload(individual));
    } catch (error) {
        console.error('Error updating individual:', error);
        throw error;
    }
}

export const updatePlan = async (formData) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/implementations/plans`, updatePlanPayload(formData));
    } catch (error) {
        console.error('Error updating plan:', error);
        throw error;
    }
}

export const assignPersonAsImplementor = async (employeeId, year_success_indicator) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, assignResponsiblePersonPayload(employeeId, year_success_indicator))

    } catch (error) {
        console.error('Error assigning person as implementor:', error);
        throw error;
    }
}

export const unassignPersonAsImplementor = async (employeeId, year_success_indicator) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, unassignResponsiblePersonPayload(employeeId, year_success_indicator));
    } catch (error) {
        console.error('Error unassigning person as implementor:', error);
        throw error;
    }
}