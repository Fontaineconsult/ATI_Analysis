from collections import namedtuple

from app.database.neomodelschema import *
from neomodel import db, config


config.DATABASE_URL = "bolt://neo4j:testtest@localhost:7687"


def full_year_report(year_identifier: str) -> namedtuple:
    """
    Fetches all the data associated with a given year identified success indicator
    :param year_identifier:
    :return:
    """
    SuccessIndicators = namedtuple('SuccessIndicators',
                                   ['success_indicator',
                                    'goals',
                                    'year_success_evidence',
                                    'status_level',
                                    'academic_year',
                                    'person',
                                    'documents',
                                    'composite_key'])

    yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)

    si_node = yse_node.related_success_indicator.get()
    g_nodes = si_node.associated_goal.all()
    sl_nodes = yse_node.status_level.get()
    ay_node = yse_node.academic_year.get()
    p_nodes = yse_node.implemented_by.all()
    d_nodes = yse_node.has_documents.all()

    return SuccessIndicators(si_node,
                             g_nodes,
                             yse_node,
                             sl_nodes,
                             ay_node,
                             p_nodes,
                             d_nodes,
                             si_node.composite_key)

def get_documents_by_yse(year_identifier: str) -> list:
    """
    Fetches all the documents associated with a given year identified success indicator
    :param year_identifier:
    :return:
    """

    yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
    d_nodes = yse_node.has_documents.all()

    return d_nodes


