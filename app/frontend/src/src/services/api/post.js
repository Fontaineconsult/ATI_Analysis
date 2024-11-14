import axios from "axios";
import {
    create_year_success_evidence_node, createIndividualPayload,
    createMessagePayload,
    createNotePayload,
    createSuccessIndicatorPayload
} from "../response_templates";


export const addNewNote = async (year_success_evidence, note_dict, created_by) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createNotePayload(year_success_evidence, note_dict, created_by));
        return response.data;
    } catch (error) {
        console.error('Error adding new note:', error);
        throw error;
    }
}

// Function to add a new message using the wrapped payload
export const addNewMessage = async (yearSuccessEvidence, messageContent, created_by) => {

    try {

        // Send the POST request with the payload
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createMessagePayload(yearSuccessEvidence, messageContent, created_by));

        return response.data;
    } catch (error) {
        console.error('Error adding new message:', error);
        throw error;
    }
};

export const createSuccessIndicator = async (indicator_number, goal_number, sub_committee, success_indicator_text, date_added, removed) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/indicators`,
            createSuccessIndicatorPayload(indicator_number, goal_number, sub_committee, success_indicator_text, date_added, removed));
        return response.data;
    } catch (error) {
        console.error('Error creating success indicator:', error);
        throw error;
    }
}

export const createYearSuccessEvidence = async (academic_year, composite_key) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/evidence`,
            create_year_success_evidence_node(academic_year, composite_key)
        );
        return response.data;
    } catch (error) {
        console.error('Error creating year success evidence:', error);
        throw error;
    }
}


export const createIndividual = async (formData) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/individuals`, createIndividualPayload(formData));
        return response.data;
    } catch (error) {
        console.error('Error creating individual:', error);
        throw error;
    }
}

export const createPlan = async (formData) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/implementations/plans`, formData);
        return response.data;
    } catch (error) {
        console.error('Error creating plan:', error);
        throw error;
    }
}