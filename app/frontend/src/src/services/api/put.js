import axios from "axios";
import {
    assignApproverPayload,
    updateIndicatorRemovedStatus,
    updateIndicatorOverrideImplementationRequirement,
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

export const updateOverrideImplementationRequirement = async (composite_key, override) => {
    try {
        await axios.put(`${process.env.REACT_APP_API_URL}/indicators`,
            updateIndicatorOverrideImplementationRequirement(composite_key, override)
        );
    } catch (error) {
        console.error('Error updating implementation-requirement override:', error);
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

// Owners of an Implementation (Process/Project/Procedure/Service/Guidance/Tracking/InternalPolicy)
export const assignPersonAsOwner = async (implementationType, implementationUniqueId, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: 'assign_person_as_owner',
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning person as owner:', error);
        throw error;
    }
};

export const unassignPersonAsOwner = async (implementationType, implementationUniqueId, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: 'unassign_person_as_owner',
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning person as owner:', error);
        throw error;
    }
};

// Accountable working group (committee) on a doing-implementation — distinct from owned_by
// (the Person). workingGroup is a full name ('Web') or abbrev ('web'/'pro'/'ins').
export const assignAccountableWorkingGroup = async (implementationType, implementationUniqueId, workingGroup) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: 'assign_accountable_working_group',
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
            working_group: workingGroup,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning accountable working group:', error);
        throw error;
    }
};

export const unassignAccountableWorkingGroup = async (implementationType, implementationUniqueId, workingGroup) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: 'unassign_accountable_working_group',
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
            working_group: workingGroup,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning accountable working group:', error);
        throw error;
    }
};

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

//
// ASSETS / TAAPs — update + edge assign/unassign (action-dispatch PUT).
// Both assign and unassign live on PUT; DELETE is reserved for node removal.
//

export const updateAsset = async (assetIdentifier, fields) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'update',
            asset_identifier: assetIdentifier,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating asset:', error);
        throw error;
    }
};

export const assignStewardToAsset = async (assetIdentifier, capacity, holderType, holderUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'assign_steward',
            asset_identifier: assetIdentifier,
            capacity,
            holder_type: holderType,
            holder_unique_id: holderUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning steward to asset:', error);
        throw error;
    }
};

export const unassignStewardFromAsset = async (assetIdentifier, capacity, holderType, holderUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'unassign_steward',
            asset_identifier: assetIdentifier,
            capacity,
            holder_type: holderType,
            holder_unique_id: holderUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning steward from asset:', error);
        throw error;
    }
};

export const assignVendorToAsset = async (assetIdentifier, vendorName) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'assign_vendor',
            asset_identifier: assetIdentifier,
            vendor_name: vendorName,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning vendor to asset:', error);
        throw error;
    }
};

export const unassignVendorFromAsset = async (assetIdentifier, vendorName) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'unassign_vendor',
            asset_identifier: assetIdentifier,
            vendor_name: vendorName,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning vendor from asset:', error);
        throw error;
    }
};

export const assignCampusToAsset = async (assetIdentifier, campusAbbrev) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'assign_campus',
            asset_identifier: assetIdentifier,
            campus_abbrev: campusAbbrev,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning campus to asset:', error);
        throw error;
    }
};

export const unassignCampusFromAsset = async (assetIdentifier, campusAbbrev) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/assets`, {
            action: 'unassign_campus',
            asset_identifier: assetIdentifier,
            campus_abbrev: campusAbbrev,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning campus from asset:', error);
        throw error;
    }
};

export const updateTaap = async (title, fields) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'update',
            title,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating TAAP:', error);
        throw error;
    }
};

export const assignOwnerToTaap = async (title, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'assign_owner',
            title,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning owner to TAAP:', error);
        throw error;
    }
};

export const unassignOwnerFromTaap = async (title, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'unassign_owner',
            title,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning owner from TAAP:', error);
        throw error;
    }
};

export const assignSignerToTaap = async (title, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'assign_signer',
            title,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning signer to TAAP:', error);
        throw error;
    }
};

export const unassignSignerFromTaap = async (title, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'unassign_signer',
            title,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning signer from TAAP:', error);
        throw error;
    }
};

export const connectTaapToYse = async (title, yseIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'connect_yse',
            title,
            yse_identifier: yseIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error connecting TAAP to YSE:', error);
        throw error;
    }
};

export const disconnectTaapFromYse = async (title, yseIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/taaps`, {
            action: 'disconnect_yse',
            title,
            yse_identifier: yseIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error disconnecting TAAP from YSE:', error);
        throw error;
    }
};

