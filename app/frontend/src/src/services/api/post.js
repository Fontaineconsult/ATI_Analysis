import axios from "axios";

export const addNewNote = async (year_success_evidence, note_dict, created_by) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/notes`, {
            year_success_evidence,
            note_dict,
            created_by,
        });
        return response.data;
    } catch (error) {
        console.error('Error adding new note:', error);
        throw error;
    }
}

export const addNewMessage = async (year_success_evidence, message_dict, created_by) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/messages`, {
            year_success_evidence,
            message_dict,
            created_by,
        });
        return response.data;
    } catch (error) {
        console.error('Error adding new message:', error);
        throw error;
    }
}