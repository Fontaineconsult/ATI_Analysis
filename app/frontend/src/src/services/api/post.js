import axios from "axios";
import {createMessagePayload, createNotePayload} from "../response_templates";


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
    console.log("SDFDSFSDFDEWEEQQQQQ", messageContent)
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