//
// VENDORS — update + employee assign/unassign (action-dispatch PUT)
//

export const updateVendor = async (name, fields) => {
    // fields: { location?, new_name? }
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/vendors`, {
            action: 'update',
            name,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating vendor:', error);
        throw error;
    }
};

export const assignEmployeeToVendor = async (name, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/vendors`, {
            action: 'assign_employee',
            name,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning employee to vendor:', error);
        throw error;
    }
};

export const unassignEmployeeFromVendor = async (name, personUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/vendors`, {
            action: 'unassign_employee',
            name,
            person_unique_id: personUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning employee from vendor:', error);
        throw error;
    }
};

//
// INTERFACES — update + backing-asset assign/unassign (action-dispatch PUT).
// Both assign and unassign live on PUT; DELETE is reserved for node removal.
//

export const updateInterface = async (interfaceIdentifier, fields) => {
    // fields: { description?, coverage_domains?[], audience?[], provenance? }
    // The identity coordinates (title, locus, function, backing/presented_by) are immutable —
    // the backend rejects them here; change identity by delete + re-create.
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'update',
            interface_identifier: interfaceIdentifier,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating interface:', error);
        throw error;
    }
};

// Accountable working group (committee) on an interface — multi-valued, NOT identity.
export const assignWorkingGroupToInterface = async (interfaceIdentifier, workingGroup) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'assign_working_group',
            interface_identifier: interfaceIdentifier,
            working_group: workingGroup,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning working group to interface:', error);
        throw error;
    }
};

export const unassignWorkingGroupFromInterface = async (interfaceIdentifier, workingGroup) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'unassign_working_group',
            interface_identifier: interfaceIdentifier,
            working_group: workingGroup,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning working group from interface:', error);
        throw error;
    }
};

export const assignAssetToInterface = async (interfaceIdentifier, assetIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'assign_asset',
            interface_identifier: interfaceIdentifier,
            asset_identifier: assetIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning asset to interface:', error);
        throw error;
    }
};

export const unassignAssetFromInterface = async (interfaceIdentifier, assetIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'unassign_asset',
            interface_identifier: interfaceIdentifier,
            asset_identifier: assetIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning asset from interface:', error);
        throw error;
    }
};

// Remediation: connect/disconnect an Implementation (Process/Project/Procedure/Service)
// that remediates the interface, via the remediates_interface edge.
export const assignRemediationToInterface = async (interfaceIdentifier, implementationType, implementationUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'assign_remediation',
            interface_identifier: interfaceIdentifier,
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning remediation to interface:', error);
        throw error;
    }
};

export const unassignRemediationFromInterface = async (interfaceIdentifier, implementationType, implementationUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/interfaces`, {
            action: 'unassign_remediation',
            interface_identifier: interfaceIdentifier,
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning remediation from interface:', error);
        throw error;
    }
};

//
// TOOLS — update + supplier / parent-asset / usage (Implementation that uses it) edges
// (action-dispatch PUT). Both assign and unassign live on PUT.
//

export const updateTool = async (toolIdentifier, fields) => {
    // fields: { title?, description? }
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'update',
            tool_identifier: toolIdentifier,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating tool:', error);
        throw error;
    }
};

export const assignVendorToTool = async (toolIdentifier, vendorName) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'assign_vendor',
            tool_identifier: toolIdentifier,
            vendor_name: vendorName,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning vendor to tool:', error);
        throw error;
    }
};

export const unassignVendorFromTool = async (toolIdentifier, vendorName) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'unassign_vendor',
            tool_identifier: toolIdentifier,
            vendor_name: vendorName,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning vendor from tool:', error);
        throw error;
    }
};

export const assignAssetToTool = async (toolIdentifier, assetIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'assign_asset',
            tool_identifier: toolIdentifier,
            asset_identifier: assetIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning asset to tool:', error);
        throw error;
    }
};

export const unassignAssetFromTool = async (toolIdentifier, assetIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'unassign_asset',
            tool_identifier: toolIdentifier,
            asset_identifier: assetIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning asset from tool:', error);
        throw error;
    }
};

