# AccountaBuddy
Website Link: https://websiteab-bpd.pages.dev/

AccountaBuddy is a full-stack web app for finding online study or work accountability partners.

Users can create "looking for partner" submissions, browse other submissions, send connection requests, and manage simple chat-style conversations. 
The project is also built as a junior full-stack portfolio app that demonstrates practical frontend/backend integration, authentication, database design, clean server-side validation, automated testing, and end-to-end deployment.

Authors: Yoav Knaanie and Noya Gideoni

## What This Project Demonstrates

- Full-stack JavaScript development with React, Express, and PostgreSQL.
- REST-style authentication endpoints for signup and login.
- Server-side input normalization and validation.
- Password hashing with bcrypt.
- JWT-based authentication token creation.
- Session-scoped frontend auth state with logged-in username display in the navigation.
- Backend-backed submission creation and public submission listing.
- PostgreSQL schema design with required and unique fields.
- Parameterized SQL queries to avoid SQL injection.
- React routing and state management with context.
- Frontend component testing with Vitest and React Testing Library.
- Backend integration testing with Node's test runner and a real PostgreSQL database.
- Production-style environment configuration across local development and deployed services.
- End-to-end deployment with Cloudflare Pages, Google Cloud Run, and Neon PostgreSQL.
- Practical code organization using controllers, routes, database helpers, and reusable frontend components.

## Deployed Architecture

```text
Cloudflare Pages frontend
  -> Google Cloud Run Express API
    -> Neon PostgreSQL database
```

Deployment responsibilities covered in this project:

- Vite frontend build and deployment through Cloudflare Pages.
- Express backend deployment to Google Cloud Run from source.
- Hosted PostgreSQL setup with Neon.
- SQL migrations for users and submissions tables.
- Production environment variables for API URLs, JWT secrets, database URLs, CORS, SSL, and pool size.
- CORS configuration between the deployed frontend origin and deployed backend API.
- Cloud Run scale-to-zero configuration for cost-aware hosting.

## Features

- User signup and login.
- Signup form collects username, email, password, and password confirmation.
- Username, email, and password validation on the backend.
- Passwords are hashed before being stored.
- Users table backed by PostgreSQL.
- Login returns the username so the frontend can show the logged-in user in the navigation bar.
- Login/signup store the JWT and username in `sessionStorage`, so normal tab/session close returns the user to a logged-out state.
- Public landing page with `Get Started`, `Log in`, and `How it works`.
- Logged-in home page for navigating to questionnaire, submissions, and My Board.
- Questionnaire for creating accountability partner submissions.
- Questionnaire submissions are created through the backend API.
- Submissions board loads submissions from the backend API with frontend filtering and "best match" helper logic.
- Connection request flow for reaching out to potential partners.
- "My Board" view for managing created submissions and sent requests.
- Local chat experience after a request is accepted.

## Current Status

This is an active portfolio project.

Implemented with backend persistence:

- User signup/login
- PostgreSQL users table
- bcrypt password hashing
- JWT creation
- Username returned on login for frontend session display
- Submission creation
- Submission deletion by owner
- Public submission listing with pagination

Currently frontend/local-storage based:

- Connection requests
- Conversations and messages
- Some local viewer/request/conversation state used by My Board and chat flows

Testing:

- Frontend test tooling is configured with Vitest, React Testing Library, and jsdom.
- The Navbar and Questionnaire have focused component tests.
- Frontend integration tests cover signup/auth flow and questionnaire submission against the real backend.
- Backend integration tests cover submission create, delete, list, auth errors, validation, and pagination.

Planned next step:

- Add backend persistence for connection requests, conversations, and messages.

## Tech Stack

Frontend:

- React
- Vite
- React Router DOM
- React Hot Toast
- Vitest
- React Testing Library
- jsdom

Backend:

- Node.js
- Express
- PostgreSQL
- pg
- bcrypt
- jsonwebtoken
- dotenv
- nodemon
- Google Cloud Run
- Neon PostgreSQL

## Project Structure

```text
WebsiteAB/
  frontend/                 React frontend built with Vite
    src/
      components/           UI pages and reusable components
      contexts/             Local state/context providers
      test/                 Frontend test setup, component tests, and integration tests
      App.jsx               Frontend routes
      main.jsx              React entrypoint

  backend/                  Express backend
    src/
      controllers/          Request handling logic
      routes/               Express route definitions
      db/                   PostgreSQL connection pool
      index.js              Backend entrypoint
    migrations/             SQL schema files
    scripts/                Database setup scripts
```

## Backend API

Auth routes:

