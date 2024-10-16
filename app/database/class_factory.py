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


implementation_types = ["process",
                        "project",
                        "procedure",
                        "service",
                        "guidance",
                        "tracking",
                        "internal_policy"]

implementation_classes = {
    "process": Process,
    "project": Project,
    "procedure": Procedure,
    "service": Service,
    "guidance": Guidance,
    "tracking": Tracking,
    "internal_policy": InternalPolicy
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
    "process": "implements_process",
    "project": "implements_project",
    "procedure": "implements_procedure",
    "service": "implements_service",
    "guidance": "implements_guidance"

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