const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')
const { spawn } = require('node:child_process')
const fs = require('node:fs/promises')
const path = require('node:path')
const dotenv = require('dotenv')

const backendRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(backendRoot, '.env') })

const pool = require('../src/db/pool')
const testPort = 3102
const baseUrl = `http://localhost:${testPort}`
const testRunId = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const password = 'Password123!'
const senderUser = {
  username: `chattest${testRunId}`.slice(0, 30),
  email: `chattest${testRunId}@example.com`,
  password,
}
const ownerUser = {
  username: `chatown${testRunId}`.slice(0, 30),
  email: `chat-owner-${testRunId}@example.com`,
  password,
}
const outsiderUser = {
  username: `chatout${testRunId}`.slice(0, 30),
  email: `chat-outsider-${testRunId}@example.com`,
  password,
}

let serverProcess

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const body = await response.json()
  return { response, body }
}

async function waitForServer() {
  const timeoutAt = Date.now() + 10000

  while (Date.now() < timeoutAt) {
    try {
      const { response } = await request('/')
      if (response.ok) {
        return
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  throw new Error(`Backend test server did not start on ${baseUrl}`)
}

async function runMigrations() {
  const migrationsPath = path.join(backendRoot, 'migrations')
  const migrationFiles = (await fs.readdir(migrationsPath))
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const migrationFile of migrationFiles) {
    const sql = await fs.readFile(path.join(migrationsPath, migrationFile), 'utf8')
    await pool.query(sql)
  }
}

async function deleteTestUsers() {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[
    senderUser.email,
    ownerUser.email,
    outsiderUser.email,
  ]])
}

async function signupUser(user) {
  const signupResult = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: user.username,
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
    }),
  })

  assert.equal(signupResult.response.status, 201)
  assert.ok(signupResult.body.token)

  return signupResult.body.token
}

async function createSubmission(token, title = 'Chat test submission') {
  const createResult = await request('/submissions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      age: 25,
      gender: 'Other',
      timezone: 'Australia/Sydney',
      description: 'Testing backend chats',
      goals: 'Study daily',
      looking_for1: 'Accountability',
      looking_for2: 'Focus sessions',
      looking_for3: 'Weekly check-ins',
      looking_for4: 'Similar timezone',
      looking_for5: 'Kind communication',
      availability: 'Evenings',
      communication: 'Chat',
      constraints: 'None',
    }),
  })

  assert.equal(createResult.response.status, 201)
  return createResult.body.submission
}

before(async () => {
  await runMigrations()
  await deleteTestUsers()

  serverProcess = spawn(process.execPath, ['src/index.js'], {
    cwd: backendRoot,
    env: {
      ...process.env,
      PORT: String(testPort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  serverProcess.on('error', (error) => {
    throw error
  })

  await waitForServer()
})

after(async () => {
  await deleteTestUsers()
  await pool.end()

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
})

test('creates a chat from a submission and lets both participants exchange messages', async () => {
  const senderToken = await signupUser(senderUser)
  const ownerToken = await signupUser(ownerUser)
  const outsiderToken = await signupUser(outsiderUser)
  const submission = await createSubmission(ownerToken)

  const createChatResult = await request('/chats', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${senderToken}`,
    },
    body: JSON.stringify({
      submissionId: submission.id,
      message: 'Hi, want to try study sessions together?',
    }),
  })

  assert.equal(createChatResult.response.status, 201)
  assert.ok(createChatResult.body.chat.id)
  assert.equal(createChatResult.body.message.body, 'Hi, want to try study sessions together?')

  const chatId = createChatResult.body.chat.id
  const senderChatsResult = await request('/chats', {
    headers: {
      Authorization: `Bearer ${senderToken}`,
    },
  })
  const ownerChatsResult = await request('/chats', {
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
  })
  const outsiderChatsResult = await request('/chats', {
    headers: {
      Authorization: `Bearer ${outsiderToken}`,
    },
  })

  assert.equal(senderChatsResult.response.status, 200)
  assert.equal(ownerChatsResult.response.status, 200)
  assert.equal(outsiderChatsResult.response.status, 200)
  assert.equal(senderChatsResult.body.chats.length, 1)
  assert.equal(ownerChatsResult.body.chats.length, 1)
  assert.equal(outsiderChatsResult.body.chats.length, 0)

  const ownerReplyResult = await request(`/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      message: 'Yes, that sounds good.',
    }),
  })

  assert.equal(ownerReplyResult.response.status, 201)
  assert.equal(ownerReplyResult.body.message.body, 'Yes, that sounds good.')

  const messagesResult = await request(`/chats/${chatId}/messages`, {
    headers: {
      Authorization: `Bearer ${senderToken}`,
    },
  })

  assert.equal(messagesResult.response.status, 200)
  assert.equal(messagesResult.body.messages.length, 2)
  assert.deepEqual(
    messagesResult.body.messages.map((message) => message.body),
    ['Hi, want to try study sessions together?', 'Yes, that sounds good.'],
  )

  const outsiderMessagesResult = await request(`/chats/${chatId}/messages`, {
    headers: {
      Authorization: `Bearer ${outsiderToken}`,
    },
  })

  assert.equal(outsiderMessagesResult.response.status, 404)
})

test('rejects empty messages and chats with your own submission', async () => {
  const ownerLoginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ownerUser.email,
      password: ownerUser.password,
    }),
  })

  assert.equal(ownerLoginResult.response.status, 200)

  const ownerToken = ownerLoginResult.body.token
  const ownSubmission = await createSubmission(ownerToken, 'Self chat test submission')
  const selfChatResult = await request('/chats', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      submissionId: ownSubmission.id,
      message: 'Talking to myself should not create a chat.',
    }),
  })

  assert.equal(selfChatResult.response.status, 400)
  assert.equal(selfChatResult.body.error, 'You cannot start a chat with your own submission.')

  const emptyMessageResult = await request('/chats', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      submissionId: ownSubmission.id,
      message: '   ',
    }),
  })

  assert.equal(emptyMessageResult.response.status, 400)
  assert.equal(emptyMessageResult.body.error, 'Message is required.')
})
