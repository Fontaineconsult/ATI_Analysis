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