import sys

from app.data_config import working_group_names

sys.path.append(r"C:\Users\Fonta\IdeaProjects\ATI_Analysis")
sys.path.append(r"C:\Users\913678186\IdeaProjects\ATI_Analysis")
from app.database.graph_schema import *

academic_years = ["2019-2020",
                  "2020-2021",
                  "2021-2022",
                  "2022-2023",
                  "2023-2024",
                  "2024-2025",]


implementation_types = ["Process",
                        "Project",
                        "Procedure",
                        "Service",
                        "Guidance",
                        "Tracking",
                        "InternalPolicy"]

implementation_classes = {
    "Process": Process,
    "Project": Project,
    "Procedure": Procedure,
    "Service": Service,
    "Guidance": Guidance,
    "Tracking": Tracking,
    "InternalPolicy": InternalPolicy
}

# Mapping of documentation types to their corresponding classes
documentation_types = ["document",
                       "webpage",
                       "message",
                       "note",
                       "metric"]

documentation_classes = {
    "document": Document,
    "webpage": Webpage,
    "message": Message,
    "note": Note,
    "metric": Metric
}

# Mapping of documentation types to their corresponding relationships
documentation_relationships = {
    "document": "supporting_documents",
    "webpage": "supporting_webpages",
    "message": "supporting_messages",
    "note": "supporting_notes",
    "metric": "supporting_metrics"
}


implementor_classes = {
    "Process": "implements_process",
    "Project": "implements_project",
    "Procedure": "implements_procedure",
    "Service": "implements_service",
    "Guidance": "implements_guidance",
    "Tracking": "implements_tracking",


}

status_levels = ["Not Started",
                 "Initiated",
                 "Defined",
                 "Established",
                 "Managed",
                 "Optimizing"]

message_types = ["e-mail",
                 "voice mail",
                 "text message",
                 "letter",
                 "memo",
                 "report",
                 "meeting minutes",
                 "presentation",
                 ]

metric_types = ["tabular",
                "graphical",
                "descriptive"]

working_group_names_web_query = {

    "web": "Web",
    "instructional-materials": "Instructional Materials",
    "procurement": "Procurement",

}

working_groups = ["Web", "Procurement", "Instructional Materials"]

plan_statuses = ["Not Started",
                 "In Progress",
                 "Complete",
                 "On Hold",
                 "Abandoned"]

evidence_descriptions = ["procedure",
                         "resource",
                         "documentation",
                         "documentation_evidence"]