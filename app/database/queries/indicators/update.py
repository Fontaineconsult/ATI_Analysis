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


def set_override_implementation_requirement(composite_key: str, override: bool) -> bool:
    """Toggle whether a SuccessIndicator is exempt from needing implementations.

    When True the dashboard stops flagging the indicator as missing implementations
    (not every SI is met through traditional implementation work).
    """
    try:
        indicator = SuccessIndicator.nodes.get(composite_key=composite_key)
        indicator.override_implementation_requirement = override
        indicator.save()
        return True
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(f"SuccessIndicator with composite_key '{composite_key}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to set implementation-requirement override for success indicator {composite_key}: {e}")

