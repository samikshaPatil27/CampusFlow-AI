# Postman API Guide

The Postman collection exercises the CampusFlow REST API. The API must be
running and connected to MongoDB for data-backed requests.

## Import and environment

1. In Postman, import `postman/campusflow-ai.postman_collection.json`.
2. Import `postman/campusflow-ai.postman_environment.json` and select the
   **CampusFlow AI Local** environment.
3. Confirm `baseUrl` is `http://localhost:5000/api`.
4. Register a student with **Auth → Register Student**, then log in through
   **Auth → Login**. Successful login saves the returned JWT into the
   environment's `token` variable.
5. Coordinator-only calls require a `COORDINATOR` or `ADMIN` account. Public
   registration creates only `STUDENT` accounts. For a local demo, the
   coordinator account can be created by `npm run seed:demo` from `server`;
   the demo credentials are local-only and are documented in the root README.
6. The collection's shared bearer authentication reads `{{token}}`. Do not
   export or commit an environment containing a real token/password.

The collection sets `jobId` after **Jobs → Create Job**. Set `studentId`
manually from **Jobs → Get Matches** (choose the profile's `studentId`) before
running candidate-specific examples.

## Suggested end-to-end sequence

### Student identity and profile

1. Call **Auth → Register Student** once for the test email. A duplicate email
   returns HTTP 409; registration does not log in automatically.
2. Call **Auth → Login** using that student's credentials. The test script
   stores the JWT in `token`.
3. Call **Students → Create Profile**, then use **Get My Profile** and
   **Update My Profile** to verify profile access.

### Coordinator job and matching

1. Log in as a coordinator/admin. This replaces `token` with the coordinator
   token; keep the student token separately if testing student APIs again.
2. Call **Jobs → Create Job**. The returned `_id` is saved as `jobId`.
3. Call **Jobs → Extract Requirements**. This returns suggestions only and
   does not approve/save them. Ollama may be used locally; the backend has a
   heuristic fallback if it is unavailable.
4. Call **Jobs → Approve Requirements** with reviewed criteria. The job is
   opened and requirements saved.
5. Call **Jobs → Get Matches**. Choose any returned profile's `studentId` and
   save it in the environment.
6. Use **Jobs → Update Candidate Stage**, **Record Match Feedback**,
   **Generate Candidate Drafts**, **Edit Candidate Draft**, **Mark Candidate
   Communication Sent**, and **Get Job Audit History** to exercise the
   coordinator workflow.

The create request includes top-level `matchingRules`; all must-have skills
are mandatory and the preferred skill threshold is a ratio from zero to one.
For example, `0.5` means a candidate must match strictly more than half of the
preferred skill list.

### CSV

- **Students → Import CSV** sends raw CSV text in JSON as `{"csv":"..."}`.
  The email column must correspond to an existing student account. Import
  updates only the profile; it does not create accounts.
- **Students → Export CSV** returns a `text/csv` file. Use Postman's Save
  Response option to save it.

## Auth and response behavior

- Protected requests use `Authorization: Bearer {{token}}`.
- Missing/invalid token returns 401; wrong role returns 403.
- Validation failures return 400 with a message and field errors.
- A successful JSON response generally has `success: true`, optional
  `message`, and a `data` object. CSV export is a file response.
- `jobId` and `studentId` must be valid MongoDB ObjectId strings.
- The batch candidate communication route accepts between 1 and 50 student
  IDs per call.
- Marking a draft `SENT` records a coordinator action; it does not send an
  email or verify delivery.

## Collection organization

| Folder | Requests |
|---|---|
| Health | API health |
| Auth | Register, login, protected-role checks |
| Students | Profile CRUD and CSV import/export |
| Jobs | CRUD, extraction, approval, matching, tracking, drafts, audit |
| Communications | Standalone local template draft |

## Troubleshooting

- **Connection refused:** start the API with `npm run dev` from `server` and
  verify MongoDB is available.
- **401:** log in again and check that the selected environment is active and
  `token` contains the latest JWT.
- **403:** use a coordinator/admin token for coordinator endpoints; a public
  registration account is a student.
- **404 for job/student:** confirm the collection has saved the `jobId` and
  that `studentId` came from the current job's match response.
- **Duplicate registration:** use a fresh email or log in to the existing
  account.
- **No match:** inspect response `failures`, profile values, approved job
  criteria, and top-level matching rules.
- **Extraction differs from expected:** extraction is an advisory AI/fallback
  step. Review and adjust its result before approval.
