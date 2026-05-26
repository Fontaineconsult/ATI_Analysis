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
    unassignResponsiblePersonPayload,
    assignResponsiblePersonPayload,
    updateDocumentPayload,
    updateWebsitePayload,
    updateMetricPayload,
    updateMessageForImplementationPayload,
    updateAccomplishmentPayload,
    updateNoteForImplementationPayload,
    addProgressNoteToPlanPayload
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


export const removeStatusLevelSubNode = async (statusLevelId, category, subNodeId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            action: 'remove_sub_node',
            status_level_unique_id: statusLevelId,
            category,
            sub_node_unique_id: subNodeId
        });
        return response.data;
    } catch (error) {
        console.error('Error removing sub-node:', error);
        throw error;
    }
};

export const updateStatusLevelNode = async (formData) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/evidence/status-levels`, {
            action: 'update_status_level_node',
            ...formData
        });
        return response.data;
    } catch (error) {
        console.error('Error updating status level node:', error);
        throw error;
    }
};


// GOVERNANCE UPDATE
export const updateGovernance = async (governanceType, uniqueId, fields) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/governance`,
            { type: governanceType, unique_id: uniqueId, ...fields },
        );
        return response.data;
    } catch (error) {
        console.error('Error updating governance item:', error);
        throw error;
    }
};

// GOVERNANCE — attach / detach Document and Webpage via supporting_documents / supporting_websites
const _governanceAttachDetach = async (action, governanceType, governanceUniqueId, targetKey, targetUniqueId) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/governance`,
            {
                action,
                type: governanceType,
                governance_unique_id: governanceUniqueId,
                [targetKey]: targetUniqueId,
            },
        );
        return response.data;
    } catch (error) {
        console.error(`Error on ${action}:`, error);
        throw error;
    }
};

export const attachDocumentToGovernance = (governanceType, governanceUniqueId, documentUniqueId) =>
    _governanceAttachDetach('attach_document', governanceType, governanceUniqueId, 'document_unique_id', documentUniqueId);

export const detachDocumentFromGovernance = (governanceType, governanceUniqueId, documentUniqueId) =>
    _governanceAttachDetach('detach_document', governanceType, governanceUniqueId, 'document_unique_id', documentUniqueId);

export const attachWebpageToGovernance = (governanceType, governanceUniqueId, webpageUniqueId) =>
    _governanceAttachDetach('attach_webpage', governanceType, governanceUniqueId, 'webpage_unique_id', webpageUniqueId);

export const detachWebpageFromGovernance = (governanceType, governanceUniqueId, webpageUniqueId) =>
    _governanceAttachDetach('detach_webpage', governanceType, governanceUniqueId, 'webpage_unique_id', webpageUniqueId);

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

export const updateNoteForImplementation = async (implementation_id,
                                                     implementation_type,
                                                     message_dict,
                                                     created_by,
                                                     academic_year,
                                                     include_in_year) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/documents/messages`,
            updateNoteForImplementationPayload(implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year));
        return response.data;
    } catch (error) {
        console.error('Error updating message:', error);
        throw error;
    }
}



export const updateMessageForImplementation = async (implementation_id,
                                                     implementation_type,
                                                     message_dict,
                                                     created_by,
                                                     academic_year,
                                                     include_in_year) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/documents/messages`,
            updateMessageForImplementationPayload(implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year));
        return response.data;
    } catch (error) {
        console.error('Error updating message:', error);
        throw error;
    }
}



export const updateDocument = async (implementation_id, implementation_type, document_dict, maintained_by, academic_year, include_in_year) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/documents/documents`,
            updateDocumentPayload(implementation_id, implementation_type, document_dict, maintained_by, academic_year, include_in_year)
        );
        return response.data;
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
}

export const updateWebpage = async (implementation_id, implementation_type, webpage_dict, maintained_by, academic_year, include_in_year) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/documents/webpages`,
            updateWebsitePayload(implementation_id, implementation_type, webpage_dict, maintained_by, academic_year, include_in_year)
        );
        return response.data;
    } catch (error) {
        console.error('Error updating webpage:', error);
        throw error;
    }
}

export const updateMetric = async (year_success_evidence, metric_dict, created_by) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/documents/metrics`, updateMetricPayload(year_success_evidence, metric_dict, created_by));
        return response.data;
    } catch (error) {
        console.error('Error updating metric:', error);
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

export const updateAccomplishment = async (formData) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/implementations/accomplishments`,
            updateAccomplishmentPayload(formData)
        );
        return response.data;
    } catch (error) {
        console.error('Error updating accomplishment:', error);
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

export const updateImplementation = async (implementation_type, unique_id, title, description) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: "update_implementation",
            implementation_type,
            unique_id,
            title,
            description
        });
        return response.data;
    } catch (error) {
        console.error('Error updating implementation:', error);
        throw error;
    }
}


export const assignImplementationToYSE = async (yearIdentifier, implementationType, implementationTitle) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: "assign_implementation_to_yse",
            year_success_identifier: yearIdentifier,
            implementation_type: implementationType,
            implementation_title: implementationTitle
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning implementation to YSE:', error);
        throw error;
    }
}

export const addProgressNoteToPlan = async (planId, noteName, noteContent, createdById = null) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_API_URL}/implementations/plans`,
            addProgressNoteToPlanPayload(planId, noteName, noteContent, createdById)
        );
        return response.data;
    } catch (error) {
        console.error('Error adding progress note to plan:', error);
        throw error;
    }
}