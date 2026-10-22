# CampusFlow AI: Interview Deep Dive

This guide is a project walkthrough and a bank of questions with technically
accurate sample answers. Personalize the examples and be clear about what is
implemented versus what would be a production enhancement.

## 60–90 second project introduction

> CampusFlow AI is a full-stack placement-operations application built for a
> college placement cell. Students register and maintain a profile containing
> branch, graduation year, CGPA, and skills. Coordinators create job openings,
> extract possible requirements from a description using local Ollama or a
> local fallback parser, review those requirements, and explicitly approve
> them. A deterministic rules engine then checks every student profile and
> explains each eligible or ineligible result. Coordinators can also manage a
> candidate stage, record match feedback, import/export student profile CSVs,
> create template-based communication drafts, and view an audit history. The
> stack is React/Vite, Express, MongoDB/Mongoose, and JWT. The key design
> choice is separating uncertain AI extraction from human approval and
> deterministic matching. It is a local-first portfolio project; email is not
> sent by the application and the matching logic is not an AI ranking model.

## Architecture and product questions

### 1. What problem does CampusFlow solve?

Placement coordinators often collect job requirements and student information
in separate documents and spreadsheets. That makes eligibility decisions
repetitive and hard to explain consistently. CampusFlow puts job intake,
requirement review, explainable eligibility checks, candidate tracking, CSV
operations, and communication preparation into one workflow. It is a support
tool for coordinators, not an automated hiring authority.

### 2. Walk me through the architecture.

The React SPA uses React Router and Axios. It calls an Express 5 REST API over
JSON and includes a JWT bearer token on authenticated requests. Express
middleware handles security headers, CORS, body parsing, logging, and request
sanitization. Routes apply authentication, role authorization, and
express-validator rules before controllers call services and Mongoose models.
MongoDB stores accounts, student profiles, job openings, candidate tracking,
and audit events. Local Ollama is optional and only involved in requirement
extraction; communication templates and matching run in application code.
See [architecture.md](architecture.md).

### 3. Why did you separate the frontend and backend?

The separation gives the UI and API clear contracts. The same API can be
exercised through Postman or another client, backend validation and role checks
do not depend on a particular screen, and UI work can evolve without putting
database access in browser code. It also makes service-level and API tests
possible without rendering the frontend.

### 4. What is the end-to-end job workflow?

A coordinator creates a job with metadata and any known fields. The extraction
endpoint returns structured suggestions but does not approve them. The
coordinator reviews/edits those values and calls the approval endpoint. The
backend normalizes and stores approved `extractedRequirements`, opens the job,
and logs an audit event. Match requests evaluate current profiles against
current approved requirements; results are calculated at request time rather
than persisted as a stale snapshot.

### 5. What does AI do, and what does it not do?

Local Ollama can extract structured fields such as skills, CGPA, eligible
branches, graduation years, location, and work mode from free text. If Ollama
is unavailable or its request fails, a heuristic fallback parser is used.
Either output is only a suggestion. A coordinator must approve requirements.
Eligibility is deterministic JavaScript, not model output. The project does
not rank candidates with an ML model or make final hiring decisions.

### 6. Why is human approval important?

Natural-language job descriptions may be ambiguous, omit a constraint, or
contain statements that a parser misunderstands. Persisting extraction output
as binding criteria would turn an uncertain inference into an opaque decision.
Separating extraction from approval gives a responsible person a chance to
correct it and creates an audit event for the approved requirement set.

### 7. What happens when Ollama is offline?

The API still starts without Ollama. Requirement extraction catches Ollama
request failures, logs the issue, and runs the local fallback parser. The
fallback is intentionally simple and may miss synonyms or complex prose, so
the coordinator still reviews the result. Communication generation uses
fixed local templates and does not call Ollama at all.

### 8. Does CampusFlow send email?