export const assignUsageToTool = async (toolIdentifier, implementationType, implementationUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'assign_usage',
            tool_identifier: toolIdentifier,
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning usage to tool:', error);
        throw error;
    }
};

export const unassignUsageFromTool = async (toolIdentifier, implementationType, implementationUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/tools`, {
            action: 'unassign_usage',
            tool_identifier: toolIdentifier,
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning usage from tool:', error);
        throw error;
    }
};

//
// COMPONENTS — update + WCAG-guideline / parent-interface edges (action-dispatch PUT).
//

export const updateComponent = async (componentIdentifier, fields) => {
    // fields: { description?, component_kind? }  (title + parent are immutable identity)
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/components`, {
            action: 'update',
            component_identifier: componentIdentifier,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating component:', error);
        throw error;
    }
};

export const assignGuidelineToComponent = async (componentIdentifier, guidelineUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/components`, {
            action: 'assign_guideline',
            component_identifier: componentIdentifier,
            guideline_unique_id: guidelineUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning guideline to component:', error);
        throw error;
    }
};

export const unassignGuidelineFromComponent = async (componentIdentifier, guidelineUniqueId) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/components`, {
            action: 'unassign_guideline',
            component_identifier: componentIdentifier,
            guideline_unique_id: guidelineUniqueId,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning guideline from component:', error);
        throw error;
    }
};

export const assignParentInterfaceToComponent = async (componentIdentifier, interfaceIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/components`, {
            action: 'assign_parent',
            component_identifier: componentIdentifier,
            interface_identifier: interfaceIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error assigning parent interface to component:', error);
        throw error;
    }
};

export const unassignParentInterfaceFromComponent = async (componentIdentifier, interfaceIdentifier) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/components`, {
            action: 'unassign_parent',
            component_identifier: componentIdentifier,
            interface_identifier: interfaceIdentifier,
        });
        return response.data;
    } catch (error) {
        console.error('Error unassigning parent interface from component:', error);
        throw error;
    }
};

//
// ONTOLOGY DESCRIPTIONS — update a descriptor's text (action-dispatch PUT). The handle,
// kind, and target_* coordinates are immutable identity; only the descriptions + flag change.
//

export const updateDescriptor = async (descriptorHandle, fields) => {
    // fields: { title?, description_short?, description_full?, include_in_report? }
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/descriptions`, {
            action: 'update',
            descriptor_handle: descriptorHandle,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating descriptor:', error);
        throw error;
    }
};

//
// META-SCAFFOLD — field updates + edge (grounding/shapes) attach/detach (action-dispatch PUT).
// handle / element_kind are immutable identity; only descriptive fields update.
//

export const updatePrinciple = async (handle, fields) => {
    // fields: { name?, description_short?, description_full? }
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/principles`, {
            action: 'update',
            handle,
            ...fields,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating principle:', error);
        throw error;
    }
};

// Shared helper for the principle edge mutations (mirrors _governanceAttachDetach).
const _principleAttachDetach = async (action, principleHandle, extra) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/principles`, {
            action,
            principle_handle: principleHandle,
            ...extra,
        });
        return response.data;
    } catch (error) {
        console.error(`Error on principle ${action}:`, error);
        throw error;
    }
};

// Grounding (derives_from) — Governance target.
export const attachGovernanceToPrinciple = (principleHandle, governanceType, governanceUniqueId) =>
    _principleAttachDetach('attach_grounding', principleHandle, {
        source_kind: 'governance', governance_type: governanceType, governance_unique_id: governanceUniqueId,
    });
export const detachGovernanceFromPrinciple = (principleHandle, governanceType, governanceUniqueId) =>
    _principleAttachDetach('detach_grounding', principleHandle, {
        source_kind: 'governance', governance_type: governanceType, governance_unique_id: governanceUniqueId,
    });

// Grounding (derives_from) — IntellectualSource target.
export const attachSourceToPrinciple = (principleHandle, sourceUniqueId) =>
    _principleAttachDetach('attach_grounding', principleHandle, {
        source_kind: 'intellectual_source', source_unique_id: sourceUniqueId,
    });
export const detachSourceFromPrinciple = (principleHandle, sourceUniqueId) =>
    _principleAttachDetach('detach_grounding', principleHandle, {
        source_kind: 'intellectual_source', source_unique_id: sourceUniqueId,
    });

// Shapes (across-link) — UniversalDescriptor target (the descriptor IS the ontology-element anchor).
export const attachShapeToPrinciple = (principleHandle, descriptorHandle) =>
    _principleAttachDetach('attach_shape', principleHandle, { descriptor_handle: descriptorHandle });
export const detachShapeFromPrinciple = (principleHandle, descriptorHandle) =>
    _principleAttachDetach('detach_shape', principleHandle, { descriptor_handle: descriptorHandle });

// Replace a doing-implementation's AMM-dimension classification (replace-semantics:
// dimensionHandles is the full intended set). Only Process/Project/Procedure/Service.
export const setImplementationDimensions = async (implementationType, implementationUniqueId, dimensionHandles) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: 'set_dimensions',
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
            dimension_handles: dimensionHandles,
        });
        return response.data;
    } catch (error) {
        console.error('Error setting implementation dimensions:', error);
        throw error;
    }
};

// Replace a person's role holdings (each with PD tracking). Keyed on employee_id.
// holdings: [{ role_handle, in_position_description, pd_description }]
export const setPersonRoleHoldings = async (employeeId, holdings) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/individuals`, {
            action: 'set_role_holdings',
            employee_id: employeeId,
            roles: holdings,
        });
        return response.data;
    } catch (error) {
        console.error('Error setting role holdings:', error);
        throw error;
    }
};

