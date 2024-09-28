import sys
sys.path.append(r"C:\Users\Fonta\IdeaProjects\ATI_Analysis")
sys.path.append(r"C:\Users\913678186\IdeaProjects\ATI_Analysis")
from app.database.graph_schema import *

implementation_types = ["process", "project", "procedure", "service", "guidance", "tracking"]

implementation_classes = {
    "process": Process,
    "project": Project,
    "procedure": Procedure,
    "service": Service,
    "guidance": Guidance,
    "tracking": Tracking
}

# Mapping of documentation types to their corresponding classes
documentation_types = ["document", "webpage", "memo", "note"]

documentation_classes = {
    "document": Document,
    "webpage": Webpage,
    "memo": Memo,
    "note": Note
}

# Mapping of documentation types to their corresponding relationships
documentation_relationships = {
    "document": "supporting_documents",
    "webpage": "supporting_webpages",
    "memo": "supporting_notes",
    "note": "supporting_messages"
}


implementor_classes = {
    "process": "implements_process",
    "project": "implements_project",
    "procedure": "implements_procedure",
    "service": "implements_service",
    "guidance": "implements_guidance"

}