No. It creates a subject/body draft and persists it for a candidate tracking
record. The coordinator reviews and edits it. The app has no SMTP credentials,
email-provider integration, connected email account, or delivery status.
Marking a message sent is a manual tracking action, not proof that delivery
occurred.

### 9. What is the difference between a match and an application?

A match is a computed comparison between a student profile and a job's current
approved requirements. It is recalculated on demand. Candidate tracking is
coordinator-authored workflow state for a job/profile pair. There is no
student application-submission record or application lifecycle in the current
data model.

### 10. How does role routing work in the UI?

`App.jsx` checks the token and role stored in local storage. Public-only pages
redirect signed-in users, protected pages redirect signed-out users, and
`/dashboard` renders a coordinator/admin or student dashboard based on role.
These guards are for navigation and UX. The API independently verifies
authorization; a user cannot gain coordinator access merely by manipulating a
frontend route.

## Eligibility and data questions

### 11. Explain the eligibility algorithm precisely.

For each student, `checkEligibility` gathers reasons and failures. If a job
supplies branches, the student's branch must match one; if it supplies a
minimum CGPA, the student's value must meet it; and if it supplies graduation
years, the student's year must be included. With configured matching rules,
all must-have skill tokens are required, and the fraction of preferred skill
tokens present must be strictly greater than the configured threshold. A
legacy flat skill list is treated as preferred skills with a default threshold
of 0.5. A candidate is eligible only if there are no failures and at least one
passing reason.

### 12. What does “more than 50% skills matched” mean?

The preferred-skill calculation is `matched preferred count / configured
preferred-skill count > threshold`. It is not `>=`. At a 0.5 threshold, two
matches out of four is exactly 50% and fails; three out of four passes the
skill threshold. Must-have requirements are separate: a candidate missing any
must-have skill fails regardless of the preferred ratio.

### 13. Why have both must-have and preferred skills?

Some skills are hard requirements while others are desirable. A single ratio
would allow a candidate to miss a critical skill and compensate with optional
ones. Must-haves preserve the non-negotiable condition; the preferred ratio
allows flexibility among desirable skills.

### 14. How do skill normalization and ordering work?

The matcher lowercases text, normalizes common punctuation/separators, splits
on whitespace, and deduplicates tokens. Thus `Java SQL`, `SQL, Java`, and
`java/sql` compare as the tokens `java` and `sql`; input order does not matter.
Known spellings like `node.js`/`NodeJS` and `C#`/`csharp` have explicit
normalization. This is token matching, not a general semantic synonym engine:
it does not infer that two unrelated phrases mean the same skill.

### 15. Is branch matching fuzzy?

No. Branch matching trims and lowercases the values and then compares the
student's branch to the supplied allowed branch list. It does not currently
apply the skill tokenization logic or a configurable alias dictionary to
branches. Data entry should use consistent branch names or a future feature
should introduce canonical branch IDs/aliases.

### 16. Are location and work mode used in eligibility?

They are extracted, normalized, stored, and available to review, but the
current `checkEligibility` implementation does not evaluate location or work
mode. I would be explicit about that limitation rather than claiming those
fields affect match results. They could be added as structured constraints
once the product defines candidate preferences and acceptable equivalence
rules.

### 17. What happens if a job has no constraints?

The matcher requires at least one passing reason as well as no failures, so an
empty set of constraints does not automatically label every student eligible.
This is a conservative behavior that avoids claiming a match without evidence.
A production product could instead reject approval of an empty requirement
set.

### 18. Are match results stored?

No. The endpoint reads the job and all student profiles and recalculates
results. This keeps results consistent with current profile data without
maintaining a second copy, but it means repeated calls repeat work and results
can change when a profile or job changes. A scaled version could cache results
with explicit versioning/invalidation or persist snapshots for audit purposes.

### 19. What are the MongoDB collections?

There are five core collections: `users`, `studentprofiles`, `jobopenings`,
`candidatetrackings`, and `auditlogs`. A user may own one student profile; a
user may create jobs; a candidate tracking record references one job and one
profile; audit events reference the actor and affected entity. Full field and
index details are in [database.md](database.md).

