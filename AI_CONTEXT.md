# AccountaBuddy AI Context

This file is a short project map for future AI/Codex sessions. `.md` means Markdown: a plain text file that supports headings, bullets, links, and code blocks.

Future AI/Codex sessions should read this file first before making project changes.

## Project Purpose

AccountaBuddy is a web app for connecting people with online study or work accountability partners.

Core product idea:

- Users sign up or log in.
- Users create "looking for partner" tickets/submissions that describe their goals, availability, timezone, preferred communication methods, and what they want in a buddy.
- Other users browse/filter the submissions board.
- Users can send connection requests, accept/cancel/decline requests, and then chat.

The current implementation is partly backend-backed and partly local-only:

- Auth is implemented against Express + PostgreSQL, including username, email, password hashing, and JWT creation.
- Backend submissions support creating, deleting, and listing submission tickets through Express + PostgreSQL.
- Submissions, requests, conversations, viewer identity, and chat messages currently live in browser `localStorage` through React context.
- The questionnaire has TODO comments for replacing local/frontend submission behavior with Express backend calls.

## Tech Stack

Frontend:

- React 19
- Vite 7
- React Router DOM 7
- React Hot Toast
- Firebase was removed from the frontend because the current app does not use it.

Backend:

- Node.js
- Express 5
- PostgreSQL via `pg`
- bcrypt for password hashing
- jsonwebtoken for JWT auth
- dotenv for environment variables
- nodemon for local backend development
- drizzle packages are installed, but current DB code uses raw `pg` queries and a SQL migration file.

## Repository Structure

Root:

- `README.md` - recruiter-friendly portfolio README with project summary, stack, setup, security notes, and roadmap.
- Root `package.json` and `package-lock.json` were removed because they were unused. Main app package scripts live in `frontend/package.json` and `backend/package.json`.
- `.gitignore` - ignores `node_modules/` and `.env`.

Frontend:

- `frontend/src/main.jsx` - React entrypoint. Wraps the app in `BrowserRouter`, `SubmissionsProvider`, and `Toaster`.
- `frontend/src/App.jsx` - route table and top-level layout. Always renders `Navbar`.
- `frontend/src/index.css` and `frontend/src/App.css` - global styling.
- `frontend/src/contexts/SubmissionsContext.jsx` - localStorage-backed data layer for submissions, requests, conversations, messages, and anonymous viewer id.
- `frontend/src/components/SignUp.jsx` - signup form with username text input, email input, password, and confirm password. Calls `${import.meta.env.VITE_API_URL}/auth/signup` with `{ username, email, password, confirmPassword }`, stores JWT in `localStorage.token`, stores the submitted username in `localStorage.username`, and navigates to `/questionnaire`.
- `frontend/src/components/LogIn.jsx` - login form, calls `${import.meta.env.VITE_API_URL}/auth/login`, stores JWT in `localStorage.token`, stores returned username in `localStorage.username`, and navigates to `/questionnaire`.
- `frontend/src/components/Questionnaire.jsx` - questionnaire form. It collects ticket/submission fields, submits them to backend `POST /submissions` with the JWT from `localStorage.token`, shows a loading button while the request is pending, and shows `Submission has been uploaded!` after success.
- `frontend/src/components/SubmissionsBoard.jsx` - browses and filters submissions from context; can send/cancel connection requests.
- `frontend/src/components/MyBoard.jsx` - shows current viewer submissions and sent requests; accepts/cancels requests and includes a chat box for accepted requests.
- `frontend/src/components/Chats.jsx` - lists active conversations for the current viewer and allows sending local messages.
- `frontend/src/components/Navbar.jsx` - top navigation. Reads `localStorage.username`; if present, shows the username in the top-right button. Clicking the username opens a `Log Out` button that clears `localStorage.token` and `localStorage.username`, then returns the navbar to `Log In`. Uses `useLocation` to reread username after route changes such as login/signup navigation.
- `frontend/src/components/Hero.jsx`, `HowItWorks.jsx`, `Footer.jsx`, `Landing.jsx` - landing/marketing UI.
- `frontend/src/test/setup.js` - Vitest setup file that imports `@testing-library/jest-dom/vitest`.
- `frontend/.env.example` - committed frontend env template with `VITE_API_URL=http://localhost:3000`.
- `frontend/src/test/components/Navbar.test.jsx` - React Testing Library tests for Navbar logged-out display, username dropdown, and logout behavior.
- `frontend/src/test/components/Questionnaire.test.jsx` - React Testing Library unit/component tests for mocked questionnaire submission behavior, including normalized `POST /submissions` payload, JWT authorization header, success message, and disabled loading submit button.
- `frontend/src/test/integration/SignUp.integration.test.jsx` - real-backend integration tests for signup success and backend validation error display.
- `frontend/src/test/integration/AuthFlow.integration.test.jsx` - real-backend integration test for signup, logout, failed login, successful login, route navigation, and logout.
- `frontend/src/test/integration/QuestionnaireSubmission.integration.test.jsx` - real-backend integration test for signing up, submitting a questionnaire ticket through the frontend, confirming it appears in `GET /submissions`, and deleting it directly with backend `DELETE /submissions/:id` for cleanup because the frontend has no delete-ticket UI yet.
- `frontend/tasks/todo.txt` - notes required questionnaire fields and validation ideas.

