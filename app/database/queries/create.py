from app.database.graph_schema import *
import uuid



def add_person(name: str,
               email: str,
               employee_id: str,
               title: str,
               ) -> bool:
    """
    Adds a person node to the graph
    :param name:
    :param email:
    :param phone_number:
    :param title:
    :return:
    """
    try:
        new_person = Person(
            name=name,
            email=email,
            employee_id=employee_id,
            title=title
        )
        new_person.save()
        print("added person")
        return True
    except Exception as e:
        print(e)
        return False

