# CampusFlow AI

CampusFlow AI is a full-stack placement-operations application for a college
placement cell. It helps coordinators turn job descriptions into reviewed
requirements, find students who meet eligibility rules, explain each match,
manage a candidate pipeline, and prepare communication drafts. Students can
maintain their academic and skills profiles.

The guiding principle is: **AI assists with extraction; a person approves the
criteria; deterministic code evaluates eligibility.** AI does not make a
hiring decision.

## Product walkthrough

1. A student registers and maintains one placement profile linked to their
   account.
2. A coordinator creates a job opening and defines the company, role,
   description, deadline, and any known eligibility fields.
3. The backend extracts structured requirements from the description. It uses
   the configured local Ollama model when available and a local fallback
   parser when it is not.
4. The coordinator reviews and approves the extracted requirements. Approval
   opens the job; extracted suggestions are not silently treated as approved.
5. The matching service evaluates all student profiles against the approved
   branch, CGPA, graduation-year, and skill rules. The coordinator sees
   eligibility explanations and failures.
6. Coordinators can record feedback, move candidates through pipeline stages,
   create and edit template-based communications, and inspect job activity.
7. Communication is not delivered by the application. Coordinators copy or
   otherwise send the reviewed text themselves and explicitly mark it sent.

## Features

- Student account registration, login, and profile create/read/update.
- Coordinator/admin job create, read, update, delete, and deadline closure.
- Requirement extraction, normalization, human review, and approval.
- Explainable, deterministic matching with branch, CGPA, graduation-year,
  must-have skill, and preferred-skill constraints.
- Case-, punctuation-, separator-, and order-insensitive skill token matching.
- Per-job candidate feedback and pipeline tracking.
- Built-in communication templates that work without Ollama.
- Coordinator student CSV import/export with per-row import errors.
- Audit history for job and candidate actions.
- JWT authentication, role authorization, request validation, NoSQL operator
  sanitization, and centralized API error handling.
- Node built-in test runner and synthetic matcher evaluation scripts.

## Architecture and documentation

- [Architecture overview](docs/architecture.md): components, request flows,
  matching process, and operational boundaries.
- [Database design](docs/database.md): collections, fields, references,
  constraints, and lifecycle.
- [Postman guide](docs/postman.md): import, authentication, variables, and
  endpoint order.
- [Interview deep dive](docs/interview-questions.md): detailed project
  walkthrough, design decisions, limitations, and interview questions with
  sample answers.
- [Postman collection](postman/campusflow-ai.postman_collection.json) and
  [local environment](postman/campusflow-ai.postman_environment.json).

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Axios, Vite |
| API | Node.js, Express 5 |
| Persistence | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Validation/security middleware | express-validator, Helmet, CORS, request sanitization |
| Local requirement extraction | Ollama when configured; deterministic fallback parser otherwise |
| Communication drafts | Local JavaScript templates; no email provider integration |
| Tests | Node.js built-in test runner |

## Prerequisites

- Node.js 20.19 or newer (the installed Vite toolchain may require a newer
  supported Node release).
- npm.
- MongoDB running locally or a reachable MongoDB deployment.
- Ollama is optional. It is used for job-description requirement extraction;
  if it is unavailable, extraction falls back to the local parser.

This repository uses local MongoDB setup and does not require Docker Compose.

## Run locally (PowerShell)

Open separate terminals for the API and frontend.

### API

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env`: set a unique, long `JWT_SECRET`; check `MONGODB_URI`;
optionally set `OLLAMA_BASE_URL` and `OLLAMA_MODEL`; and set `CLIENT_URL` to the
frontend origin. Then start the API:

```powershell
npm run dev
```

The API listens on `http://localhost:5000` by default. Verify it at
`http://localhost:5000/api/health`. Starting the server requires MongoDB.

### Frontend

```powershell
cd client
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally
`http://localhost:5173`). The frontend API base URL is currently configured in
`client/src/api/apiClient.js`.

### Demo data

To create or update the reserved demo accounts and jobs:

```powershell
cd server
npm run seed:demo
```

The seed script is designed to manage its named demo accounts, their profiles,
and named demo jobs; it does not clear unrelated users, profiles, or jobs.
Demo student usernames are `stud1` through `stud20` at `campusflow.ai`; the
coordinator account is `coordinator@campusflow.ai`. The seed script currently
uses a shared demo password (`Password123!`). Change or avoid these credentials
outside local demonstrations; never use them as real credentials.

Public registration always creates a `STUDENT`. Coordinator/admin access is
provisioned separately (for example by the local demo seed or an administrator);
the public registration endpoint does not accept a role.

## Student CSV

CSV import/export is available to coordinator/admin users. The required header
row is:

```csv
email,fullName,branch,graduationYear,cgpa,skills
```

Email must identify an existing `STUDENT` account. Import creates or updates
that account's profile; it does not create user accounts, change passwords, or
import experience/resume text. Multiple skills in a cell may be separated by
semicolons or vertical bars. Invalid rows are returned as row-level errors;
valid rows can still be imported. Imports are limited to 1 MB and 1,000
student rows. Export returns the same six profile columns.

