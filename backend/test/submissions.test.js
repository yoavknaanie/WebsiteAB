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
const listTestUser = {
  username: `subtest${testRunId}c`.slice(0, 30),
  email: `list-${testUser.email}`,
  password: testUser.password,
}
const validationTestUser = {
  username: `subtest${testRunId}d`.slice(0, 30),
  email: `validation-${testUser.email}`,
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
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[
    testUser.email,
    secondTestUser.email,
    listTestUser.email,
    validationTestUser.email,
  ]])
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

async function createSubmission(token, submissionOverrides = {}) {
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
      ...submissionOverrides,
    }),
  })

  assert.equal(createResult.response.status, 201)
  return createResult.body.submission
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
  const token = await signupUser(testUser)
  const submission = await createSubmission(token)

  assert.ok(submission.id)
  assert.equal(submission.title, 'Looking for study buddy')
  assert.equal(submission.age, 25)

  const submissionId = submission.id
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

test('lists public submissions with pagination metadata', async () => {
  const token = await signupUser(listTestUser)
  const firstSubmission = await createSubmission(token, {
    title: 'First list test submission',
  })
  const secondSubmission = await createSubmission(token, {
    title: 'Second list test submission',
  })

  const listResult = await request('/submissions?limit=1&offset=0')

  assert.equal(listResult.response.status, 200)
  assert.equal(listResult.body.submissions.length, 1)
  assert.equal(listResult.body.submissions[0].id, secondSubmission.id)
  assert.equal(listResult.body.pagination.limit, 1)
  assert.equal(listResult.body.pagination.offset, 0)
  assert.equal(listResult.body.pagination.count, 1)
  assert.equal(listResult.body.pagination.hasMore, true)

  const secondPageResult = await request('/submissions?limit=1&offset=1')

  assert.equal(secondPageResult.response.status, 200)
  assert.equal(secondPageResult.body.submissions.length, 1)
  assert.equal(secondPageResult.body.submissions[0].id, firstSubmission.id)
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

test('rejects invalid submission age', async () => {
  const token = await signupUser(validationTestUser)
  const requiredSubmissionFields = {
    title: 'Validation test submission',
    age: 25,
    gender: 'Other',
    timezone: 'Australia/Sydney',
    availability: 'Evenings',
    communication: 'Discord',
  }
  const invalidRequests = [
    {
      body: { ...requiredSubmissionFields, age: 12 },
      expectedError: 'Age must be a number between 13 and 120.',
    },
    {
      body: { ...requiredSubmissionFields, age: 121 },
      expectedError: 'Age must be a number between 13 and 120.',
    },
  ]

  for (const invalidRequest of invalidRequests) {
    const result = await request('/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invalidRequest.body),
    })

    assert.equal(result.response.status, 400)
    assert.equal(result.body.error, invalidRequest.expectedError)
  }
})

test('rejects submission creation with missing required fields', async () => {
  const loginResult = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: validationTestUser.email,
      password: validationTestUser.password,
    }),
  })

  assert.equal(loginResult.response.status, 200)

  const token = loginResult.body.token
  const requiredSubmissionFields = {
    title: 'Validation test submission',
    age: 25,
    gender: 'Other',
    timezone: 'Australia/Sydney',
    availability: 'Evenings',
    communication: 'Discord',
  }
  const invalidRequests = [
    {
      body: { ...requiredSubmissionFields, title: '' },
      expectedError: 'Title is required.',
    },
    {
      body: { ...requiredSubmissionFields, age: undefined },
      expectedError: 'Age is required.',
    },
    {
      body: { ...requiredSubmissionFields, gender: '' },
      expectedError: 'Gender is required.',
    },
    {
      body: { ...requiredSubmissionFields, timezone: '' },
      expectedError: 'Timezone is required.',
    },
    {
      body: { ...requiredSubmissionFields, availability: '' },
      expectedError: 'Availability is required.',
    },
    {
      body: { ...requiredSubmissionFields, communication: '' },
      expectedError: 'Communication is required.',
    },
  ]

  for (const invalidRequest of invalidRequests) {
    const result = await request('/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invalidRequest.body),
    })

    assert.equal(result.response.status, 400)
    assert.equal(result.body.error, invalidRequest.expectedError)
  }
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

test('rejects invalid list pagination options', async () => {
  const invalidLimitResult = await request('/submissions?limit=abc')

  assert.equal(invalidLimitResult.response.status, 400)
  assert.equal(invalidLimitResult.body.error, 'Limit must be a positive integer.')

  const invalidOffsetResult = await request('/submissions?offset=-1')

  assert.equal(invalidOffsetResult.response.status, 400)
  assert.equal(invalidOffsetResult.body.error, 'Offset must be a non-negative integer.')

  const tooHighLimitResult = await request('/submissions?limit=51')

  assert.equal(tooHighLimitResult.response.status, 400)
  assert.equal(tooHighLimitResult.body.error, 'Limit cannot be greater than 50.')
})
