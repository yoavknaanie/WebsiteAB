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
- Submissions, requests, conversations, viewer identity, and chat messages currently live in browser `localStorage` through React context.
- The questionnaire has TODO comments for replacing local/frontend submission behavior with Express backend calls.

## Tech Stack

Frontend:

- React 19
- Vite 7
- React Router DOM 7
- React Hot Toast
- Firebase package is installed, but current scanned code does not show Firebase being used for active data writes.

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
- `package.json` - only lists `react-router-dom`; main app package scripts live in `frontend/package.json` and `backend/package.json`.
- `.gitignore` - ignores `node_modules/` and `.env`.

Frontend:

- `frontend/src/main.jsx` - React entrypoint. Wraps the app in `BrowserRouter`, `SubmissionsProvider`, and `Toaster`.
- `frontend/src/App.jsx` - route table and top-level layout. Always renders `Navbar`.
- `frontend/src/index.css` and `frontend/src/App.css` - global styling.
- `frontend/src/contexts/SubmissionsContext.jsx` - localStorage-backed data layer for submissions, requests, conversations, messages, and anonymous viewer id.
- `frontend/src/components/SignUp.jsx` - signup form with username text input, email input, password, and confirm password. Calls `POST http://localhost:3000/auth/signup` with `{ username, email, password, confirmPassword }`, stores JWT in `localStorage.token`, stores the submitted username in `localStorage.username`, and navigates to `/questionnaire`.
- `frontend/src/components/LogIn.jsx` - login form, calls `POST http://localhost:3000/auth/login`, stores JWT in `localStorage.token`, stores returned username in `localStorage.username`, and navigates to `/questionnaire`.
- `frontend/src/components/Questionnare.jsx` - questionnaire form. Filename is misspelled as `Questionnare`. It collects ticket/submission fields but currently does not call backend or context on submit.
- `frontend/src/components/SubmissionsBoard.jsx` - browses and filters submissions from context; can send/cancel connection requests.
- `frontend/src/components/MyBoard.jsx` - shows current viewer submissions and sent requests; accepts/cancels requests and includes a chat box for accepted requests.
- `frontend/src/components/Chats.jsx` - lists active conversations for the current viewer and allows sending local messages.
- `frontend/src/components/Navbar.jsx` - top navigation. Reads `localStorage.username`; if present, shows the username in the top-right button and disables it, otherwise shows a clickable `Log In` button.
- `frontend/src/components/Hero.jsx`, `HowItWorks.jsx`, `Footer.jsx`, `Landing.jsx` - landing/marketing UI.
- `frontend/src/test/setup.js` - Vitest setup file that imports `@testing-library/jest-dom/vitest`.
- `frontend/src/test/components/Navbar.test.jsx` - React Testing Library tests for Navbar logged-out/logged-in username display.
- `frontend/tasks/todo.txt` - notes required questionnaire fields and validation ideas.

Backend:

- `backend/src/index.js` - Express entrypoint. Loads dotenv, enables CORS and JSON parsing, mounts `/auth`, responds on `/`.
- `backend/src/routes/authRoutes.js` - maps `POST /auth/signup` and `POST /auth/login` to the auth controller.
- `backend/src/controllers/AuthController.js` - validates signup/login, normalizes username/email, hashes passwords, stores/loads users from PostgreSQL, and returns JWTs. Uses private class helper methods and `AUTH_MESSAGES` constants.
- `backend/src/db/pool.js` - shared PostgreSQL pool. Requires `DATABASE_URL`.
- `backend/src/models/User.js` - legacy in-memory user shape. Current auth does not use this model.
- `backend/migrations/001_create_users.sql` - originally created `users` table with `id`, unique `email`, `password_hash`, and `created_at`; update it before relying on `npm run db:init` for the newer username-required schema.
- `backend/scripts/initDb.js` - loads `backend/.env`, runs `001_create_users.sql`, then closes the pool.

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
```

On this Windows setup, PowerShell may block `npm.ps1`; use `npm.cmd` instead, for example `npm.cmd run build` and `npm.cmd test -- --run`.

Backend production-ish start:

```bash
cd backend
npm start
```

## Environment Variables

Backend expects `backend/.env` with:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/accountabuddy
JWT_SECRET=replace_with_long_random_secret
PORT=3000
```

`DATABASE_URL` is required by `backend/src/db/pool.js`. `JWT_SECRET` is required for signup/login token signing.

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

Current auth behavior:

- Username is required.
- Username is trimmed before validation.
- Username must be at least 3 characters and at most 30 characters.
- Frontend signup uses an HTML text input for username and sends it in the signup request body.
- Username is checked before insert; database unique-constraint errors are also handled for race conditions.
- Email is trimmed/lowercased before validation and insert.
- Password is hashed with bcrypt before storage.
- Successful login returns the user's username so the frontend can store it in `localStorage.username` for the Navbar display.

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

- The questionnaire filename is `Questionnare.jsx`, not `Questionnaire.jsx`.
- Some files contain mojibake/encoding artifacts where dashes, arrows, or ellipses were probably intended.
- Signup/login store JWTs in `localStorage`, but most app data does not use the JWT yet.
- No backend routes currently exist for submissions, requests, or conversations.
- `SubmissionsContext.jsx` uses `localStorage`, so data is per-browser and not shared between real users.
- `Questionnare.jsx` currently resets form state on submit but does not add a submission to context or backend.
- `backend/migrations/001_create_users.sql` may be stale compared with the current pgAdmin-created users table.
- `backend/src/models/User.js` is legacy and may be removable once auth/data model is stable.
- Frontend has initial Vitest/React Testing Library coverage for `Navbar`; backend still has no obvious automated tests.

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

## Good Next Steps

- Update `backend/migrations/001_create_users.sql` to match the current required username schema.
- Fix remaining text encoding artifacts in UI strings.
- Decide whether to rename `Questionnare.jsx` to `Questionnaire.jsx` and update imports.
- Wire questionnaire submit to `addSubmission` or, preferably, a new backend `POST /submissions`.
- Add backend tables/routes/controllers for submissions, requests, conversations, and messages.
- Add auth middleware to verify JWTs and attach `userId` to protected requests.
- Add signup/login rate limiting middleware.
- Add more frontend tests for login/signup localStorage behavior.
- Add backend auth tests for signup/login behavior.
