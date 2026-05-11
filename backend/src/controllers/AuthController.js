/**
 * AuthController
 * --------------
 * Centralizes the backend authentication actions for the app.
 *
 * The route files call this controller when a user signs up or logs in.
 * The controller is responsible for validating incoming request data,
 * reading/writing user records in PostgreSQL, hashing and checking passwords,
 * and issuing JWT tokens that the frontend can store and send with later
 * authenticated requests.
 *
 * Security responsibilities:
 * - Never stores plain-text passwords. Signup hashes passwords with bcrypt
 *   before inserting them into PostgreSQL.
 * - Uses parameterized SQL queries through postgres, so request values are passed
 *   separately from the SQL text instead of being string-concatenated.
 * - Normalizes emails before lookup/insert to reduce duplicate accounts caused
 *   by casing or accidental whitespace.
 * - Relies on the database UNIQUE constraint for users.email to prevent
 *   duplicate accounts safely even if two signup requests happen at the same time.
 * - Signs JWTs with JWT_SECRET and includes only the database user id in the
 *   token payload.
 * - Avoids logging password values or password hashes.
 *
 * API endpoints using this controller:
 * - POST /auth/signup
 * - POST /auth/login
 *
 * Both endpoints return a JWT token on success. The token payload contains:
 * - userId: the PostgreSQL users.id value
 */

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')

const SALT_ROUNDS = 10
const USERNAME_MIN_LENGTH = 3
const USERNAME_MAX_LENGTH = 30
const PASSWORD_MIN_LENGTH = 8

const AUTH_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully.',
  ACCOUNT_CREATE_FAILED: 'Could not create account.',
  EMAIL_AND_PASSWORD_REQUIRED: 'Email and password are required.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  INCORRECT_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
  INVALID_EMAIL: 'Invalid email format.',
  LOGIN_FAILED: 'Could not log in.',
  LOGIN_SUCCESS: 'Logged in successfully.',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match.',
  PASSWORD_SHOULD_BE_AT_LEAST_8_CHARACTERS: 'Password should be at least 8 characters.',
  USERNAME_REQUIRED: 'Username is required.',
  USERNAME_TAKEN: 'Username is taken.',
  USERNAME_TOO_SHORT: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
  USERNAME_TOO_LONG: `Username must be ${USERNAME_MAX_LENGTH} characters or less.`,
}

const STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
}