### 20. Why separate User and StudentProfile?

Authentication identity and placement-specific data have different ownership
and access rules. `User` stores normalized email, password hash, and role.
`StudentProfile` stores branch, academic data, and skills. A unique `userId`
reference ensures at most one profile per student account without adding
student-only fields to coordinator records.

### 21. Why use a compound unique index on candidate tracking?

The same student can be considered for many jobs, and each job can have many
students. `{ jobId, studentId }` is the identity of the workflow record. A
unique compound index prevents duplicate workflow records for that pair,
including races that an application-only “check then insert” cannot safely
prevent.

### 22. Why are requirements embedded in a JobOpening?

Approved criteria are owned and read with the job, have a bounded structured
shape, and are usually fetched together with that job. Embedding avoids an
extra lookup and keeps the current job definition coherent. Candidate tracking
and audit records are separate because they are independently queried,
potentially numerous, and have distinct lifecycles.

### 23. Why is `matchingRules` stored separately from extracted requirements?

Extracted requirements are the normalized fields reviewed from the job
description; matching rules configure how skill criteria are interpreted,
including must-have/preferred lists and threshold. They are now stored as a
top-level job subdocument because create/edit clients submit them separately
and the matcher reads them separately. A compatibility field remains inside
older extracted requirement documents so existing data can still be read.

### 24. How do CSV import and export work?

The coordinator UI reads a selected file as text and posts `{ csv: "..." }`.
The backend parses quoted CSV fields, validates required headers and each row,
normalizes email, and looks up an existing student account. Valid rows
upsert profile fields; invalid rows are accumulated as errors while import
continues. Export loads profiles with their emails, escapes commas/quotes/
newlines, and responds as a CSV attachment. It does not create accounts or
change credentials.

### 25. Is CSV import transactional?

No. It processes rows independently so one bad row does not discard valid
rows. If the process fails after some writes, those prior writes may already
be committed. The response reports row-level validation/account errors, but
there is no all-or-nothing transaction. A future implementation could stage
and validate all rows, then use a MongoDB transaction where deployment
topology supports it.

### 26. What audit data is stored?

AuditLog stores actor ID, action code, entity type/ID, flexible metadata, and
timestamps. Job history combines events directly targeting a job with
candidate events whose metadata includes the job ID. The API limits the
history view to the newest 100. Audit writes are currently best-effort so
failure to record an event does not roll back the primary operation; that
tradeoff should be reconsidered if audit completeness becomes a compliance
requirement.

## API, security, and reliability

### 27. How does authentication work?

Registration validates fields and hashes a password with bcryptjs using 12
salt rounds. Login lowercases/trims email, explicitly selects the normally
excluded password hash, compares the submitted password with bcrypt, and
returns a signed JWT. The token contains `userId` and `role` and expires after
the configured `JWT_EXPIRES_IN` (default one day). Protected requests send it
as `Authorization: Bearer <token>`.

### 28. How are roles enforced?

Routes first authenticate the token, then call `authorize` with allowed roles
where needed. Student profile endpoints additionally use the authenticated
user ID to select their own profile. Job writes, imports/exports, matching,
candidate tracking, audit history, and coordinator communications require
`ADMIN` or `COORDINATOR`. Public user registration always assigns `STUDENT`.

### 29. What security middleware is used?

Helmet sets common HTTP security headers; CORS restricts the browser origin to
configured `CLIENT_URL`; express-validator rejects malformed inputs; the
sanitizer recursively removes keys starting with `$` or containing `.` to
reduce NoSQL operator injection risk. Passwords are bcrypt hashes and are
excluded from ordinary User queries. These are baseline controls, not a
complete production security certification.

### 30. What are the security limitations?

