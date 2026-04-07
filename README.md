# AccountaBuddy

A web app for finding accountability partners.

---

## Prerequisites

Make sure you have these installed on your machine before running anything:

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

---

## Project Structure

```
WebsiteAB/
  ab/        ← React frontend (Vite)
  backend/   ← Express backend (Node.js)
```

---

## Setup

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

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set:
```
JWT_SECRET=some_long_random_string_of_your_choice
```

### 3. Set up the frontend

```bash
cd ../ab
npm install
```

Copy the example env file and fill in your Firebase values:

```bash
cp .env.example .env
```

---

## Running the app

You need **two terminals** running at the same time.

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Runs on http://localhost:3000

**Terminal 2 — Frontend:**
```bash
cd ab
npm run dev
```
Runs on http://localhost:5173

---

## Backend dependencies

| Package | Purpose |
|---|---|
| express | Web server framework |
| cors | Allows frontend to call the backend |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication tokens |
| dotenv | Loads environment variables from .env |
| nodemon (dev) | Auto-restarts server on file changes |

## Frontend dependencies

| Package | Purpose |
|---|---|
| react | UI framework |
| react-router-dom | Client-side routing |
| vite | Frontend build tool and dev server |
