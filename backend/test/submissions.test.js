const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')
const { spawn } = require('node:child_process')
const fs = require('node:fs/promises')
const path = require('node:path')
const dotenv = require('dotenv')

const backendRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(backendRoot, '.env') })

const pool = require('../src/db/pool')
const testPort = 3101
const baseUrl = `http://localhost:${testPort}`
const testRunId = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const testUser = {
  username: `subtest${testRunId}`.slice(0, 30),
  email: `subtest${testRunId}@example.com`,
  password: 'Password123!',
}
const secondTestUser = {
  username: `subtest${testRunId}b`.slice(0, 30),
  email: `missing-${testUser.email}`,
  password: testUser.password,
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

async function deleteTestUser() {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[testUser.email, secondTestUser.email]])
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

before(async () => {
  await runMigrations()
  await deleteTestUser()

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
  await deleteTestUser()
  await pool.end()

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
})

test('creates and deletes a submission for the logged-in user', async () => {
  const signupResult = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
    }),
  })

  assert.equal(signupResult.response.status, 201)
  assert.ok(signupResult.body.token)

  const token = signupResult.body.token
  const createResult = await request('/submissions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Looking for study buddy',
      age: 25,
      gender: 'Other',
      timezone: 'Australia/Sydney',
      description: 'Testing backend submissions',
      goals: 'Study daily',
      looking_for1: 'Accountability',
      looking_for2: 'Focus sessions',
      looking_for3: 'Weekly check-ins',
      looking_for4: 'Similar timezone',
      looking_for5: 'Kind communication',
      availability: 'Evenings',
      communication: 'Discord',
      constraints: 'None',
    }),
  })

  assert.equal(createResult.response.status, 201)
  assert.equal(createResult.body.message, 'Submission created successfully.')
  assert.ok(createResult.body.submission.id)
  assert.equal(createResult.body.submission.title, 'Looking for study buddy')
  assert.equal(createResult.body.submission.age, 25)

  const submissionId = createResult.body.submission.id
  const deleteResult = await request(`/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  assert.equal(deleteResult.response.status, 200)
  assert.equal(deleteResult.body.message, 'Submission deleted successfully.')
  assert.equal(deleteResult.body.submission.id, submissionId)
})

test('rejects submission creation without a token', async () => {
  const result = await request('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      title: 'No token test',
    }),
  })

  assert.equal(result.response.status, 401)
  assert.equal(result.body.error, 'Unauthorized.')
})

test('rejects invalid and missing submission deletes', async () => {
  const signupResult = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      username: `${testUser.username}b`.slice(0, 30),
      email: secondTestUser.email,
      password: secondTestUser.password,
      confirmPassword: secondTestUser.password,
    }),
  })

  assert.equal(signupResult.response.status, 201)

  const token = signupResult.body.token
  const invalidIdResult = await request('/submissions/abc', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  assert.equal(invalidIdResult.response.status, 400)

  const missingSubmissionResult = await request('/submissions/999999999', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  assert.equal(missingSubmissionResult.response.status, 404)

  await pool.query('DELETE FROM users WHERE email = $1', [secondTestUser.email])
})
