#
# INDICATOR UPDATE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError, ValidationError
from app.data_config import (evidence_requirement_elements,
                             evidence_requirement_rubric_dimensions)

# Sentinel separating "field omitted" from "field explicitly cleared" — None is a
# meaningful value for element / rubric_dimension / lead_in, so it cannot double as
# the absent marker.
_UNSET = object()



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


def update_success_indicator_examples(
    composite_key: str,
    examples_of_evidence=None,
    established_example=None,
    managed_example=None,
    optimizing_example=None,
) -> bool:
    """Replace the companion-guide fields on an existing SuccessIndicator.

    Full-replace semantics: the edit form always submits the complete set, so every
    field is overwritten. Empty string / missing → cleared (empty list or None) so the
    Companion Guide card hides that sub-section again.
    """
    try:
        indicator = SuccessIndicator.nodes.get(composite_key=composite_key)
        indicator.examples_of_evidence = examples_of_evidence or []
        indicator.established_example = established_example or None
        indicator.managed_example = managed_example or None
        indicator.optimizing_example = optimizing_example or None
        indicator.save()
        return True
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(f"SuccessIndicator with composite_key '{composite_key}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to update companion examples for success indicator {composite_key}: {e}")


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



def update_evidence_requirement(unique_id,
                                requirement=None,
                                element=_UNSET,
                                rubric_dimension=_UNSET,
                                lead_in=_UNSET):
    """Edit one EvidenceRequirement in place.

    Partial-update semantics, unlike update_success_indicator_examples above: the
    requirements list is edited one row at a time, so an omitted field means "leave it"
    rather than "clear it". Passing an explicit None/"" for element, rubric_dimension or
    lead_in DOES clear that field — which is how a requirement gets un-labelled again.

    `handle`, `composite_key`, `level` and `seq` are identity and are never edited; move a
    requirement between levels by deleting and re-adding it, so the handle stays truthful.
    """
    try:
        node = EvidenceRequirement.nodes.get(unique_id=unique_id)
    except EvidenceRequirement.DoesNotExist:
        raise NotFoundError(f"EvidenceRequirement '{unique_id}' not found.")

    try:
        if requirement is not None:
            text = requirement.strip()
            if not text:
                raise ValidationError("An evidence requirement needs requirement text.")
            node.requirement = text

        if element is not _UNSET:
            element = element or None
            if element and element not in evidence_requirement_elements:
                raise ValidationError(
                    f"Unknown element '{element}'. Expected one of: "
                    f"{', '.join(evidence_requirement_elements)}."
                )
            node.element = element
            # Keep the dimension in step with the element unless the caller set it
            # explicitly in the same call — an element change that left a stale dimension
            # behind would misfile the requirement in every rubric roll-up.
            if rubric_dimension is _UNSET:
                node.rubric_dimension = (
                    evidence_requirement_rubric_dimensions.get(element) if element else None
                )

        if rubric_dimension is not _UNSET:
            node.rubric_dimension = rubric_dimension or None
        if lead_in is not _UNSET:
            node.lead_in = lead_in or None

        node.save()
        return node
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        raise CrudError(f"Failed to update evidence requirement '{unique_id}': {e}")
