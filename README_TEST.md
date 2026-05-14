# AccountaBuddy Test Guide

This project currently has frontend component tests and frontend integration tests.

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
- Questionnaire submission request behavior.
- Questionnaire submission success message.
- Questionnaire loading state while a submission request is pending.

The questionnaire component tests mock `fetch` and check that submitting the form sends a `POST /submissions` request with:

- The saved JWT in the `Authorization` header.
- Normalized form fields such as numeric `age`, custom gender, custom availability, `looking_for1` through `looking_for5`, and comma-separated communication methods.
- A success message: `Submission has been uploaded!`.
- A disabled `Submitting...` button while the request is still processing.

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
- Logout clearing frontend `localStorage`.
- Failed login with correct user and wrong password.
- Successful login.
- Navbar preserving the username after route navigation.
- Questionnaire submission creation through the frontend form.
- Direct backend deletion of the created questionnaire submission for cleanup.

The questionnaire submission integration test creates a real user, submits a real ticket to `POST /submissions`, confirms it appears in `GET /submissions`, then deletes it with `DELETE /submissions/:id`. The deletion is done directly through the backend API because the frontend does not currently provide a user-facing delete-ticket control.

The `test:integration` script runs every test file under:

```text
frontend/src/test/integration
```

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
