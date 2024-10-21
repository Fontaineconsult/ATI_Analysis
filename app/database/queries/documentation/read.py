#
# DOCUMENTATION READ QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def get_all_documents():
    try:
        documents = Document.nodes.all()
        if not documents:
            raise NotFoundError("No documents found.")
        return documents
    except Exception as e:
        raise CrudError(f"Error fetching documents: {str(e)}")

def get_all_webpages():
    try:
        webpages = Webpage.nodes.all()
        if not webpages:
            raise NotFoundError("No webpages found.")
        return webpages
    except Exception as e:
        raise CrudError(f"Error fetching webpages: {str(e)}")

def get_all_notes():
    try:
        notes = Note.nodes.all()
        if not notes:
            raise NotFoundError("No notes found.")
        return notes
    except Exception as e:
        raise CrudError(f"Error fetching notes: {str(e)}")

def get_all_messages():
    try:
        messages = Message.nodes.all()
        if not messages:
            raise NotFoundError("No messages found.")
        return messages
    except Exception as e:
        raise CrudError(f"Error fetching messages: {str(e)}")

def get_all_metrics():
    try:
        metrics = Metric.nodes.all()
        if not metrics:
            raise NotFoundError("No metrics found.")
        return metrics
    except Exception as e:
        raise CrudError(f"Error fetching metrics: {str(e)}")
