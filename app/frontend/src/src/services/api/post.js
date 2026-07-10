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

// Upload a file's bytes to the content-addressed store (POST /files, multipart).
// Returns { key, size, content_type, filename }. The caller then includes `key`
// (as storage_key) on the document/message/metric it registers.
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/files`, formData);
        return response.data?.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}


// Unlink (detach) a supporting document / webpage / note / message from an
// implementation. The node itself is NOT deleted — it may be linked elsewhere.
// documentation_type: 'document' | 'webpage' | 'note' | 'message'.
export const unlinkDocumentationFromImplementation = async (implementation_id, implementation_type, documentation_type, unique_id) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/documents`,
            {
                action: 'unlink_documentation',
                documentation_type,
                implementation_id,
                implementation_type,
                unique_id,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error unlinking documentation:', error);
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

export const createSuccessIndicator = async (indicator_number, goal_number, sub_committee, success_indicator_text, date_added, removed, examples_of_evidence = [], established_example = null, managed_example = null, optimizing_example = null) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/indicators`,
            createSuccessIndicatorPayload(indicator_number, goal_number, sub_committee, success_indicator_text, date_added, removed, examples_of_evidence, established_example, managed_example, optimizing_example));
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

// DOCUMENT / WEBPAGE — standalone create (no implementation link). Backend
// add_document / add_webpage already accept null implementation_id +
// implementation_type and skip the link step.
export const createStandaloneDocument = async (documentData, createdBy) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`, {
            action: 'add_document',
            document_dict: documentData,
            created_by: createdBy || null,
            implementation_id: null,
            implementation_type: null,
            academic_year: null,
            include_in_year: true,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating document:', error);
        throw error;
    }
};

export const createStandaloneWebpage = async (webpageData, createdBy) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/documents`, {
            action: 'add_webpage',
            webpage_dict: webpageData,
            created_by: createdBy || null,
            implementation_id: null,
            implementation_type: null,
            academic_year: null,
            include_in_year: true,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating webpage:', error);
        throw error;
    }
};

// GOVERNANCE CREATE
export const createGovernance = async (governanceType, fields) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/governance`,
            { type: governanceType, ...fields },
        );
        return response.data;
    } catch (error) {
        console.error('Error creating governance item:', error);
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

export const addPrioritizedIndicator = async (workingGroupPlanIdentifier, indicatorCompositeKey) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'add_prioritized_indicator',
                working_group_plan_identifier: workingGroupPlanIdentifier,
                indicator_composite_key: indicatorCompositeKey,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error adding prioritized indicator:', error);
        throw error;
    }
}

export const removePrioritizedIndicator = async (workingGroupPlanIdentifier, indicatorCompositeKey) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'remove_prioritized_indicator',
                working_group_plan_identifier: workingGroupPlanIdentifier,
                indicator_composite_key: indicatorCompositeKey,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error removing prioritized indicator:', error);
        throw error;
    }
}

export const updateCampusPlanSummary = async (planIdentifier, executiveSummary) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'update_campus_plan_summary',
                plan_identifier: planIdentifier,
                executive_summary: executiveSummary,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating campus plan summary:', error);
        throw error;
    }
}

export const assignExecutiveSponsor = async (planIdentifier, personUniqueId) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'assign_executive_sponsor',
                plan_identifier: planIdentifier,
                person_unique_id: personUniqueId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error assigning executive sponsor:', error);
        throw error;
    }
};

export const unassignExecutiveSponsor = async (planIdentifier, personUniqueId) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'unassign_executive_sponsor',
                plan_identifier: planIdentifier,
                person_unique_id: personUniqueId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error unassigning executive sponsor:', error);
        throw error;
    }
};

export const assignGroupLead = async (workingGroupPlanIdentifier, personUniqueId) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'assign_group_lead',
                working_group_plan_identifier: workingGroupPlanIdentifier,
                person_unique_id: personUniqueId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error assigning group lead:', error);
        throw error;
    }
};

export const unassignGroupLead = async (workingGroupPlanIdentifier, personUniqueId) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'unassign_group_lead',
                working_group_plan_identifier: workingGroupPlanIdentifier,
                person_unique_id: personUniqueId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error unassigning group lead:', error);
        throw error;
    }
};