The frontend stores JWTs in local storage, so an XSS vulnerability could
expose a token. The app does not currently provide rate limiting, password
reset/MFA, production monitoring, or institution-level tenant isolation.
Production use should assess HttpOnly secure cookies and CSRF defenses, strict
deployment CORS, rate limiting, secret rotation, audit retention, privacy
controls, and a threat model.

### 31. How are errors represented?

Route validation returns a 400 response with a general validation message and
field-level error details. The global handler maps MongoDB duplicate key to
409, Mongoose validation to 400, and CastError to invalid-ID 400; other errors
use their status when available or 500. Responses use a `success` boolean and
message/data fields where appropriate. Unexpected errors are logged.

### 32. What happens when MongoDB is unavailable?

`server.js` awaits the MongoDB connection before calling `app.listen`. A
connection error is logged and exits the process rather than starting an API
that cannot serve its data-backed routes. The health endpoint is available
without a DB in app-level tests, but the normal server startup requires the
database.

### 33. How is job deadline closure handled?

When jobs are listed or retrieved, the controller closes `OPEN` jobs whose
deadline is earlier than the current UTC day. Job updates also run expiration
maintenance. This is request-triggered; there is no cron job or background
scheduler, so a job's stored status may not flip until one of those calls
occurs.

### 34. How is the API tested without MongoDB?

The Node test runner imports the Express app and starts it on an ephemeral
port. Tests use signed test JWTs to cover health, authentication/role gates,
and request validation without invoking database-backed valid requests. Pure
matcher, template, and Mongoose model tests verify deterministic service and
schema behavior. Database integration tests against an isolated MongoDB
instance would improve coverage.

### 35. What would you monitor in production?

I would monitor API latency/error rates by route, MongoDB connection/pool
health and query latency, Ollama extraction latency/fallback frequency,
validation and authorization failures, CSV import row outcomes, and audit
write failures. Logs should use correlation IDs and avoid passwords, tokens,
resume text, and unnecessary student personal data.

## Frontend and implementation questions

### 36. Why React and Vite?

React supports reusable route/page UI and local state for forms, selection,
and async operations. Vite provides a straightforward local development
server and production bundler. The application is currently JavaScript rather
than TypeScript; adding static type checks would be a useful improvement as
the model/API contract grows.

### 37. What does the Axios interceptor do?

The shared API client reads `token` from local storage for each request and
sets an Authorization bearer header if present. Centralizing this avoids
duplicating auth header logic in every page. It currently hard-codes the API
base URL; production configuration should use a build-time environment
variable and validate the target origin.

### 38. How do you avoid trusting frontend validation?

The frontend performs useful UX checks such as CGPA/year validation, but
server validators and Mongoose schema constraints independently validate
requests and persisted data. The API is the security boundary. The UI can be
bypassed by any HTTP client, which is why Postman and browser behavior must
not be the only enforcement.

### 39. How does the user know why a candidate passed or failed?

The matcher builds `reasons`, `failures`, and `missingSkills` while evaluating
the same constraints used for its boolean. The UI displays passing reasons
and failures separately. This makes a mismatch diagnosable (for example,
branch passes but CGPA fails) and helps coordinators correct source criteria
instead of treating the result as a black box.

### 40. How is the campus image handled?

The login page uses a local static image in `client/public`, so the page
doesn't depend on a third-party image host at runtime. The image asset is a
user-provided DKTE campus photograph. The alt text describes the college
building for assistive technology.

## Tradeoffs, limitations, and next steps

### 41. What is the biggest technical limitation?

The matching endpoint loads all profiles and evaluates them in memory on every
request. That is simple and adequate for a small local demo, but it will not
scale to a large institution. I would first profile real data, then add
pagination/summary endpoints and indexes, and decide whether match results
need caching or versioned snapshots.

### 42. What is the biggest product limitation?

The model does not yet include student application submissions or a student
view of open opportunities/status. It supports coordinator matching and
candidate tracking. The next product step would be a defined application
workflow with consent, submission timestamps, withdrawal, and status
visibility.

### 43. How would you scale this for multiple institutions?

