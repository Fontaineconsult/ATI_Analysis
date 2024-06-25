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
                                    'websites',
                                    'vendors',
                                    'laws',
                                    'policies',
                                    'projects',
                                    'notes',
                                    'composite_key'])

    yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)

    si_node = yse_node.related_success_indicator.get()
    goal_nodes = si_node.goals.all()
    sl_nodes = yse_node.status_level.get()
    ay_node = yse_node.academic_year.get()
    p_nodes = yse_node.implemented_by.all()
    d_nodes = yse_node.has_documents.all()
    w_nodes = yse_node.has_webpages.all()
    v_nodes = yse_node.supporting_vendors.all()
    l_nodes = si_node.guiding_laws.all() # this is an incoming law relationship
    pl_nodes = si_node.supporting_policies.all() # this is an incoming policy relationship
    project_nodes = yse_node.related_projects.all()
    note_nodes = yse_node.notes.all()


    return SuccessIndicators(si_node,
                             goal_nodes,
                             yse_node,
                             sl_nodes,
                             ay_node,
                             p_nodes,
                             d_nodes,
                             w_nodes,
                             v_nodes,
                             l_nodes,
                             pl_nodes,
                             project_nodes,
                             note_nodes,
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

def get_nodes_related_to_document(document_hash):
    document_node = Document.nodes.get(hash=document_hash)
    related_nodes = document_node.match_incoming(rel_type="has_document")
    return related_nodes

def get_nodes_related_to_website(url):
    website_node = Webpage.nodes.get(url=url)
    related_nodes = website_node.match_incoming(rel_type="has_website")
    return related_nodes

