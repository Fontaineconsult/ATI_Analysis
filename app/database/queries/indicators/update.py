#
# INDICATOR UPDATE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError


def set_removed_status_for_success_indicator(composite_key: str, removed: bool) -> bool:
    try:
        indicator = SuccessIndicator.nodes.get(composite_key=composite_key)
        indicator.removed = removed
        indicator.save()
        return True
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(f"SuccessIndicator with composite_key '{composite_key}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to set removed status for success indicator {composite_key}: {e}")