#
# DOCUMENTATION READ QUERIES
#
from app.database.graph_schema import *

def get_all_documents():
    return Document.nodes.all()

def get_all_webpages():
    return Webpage.nodes.all()

def get_all_notes():
    return Note.nodes.all()

def get_all_messages():
    return Message.nodes.all()