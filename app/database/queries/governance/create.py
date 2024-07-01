#
# GOVERNANCE CREATE QUERIES
#
from app.database.graph_schema import *

def add_law(title: str,
            description: str,
            effective_date: str,
            last_updated: str,
            relevant_sections: str,
            legislative_authority: str) -> bool:
    """
    Adds a law node to the graph
    :param title: Title of the law
    :param description: Description of the law
    :param effective_date: Effective date of the law
    :param last_updated: Last updated date of the law
    :param relevant_sections: Relevant sections of the law
    :param legislative_authority: Legislative authority of the law
    :return: True if the law node is added successfully, False otherwise
    """
    try:
        new_law = Law(
            title=title,
            description=description,
            effective_date=effective_date,
            last_updated=last_updated,
            relevant_sections=relevant_sections,
            legislative_authority=legislative_authority
        )
        new_law.save()
        print("Added law")
        return True
    except Exception as e:
        print(e)
        return False


def add_policy(title: str,
               description: str,
               effective_date: str,
               last_updated: str) -> bool:
    """
    Adds a policy node to the graph
    :param title: Title of the policy
    :param description: Description of the policy
    :param effective_date: Effective date of the policy
    :param last_updated: Last updated date of the policy
    :return: True if the policy node is added successfully, False otherwise
    """
    try:
        new_policy = Policy(
            title=title,
            description=description,
            effective_date=effective_date,
            last_updated=last_updated
        )
        new_policy.save()
        print("Added policy")
        return True
    except Exception as e:
        print(e)
        return False


def add_directive(title: str,
                  description: str,
                  effective_date: str,
                  last_updated: str,
                  source_institution: str) -> bool:
    """
    Adds a directive node to the graph
    :param title: Title of the directive
    :param description: Description of the directive
    :param effective_date: Effective date of the directive
    :param last_updated: Last updated date of the directive
    :param source_institution: Source institution of the directive
    :return: True if the directive node is added successfully, False otherwise
    """
    try:
        new_directive = Directive(
            title=title,
            description=description,
            effective_date=effective_date,
            last_updated=last_updated,
            source_institution=source_institution
        )
        new_directive.save()
        print("Added directive")
        return True
    except Exception as e:
        print(e)
        return False


def add_case(title: str,
             description: str,
             effective_date: str,
             ruling: str,
             legislative_authority: str) -> bool:
    """
    Adds a case node to the graph
    :param title: Title of the case
    :param description: Description of the case
    :param effective_date: Effective date of the case
    :param ruling: Ruling of the case
    :param legislative_authority: Legislative authority of the case
    :return: True if the case node is added successfully, False otherwise
    """
    try:
        new_case = Case(
            title=title,
            description=description,
            effective_date=effective_date,
            ruling=ruling,
            legislative_authority=legislative_authority
        )
        new_case.save()
        print("Added case")
        return True
    except Exception as e:
        print(e)
        return False


def add_memo(title: str,
             description: str,
             authored_date: str) -> bool:
    """
    Adds a memo node to the graph
    :param title: Title of the memo
    :param description: Description of the memo
    :param authored_date: Authored date of the memo
    :return: True if the memo node is added successfully, False otherwise
    """
    try:
        new_memo = Memo(
            title=title,
            description=description,
            authored_date=authored_date
        )
        new_memo.save()
        print("Added memo")
        return True
    except Exception as e:
        print(e)
        return False


def add_guideline(title: str,
                  description: str,
                  effective_date: str,
                  last_updated: str) -> bool:
    """
    Adds a guideline node to the graph
    :param title: Title of the guideline
    :param description: Description of the guideline
    :param effective_date: Effective date of the guideline
    :param last_updated: Last updated date of the guideline
    :return: True if the guideline node is added successfully, False otherwise
    """
    try:
        new_guideline = Guideline(
            title=title,
            description=description,
            effective_date=effective_date,
            last_updated=last_updated
        )
        new_guideline.save()
        print("Added guideline")
        return True
    except Exception as e:
        print(e)
        return False