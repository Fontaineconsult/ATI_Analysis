function createNotePayload(yearSuccessEvidence, noteName, noteContent, dateCreated) {
    return {
        action: "add_note",
        year_success_evidence: yearSuccessEvidence,
        note_dict: {
            name: noteName,
            content: noteContent,
            date_created: dateCreated
        }
    };
}


function createMessagePayload(yearSuccessEvidence, messageName, messageType, dateCreated, content) {
    return {
        action: "add_message",
        year_success_evidence: yearSuccessEvidence,
        message_dict: {
            name: messageName,
            message_type: messageType,
            date_created: dateCreated,
            content: content
        }
    };
}

function createDocumentPayload(name, filePath = null, uriPath = null, depreciated = false) {
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


function generateUpdateStatusLevelPayload(yearSuccessEvidence, statusLevel) {
    return {
        yse: yearSuccessEvidence,  // year success evidence identifier
        status_level: statusLevel  // new status level
    };
}