## Matching rules

- Branch, CGPA, and graduation year constraints are applied when the
  corresponding job requirement is supplied. Each supplied constraint must
  pass.
- A job may declare **must-have skills** and **preferred skills**. Every
  must-have skill must be present. The candidate must match a fraction of the
  preferred skills that is **strictly greater than** the configured threshold.
  With a 50% threshold and four preferred skills, matching exactly two is not
  enough; three are needed.
- Older jobs that only have a flat `extractedRequirements.skills` list treat
  those skills as preferred skills with a default threshold of 50%.
- Matching lowercases and tokenizes skill strings and common separators so
  values such as `Java SQL`, `SQL, Java`, and `java/sql` compare by skill
  tokens rather than entered order.
- Reasons and failures are returned separately to make the result auditable.
- When no supplied constraint produces a passing reason, a candidate is not
  marked eligible by default.

## AI and communications boundaries

Requirement extraction is advisory. It makes a local Ollama request when
available; extraction failures are logged and handled with the local fallback
parser. The extracted result is shown for coordinator review and is not
persisted as approved requirements until the approval endpoint is called.
Fallback extraction is heuristic and should also be reviewed.

Communication drafts use fixed local templates. They do not require Ollama.
The application does **not** connect to an email account, send email, or
confirm delivery. A coordinator reviews/edits the text and uses their own
process to contact candidates before marking the draft as sent in CampusFlow.

## Tests and local evaluation

```powershell
cd server
npm test
```

The test suite uses Node's built-in test runner and does not require MongoDB for
the covered service and API validation tests.

Generate a synthetic evaluation dataset and run the rule-agreement check:

```powershell
cd server
npm run generate-dataset
npm run evaluate
```

These scripts operate on generated files under `docs/` and do not update
MongoDB. The reported rule agreement checks the matcher against the expected
documented rules; it is not a measure of real-world hiring quality or model
accuracy. Generated evaluation artifacts are local outputs.

For a production frontend bundle and lint:

```powershell
cd client
npm run build
npm run lint
```

## API

The REST API is rooted at `/api`. Protected requests use
`Authorization: Bearer <JWT>`. See the collection and [Postman guide](docs/postman.md)
for request bodies and an executable workflow.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | API health |
| `POST` | `/auth/register` | Public | Register student account |
| `POST` | `/auth/login` | Public | Get JWT and user role |
| `GET` | `/auth/protected-test` | Authenticated | Verify bearer token |
| `GET` | `/auth/coordinator-test` | Admin/coordinator | Verify coordinator role |
| `GET`, `POST` | `/students/profile` | Student | Read/create own profile |
| `PATCH` | `/students/profile` | Student | Update own profile |
| `POST` | `/students/import` | Admin/coordinator | Import profile CSV text |
| `GET` | `/students/export` | Admin/coordinator | Download profiles CSV |
| `GET`, `POST` | `/jobs` | Authenticated read; admin/coordinator create | List/create job openings |
| `GET`, `PATCH`, `DELETE` | `/jobs/:jobId` | Authenticated read; admin/coordinator write | Read/update/delete one opening |
| `POST` | `/jobs/:jobId/extract-requirements` | Admin/coordinator | Extract unapproved suggestions |
| `POST` | `/jobs/:jobId/approve-requirements` | Admin/coordinator | Save reviewed requirements and open job |
| `GET` | `/jobs/:jobId/matches` | Admin/coordinator | Evaluate students and include tracking |
| `GET` | `/jobs/:jobId/audit` | Admin/coordinator | Read latest job/candidate activity |
| `PATCH` | `/jobs/:jobId/candidates/:studentId` | Admin/coordinator | Update stage or match feedback |
| `POST` | `/jobs/:jobId/candidates/communications` | Admin/coordinator | Create and persist drafts for 1–50 students |
| `PATCH` | `/jobs/:jobId/candidates/:studentId/communication` | Admin/coordinator | Save edited draft |
| `POST` | `/jobs/:jobId/candidates/:studentId/communication-sent` | Admin/coordinator | Mark an existing draft sent |
| `POST` | `/communications/draft` | Admin/coordinator | Generate one local template draft without persisting candidate tracking |

Job listing supports `page`, `limit` (maximum 100), and `status` query
parameters. The APIs use JSON response envelopes with `success`, optional
`message`, and `data`; validation errors include field-level details. CSV
export is a `text/csv` attachment rather than a JSON envelope.

## Known scope and limitations

- This is a local-first portfolio application, not a deployed, multi-tenant
  placement platform.
- There is no application-submission record or student application workflow;
  candidate tracking records coordinator review state per job/student pair.
- Email is not integrated. Marking a communication sent is a manual coordinator
  action and is not delivery verification.
- The fallback requirement parser is heuristic, not a trained classifier.
- Matching is a transparent rules engine, not a ranking or recommendation
  model. It evaluates all profiles and provides pass/fail explanations.
- The frontend stores the JWT in browser local storage. For production,
  evaluate an HttpOnly cookie/session design, rate limiting, account recovery,
  operational monitoring, deployment secrets, and privacy/retention controls.
