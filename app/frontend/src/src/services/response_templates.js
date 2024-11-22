export function createNotePayload(yearSuccessEvidence, noteContent, created_by) {
    return {
        action: "add_note",
        year_success_evidence: yearSuccessEvidence,
        note_dict: noteContent,
        created_by:created_by

    };
}



export function createMessagePayload(yearSuccessEvidence, messageContent, created_by) {
    console.log(messageContent)
    return {
        action: "add_message",
        year_success_evidence: yearSuccessEvidence,
        message_dict: messageContent,
        created_by: created_by,

    };
}

export function createDocumentPayload(name, filePath = null, uriPath = null, depreciated = false) {
    return {
        action: "add_document",
        name: name,
        file_path: filePath,
        uri_path: uriPath,
        depreciated: depreciated
    };
}


function createWebpagePayload(url, name, noLongerExists, depreciated, depreciatedYear, description) {
    return {
        action: "add_webpage",
        url: url,
        name: name,
        no_longer_exists: noLongerExists,
        depreciated: depreciated,
        depreciated_year: depreciatedYear,
        description: description
    };
}

export function updateNotePayload(yearSuccessEvidence, note_dict, created_by) {
    return {
        action: "update_note",
        year_success_evidence: yearSuccessEvidence,
        note_dict: note_dict,
        created_by:created_by
        }

}

export function updateMessagePayload(yearSuccessEvidence, message_dict, created_by) {
    return {
        action: "update_message",
        year_success_evidence: yearSuccessEvidence,
        message_dict: message_dict,
        created_by:created_by
    }

}


export function updateDocumentPayload(yearSuccessEvidence, document_dict, created_by) {
    return {
        action: "update_document",
        year_success_evidence: yearSuccessEvidence,
        document_dict: document_dict,
        created_by:created_by
    }

}


export function updateWebsitePayload(yearSuccessEvidence, website_dict, created_by) {
    return {
        action: "update_website",
        year_success_evidence: yearSuccessEvidence,
        website_dict: website_dict,
        created_by:created_by
    }

}

export function updateMetricPayload(yearSuccessEvidence, metric_dict, created_by) {
    return {
        action: "update_metric",
        year_success_evidence: yearSuccessEvidence,
        metric_dict: metric_dict,
        created_by:created_by
    }

}

export function generateUpdateStatusLevelPayload(yearSuccessEvidence, statusLevel) {
    return {
        action: "update_status_level",
        yse: yearSuccessEvidence,  // year success evidence identifier
        status_level: statusLevel  // new status level
    };
}



export function updateIndicatorRemovedStatus(composite_key, removed) {
    return {
        action:"update_removed_status",
        composite_key: composite_key,  // indicator identifier
        removed: removed  // bool
    };
}

export function createSuccessIndicatorPayload(number, goalNumber, subCommittee, successIndicatorText, dateAdded, removed) {
    return {
        action: "create_success_indicator",
        number: number,
        goal_number: goalNumber,
        sub_committee: subCommittee,
        success_indicator_text: successIndicatorText,
        date_added: dateAdded,
        removed: removed
    };
}

export function create_year_success_evidence_node(academic_year,
                                             success_indicator_composite_key,
                                             ) {
    return {
        action:"create_year_success_evidence_node",
        academic_year: academic_year,
        success_indicator_composite_key: success_indicator_composite_key,
        status_level: "Not Started" //defaulting
    };
}

export function assignApproverPayload(employeeId, yearSuccessEvidence) {
    return {
        action: "assign_approver",
        employee_id: employeeId,
        year_success_evidence: yearSuccessEvidence
    };
}

export function updateIndividualPayload(individual) {
    return {
        action: "update_person_by_employee_id",
        ...individual
    };
}

export function createIndividualPayload(individual) {
    return {
        action: "add_person",
        ...individual
    };
}

export function createPlanPayload(plan) {
    return {
        action: "add_plan",
        ...plan
    };
}

export function updatePlanPayload(plan) {
    return {
        action: "update_plan",
        ...plan
    };
}

export function assignResponsiblePersonPayload(unique_id, yearSuccessEvidence) {
    return {
        action: "assign_person_as_implementor",
        unique_id: unique_id,
        year_success_evidence: yearSuccessEvidence
    };
}

export function unassignResponsiblePersonPayload(unique_id, yearSuccessEvidence) {
    return {
        action: "unassign_person_as_implementor",
        unique_id: unique_id,
        year_success_evidence: yearSuccessEvidence
    };
}