export const addProgressUpdate = async (workingGroupPlanIdentifier, yseIdentifier, { note, trajectory, authorUniqueId } = {}) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/campus-plans`,
            {
                action: 'add_progress_update',
                working_group_plan_identifier: workingGroupPlanIdentifier,
                yse_identifier: yseIdentifier,
                note,
                trajectory,
                author_unique_id: authorUniqueId,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error adding progress update:', error);
        throw error;
    }
}

//
// ASSETS / TAAPs — create (plain POST, no `action` field)
//

export const createAsset = async (payload) => {
    // payload: { title, scope, locus, asset_class?, version?, description? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/assets`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating asset:', error);
        throw error;
    }
};

export const createTaap = async (payload) => {
    // payload: { title, asset_identifier, outcome?, description?, effective_date?, review_due?, active? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/taaps`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating TAAP:', error);
        throw error;
    }
};

export const createVendor = async (payload) => {
    // payload: { name, location? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/vendors`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating vendor:', error);
        throw error;
    }
};

export const createInterface = async (payload) => {
    // payload: { title, locus, function, presented_by?, coverage_domains?[], audience?[], provenance?, description? }
    // title/locus/function (+ backing from presented_by) are the identity coordinates.
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/interfaces`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating interface:', error);
        throw error;
    }
};

export const createTool = async (payload) => {
    // payload: { title, description?, supplied_by? (vendor name), parent_asset? (asset_identifier) }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/tools`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating tool:', error);
        throw error;
    }
};

export const createComponent = async (payload) => {
    // payload: { title, interface_identifier? (parent), component_kind?, description? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/components`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating component:', error);
        throw error;
    }
};

// ONTOLOGY DESCRIPTIONS — create a UniversalDescriptor. The handle is auto-built by the
// backend from descriptor_kind + the target_* coordinates.
export const createDescriptor = async (payload) => {
    // payload: { descriptor_kind, target_label?, target_field?, target_value?,
    //            title?, description_short?, description_full?, include_in_report? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/descriptions`, payload);
        return response.data;
    } catch (error) {
        console.error('Error creating descriptor:', error);
        throw error;
    }
};

//
// META-SCAFFOLD — create Principles / IntellectualSources. Relationship edges (grounding,
// shapes) are attached afterward from the detail panel, not in the create payload.
//

export const createPrinciple = async (fields) => {
    // fields: { handle (required), name (required), description_short?, description_full? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/principles`, fields);
        return response.data;
    } catch (error) {
        console.error('Error creating principle:', error);
        throw error;
    }
};

export const createIntellectualSource = async (fields) => {
    // fields: { name (required), description_short?, description_full? }
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/intellectual-sources`, fields);
        return response.data;
    } catch (error) {
        console.error('Error creating intellectual source:', error);
        throw error;
    }
};

//
// ASANA SYNC — two-way reconciliation for the plans page. Pushes the campus's
// plans for the year into the year's Asana project (create or update name/notes)
// and pulls each task's subtasks back into the graph. Slow-ish (one round-trip
// per plan); callers should show a loading state. Summary at response.data.data.
//

export const refreshAsanaPlans = async (campusAbbrev, yearName) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/asana/refresh-plans`, {
            campus_abbrev: campusAbbrev,
            year_name: yearName,
        });
        return response.data;
    } catch (error) {
        console.error('Error refreshing plans to Asana:', error);
        throw error;
    }
};

// --- Queries (pending questions) ---
// payload: { question, working_group_plan_identifier? | (campus_abbrev, year_name,
// working_group), category?, detail?, raised_by_unique_id? }
export const createQuery = async (payload) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/queries`, {
            action: 'create_query',
            ...payload,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating query:', error);
        throw error;
    }
};

// --- Meeting minutes ---
// payload: { title, content?, working_group_plan_identifier? | (campus_abbrev, year_name,
// working_group), meeting_date?, recorded_by_unique_id? }
export const createMeetingMinutes = async (payload) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/meeting-minutes`, {
            action: 'create_meeting_minutes',
            ...payload,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating meeting minutes:', error);
        throw error;
    }
};