export function createNotePayload(yearSuccessEvidence, noteContent, created_by) {
    return {
        action: "add_note",
        year_success_evidence: yearSuccessEvidence,
        note_dict: noteContent,
        created_by:created_by

    };
}

export function addProgressNoteToPlanPayload(planId, noteName, noteContent, createdById) {
    return {
        action: "add_progress_note",
        plan_id: planId,
        note_name: noteName,
        note_content: noteContent,
        created_by_id: createdById
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





export function createDocumentPayloadForImplementation(implementation_id, implementation_type, document_dict, created_by, academic_year, include_in_year) {
    return {
        action: "add_document",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        document_dict: document_dict,
        created_by: created_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    };
}



export function createImplementationNotePayload(implementation_id, implementation_type, noteContent, created_by, academic_year, include_in_year) {
    return {
        action: "add_note",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        note_dict: noteContent,
        created_by:created_by,
        academic_year: academic_year,
        include_in_year:include_in_year

    };
}




export function createWebpagePayloadForImplementation(implementation_id, implementation_type, webpage_dict, created_by, academic_year, include_in_year) {
    return {
        action: "add_webpage",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        webpage_dict: webpage_dict,
        created_by:created_by,
        academic_year: academic_year,
        include_in_year: include_in_year

    };
}



export function createMessagePayloadForImplementation(implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year) {
    return {
        action: "add_message",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        message_dict: message_dict,
        created_by:created_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    }

}



export function updateMessageForImplementationPayload(implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year) {
    return {
        action: "update_message",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        message_dict: message_dict,
        created_by:created_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    }

}


export function updateNoteForImplementationPayload(implementation_id, implementation_type, message_dict, created_by, academic_year, include_in_year) {
    return {
        action: "update_note",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        note_dict: message_dict,
        created_by:created_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    }

}



export function updateMetricForImplementationPayload(implementation_id, implementation_type, metric_dict, created_by) {

    return {
        action: "update_metric",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        message_dict: metric_dict,
        created_by:created_by
    }



}


export function createMetricPayloadForImplementation(implementation_id, implementation_type, metric_dict, created_by) {
    return {
        action: "add_metric",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        metric_dict: metric_dict,
        created_by:created_by
    }

}



export function updateNotePayloadForImplementation(implementation_id, implementation_type, note_dict, created_by, academic_year, include_in_year) {
    return {
        action: "update_note",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        note_dict: note_dict,
        created_by:created_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    }
}


export function updateNotePayload(yearSuccessEvidence, note_dict, created_by) {
    return {
        action: "update_note",
        year_success_evidence: yearSuccessEvidence,
        note_dict: note_dict,
        created_by:created_by,

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



export function updateDocumentPayload(implementation_id, implementation_type, document_dict, maintained_by, academic_year, include_in_year) {
    return {
        action: "update_document",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        document_dict: document_dict,
        maintained_by: maintained_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    }
}


export function updateWebsitePayload(implementation_id, implementation_type, webpage_dict, maintained_by, academic_year, include_in_year) {
    return {
        action: "update_webpage",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
        webpage_dict: webpage_dict,
        maintained_by: maintained_by,
        academic_year: academic_year,
        include_in_year: include_in_year
    }
}



export function updateMetricPayload(implementation_id, implementation_type, metric_dict, created_by) {
    return {
        action: "update_metric",
        implementation_id: implementation_id,
        implementation_type: implementation_type,
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

export function updateIndicatorOverrideImplementationRequirement(composite_key, override_implementation_requirement) {
    return {
        action: "update_override_implementation_requirement",
        composite_key: composite_key,  // indicator identifier
        override_implementation_requirement: override_implementation_requirement  // bool
    };
}

export function createSuccessIndicatorPayload(number, goalNumber, subCommittee, successIndicatorText, dateAdded, removed, examplesOfEvidence = [], establishedExample = null, managedExample = null, optimizingExample = null) {
    return {
        action: "create_success_indicator",
        number: number,
        goal_number: goalNumber,
        sub_committee: subCommittee,
        success_indicator_text: successIndicatorText,
        date_added: dateAdded,
        removed: removed,
        examples_of_evidence: examplesOfEvidence,   // array of bullet strings
        established_example: establishedExample,     // markdown (the common case)
        managed_example: managedExample,             // markdown (rare — a few Procurement SIs)
        optimizing_example: optimizingExample        // markdown (rare)
    };
}

export function create_year_success_evidence_node(academic_year,
                                             success_indicator_composite_key,
                                             campus_abbreviation,
                                             ) {
    return {
        action:"create_year_success_evidence_node",
        academic_year: academic_year,
        success_indicator_composite_key: success_indicator_composite_key,
        status_level: "Not Started", //defaulting
        campus_abbreviation: campus_abbreviation
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

export function createAccomplishmentPayload(accomplishment) {

    return {
        action: "add_accomplishment",
        ...accomplishment
    }

}


export function updateAccomplishmentPayload(accomplishment) {

    return {
        action: "update_accomplishment",
        ...accomplishment
    }

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


