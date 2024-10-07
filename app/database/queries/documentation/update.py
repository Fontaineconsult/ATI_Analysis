#
# DOCUMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *


def unassign_note_from_yse(note_name, year_success_evidence):

    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except Exception as e:
        print(f"Failed to get YearSuccessEvidence: {e}")
        return False

    try:
        note = Note.nodes.get(name=note_name)
    except Exception as e:
        print(f"Failed to get Note: {e}")
        return False

    try:
        yse.notes.disconnect(note)
    except Exception as e:
        print(f"Failed to disconnect Note from YearSuccessEvidence: {e}")
        return False
    print(f"Successfully disconnected Note from YearSuccessEvidence")
    return True
#
# unassign_note_from_yse("Measures of success: Stored in compliance sheriff", "2022-2023-1.6-web")