```text
POST /auth/signup
POST /auth/login
```

Health check:

```text
GET /
```

Signup currently accepts:

```json
{
  "username": "studybuddy",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

Successful login returns:

```json
{
  "message": "Logged in successfully.",
  "token": "jwt-token",
  "username": "studybuddy"
}
```

Submission routes:

```text
GET /submissions
POST /submissions
DELETE /submissions/:id
```

`GET /submissions` is public and supports pagination:

```text
GET /submissions?limit=20&offset=0
```

Successful response:

```json
{
  "submissions": [
    {
      "id": "1",
      "user_id": "1",
      "title": "Daily study partner",
      "age": 25,
      "gender": "Non-binary",
      "timezone": "UTC +10",
      "description": "Looking for focused study sessions.",
      "goals": "Finish my accounting course.",
      "looking_for1": "Consistent",
      "looking_for2": "Friendly",
      "looking_for3": null,
      "looking_for4": null,
      "looking_for5": null,
      "availability": "Weeknights after 7",
      "communication": "Chat, Discord",
      "constraints": null,
      "created_at": "2026-05-21T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "count": 1,
    "hasMore": false
  }
}
```

`POST /submissions` requires:

```text
Authorization: Bearer <jwt-token>
```

Request body:

```json
{
  "title": "Daily study partner",
  "age": 25,
  "gender": "Non-binary",
  "timezone": "UTC +10",
  "description": "Looking for focused study sessions.",
  "goals": "Finish my accounting course.",
  "looking_for1": "Consistent",
  "looking_for2": "Friendly",
  "looking_for3": "",
  "looking_for4": "",
  "looking_for5": "",
  "availability": "Weeknights after 7",
  "communication": "Chat, Discord",
  "constraints": ""
}
```

`DELETE /submissions/:id` requires the same JWT header and only deletes submissions owned by the logged-in user.

## Database

The app uses PostgreSQL. The current users table is expected to include:

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The backend validates username length before insert and also relies on database constraints for final protection.
The frontend signup form sends `username`, `email`, `password`, and `confirmPassword` to the backend.

The app also uses a `submissions` table for accountability partner tickets:

```sql
CREATE TABLE submissions (
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
);
```

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm
- PostgreSQL
- pgAdmin or another PostgreSQL client is useful for inspecting the database

### 1. Clone the repo

```bash
git clone <repo-url>
cd WebsiteAB
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/accountabuddy
DATABASE_SSL=false
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

Initialize the database:

```bash
npm run db:init
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Useful Commands

Backend:

```bash
cd backend
npm run dev
npm start
npm run db:init
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run test -- --run
npm run test:integration
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use `npm.cmd` instead:

```powershell
npm.cmd run build
npm.cmd run test -- --run
npm.cmd run test:integration
```

## Deployment Summary

The deployed app uses:

- Cloudflare Pages for the frontend.
- Google Cloud Run for the backend API.
- Neon PostgreSQL for the hosted database.

Backend deployment uses Cloud Run source deployment from the `backend` folder:

```powershell
gcloud run deploy accountabuddy-backend --source . --region europe-west1 --allow-unauthenticated --min-instances 0 --max-instances 2 --env-vars-file cloudrun.env
```

Production backend environment variables include:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=5
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=https://your-frontend-domain
```

Production frontend builds with:

```env
VITE_API_URL=https://your-cloud-run-backend-url
```

See `deployment.txt` for the step-by-step deployment and redeployment notes.

## Security Notes

- Plain-text passwords are never stored.
- Passwords are hashed with bcrypt.
- SQL queries use parameterized values.
- Signup/login validation happens on the server, not only in the frontend.
- JWTs contain the database user id, not the password or password hash.
- `.env` files should not be committed.
- Deployment env files such as `cloudrun.env` should not be committed.
- The frontend currently stores the JWT and username in `sessionStorage`, so a normal tab/session close clears the logged-in frontend state.
- Logout is frontend-local: it clears `sessionStorage` auth values and removes old `localStorage` auth leftovers from earlier app versions.
- A production app should consider stronger session handling such as HTTP-only cookies.

## Roadmap

- Add backend persistence for connection requests.
- Add backend persistence for conversations/messages.
- Add rate limiting for auth routes to reduce abuse.
- Improve frontend form validation and loading/error states.
- Add backend-side filtering/search for submissions.
- Implement `GET /submissions/mine` for the logged-in user's own submissions.
- Add backend tests for auth and key user flows.

## License

This project is shared publicly as portfolio work. You may view the code, but copying, redistribution, or commercial use requires permission.
