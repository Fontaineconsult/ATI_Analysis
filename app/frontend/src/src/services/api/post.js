import axios from "axios";
import {
    create_year_success_evidence_node, createAccomplishmentPayload,
    createDocumentPayload,
    createDocumentPayloadForImplementation, createImplementationNotePayload,
    createIndividualPayload,
    createMessagePayload, createMessagePayloadForImplementation, createMetricPayloadForImplementation,
    createNotePayload, createPlanPayload,
    createSuccessIndicatorPayload, createWebpagePayloadForImplementation
} from "../response_templates";

// Create Functions for Direct YSE annotations
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

export const addImplementationNote = async (implementation_id, implementation_type, note_dict, created_by, academic_year, include_in_year) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createImplementationNotePayload(implementation_id, implementation_type, note_dict, created_by, academic_year, include_in_year));
        return response.data;
    } catch (error) {
        console.error('Error adding new note:', error);
        throw error;
    }
}



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


// Create Functions for Implementation Evidence
export const addDocumentToImplementation = async (implementation_id, implementation_type, document_dict, created_by, academic_year, include_in_year) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/documents`,
            createDocumentPayloadForImplementation(
                implementation_id,
                implementation_type,
                document_dict,
                created_by,
                academic_year,
                include_in_year
            )
        );
        return response.data;
    } catch (error) {
        console.error('Error adding new document:', error);
        throw error;
    }
}


export const addWebpageToImplementation = async (implementation_id, implementation_type, webpage_dict, created_by, academic_year, include_in_year) => {

    try {

        // Send the POST request with the payload
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createWebpagePayloadForImplementation(
                implementation_id,
                implementation_type,
                webpage_dict,
                created_by,
                academic_year,
                include_in_year));

        return response.data;
    } catch (error) {
        console.error('Error adding new message:', error);
        throw error;
    }


}

export const addNoteToImplementation = async (implementation_id, implementation_type, webpage_dict, created_by) => {

    try {

        // Send the POST request with the payload
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createWebpagePayloadForImplementation(implementation_id, implementation_type, webpage_dict, created_by));

        return response.data;
    } catch (error) {
        console.error('Error adding new message:', error);
        throw error;
    }




}



export const addMessageToImplementation = async (implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year) => {

    try {

        // Send the POST request with the payload
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createMessagePayloadForImplementation(implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year));

        return response.data;
    } catch (error) {
        console.error('Error adding new message:', error);
        throw error;
    }
}




export const addMetricToImplementation = async (implementation_id, implementation_type, metric_dict, created_by) => {
    try {

        // Send the POST request with the payload
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`,
            createMetricPayloadForImplementation(implementation_id, implementation_type, metric_dict, created_by));

        return response.data;
    } catch (error) {
        console.error('Error adding new message:', error);
        throw error;
    }
}



export const connectStatusLevelSubNode = async (statusLevelId, category, subNodeId) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            action: 'connect_sub_node',
            status_level_unique_id: statusLevelId,
            category,
            sub_node_unique_id: subNodeId
        });
        return response.data;
    } catch (error) {
        console.error('Error connecting sub-node:', error);
        throw error;
    }
}

export const addStatusLevelSubNode = async (statusLevelId, category, text) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            action: 'add_sub_node',
            status_level_unique_id: statusLevelId,
            category,
            text
        });
        return response.data;
    } catch (error) {
        console.error('Error adding sub-node:', error);
        throw error;
    }
}

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

export const createYearSuccessEvidence = async (academic_year, composite_key, campus_abbreviation) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/evidence`,
            create_year_success_evidence_node(academic_year, composite_key, campus_abbreviation)
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
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/implementations/plans`, createPlanPayload(formData));
        return response.data;
    } catch (error) {
        console.error('Error creating plan:', error);
        throw error;
    }
}


export const createImplementation = async (implementation_type, title, description, year_success_identifier = null) => {
    try {
        const payload = {
            action: "add_implementation",
            implementation_type,
            title,
            description
        };

        if (year_success_identifier) {
            payload.year_success_identifier = year_success_identifier;
        }

        const response = await axios.post(`${process.env.REACT_APP_API_URL}/implementations`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating implementation:', error);
        throw error;
    }
}



// STATUS LEVEL CREATE FUNCTIONS
export const createStatusLevel = async (formData) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            action: 'create_status_level',
            ...formData
        });
        return response.data;
    } catch (error) {
        console.error('Error creating status level:', error);
        throw error;
    }
}

// ACCOMPLISHMENT CREATE FUNCTIONS
export const createAccomplishment = async (formData) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/implementations/accomplishments`,
            createAccomplishmentPayload(formData)
        );
        return response.data;
    } catch (error) {
        console.error('Error creating accomplishment:', error);
        throw error;
    }
}

// CAMPUS PLAN CREATE FUNCTIONS
export const createCampusPlan = async (campusAbbrev, yearName) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'create_campus_plan',
                campus_abbrev: campusAbbrev,
                year_name: yearName,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating campus plan:', error);
        throw error;
    }
}