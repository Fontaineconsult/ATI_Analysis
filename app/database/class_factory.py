from graph_schema import *


implementation_classes = {
    "process": Process,
    "project": Project,
    "procedure": Procedure,
    "service": Service,
    "guideline": Guideline
}

# Mapping of documentation types to their corresponding classes
documentation_classes = {
    "document": Document,
    "webpage": Webpage,
    "memo": Memo,
    "note": Note
}

# Mapping of documentation types to their corresponding relationships
documentation_relationships = {
    "document": "supporting_documents",
    "webpage": "supporting_websites",
    "memo": "supporting_notes",
    "note": "supporting_messages"
}

implementor_classes = {
    "process":"implements_process",
    "project":"implements_project",
    "procedure": "implements_procedure",
    "service":"implements_service",
    "guideline":"implements_guideline"

}