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
    const { password, confirmPassword } = req.body
    const email = req.body.email?.trim().toLowerCase()

    if (!email || !password) {
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Email and password are required.' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Invalid email format.' })
    }

    if (password !== confirmPassword) {
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Passwords do not match.' })
    }

    try {
      // Store only the bcrypt hash. Never save the plain password in the database.
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
      const result = await pool.query(
        `
          INSERT INTO users (email, password_hash)
          VALUES ($1, $2)
          RETURNING id, email, created_at
        `,
        [email, hashedPassword],
      )

      const newUser = result.rows[0]
      const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

      console.log('Account created successfully:', { id: newUser.id, email: newUser.email })
      return res.status(STATUS.CREATED).json({ message: 'Account created successfully.', token })
    } catch (error) {
      // PostgreSQL unique_violation. The users.email column has a UNIQUE constraint.
      if (error.code === '23505') {
        return res.status(STATUS.CONFLICT).json({ error: 'An account with this email already exists.' })
      }

      console.error('Signup failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: 'Could not create account.' })
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
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Email and password are required.' })
    }

    try {
      const result = await pool.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email],
      )

      const user = result.rows[0]
      if (!user) {
        return res.status(STATUS.UNAUTHORIZED).json({ error: 'Incorrect email or password.' })
      }

      // bcrypt.compare hashes the submitted password and checks it against password_hash.
      const passwordMatch = await bcrypt.compare(password, user.password_hash)
      if (!passwordMatch) {
        return res.status(STATUS.UNAUTHORIZED).json({ error: 'Incorrect email or password.' })
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
      return res.status(STATUS.OK).json({ message: 'Logged in successfully.', token })
    } catch (error) {
      console.error('Login failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: 'Could not log in.' })
    }
  }
}

module.exports = new AuthController()
