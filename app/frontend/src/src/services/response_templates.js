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

function updateNotePayload(yearSuccessEvidence, noteName, content = null, includeInReport = true, depreciated = false, depreciatedDate = null) {
    return {
        action: "update_note",
        year_success_evidence: yearSuccessEvidence,
        note_dict: {
            name: noteName,
            content: content,
            include_in_report: includeInReport,
            depreciated: depreciated,
            depreciated_date: depreciatedDate
        }
    };
}

function updateMessagePayload(yearSuccessEvidence, messageName, content = null, filePath = null, uriPath = null, depreciated = false, depreciatedDate = null) {
    return {
        action: "update_message",
        year_success_evidence: yearSuccessEvidence,
        message_dict: {
            name: messageName,
            content: content,
            file_path: filePath,
            uri_path: uriPath,
            depreciated: depreciated,
            depreciated_date: depreciatedDate
        }
    };
}


function updateMetricPayload() {
    return {
        action: "update_metric"
    };
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