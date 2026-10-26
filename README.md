# Sentinova ThreatLens

### Cyber Threat Intelligence Dashboard

**Project:** Sentinova ThreatLens  
**Project type:** Cyber Threat Intelligence (CTI) Platform  
**Purpose:** Internship / Capstone Project  
**Status:** Deployed demonstration version  
**Repository:** https://github.com/saideshmukh-cyber/Sentinova-ThreatLens  
**Live Frontend:** https://sentinova-threatlens-frontend.onrender.com  
**Backend API:** https://sentinova-threatlens-api-p9t0.onrender.com  
**API Documentation:** https://sentinova-threatlens-api-p9t0.onrender.com/docs

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Target Users and Personas](#4-target-users-and-personas)
5. [Key Features](#5-key-features)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture](#7-system-architecture)
8. [Application Modules](#8-application-modules)
9. [User Roles and Access Control](#9-user-roles-and-access-control)
10. [Installation and Local Setup](#10-installation-and-local-setup)
11. [Environment Configuration](#11-environment-configuration)
12. [Running the Application](#12-running-the-application)
13. [Database and Migrations](#13-database-and-migrations)
14. [API Documentation](#14-api-documentation)
15. [Testing](#15-testing)
16. [Deployment](#16-deployment)
17. [Security Considerations](#17-security-considerations)
18. [Known Limitations](#18-known-limitations)
19. [Future Enhancements](#19-future-enhancements)
20. [Project Structure](#20-project-structure)
21. [Acknowledgements](#21-acknowledgements)

---

## 1. Project Overview

Sentinova ThreatLens is a Cyber Threat Intelligence (CTI) platform designed to help Security Operations Centre (SOC) teams collect, organize, investigate, and operationalize threat intelligence from multiple sources.

The platform provides a centralized interface for reviewing indicators of compromise (IOCs), monitoring alerts, managing incidents, viewing threat intelligence feeds, and supporting security investigations.

The project follows the requirements and design direction of the ThreatLens Product Requirements Document (PRD), with a focus on a modular backend, a web-based frontend, persistent storage, threat intelligence integrations, and role-based access control.

## 2. Problem Statement

Security teams often receive threat intelligence from multiple disconnected sources. Differences in data formats, duplicated indicators, and limited context can make it difficult to prioritize threats and respond efficiently.

ThreatLens addresses this problem by bringing threat intelligence into a common operational interface. It aims to help analysts review indicators, understand threat context, prioritize alerts, coordinate incident handling, and maintain an audit trail of security-related actions.

## 3. Objectives

The main objectives are to:

- Centralize threat intelligence from supported sources.
- Provide indicator management and investigation workflows.
- Support alert monitoring, triage, escalation, and incident association.
- Present threat information through operational and executive dashboards.
- Apply role-based permissions to administrative and operational features.
- Support auditing and reporting for security operations.
- Provide a deployable web application with documented setup instructions.
- Establish a modular foundation for future CTI integrations and analysis capabilities.

## 4. Target Users and Personas

The PRD defines the following principal personas and user groups.

| Persona | Role | Primary responsibility |
|---|---|---|
| Priya Nair | SOC Analyst | Monitor and triage alerts, review indicators, and investigate suspicious activity. |
| Daniel Okafor | Incident Responder | Manage incidents, review related evidence, and coordinate response workflows. |
| Mei Lin | Threat Hunter | Explore threat intelligence and investigate relationships between indicators. |
| Rachel Adeyemi | CISO / Executive | Review organizational threat posture, risk summaries, and executive reports. |
| SOC Manager / Lead | Management user group | Monitor operational performance and support SOC oversight. |
| Security Engineer | Technical user group | Support integrations and technical platform operations. |
| Platform Administrator | Administrator | Manage platform users, roles, and administrative configuration. |

The named personas describe intended users. They are not intended to represent real individuals or to require accounts with real personal information.

## 5. Key Features

The application is organized around the following functional areas. The availability of individual functions depends on the current implementation and configured integrations.

### 5.1 Command Center and Dashboards

- Centralized overview of threat intelligence and operational activity.
- Threat-source concentration and indicator summaries.
- Dashboard views for different security responsibilities.
- Operational visibility into alerts and incidents.

### 5.2 Indicator Management

- View and manage indicators of compromise.
- Organize indicators by type and source.
- Support indicator investigation and threat-context workflows.
- Reduce duplicate intelligence through indicator deduplication where supported.

### 5.3 Threat Intelligence Feeds

- Configure and inspect supported threat intelligence sources.
- Review feed status and recent ingestion activity.
- Trigger feed polling where supported.
- Consolidate ingested intelligence for downstream analysis.

### 5.4 Enrichment and Investigation

- Provide a dedicated interface for indicator enrichment and investigation.
- Support analysis of indicator context and associated intelligence.
- Provide a foundation for adding further reputation and enrichment providers.

### 5.5 Alert Management

- Review security alerts.
- Triage and update alert statuses.
- Support alert escalation and incident association where implemented.
- Present alert information in the monitoring interface.

### 5.6 Incident Management

- Review and manage security incidents.
- Associate relevant alerts and indicators with incidents where supported.
- Track incident status and response activity.

### 5.7 Administration and Role Management

- Create platform user accounts.
- Assign supported application roles.
- Separate administrative access from analyst and operational responsibilities.

### 5.8 Audit Logging and Reporting

- Provide an audit-log interface for security-related activity.
- Support report and data-export workflows where implemented.
- Assist with operational review and accountability.

## 6. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| UI styling | Tailwind CSS |
| Backend | Python, FastAPI |
| API validation | Pydantic |
| Relational database | PostgreSQL |
| ORM | SQLAlchemy |
| Database migrations | Alembic |
| Caching and real-time infrastructure | Redis |
| Search and intelligence indexing | Elasticsearch |
| Authentication | JWT-based authentication |
| Testing | Pytest |
| Version control | Git and GitHub |
| Deployment | Render |

The stack is divided into frontend, backend, persistence, caching, search, and deployment components to support modular development and maintenance.

## 7. System Architecture

ThreatLens uses a web-client and API-server architecture.

```text
User / Browser
      |
      v
Next.js Frontend
      |
      | HTTPS / REST API
      v
FastAPI Backend
      |
      +---- PostgreSQL
      |       Persistent application data
      |
      +---- Redis
      |       Caching and real-time infrastructure
      |
      +---- Elasticsearch
      |       Search and indexed intelligence
      |
      +---- Threat Intelligence Providers
              External intelligence sources
```

The frontend provides the user interface. The backend handles application logic, validation, authentication, authorization, and data access. PostgreSQL stores relational application data, while Redis and Elasticsearch support additional infrastructure needs.

External threat intelligence integrations depend on provider availability, API credentials, rate limits, and application configuration.

## 8. Application Modules

The primary modules exposed through the application include:

| Module | Purpose |
|---|---|
| Command Center | Operational overview of threat activity |
| Executive | High-level threat and risk visibility |
| SOC Analyst | Alert triage and analyst workflows |
| Incident Response | Incident handling and response tracking |
| Threat Hunting | Threat investigation and intelligence exploration |
| Indicators | Indicator management |
| Enrichments | Indicator context and enrichment workflows |
| Investigations | Investigation workspace |
| Feeds | Threat intelligence source management |
| Alerts | Alert monitoring and triage |
| Alert Rules | Alert rule management |
| Security Events | Security event visibility |
| Incidents | Incident management |
| Audit Log | Audit and accountability |
| Reports | Reporting and export workflows |
| Users & Roles | User administration and role assignments |

The actual actions available in each module are controlled by the implemented permissions and backend functionality.

## 9. User Roles and Access Control

ThreatLens uses role-based access control (RBAC) to separate user responsibilities.

| Role | Intended responsibility |
|---|---|
| `admin` | Platform administration and user/role management |
| `analyst` | Alert triage, indicator review, and investigations |
| `incident_responder` | Incident management and response workflows |
| `threat_hunter` | Proactive threat intelligence investigation |
| `security_engineer` | Technical and integration-related responsibilities |
| `executive` | Executive dashboards and reporting |

Authorization should be enforced by the backend rather than relying only on frontend visibility. Users should receive only the permissions required for their responsibilities.

The demonstration accounts are created separately from the personas' descriptive names. No passwords or live authentication tokens are stored in this README.

## 10. Installation and Local Setup

### 10.1 Prerequisites

Install the following tools before running the application locally:

- Python version compatible with `requirements.txt`.
- Node.js and npm compatible with the frontend package configuration.
- Git.
- PostgreSQL.
- Redis.
- Elasticsearch.
- Docker Desktop and Docker Compose, if using the provided container configuration.

The exact versions should be checked against the project configuration and dependency files.

### 10.2 Clone the repository

```bash
git clone https://github.com/saideshmukh-cy/Sentinova-ThreatLens.git
cd Sentinova-ThreatLens
```

### 10.3 Configure the backend environment

Create and activate a Python virtual environment from the project root.

On Windows Git Bash:

```bash
python -m venv .venv
source .venv/Scripts/activate
```

Install backend dependencies:

```bash
python -m pip install -r requirements.txt
```

If the repository uses a different requirements-file location, follow that file's location in the project structure.

### 10.4 Configure environment variables

Create a local `.env` file using `.env.example` as the reference. Fill in the required local database, authentication, and provider settings.

Do not commit `.env` to GitHub.

### 10.5 Install frontend dependencies

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Use the package manager and lockfile already present in the repository if they specify a different installation command.

## 11. Environment Configuration

The application may require configuration for:

- PostgreSQL connection details.
- JWT signing and token-expiration settings.
- Redis connection details.
- Elasticsearch connection details.
- External threat intelligence API credentials.
- Frontend API base URL.
- Bootstrap administrator configuration, if enabled.

Use `.env.example` and the backend configuration code to identify the exact variable names required by this version of the application.

Example placeholders:

```dotenv
# Illustrative placeholders only; use the exact names in .env.example.
DATABASE_URL=<your-local-database-connection>
JWT_SECRET=<generate-a-strong-random-secret>
REDIS_URL=<your-redis-connection>
ELASTICSEARCH_URL=<your-elasticsearch-connection>
```

Do not copy these illustrative variable names into production unless they match the actual configuration expected by the application.

Production environment variables must be configured in the deployment platform's environment settings. Do not publish actual credentials, connection strings, API keys, or JWT secrets.

## 12. Running the Application

### 12.1 Start the backend

From the repository root, with the virtual environment activated:

```bash
uvicorn backend.app.main:app --reload
```

The local backend is expected to be available at:

```text
http://127.0.0.1:8000
```

### 12.2 Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Open the local frontend URL printed by the development server, commonly:

```text
http://localhost:3000
```

### 12.3 Verify the services

Check that:

- The frontend opens successfully.
- The backend starts without configuration errors.
- Database connectivity is healthy.
- Required Redis and Elasticsearch services are reachable.
- Login and role permissions work as expected.
- The relevant API endpoints respond correctly.

## 13. Database and Migrations

ThreatLens uses PostgreSQL for relational application data and SQLAlchemy for database access.

Alembic is used to manage schema migrations.

Before running migrations, ensure that the correct database connection is configured and that a backup exists for any database containing important data.

Check the migration instructions and Alembic configuration in the repository before applying migrations to production.

Do not include production database credentials or database dumps containing sensitive information in the submission ZIP.

## 14. API Documentation

The backend exposes an API through FastAPI.

- **Deployed API:** https://sentinova-threatlens-api-p9t0.onrender.com
- **Interactive API documentation:** https://sentinova-threatlens-api-p9t0.onrender.com/docs

The API documentation can be used to inspect available endpoints, schemas, and request/response formats. Protected endpoints require appropriate authentication and permissions.

Do not share access tokens when submitting API examples or screenshots.

## 15. Testing

The backend uses Pytest for automated tests.

From the repository root, activate the virtual environment and run:

```bash
python -m pytest backend/tests -q
```

Run frontend checks using the scripts defined in `frontend/package.json`. For example, if the relevant scripts exist:

```bash
cd frontend
npm run lint
npm run build
```

Record the actual test results from the final submitted commit. Do not claim that every test or workflow passes unless it has been verified.

Recommended manual test areas include:

- Authentication and logout.
- User creation and role assignment.
- Indicator operations.
- Alert triage and escalation.
- Incident workflows.
- Feed polling.
- Audit logging and exports.
- API authentication and authorization.
- WebSocket connectivity, if enabled.

## 16. Deployment

The demonstration application is hosted on Render.

| Service | Link |
|---|---|
| Frontend web service | https://sentinova-threatlens-frontend.onrender.com |
| Backend API service | https://sentinova-threatlens-api-p9t0.onrender.com |
| Backend API documentation | https://sentinova-threatlens-api-p9t0.onrender.com/docs |

Deployment requires appropriate environment variables, a reachable database, and correctly configured service URLs.

The application may take time to start if a hosted service is idle. External feeds may also depend on API limits, network access, and provider availability.

## 17. Security Considerations

Security is an important part of a cyber threat intelligence platform.

The project uses JWT-based authentication and role-based access control. The following practices should be maintained during development, deployment, and evaluation:

- Keep secrets outside source code.
- Use strong, unique passwords for demonstration accounts.
- Never commit `.env`, live tokens, API keys, or production connection strings.
- Store password hashes rather than plaintext passwords.
- Validate user input and enforce permissions on the backend.
- Use HTTPS for deployed application traffic.
- Keep dependencies updated and review security advisories.
- Avoid exposing sensitive values in application logs.
- Restrict access to administrative functions.
- Use synthetic or non-sensitive data for demonstrations.

Security features should be described as implemented only after they have been verified in the current version.

## 18. Known Limitations

Document any remaining issues discovered during final verification here.

Items to verify before submission include:

- Real-time alert WebSocket authentication and connection status.
- Readable error messages in the user-management interface.
- Successful execution of each role's permitted workflows.
- Actual feed ingestion results for each configured provider.
- Final automated test and production build results.

Update this section after testing. Remove resolved issues and retain any known limitations that remain in the submitted version.

## 19. Future Enhancements

Potential future enhancements, consistent with the PRD's direction, include:

- More comprehensive STIX 2.1 and TAXII 2.1 interoperability.
- Expanded threat intelligence enrichment integrations.
- More advanced indicator relationship analysis.
- Improved MITRE ATT&CK mapping and threat-hunting workflows.
- Enhanced executive reporting and scheduled exports.
- Stronger real-time notification and alert-routing capabilities.
- Multi-factor authentication for privileged accounts.
- More comprehensive audit and security monitoring.
- Automated dependency and container vulnerability scanning.
- Additional performance, reliability, and authorization tests.

These are proposed enhancements, not claims that every capability is currently implemented.

## 20. Project Structure

The repository is organized into separate backend and frontend components.

```text
Sentinova-ThreatLens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   └── lib/
│   └── package.json
├── .env.example
├── .gitignore
├── requirements.txt
├── docker-compose.yml
└── README.md
```

This is a representative structure. Preserve the actual folders and files present in the submitted repository; do not create empty directories merely to match this example.

## 21. Acknowledgements

ThreatLens was developed as an individual engineering project for internship demonstration and professional learning.

The implementation follows the product scope and design direction established in the Sentinova ThreatLens Product Requirements Document (PRD). The project brings together frontend development, backend API development, database integration, threat intelligence workflows, authentication, authorization, and deployment.

---

**End of README**