Backend:

- `backend/src/index.js` - Express entrypoint. Loads dotenv, enables CORS and JSON parsing, mounts `/auth` and `/submissions`, responds on `/`, and starts the server.
- `backend/src/routes/authRoutes.js` - maps `POST /auth/signup` and `POST /auth/login` to the auth controller.
- `backend/src/controllers/AuthController.js` - validates signup/login, normalizes username/email, hashes passwords, stores/loads users from PostgreSQL, and returns JWTs. Uses private class helper methods and `AUTH_MESSAGES` constants.
- `backend/src/middleware/authMiddleware.js` - JWT middleware for protected routes. Expects `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, attaches `req.userId`, and returns `401` for missing/invalid/expired tokens.
- `backend/src/routes/submissionRoutes.js` - Express router for submissions. Supports public `GET /` for listing submissions, protected `POST /` for creating a submission, and protected `DELETE /:id` for deleting one of the logged-in user's submissions. Future `GET /mine` route is still commented/TODO.
- `backend/src/controllers/SubmissionController.js` - submissions controller with `create`, `delete`, and `list` implemented using private helper methods and parameterized PostgreSQL queries. `create` uses `req.userId` from JWT middleware plus request body fields matching the submissions table, except database-owned fields such as `id`, `user_id`, and `created_at`. `delete` deletes by submission `id` and `req.userId`, so users cannot delete another user's submission. `list` returns newest submissions first with `limit`/`offset` pagination metadata.
- `backend/src/db/pool.js` - shared PostgreSQL pool. Requires `DATABASE_URL`.
- `backend/src/models/User.js` - legacy in-memory user shape. Current auth does not use this model.
- `backend/migrations/001_create_users.sql` - creates `users` table with `id`, unique `username`, unique `email`, `password_hash`, and `created_at`.
- `backend/migrations/002_create_submissions_board.sql` - creates `submissions` table and indexes for listing/filtering.
- `backend/scripts/initDb.js` - loads `backend/.env`, reads all `.sql` files in `backend/migrations`, sorts them by filename, runs them in order, then closes the pool.
- `backend/test/submissions.test.js` - Node test-runner integration tests for submission create, delete, list, auth, validation errors, and pagination validation. Starts the backend on port `3101`, applies migrations, uses the real PostgreSQL database, and cleans up disposable users.
- `backend/README_TEST.md` - documents backend test requirements and commands.

## Routes

Frontend routes in `frontend/src/App.jsx`:

- `/` - landing page
- `/signup` - signup form
- `/login` - login form
- `/questionnaire` - create looking-for-buddy ticket form
- `/submissions` - browse/filter submissions
- `/myboard` - user's submissions and sent requests
- `/chats` - active local chats

Backend routes:

- `GET /` - health message: `{ message: 'Backend is running' }`
- `POST /auth/signup` - body: `{ username, email, password, confirmPassword }`; returns `{ message, token }`
- `POST /auth/login` - body: `{ email, password }`; returns `{ message, token, username }`
- `GET /submissions` - public; returns newest submissions with pagination: `{ submissions, pagination: { limit, offset, count, hasMore } }`. Supports optional `limit` and `offset` query params. Default limit is `20`; max limit is `50`.
- `POST /submissions` - protected by JWT; creates a submission for the logged-in user.
- `DELETE /submissions/:id` - protected by JWT; deletes a submission only if it belongs to the logged-in user.
- Planned submissions route:
- `GET /submissions/mine` - protected by JWT; should list submissions created by the logged-in user.

## Local Setup And Commands

Backend:

```bash
cd backend
npm install
npm run db:init
npm run dev
```

Backend runs on `http://localhost:3000` unless `PORT` is set.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend Vite dev server usually runs on `http://localhost:5173`.

Frontend checks:

```bash
cd frontend
npm run build
npm run lint
npm run test -- --run
npm run test:integration
```

On this Windows setup, PowerShell may block `npm.ps1`; use `npm.cmd` instead, for example `npm.cmd run build`, `npm.cmd run test -- --run`, and `npm.cmd run test:integration`.

`npm run test -- --run` runs quick component tests under `frontend/src/test/components`. On Windows PowerShell, use `npm.cmd run test -- --run`. `npm run test:integration` runs real-backend integration tests under `frontend/src/test/integration`; backend and PostgreSQL must be running, and these tests create real `testXXXX` users. The questionnaire submission integration test also creates a real submission and cleans it up through direct backend deletion.

Backend production-ish start:

```bash
cd backend
npm start
```

Backend checks:

