#
# GOVERNANCE DELETE QUERIES
#
from app.database.graph_schema import *

def delete_law(title: str) -> bool:
    """
    Deletes a law node from the graph
    :param title: Title of the law
    :return: True if the law node is deleted successfully, False otherwise
    """
    try:
        law = Law.nodes.get(title=title)
        law.delete()
        print("Deleted law")
        return True
    except Law.DoesNotExist:
        print("Law does not exist")
        return False


def delete_policy(title: str) -> bool:
    """
    Deletes a policy node from the graph
    :param title: Title of the policy
    :return: True if the policy node is deleted successfully, False otherwise
    """
    try:
        policy = Policy.nodes.get(title=title)
        policy.delete()
        print("Deleted policy")
        return True
    except Policy.DoesNotExist:
        print("Policy does not exist")
        return False


def delete_directive(title: str) -> bool:
    """
    Deletes a directive node from the graph
    :param title: Title of the directive
    :return: True if the directive node is deleted successfully, False otherwise
    """
    try:
        directive = Directive.nodes.get(title=title)
        directive.delete()
        print("Deleted directive")
        return True
    except Directive.DoesNotExist:
        print("Directive does not exist")
        return False


def delete_case(title: str) -> bool:
    """
    Deletes a case node from the graph
    :param title: Title of the case
    :return: True if the case node is deleted successfully, False otherwise
    """
    try:
        case = Case.nodes.get(title=title)
        case.delete()
        print("Deleted case")
        return True
    except Case.DoesNotExist:
        print("Case does not exist")
        return False


def delete_memo(title: str) -> bool:
    """
    Deletes a memo node from the graph
    :param title: Title of the memo
    :return: True if the memo node is deleted successfully, False otherwise
    """
    try:
        memo = Memo.nodes.get(title=title)
        memo.delete()
        print("Deleted memo")
        return True
    except Memo.DoesNotExist:
        print("Memo does not exist")
        return False


def delete_guideline(title: str) -> bool:
    """
    Deletes a guideline node from the graph
    :param title: Title of the guideline
    :return: True if the guideline node is deleted successfully, False otherwise
    """
    try:
        guideline = Guideline.nodes.get(title=title)
        guideline.delete()
        print("Deleted guideline")
        return True
    except Guideline.DoesNotExist:
        print("Guideline does not exist")
        return False