// Replace a doing-implementation's participants (the working team — people in their
// roles), distinct from owner. participants: [{ person_unique_id, role_handle, note }]
export const setImplementationParticipants = async (implementationType, implementationUniqueId, participants) => {
    try {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations`, {
            action: 'set_participants',
            implementation_type: implementationType,
            implementation_unique_id: implementationUniqueId,
            participants,
        });
        return response.data;
    } catch (error) {
        console.error('Error setting implementation participants:', error);
        throw error;
    }
};
//
// CROSS-CAMPUS PLAN ASSIGNMENT — connects/disconnects a plan to another
// campus's YSEs for the same indicators + year (the plan's campus anchoring
// runs through its furthers_yse edges). Backend refuses to remove the last
// remaining campus for the year.
//

export const assignPlanToCampus = async (planUid, campusAbbrev, yearName) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations/plans`, {
        action: 'assign_campus',
        unique_id: planUid,
        campus_abbrev: campusAbbrev,
        year_name: yearName,
    });
    return response.data;
};

export const unassignPlanFromCampus = async (planUid, campusAbbrev, yearName) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations/plans`, {
        action: 'unassign_campus',
        unique_id: planUid,
        campus_abbrev: campusAbbrev,
        year_name: yearName,
    });
    return response.data;
};

export const detachPlanFromYse = async (planUid, yseUniqueId) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations/plans`, {
        action: 'detach_yse',
        unique_id: planUid,
        yse_unique_id: yseUniqueId,
    });
    return response.data;
};

export const attachPlanToYse = async (planUid, yseUniqueId) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/implementations/plans`, {
        action: 'attach_yse',
        unique_id: planUid,
        yse_unique_id: yseUniqueId,
    });
    return response.data;
};

// --- Queries (pending questions) ---
// Each returns the wrapped {status, data} envelope; data is the refreshed query.
export const updateQuery = async (uniqueId, fields) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/queries`, {
        action: 'update_query',
        unique_id: uniqueId,
        ...fields,
    });
    return response.data;
};

export const settleQuery = async (uniqueId, answer, settledByUniqueId = null) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/queries`, {
        action: 'settle_query',
        unique_id: uniqueId,
        answer,
        settled_by_unique_id: settledByUniqueId,
    });
    return response.data;
};

export const attachEvidenceToQuery = async (uniqueId, yseIdentifier) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/queries`, {
        action: 'attach_evidence',
        unique_id: uniqueId,
        yse_identifier: yseIdentifier,
    });
    return response.data;
};

export const detachEvidenceFromQuery = async (uniqueId, yseIdentifier) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/queries`, {
        action: 'detach_evidence',
        unique_id: uniqueId,
        yse_identifier: yseIdentifier,
    });
    return response.data;
};

export const addQueryNote = async (uniqueId, content, createdByUniqueId = null) => {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/queries`, {
        action: 'add_query_note',
        unique_id: uniqueId,
        content,
        created_by_unique_id: createdByUniqueId,
    });
    return response.data;
};
