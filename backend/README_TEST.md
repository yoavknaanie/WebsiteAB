# Backend Tests

This backend uses Node's built-in test runner for integration tests.

## Requirements

- PostgreSQL must be running.
- `backend/.env` must exist and include:

```env
DATABASE_URL=###
JWT_SECRET=####
PORT=3000
```

- Tests apply the SQL files in `backend/migrations` before running.

## Run All Backend Tests

From the `backend` folder:

```bash
npm test
```

On Windows PowerShell, if `npm.ps1` is blocked, use:

```powershell
npm.cmd test
```

## Run Submission Tests Only

From the `backend` folder:

```bash
npm run test:submissions
```

On Windows PowerShell:

```powershell
npm.cmd run test:submissions
```

## What The Submission Test Covers

`test/submissions.test.js` applies migrations, starts the backend on `http://localhost:3101`, then tests the real HTTP endpoints against the real PostgreSQL database:

- `POST /auth/signup` creates a disposable test user.
- `POST /submissions` creates a submission with a JWT.
- `DELETE /submissions/:id` deletes that submission with the same JWT.
- `POST /submissions` without a JWT returns `401`.
- `DELETE /submissions/abc` returns `400`.
- `DELETE /submissions/999999999` returns `404`.

The test deletes its disposable users after it finishes. Because users own submissions with `ON DELETE CASCADE`, their test submissions are removed too.
