/**
 * AuthController
 * --------------
 * Handles all authentication logic: signup, login (future).
 * Receives requests from routes, processes them, and sends responses.
 * It uses the User model to create and store user objects.
 */

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * SALT_ROUNDS — controls how much work bcrypt does to hash the password.
 * Higher = more secure but slower. 10 is the industry standard default.
 * Each increment doubles the computation time.
 */
const SALT_ROUNDS = 10

/**
 * HTTP Status Codes
 * -----------------
 * 200 OK            — request succeeded, used for general success (e.g. login)
 * 201 CREATED       — a new resource was successfully created (e.g. signup)
 * 400 BAD REQUEST   — the client sent invalid or missing data
 * 401 UNAUTHORIZED  — the client is not authenticated (no valid token)
 * 403 FORBIDDEN     — the client is authenticated but not allowed to do this
 * 404 NOT FOUND     — the requested resource does not exist
 * 409 CONFLICT      — the request conflicts with existing data (e.g. duplicate email)
 * 500 INTERNAL SERVER ERROR — something went wrong on the server side
 */
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

// Temporary in-memory storage — will be replaced with PostgreSQL
const users = []

class AuthController {
  async signup(req, res) {
    const { email, password, confirmPassword } = req.body

    if (!email || !password) { // actualy those are checked in the frontend
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Email and password are required.' })
    }

    // validates format: must have characters before @, a domain, and a dot in the domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Invalid email format.' })
    }

    if (password !== confirmPassword) {
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Passwords do not match.' })
    }

    const existingUser = users.find((u) => u.email === email)
    if (existingUser) {
      return res.status(STATUS.CONFLICT).json({ error: 'An account with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const newUser = new User(email, hashedPassword)
    users.push(newUser)

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    console.log('Account created successfully:', newUser)
    return res.status(STATUS.CREATED).json({ message: 'Account created successfully.', token })
  }

  async login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(STATUS.BAD_REQUEST).json({ error: 'Email and password are required.' })
    }

    const user = users.find((u) => u.email === email)
    if (!user) {
      return res.status(STATUS.UNAUTHORIZED).json({ error: 'Incorrect email or password.' })
    }

    // compare the plain password against the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(STATUS.UNAUTHORIZED).json({ error: 'Incorrect email or password.' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.status(STATUS.OK).json({ message: 'Logged in successfully.', token })
  }
}

module.exports = new AuthController()
