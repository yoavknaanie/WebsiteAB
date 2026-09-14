# Backend API entry points and curl examples

This document describes the HTTP entry points that are currently mounted by
the Express application. The examples are written for PowerShell and use
`curl.exe` explicitly because `curl` can be an alias for `Invoke-WebRequest`
in some PowerShell versions.

## Prerequisites

From the `backend` directory, configure `.env`, initialize the database, and
start the server:

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run db:init
npm.cmd start
```

The default local URL is `http://localhost:3000`. Override `PORT` when starting
the backend if another port is required.

Set a reusable URL for the examples:

```powershell
$api = 'http://localhost:3000'
```

All request and response bodies are JSON. Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

## Endpoint summary

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Check that the backend is running |
| `POST` | `/auth/signup` | Public, rate-limited | Create a user and receive a JWT |
| `POST` | `/auth/login` | Public, rate-limited | Log in and receive a JWT |
| `GET` | `/submissions` | Public | List submissions with pagination |
| `POST` | `/submissions` | Bearer JWT | Create a submission |
| `DELETE` | `/submissions/:id` | Bearer JWT | Delete the current user's submission |
| `GET` | `/chats` | Bearer JWT | List the current user's chats |
| `POST` | `/chats` | Bearer JWT | Start/find a chat and send its first message |
| `GET` | `/chats/:id/messages` | Bearer JWT | List messages in a chat |
| `POST` | `/chats/:id/messages` | Bearer JWT | Send a message in a chat |

`GET /submissions/mine` appears as a TODO in the source but is not mounted, so
it is not currently an API entry point.

## Health check

```powershell
curl.exe -sS "$api/"
```

Expected status: `200 OK`.

## Authentication

Authentication endpoints are limited to 20 requests per 15 minutes per client.

### Sign up

Use a new username and email each time because both must be unique:

```powershell
$ownerSignup = curl.exe -sS -X POST "$api/auth/signup" `
  -H "Content-Type: application/json" `
  -d '{"username":"curl_owner","email":"curl_owner@example.com","password":"password123","confirmPassword":"password123"}' |
  ConvertFrom-Json

$ownerToken = $ownerSignup.token
$ownerToken
```

Expected status: `201 Created`. The response contains `message` and `token`.

### Log in

```powershell
$ownerLogin = curl.exe -sS -X POST "$api/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"curl_owner@example.com","password":"password123"}' |
  ConvertFrom-Json

$ownerToken = $ownerLogin.token
```

Expected status: `200 OK`. An unknown email or incorrect password returns
`401 Unauthorized` with the same generic error message.

## Submissions

### Create a submission

The required fields are `title`, `age`, `gender`, `timezone`, `availability`,
and `communication`. Age must be an integer from 13 through 120. The remaining
fields in this example are optional.

```powershell
$createdSubmission = curl.exe -sS -X POST "$api/submissions" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $ownerToken" `
  -d '{"title":"Looking for a Java study partner","age":25,"gender":"Any","timezone":"Asia/Jerusalem","description":"Preparing for Java interviews","goals":"Practice OOP and SQL","looking_for1":"Java","looking_for2":"SQL","availability":"Evenings","communication":"Chat","constraints":"Twice a week"}' |
  ConvertFrom-Json

$submissionId = $createdSubmission.submission.id
$submissionId
```

Expected status: `201 Created`. The authenticated user ID is taken from the
JWT, not from the request body.

### List submissions

```powershell
curl.exe -sS "$api/submissions"
curl.exe -sS "$api/submissions?limit=10&offset=0"
```

Expected status: `200 OK`. The default limit is 20, the maximum is 50, and the
response includes `submissions` plus `pagination` metadata.

### Delete your submission

```powershell
curl.exe -sS -X DELETE "$api/submissions/$submissionId" `
  -H "Authorization: Bearer $ownerToken"
```

Expected status: `200 OK`. The SQL operation matches both the submission ID and
the authenticated user ID. A missing owned submission returns `404 Not Found`.

## Chats

A user cannot start a chat with their own submission. To test chats, keep the
owner submission created above and create a second user:

```powershell
$partnerSignup = curl.exe -sS -X POST "$api/auth/signup" `
  -H "Content-Type: application/json" `
  -d '{"username":"curl_partner","email":"curl_partner@example.com","password":"password123","confirmPassword":"password123"}' |
  ConvertFrom-Json

$partnerToken = $partnerSignup.token
```

### Start a chat and send the first message

```powershell
$createdChat = curl.exe -sS -X POST "$api/chats" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $partnerToken" `
  -d "{`"submissionId`":$submissionId,`"message`":`"Hi, would you like to study Java together?`"}" |
  ConvertFrom-Json

$chatId = $createdChat.chat.id
$chatId
```

Expected status: `201 Created`. The operation creates or finds the single chat
between the two users and inserts the first message in one database transaction.

### List the current user's chats

```powershell
curl.exe -sS "$api/chats" `
  -H "Authorization: Bearer $partnerToken"
```

Expected status: `200 OK`.

### List messages

The default message limit is 50 and the maximum is 100:

```powershell
curl.exe -sS "$api/chats/$chatId/messages?limit=50" `
  -H "Authorization: Bearer $partnerToken"
```

Expected status: `200 OK`. Only a participant can access the chat. For privacy,
an inaccessible or nonexistent chat is returned as `404 Not Found`.

### Send another message

```powershell
curl.exe -sS -X POST "$api/chats/$chatId/messages" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $ownerToken" `
  -d '{"message":"Yes, evenings work for me."}'
```

Expected status: `201 Created`.

## Useful negative checks

Missing JWT:

```powershell
curl.exe -i -sS -X POST "$api/submissions" `
  -H "Content-Type: application/json" `
  -d '{"title":"Unauthorized request"}'
```

Expected status: `401 Unauthorized`.

Invalid submission pagination:

```powershell
curl.exe -i -sS "$api/submissions?limit=51&offset=0"
```

Expected status: `400 Bad Request`.

Invalid chat message:

```powershell
curl.exe -i -sS -X POST "$api/chats/$chatId/messages" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $partnerToken" `
  -d '{"message":"   "}'
```

Expected status: `400 Bad Request`.

## Cleanup order

Deleting the submission before exercising the chat examples also deletes its
chat through PostgreSQL cascading foreign keys. After completing the chat
examples, delete the test submission with the owner's token:

```powershell
curl.exe -sS -X DELETE "$api/submissions/$submissionId" `
  -H "Authorization: Bearer $ownerToken"
```

There is currently no public API endpoint for deleting test users.