I would add an institution/tenant entity and a tenant ID to users, jobs,
profiles, tracking, and audit events. Every read and write would enforce the
tenant ID from authenticated claims/server-side membership, not trust a
request body. I would add compound indexes beginning with tenant ID, define
data separation and export boundaries, and test cross-tenant access
explicitly.

### 44. How would you improve requirement extraction?

I would measure extraction quality against a reviewed, representative set of
job descriptions, separately score each field, and track missing/incorrect
constraints. I would version prompts/models, validate model JSON against a
schema, retain provenance/confidence per field, and keep coordinator
correction as ground truth. The heuristic fallback should be evaluated
separately and should never be presented as model accuracy.

### 45. How would you improve the matching model?

First align every rule with placement policies and canonicalize branch/skill
identifiers rather than rely on free-text tokens. Add explicit behavior for
location/work mode only after clarifying requirements. Keep must-have
constraints distinct from preferences, version the rule set, add edge-case
tests and feedback analytics, and avoid replacing transparent rules with a
model unless there is a measurable need and a fairness review.

### 46. How would you add real email delivery?

I would use a transactional email provider behind a backend service, keep
credentials in a secret manager, validate sender/domain configuration, and
send only after explicit coordinator confirmation. I would store provider
message IDs and delivery/bounce events, make requests idempotent, handle
retry/backoff and rate limits, and provide consent/unsubscribe and audit
policies. Opening an email composer or setting a local status to `SENT` is not
a substitute for provider delivery tracking.

### 47. How would you make audit history reliable?

For a compliance-sensitive system, I would not swallow audit persistence
failure. I would either write the audit event in the same database transaction
as the primary update, or use a durable outbox pattern and retry. I would
define immutable event fields, redact sensitive metadata, restrict access,
and establish retention/export policy.

### 48. What concurrency issues could occur?

The unique compound index prevents duplicate tracking pairs, but concurrent
upserts can still surface a duplicate-key race that should be handled
idempotently. Two coordinators can overwrite the same job or draft because
there is no optimistic version check. A stronger design would use Mongoose
versioning/ETags and return a conflict when the resource changed since it was
read.

### 49. What happens if a job is deleted?

The current delete handler removes the job document and writes a delete audit
record. It does not cascade-delete candidate tracking or prior audit records,
so orphaned references may remain. Before production I would define retention
and referential lifecycle explicitly—soft deletion may be preferable where
auditable historical records must remain accessible.

### 50. How would you make CSV import safer for larger files?

The current API accepts up to 1 MB/1,000 rows in JSON and processes valid
rows individually. For larger datasets I would accept multipart streaming,
parse incrementally, validate into a staging collection/file, report a
downloadable error report, and use bulk writes with careful duplicate handling.
I would also consider formula-injection mitigation for exported cells that
begin with spreadsheet formula characters.

### 51. How would you improve observability?

Add structured logs with request IDs, route and actor identifiers (not
secrets), metrics for latency/error rate and dependency behavior, traces
across API/Mongo/Ollama, and alerts for sustained failures. Track fallback
frequency and coordinator corrections to understand extraction quality.
Provide a health/readiness distinction so orchestration can tell API process
health from database readiness.

### 52. How would you deploy it?

Build the React static bundle and serve it from an appropriate static host or
web server; deploy the Express API separately; use managed MongoDB or a
secured MongoDB service; inject secrets through the hosting platform; and set
strict CORS and frontend API configuration. Ollama can be omitted or deployed
as a private local service if extraction is desired. The current repo is
local-first and does not include a production deployment pipeline or Docker
Compose setup.

### 53. What tests would you add next?

I would add isolated MongoDB integration tests for profile ownership, job
creation/update/approval, matching with real persisted matching rules, CSV
upserts and partial failures, candidate tracking uniqueness, and audit
association. Frontend component tests should cover selection and draft
states; end-to-end tests should exercise the student and coordinator flows.
Security tests should verify every role/resource boundary and malformed
inputs.

