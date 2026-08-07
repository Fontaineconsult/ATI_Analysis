"""
HTTP endpoint for CommunityOfPractice nodes.

A community of practice is a cross-campus grouping of people around a shared
functional area or interest (Library, Faculty Development, Disability Services, ...).
Communities are freely creatable data — not a seeded vocabulary. A person's own
membership edges are managed on the individuals endpoint (PUT set_communities),
mirroring how role holdings work; this endpoint owns the community nodes themselves.

URL surface (mounted at /ati/data-api/v1):
    GET    /communities               list (member counts + campuses + stake counts)
    GET    /communities?view=by_working_group
                                      communities per working group, derived via
                                      stakes (wg->Goal->SI<-has_stake_in); each
                                      community's explicit members are its leads,
                                      the WG roster is the derived body of people
    GET    /communities/<unique_id>   one community with its member roster + indicator stakes
    POST   /communities               {action: create_community, name, description?}
    PUT    /communities/<unique_id>   {action: update_community, name?, description?}
                                      {action: add_stake, composite_key, note?}
                                      {action: remove_stake, composite_key}
    DELETE /communities/<unique_id>   delete (membership edges only; people untouched)
"""
import traceback

from flask import request
from flask.views import MethodView

from app.database.queries.communities.create import create_community
from app.database.queries.communities.delete import delete_community
from app.database.queries.communities.read import (
    get_all_communities,
    get_communities_by_working_group,
    get_community,
)
from app.database.queries.communities.update import (
    add_community_stake,
    remove_community_stake,
    update_community,
)
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError

from . import data_api_endpoints
from .util.response import make_response


class CommunitiesAPI(MethodView):
    def get(self, unique_id=None):
        try:
            if unique_id:
                return make_response(status="success", data={"community": get_community(unique_id)}), 200
            if request.args.get("view") == "by_working_group":
                return make_response(status="success", data={"items": get_communities_by_working_group()}), 200
            return make_response(status="success", data={"items": get_all_communities()}), 200
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500

    def post(self):
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("Request body must be JSON.")

            if data.get("action") == "create_community":
                community = create_community(data)
                return make_response(status="success", data={"community": community.serialize()}), 201

            raise ValidationError(f"Unknown action {data.get('action')!r}.")
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {str(e)}"), 500

    def put(self, unique_id=None):
        try:
            data = request.get_json()
            if not data:
                raise ValidationError("Request body must be JSON.")

            if data.get("action") == "update_community":
                if not unique_id:
                    raise ValidationError("Missing community unique_id in the URL.")
                community = update_community(unique_id, data)
                return make_response(status="success", data={"community": community.serialize()}), 200

            if data.get("action") == "add_stake":
                if not unique_id:
                    raise ValidationError("Missing community unique_id in the URL.")
                if not data.get("composite_key"):
                    raise ValidationError("add_stake requires a composite_key.")
                add_community_stake(unique_id, data["composite_key"], data.get("note"))
                return make_response(status="success", data={"community": get_community(unique_id)}), 200

            if data.get("action") == "remove_stake":
                if not unique_id:
                    raise ValidationError("Missing community unique_id in the URL.")
                if not data.get("composite_key"):
                    raise ValidationError("remove_stake requires a composite_key.")
                remove_community_stake(unique_id, data["composite_key"])
                return make_response(status="success", data={"community": get_community(unique_id)}), 200

            raise ValidationError(f"Unknown action {data.get('action')!r}.")
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=f"An unexpected error occurred: {str(e)}"), 500

    def delete(self, unique_id=None):
        try:
            if not unique_id:
                raise ValidationError("Missing community unique_id in the URL.")
            delete_community(unique_id)
            return make_response(status="success", data={"deleted": unique_id}), 200
        except ValidationError as e:
            return make_response(status="error", error=str(e)), 400
        except NotFoundError as e:
            return make_response(status="error", error=str(e)), 404
        except CrudError as e:
            return make_response(status="error", error=str(e)), 500
        except Exception as e:
            traceback.print_exc()
            return make_response(status="error", error=str(e)), 500


communities_view = CommunitiesAPI.as_view("communities_api")
data_api_endpoints.add_url_rule("/communities", view_func=communities_view, methods=["GET", "POST"])
data_api_endpoints.add_url_rule("/communities/<unique_id>", view_func=communities_view, methods=["GET", "PUT", "DELETE"])