class AuthController {
  #normalizeEmail(email) {
    return email?.trim().toLowerCase()
  }

  #isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  #normalizeUsername(username) {
    return username?.trim()
  }

  #validateUsername(username) {
    if (!username) {
      return AUTH_MESSAGES.USERNAME_REQUIRED
    }

    if (username.length < USERNAME_MIN_LENGTH) {
      return AUTH_MESSAGES.USERNAME_TOO_SHORT
    }

    if (username.length > USERNAME_MAX_LENGTH) {
      return AUTH_MESSAGES.USERNAME_TOO_LONG
    }

    return null
  }

  #validateSignupInput({ username, email, password, confirmPassword }) {
    const usernameError = this.#validateUsername(username)
    if (usernameError) {
      return usernameError
    }

    if (!email || !password) {
      return AUTH_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED
    }

    if (!this.#isValidEmail(email)) {
      return AUTH_MESSAGES.INVALID_EMAIL
    }

    if (password !== confirmPassword) {
      return AUTH_MESSAGES.PASSWORDS_DO_NOT_MATCH
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return AUTH_MESSAGES.PASSWORD_SHOULD_BE_AT_LEAST_8_CHARACTERS
    }

    return null
  }

  #getSignupInput(body) {
    return {
      username: this.#normalizeUsername(body.username),
      email: this.#normalizeEmail(body.email),
      password: body.password,
      confirmPassword: body.confirmPassword,
    }
  }

  async #isUsernameTaken(username) {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE username = $1',
      [username],
    )
    const usernameExists = result.rowCount > 0
    return usernameExists
  }

  async #createUser({ username, email, password }) {
    // Store only the bcrypt hash. Never save the plain password in the database.
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await pool.query(
      `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at
      `,
      [username, email, hashedPassword],
    )

    return result.rows[0]
  }

  #createToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
  }

  #handleSignupError(error, res) {
    // PostgreSQL unique_violation. The database has UNIQUE constraints for username and email.
    if (error.code === '23505') {
      if (error.constraint?.includes('username')) {
        return res.status(STATUS.CONFLICT).json({ error: AUTH_MESSAGES.USERNAME_TAKEN })
      }

      return res.status(STATUS.CONFLICT).json({ error: AUTH_MESSAGES.EMAIL_ALREADY_EXISTS })
    }

    console.error('Signup failed:', error)
    return res.status(STATUS.SERVER_ERROR).json({ error: AUTH_MESSAGES.ACCOUNT_CREATE_FAILED })
  }

  /**
   * POST /auth/signup
   *
   * Creates a new user account.
   * This is the only place where a new auth user is inserted into PostgreSQL.
   *
   * Request body:
   * {
   *   "email": "user@example.com",
   *   "password": "plain-text password from the form",
   *   "confirmPassword": "same plain-text password"
   * }
   *
   * What happens:
   * 1. Normalizes the email by trimming spaces and converting it to lowercase.
   * 2. Validates that email and password exist before doing any database work.
   * 3. Validates the email format.
   * 4. Confirms password and confirmPassword match so the account is not created
   *    from a mistyped password.
   * 5. Hashes the password with bcrypt using SALT_ROUNDS. The plain password is
   *    kept only in memory for this request and is never saved.
   * 6. Inserts the user into PostgreSQL users(email, password_hash) with a
   *    parameterized query. The database receives the email and hash as values,
   *    not as string-built SQL.
   * 7. Creates a JWT token using the inserted user's database id.
   * 8. Logs only non-sensitive user details: id and email.
   *
   * Security operations:
   * - Email normalization: makes duplicate detection more reliable.
   * - Server-side validation: does not trust frontend-only validation.
   * - bcrypt hashing: protects saved passwords if the database is exposed.
   * - Parameterized SQL: protects this insert from SQL injection.
   * - PostgreSQL unique email constraint: prevents duplicate signups safely.
   * - Minimal JWT payload: stores userId only, not email or password data.
   * - Safe logging: does not log the submitted password or password_hash.
   *
   * Success response:
   * - 201 Created
   * - { message, token }
   *
   * Error responses:
   * - 400 when required fields are missing, email is invalid, or passwords do not match.
   * - 409 when PostgreSQL rejects the insert because the email already exists.
   * - 500 when account creation fails for another server/database reason.
   */
  async signup(req, res) {
    const signupInput = this.#getSignupInput(req.body)

    const validationError = this.#validateSignupInput(signupInput)
    if (validationError) {
      return res.status(STATUS.BAD_REQUEST).json({ error: validationError })
    }

    try {
      if (await this.#isUsernameTaken(signupInput.username)) {
        return res.status(STATUS.CONFLICT).json({ error: AUTH_MESSAGES.USERNAME_TAKEN })
      }

      const newUser = await this.#createUser(signupInput)
      const token = this.#createToken(newUser.id)

      console.log(AUTH_MESSAGES.ACCOUNT_CREATED, {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      })
      return res.status(STATUS.CREATED).json({ message: AUTH_MESSAGES.ACCOUNT_CREATED, token })
    } catch (error) {
      return this.#handleSignupError(error, res)
    }
  }

  /**
   * POST /auth/login
   *
   * Logs in an existing user.
   *
   * Request body:
   * {
   *   "email": "user@example.com",
   *   "password": "plain-text password from the form"
   * }
   *
   * What happens:
   * 1. Normalizes the email by trimming spaces and converting it to lowercase.
   * 2. Validates that email and password exist.
   * 3. Loads the user row from PostgreSQL by email.
   * 4. Compares the submitted password with the saved bcrypt password_hash.
   * 5. Creates a JWT token using the user's database id.
   *
   * Success response:
   * - 200 OK
   * - { message, token }
   *
   * Error responses:
   * - 400 when email or password is missing.
   * - 401 when no user exists for that email or the password is incorrect.
   * - 500 when login fails for a server/database reason.
   */
  async login(req, res) {
    const { password } = req.body
    const email = req.body.email?.trim().toLowerCase()

    if (!email || !password) {
      return res.status(STATUS.BAD_REQUEST).json({ error: AUTH_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED })
    }

    try {
      const result = await pool.query(
        'SELECT id, username, email, password_hash FROM users WHERE email = $1',
        [email],
      )

      const user = result.rows[0]
      if (!user) {
        return res.status(STATUS.UNAUTHORIZED).json({ error: AUTH_MESSAGES.INCORRECT_EMAIL_OR_PASSWORD })
      }

      // bcrypt.compare hashes the submitted password and checks it against password_hash.
      const passwordMatch = await bcrypt.compare(password, user.password_hash)
      if (!passwordMatch) {
        return res.status(STATUS.UNAUTHORIZED).json({ error: AUTH_MESSAGES.INCORRECT_EMAIL_OR_PASSWORD })
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
      return res.status(STATUS.OK).json({
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
        token,
        username: user.username,
      })
    } catch (error) {
      console.error('Login failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: AUTH_MESSAGES.LOGIN_FAILED })
    }
  }
}

module.exports = new AuthController()
