# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ATI Analysis is a full-stack web application for tracking and managing Accessible Technology Initiative (ATI) compliance across an institution. The system uses a Neo4j graph database to model complex relationships between governance, implementation, evidence, and organizational entities.

## Architecture

### Backend (Python Flask)

- **Flask Application**: Entry point is `app/__init__.py` with `create_app()` factory pattern
- **WSGI Server**: Production deployment via Waitress (`run.py`) or IIS with wfastcgi (see `deployment/iis-deploy.md`)
- **Database**: Neo4j graph database accessed through neomodel ORM
- **API**: RESTful API organized as Flask Blueprints under `app/endpoints/data_api/`

### Frontend (React)

- **Location**: `app/frontend/src/src/`
- **Build Output**: `app/frontend/src/build/` (served by Flask)
- **Routing**: React Router with Flask serving `index.html` for all `/ati/*` routes
- **Key Components**:
  - Working group containers (Web, Instructional Materials, Procurement)
  - Evidence management and approval workflows
  - Dashboard and reporting interfaces

### Graph Database Schema

**Core Domain Model** (defined in `app/database/graph_schema.py`):

1. **Governance Layer**: Laws, Cases, Directives, ExternalPolicy, Memo, Guideline
   - Inform Goals and establish compliance framework

2. **Indicators Layer**: Goal, SuccessIndicator
   - Goals supported by SuccessIndicators
   - Track progress metrics and benchmarks

3. **Implementation Layer**: Plan, InternalPolicy, Process, Project, Procedure, Service, Guidance, Tracking
   - Evidence nodes that demonstrate compliance
   - Connected to YearSuccessEvidence for annual tracking

4. **Evidence Layer**: YearSuccessEvidence, AcademicYear, StatusLevel, Accomplishment
   - YearSuccessEvidence (YSE) is the central tracking node
   - Links implementation nodes to success indicators by academic year
   - StatusLevel: "Not Started" → "Initiated" → "Defined" → "Established" → "Managed" → "Optimizing"

5. **Organizational Layer**: ATIWorkingGroup, Person, Department, College, Vendor
   - Three working groups: Web, Instructional Materials, Procurement
   - Persons implement YSE nodes and serve as approvers

6. **Documentation Layer**: Document, Webpage, Note, Message, Metric
   - Support evidence with URLs, files, and quantitative data
   - DocumentedByRel includes year-based inclusion/exclusion

**Key Relationships**:
- Implementation nodes → `is_evidence_for` → YearSuccessEvidence
- YearSuccessEvidence → `tracks` → SuccessIndicator
- YearSuccessEvidence → `status_is` → StatusLevel
- Person → `implements` → YearSuccessEvidence

## Development Commands

### Python Backend

```bash
# Install dependencies
pip install -r app/requirements.txt

# Development server
python run.py
# Runs on http://127.0.0.1:5000 using Waitress

# Direct Flask development mode
python app/application.py
# Runs on port specified in .env.development
```

### Database Connection

Environment files:
- `.env.development` - Local Neo4j connection
- `.env.production` - Production Neo4j
- `.env.remote` - Remote Neo4j instance

Set connection in `graph_schema.py`:
- `set_connection()` - Uses `.env.development`
- `update_remote()` - Uses `.env.remote`

### React Frontend

```bash
cd app/frontend/src

# Install dependencies
npm install

# Development server
npm start

# Production build
npm run build
# Output goes to app/frontend/src/build/
```

## Database Query Patterns

Queries are organized by domain in `app/database/queries/`:
- `committees/` - ATIWorkingGroup CRUD
- `evidence/` - YearSuccessEvidence operations
- `governance/` - Laws, policies, directives
- `implementation/` - Plans, processes, projects, procedures, services
- `indicators/` - Goals and SuccessIndicators
- `individuals/` - Person nodes
- `organizational_units/` - Departments, colleges, vendors
- `documentation/` - Documents, webpages, notes, messages, metrics
- `compound_queries/` - Complex multi-node queries

**Important Query Functions**:
- `build_yse_report(yse_identifier)` in `app/database/tools/report_queries.py` - Builds complete evidence reports
- `fetch_evidence_for_working_group(working_group, academic_year)` - Gets all YSE for a working group
- `assign_*_to_yse()` functions in `queries/evidence/update.py` - Link entities to evidence

## API Endpoints

Base URL: `/ati/data-api/v1/`

API modules in `app/endpoints/data_api/`:
- `api_endpoints.py` - Core YSE, status, person, approver endpoints
- `evidence.py` - Evidence CRUD operations
- `implementation.py` - Implementation node operations
- `indicators.py` - Goal and SuccessIndicator management
- `documents.py` - Document/webpage/note/message operations
- `committees.py` - Working group operations
- `individuals.py` - Person management
- `organizational_units.py` - Department/college/vendor operations

**Key Endpoints**:
- `GET /yse/<yse>` - Fetch complete YSE report
- `PUT /assign-approver` - Assign Person as admin reviewer to YSE
- `GET /persons?employee_id=<id>` - Get person by employee ID

## Configuration & Deployment

**Flask Configuration** (`app/web_config.py` and `app/__init__.py`):
- Database URL from environment
- Static files served from `frontend/src/build/static`
- Templates from `frontend/src/build`
- CORS enabled for React development

**IIS Deployment**:
- Follow `deployment/iis-deploy.md` for Windows Server deployment
- Uses wfastcgi as WSGI bridge
- Deployment root: `C:\www\ati\`
- Requires proper permissions for IIS_IUSRS and app pool identity

## Batch Operations

Cypher scripts in `app/database/batch/`:
- `import.cypher` / `export.cypher` - Data import/export
- `schema_updates/` - Schema migration scripts
- `master_wg.cypher` - Working group master queries
- `status_levels.cypher` - StatusLevel initialization

## Important Patterns

**Composite Keys**:
- SuccessIndicator: `{goal_number}_{working_group_abbreviation}` (e.g., "1_web")
- YearSuccessEvidence: `{academic_year}_{success_indicator_composite_key}` (e.g., "2024-2025_1_web")
- Metric: `{name}_{academic_year}_{additional_identifier}`

**Working Group Abbreviations**:
- `web` - Web
- `ins` - Instructional Materials
- `pro` - Procurement

Mappings in `app/data_config.py` and `app/database/class_factory.py`

**Error Handling**:
Custom exceptions in `app/endpoints/data_api/errors/custom_exceptions.py`:
- `NotFoundError` - Entity not found (404)
- `ValidationError` - Invalid input (400)
- `CrudError` - Database operation failed (500)
- `DatabaseError` - Database connection issues (500)

## Testing & Schema Management

To regenerate schema in Neo4j:
```python
from app.database.graph_schema import install_all_labels
install_all_labels()
```

Run Cypher queries directly via Neo4j browser or batch files in `app/database/batch/`
