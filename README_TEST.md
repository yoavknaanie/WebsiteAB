# AccountaBuddy Test Guide

This project has frontend component tests, frontend integration tests, and backend integration tests.

## Test Tools

The frontend tests use:

- `vitest` - runs the test files.
- `@testing-library/react` - renders React components in tests.
- `@testing-library/jest-dom` - adds DOM assertions like `toBeInTheDocument`.
- `@testing-library/user-event` - simulates user typing and clicking.
- `jsdom` - provides a browser-like environment for tests.

## Install Test Dependencies

From the frontend folder:

```bash
cd frontend
npm install
```

If the test packages are missing, install them with:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

On Windows PowerShell, `npm` may be blocked by script execution policy. Use `npm.cmd` instead:

```powershell
npm.cmd install
npm.cmd install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Quick Component Tests

These tests do not require the backend or PostgreSQL. Backend requests are mocked where needed.

Run:

```bash
cd frontend
npm run test -- --run
```

On Windows PowerShell:

```powershell
cd frontend
npm.cmd run test -- --run
```

Current quick tests cover:

- Navbar logged-out display.
- Navbar username dropdown.
- Navbar logout behavior.
- Navbar ignores stale `localStorage` auth values after auth moved to `sessionStorage`.
- Navbar logo sends logged-in users to `/home`.
- Navbar `Log In` button sends logged-out users to `/login`.
- Landing page public actions: `Get Started`, `Log in`, and `How it works`.
- Landing page does not show logged-in app navigation buttons.
- Home page app navigation for Questionnaire, Submissions, and My Board.
- Home page keeps Chats hidden while chat is not fully implemented.
- Hero button navigation to signup and login.
- Questionnaire submission request behavior.
- Questionnaire submission success message.
- Questionnaire loading state while a submission request is pending.
- Submissions board backend loading from `GET /submissions`.
- Submissions board backend field normalization for `created_at`, `user_id`, `looking_for1` through `looking_for5`, and communication values.
- Submissions board backend error display.
- Submissions board frontend filtering by looking-for keywords and communication methods.

The questionnaire component tests mock `fetch` and check that submitting the form sends a `POST /submissions` request with:

- The saved `sessionStorage` JWT in the `Authorization` header.
- Normalized form fields such as numeric `age`, custom gender, custom availability, `looking_for1` through `looking_for5`, and comma-separated communication methods.
- A success message: `Submission has been uploaded!`.
- A disabled `Submitting...` button while the request is still processing.

The submissions board component tests mock `fetch` for `GET /submissions` and use a mocked `SubmissionsContext.Provider` so the tests can focus on backend loading, normalization, rendering, and filtering without depending on local request/conversation storage.

## Integration Tests

These tests call the real backend and use the real PostgreSQL database.

Before running them, start the backend in a separate terminal:

```bash
cd backend
npm run dev
```

On Windows PowerShell:

```powershell
cd backend
npm.cmd run dev
```

Then run the integration tests from another terminal:

```bash
cd frontend
npm run test:integration
```

On Windows PowerShell:

```powershell
cd frontend
npm.cmd run test:integration
```

Integration tests require:

- Backend running on `http://localhost:3000`.
- PostgreSQL running.
- `backend/.env` configured with `DATABASE_URL` and `JWT_SECRET`.
- `frontend/.env` configured with `VITE_API_URL=http://localhost:3000`.
- Users table already created.

Current integration tests cover:

- Successful signup with a generated `testXXXX` username.
- Signup validation errors from the backend.
- Signup navigating to `/home`.
- Logout clearing frontend `sessionStorage`.
- Failed login with correct user and wrong password.
- Successful login.
- Navbar preserving the username after route navigation.
- Logged-in navbar logo navigation to `/home`.
- Questionnaire submission creation through the frontend form.
- Direct backend deletion of the created questionnaire submission for cleanup.

The questionnaire submission integration test creates a real user, lands on `/home`, navigates to the questionnaire, submits a real ticket to `POST /submissions`, confirms it appears in `GET /submissions`, then deletes it with `DELETE /submissions/:id`. The deletion is done directly through the backend API because the frontend does not currently provide a user-facing delete-ticket control.

The `test:integration` script runs every test file under:

```text
frontend/src/test/integration
```

## Backend Tests

These tests call the real backend and use the real PostgreSQL database.

Backend tests require:

- PostgreSQL running.
- `backend/.env` configured with `DATABASE_URL` and `JWT_SECRET`.

If the database tables have not been created yet, run the migrations first:

```powershell
cd backend
npm.cmd run db:init
```

Run all backend tests:

```powershell
cd backend
npm.cmd test
```

Run the submissions backend tests only:

```powershell
cd backend
npm.cmd run test:submissions
```

On this Windows setup, use `npm.cmd` because PowerShell may block `npm.ps1`.

## Database Note

The integration tests intentionally create real users with names like:

```text
test1234
```

These users can be deleted later from PostgreSQL, for example through pgAdmin.

## Useful Verification Commands

Run quick tests:

```powershell
cd frontend
npm.cmd run test -- --run
```

Run integration tests:

```powershell
cd frontend
npm.cmd run test:integration
```

Run the frontend production build:

```powershell
cd frontend
npm.cmd run build
```

Recommended pre-commit frontend check:

```powershell
cd frontend
npm.cmd run test -- --run
npm.cmd run test:integration
npm.cmd run build
```
