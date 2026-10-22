# CampusFlow AI frontend

The frontend is a React single-page application built with Vite. It serves the
student registration/profile flow and coordinator job, matching, candidate
tracking, and communication workflows.

## Development

From this directory:

```powershell
npm install
npm run dev
```

The app normally runs at `http://localhost:5173`. The API URL is currently
defined in `src/api/apiClient.js` as `http://localhost:5000/api`; the Express
API and MongoDB must be running for authenticated data pages.

## Frontend commands

```powershell
npm run build
npm run lint
npm run preview
```

`build` creates the production bundle in `dist/`; `lint` runs ESLint;
`preview` serves an existing production build locally.

## Main structure

- `src/App.jsx`: shared navigation, route table, protected/public-only guards,
  and role-based dashboard selection.
- `src/api/apiClient.js`: Axios base URL and bearer-token request interceptor.
- `src/pages/LoginPage.jsx`, `RegisterPage.jsx`: authentication screens.
- `src/pages/StudentDashboard.jsx`, `StudentProfilePage.jsx`: student profile
  workflows.
- `src/pages/CoordinatorDashboard.jsx`, `JobCreatePage.jsx`,
  `RequirementReviewPage.jsx`, `StudentMatchPage.jsx`: coordinator workflows.
- `src/App.css`, `src/index.css`: shared and global presentation.
- `public/dkte-campus.png`: user-provided DKTE campus photo used by the login
  page.

The client stores the JWT and role in local storage. Frontend route guards are
for navigation and user experience; authorization must and does also happen in
the API. The client does not connect to an email account or send email.

For full setup, API details, and cross-layer architecture, see the root
[README](../README.md) and [architecture](../docs/architecture.md).