### 54. What would you do if coordinators disagree with a match?

Capture structured feedback and a reason, which the app currently supports.
Then categorize disagreement: incorrect source profile, extraction/approved
criteria error, alias/normalization gap, or policy mismatch. Do not tune a
threshold blindly. Analyze a representative dataset with coordinators, update
the rule definitions, and add regression cases to prevent recurrence.

### 55. How would you evaluate fairness?

Start by determining which attributes are policy-approved and legally
appropriate. Test false-positive/false-negative and eligibility rates across
relevant groups only with lawful, consented, privacy-protected data. Audit
whether hard filters proxy for protected characteristics, review historical
bias, involve placement stakeholders, document limitations, and keep humans
accountable. No fairness evaluation is claimed by the current demo.

### 56. What did you learn from the matching-rules schema issue?

The API validators and frontend were sending `matchingRules` at the job root,
but the Mongoose schema originally declared it nested inside
`extractedRequirements`. This mismatch meant Mongoose strict schemas could
drop the root field even though validation accepted it. I aligned the schema
with the API contract and matcher, retained a legacy nested path for older
records, and added the schema shape to tests. It reinforced that request
validation, persistence schema, UI payloads, and read paths need contract
tests, not just visual verification.

### 57. How do you explain the test strategy?

Pure unit tests cover skill normalization, strict threshold boundaries,
required academic constraints, must-have behavior, and template content.
API tests start Express on an ephemeral port and cover health, role gates,
validation, and CSV preconditions without a database dependency. Separate
template tests verify offline draft generation, and model tests verify
matching-rule schema persistence. Build and lint cover the frontend. The main
gap is database-backed and browser end-to-end coverage.

### 58. What would you prioritize next?

I would prioritize (1) Mongo-backed integration tests for saved matching
rules and the coordinator workflow, (2) an end-to-end demo deployment with
safe seeded data and clear setup, (3) pagination and query profiling before
growing the student population, and (4) explicit application/communication
delivery scope decisions with placement coordinators. I would not add email
delivery or ML ranking just for technology breadth.

## Useful concise answers

### “Why should we hire you based on this project?”

> I can take an operational workflow from a stakeholder problem through data
> modeling, API design, a usable frontend, validation, and tests. I made the
> decision path explainable, separated uncertain extraction from deterministic
> eligibility, and documented the parts that are intentionally not production
> features. I can also adapt the system to a customer's vocabulary and
> workflow while keeping the core decision behavior testable.

### “What would you change if starting again?”

> I would define the API and data contracts first, including the location of
> matching rules and whether candidate tracking represents an application.
> Then I would add contract/integration tests before building all screens. I
> would keep extraction, approval, and deterministic evaluation as separate
> stages, but would version the approved criteria and track changes explicitly.

### “What is your strongest engineering decision?”

> The strongest decision is that AI extraction never silently becomes an
> eligibility decision. The coordinator reviews the criteria, and a small
> deterministic service applies the rules and produces explanations. That
> separation improves trust, debuggability, and testability.

### “What is not finished?”

> It is not a production multi-tenant system. It has no formal application
> submission flow, real email delivery, account recovery, rate limiting,
> production observability, or database-backed end-to-end test suite. Matching
> is calculated across all profiles on each request, and requirement fallback
> parsing remains heuristic.

## Practice checklist

- Explain must-have versus preferred requirements and the strict threshold
  boundary without mixing them up.
- Be able to point to one eligibility test for normalization, one for
  threshold behavior, and one for mandatory branch/CGPA/year checks.
- Show how extraction output is reviewed before approval.
- Explain that a local template draft is not a sent email.
- Distinguish `StudentProfile`, `CandidateTracking`, and a formal application.
- Discuss the JWT/local-storage tradeoff and API role checks.
- State what is local-only, seeded, heuristic, untested, or not implemented.
- For every proposed improvement, explain the user need and measurable
  success criteria rather than adding technology for its own sake.