```bash
cd backend
npm test
npm run test:submissions
```

On this Windows setup, PowerShell may block `npm.ps1`; use `npm.cmd` instead, for example `npm.cmd test` and `npm.cmd run test:submissions`.

## Environment Variables

Backend expects `backend/.env` with:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/accountabuddy
JWT_SECRET=replace_with_long_random_secret
PORT=3000
```

`DATABASE_URL` is required by `backend/src/db/pool.js`. `JWT_SECRET` is required for signup/login token signing.

Frontend expects `frontend/.env` locally with:

```env
VITE_API_URL=http://localhost:3000
```

Commit `frontend/.env.example`, not the real `frontend/.env`.

Do not commit `.env` files or real secrets.

## Current Data Model

PostgreSQL table:

```sql
users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Submissions table:

```sql
submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  timezone TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  looking_for1 TEXT,
  looking_for2 TEXT,
  looking_for3 TEXT,
  looking_for4 TEXT,
  looking_for5 TEXT,
  availability TEXT NOT NULL,
  communication TEXT NOT NULL,
  constraints TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

Current auth behavior:

- Username is required.
- Username is trimmed before validation.
- Username must be at least 3 characters and at most 30 characters.
- Frontend signup uses an HTML text input for username and sends it in the signup request body.
- Username is checked before insert; database unique-constraint errors are also handled for race conditions.
- Email is trimmed/lowercased before validation and insert.
- Password is hashed with bcrypt before storage.
- Successful login returns the user's username so the frontend can store it in `localStorage.username` for the Navbar display.
- Frontend logout is local-only for now: it removes `localStorage.token` and `localStorage.username`; no backend logout route exists yet.

Local frontend storage keys in `SubmissionsContext.jsx`:

- `ab_submissions_v1`
- `ab_requests_v1`
- `ab_conversations_v1`
- `ab_viewer_v1`

Submission fields collected by the questionnaire include:

- `title`
- `age`
- `gender`
- `otherGender`
- `timezone`
- `description`
- `goals`
- `lookingFor`
- `availability`
- `otherAvailability`
- `communication`
- `communicationOther`
- `constraints`

Request fields include:

- `id`
- `submissionId`
- `fromId`
- `message`
- `status`: `pending`, `accepted`, `cancelled`, or `declined`
- `createdAt`

Conversation fields include:

- `id`
- `submissionId`
- `participants`
- `messages`
- `createdAt`

## Known Gaps And Risks

- Some files contain mojibake/encoding artifacts where dashes, arrows, or ellipses were probably intended.
- Signup/login store JWTs in `localStorage`, but most app data does not use the JWT yet.
- Backend submissions create/delete/list routes are mounted and covered by backend integration tests. Requests/conversations still have no backend routes.
- `SubmissionsContext.jsx` uses `localStorage`, so data is per-browser and not shared between real users.
- `Questionnaire.jsx` now posts submissions to the backend and resets only after a successful response. It still does not add the created submission to local context, and requests/conversations/chats remain local-only.
- `backend/src/models/User.js` is legacy and may be removable once auth/data model is stable.
- Frontend has Vitest/React Testing Library component coverage for `Navbar` and `Questionnaire`, plus real-backend integration coverage for signup/auth flows and questionnaire submission creation. Backend has Node test-runner integration coverage for submissions.

## Development Conventions To Preserve

- Keep auth logic centralized in `backend/src/controllers/AuthController.js`.
- Keep Express route files thin; route files should map endpoints to controllers.
- Use parameterized SQL queries through `pg`; do not build SQL by concatenating request values.
- Keep secrets in `.env`, not in committed source.
- Prefer adding backend persistence for submissions/requests/chats before treating the app as multi-user.
- When changing frontend data flows, check how `SubmissionsProvider` supplies state and helper functions.
- Avoid broad rewrites unless needed; this is an early-stage app with simple structure.
- Before editing files, show the proposed change and ask for approval. The user prefers approval per file before edits.
- For abuse protection such as signup request spam or account enumeration, prefer Express middleware before the controller. Later middleware can use `req.ip`; if deployed behind a proxy, configure Express `trust proxy`.
- Keep frontend tests under `frontend/src/test/`, grouped by subject such as `frontend/src/test/components/`.
- Keep frontend integration tests under `frontend/src/test/integration/`; they require the real backend and PostgreSQL and may create disposable `testXXXX` users.
- For protected backend routes, use `backend/src/middleware/authMiddleware.js` and read the logged-in owner from `req.userId`, not from request body fields.

## Good Next Steps

- Fix remaining text encoding artifacts in UI strings.
- Wire submissions board to backend `GET /submissions` instead of localStorage-only context data.
- Implement `SubmissionController.listMine` and `GET /submissions/mine` with parameterized PostgreSQL queries.
- Add backend tables/routes/controllers for requests, conversations, and messages.
- Add signup/login rate limiting middleware.
- Add backend auth tests for signup/login behavior.
