from app.database.graph_schema import *

def build_yse_report(year_success_evidence):

    # query for the year success evidence
    yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)

    # query for the status level
    status = yse.status_level.single()

    # query for the success indicator
    success_indicator = yse.tracks_success_indicator.single()

    # query for the processes_that_evidence
    processes = yse.processes_that_evidence.all()


    # query for the projects_that_evidence
    projects = yse.projects_that_evidence.all()

    # query for the procedures_that_evidence
    procedures = yse.procedures_that_evidence.all()

    # query for the services_that_evidence
    services = yse.services_that_evidence.all()

    # query for the guidelines_that_evidence
    guidance = yse.guidance_that_evidence.all()

    # query for the persons_that_implement
    persons = yse.persons_that_implement.all()

    # combine each query into a dictionary
    report = {
        "year_identifier": yse.year_identifier,
        "status": status.status_level,
        "success_indicator": success_indicator.success_indicator,
        "processes": [{"title": process.title,
                       "description": process.description,
                       "documentation": {"documents": process.supporting_documents.all(),
                                       "webpages": process.supporting_webpages.all(),
                                       "notes":process.supporting_notes.all(),
                                       "messages":process.supporting_messages.all()}} for process in processes],

        "projects": [{"title": project.title,
                      "description": project.description,
                      "documentation": {"documents": project.supporting_documents.all(),
                                        "webpages": project.supporting_webpages.all(),
                                        "notes": project.supporting_notes.all(),
                                        "messages": project.supporting_messages.all()}} for project in projects],

        "procedures": [{"title": procedure.title,
                        "description": procedure.description,
                        "documentation": {"documents": procedure.supporting_documents.all(),
                                          "webpages": procedure.supporting_webpages.all(),
                                          "notes": procedure.supporting_notes.all(),
                                          "messages": procedure.supporting_messages.all()}} for procedure in procedures],

        "services": [{"title": service.title,
                      "description": service.description,
                      "documentation": {"documents": service.supporting_documents.all(),
                                        "webpages": service.supporting_webpages.all(),
                                        "notes": service.supporting_notes.all(),
                                        "messages": service.supporting_messages.all()}} for service in services],

        "guidelines": [{"title": guideline.title,
                        "description": guideline.description,
                        "documentation": {"documents": guideline.supporting_documents.all(),
                                          "webpages": guideline.supporting_webpages.all(),
                                          "notes": guideline.supporting_notes.all(),
                                          "messages": guideline.supporting_messages.all()}} for guideline in guidance],

        "persons": [person.name for person in persons]
    }

    print(report)



build_yse_report("2020-2021-1.9-web")