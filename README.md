# AccountaBuddy

AccountaBuddy is a full-stack web app for finding online study or work accountability partners.

Users can create "looking for partner" submissions, browse other submissions, send connection requests, and manage simple chat-style conversations. 
The project is also built as a practical portfolio app to demonstrate frontend/backend integration, authentication, database design, and clean server-side validation.

Authors: Noya Gideoni and Yoav Knaanie

## What This Project Demonstrates

- Full-stack JavaScript development with React, Express, and PostgreSQL.
- REST-style authentication endpoints for signup and login.
- Server-side input normalization and validation.
- Password hashing with bcrypt.
- JWT-based authentication token creation.
- PostgreSQL schema design with required and unique fields.
- Parameterized SQL queries to avoid SQL injection.
- React routing and state management with context.
- Practical code organization using controllers, routes, database helpers, and reusable frontend components.

## Features

- User signup and login.
- Signup form collects username, email, password, and password confirmation.
- Username, email, and password validation on the backend.
- Passwords are hashed before being stored.
- Users table backed by PostgreSQL.
- Questionnaire for creating accountability partner submissions.
- Submissions board with filtering and "best match" helper logic.
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

Currently frontend/local-storage based:

- Partner submissions
- Connection requests
- Conversations and messages

Planned next step:

- Move submissions, requests, and conversations from browser `localStorage` into PostgreSQL-backed API endpoints.

## Tech Stack

Frontend:

- React
- Vite
- React Router DOM
- React Hot Toast

Backend:

- Node.js
- Express
- PostgreSQL
- pg
- bcrypt
- jsonwebtoken
- dotenv
- nodemon

## Project Structure

```text
WebsiteAB/
  frontend/                 React frontend built with Vite
    src/
      components/           UI pages and reusable components
      contexts/             Local state/context providers
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
```

## Security Notes

- Plain-text passwords are never stored.
- Passwords are hashed with bcrypt.
- SQL queries use parameterized values.
- Signup/login validation happens on the server, not only in the frontend.
- JWTs contain the database user id, not the password or password hash.
- `.env` files should not be committed.

## Roadmap

- Add backend persistence for partner submissions.
- Add backend persistence for connection requests.
- Add backend persistence for conversations/messages.
- Add JWT verification middleware for protected routes.
- Add rate limiting for auth routes to reduce abuse.
- Improve frontend form validation and loading/error states.
- Add automated tests for auth and key user flows.

## License

This project is shared publicly as portfolio work. You may view the code, but copying, redistribution, or commercial use requires permission.
