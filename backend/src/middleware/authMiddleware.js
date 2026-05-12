/**
 * Auth Middleware
 * ---------------
 * Protects routes that require a logged-in user.
 *
 * Expected request header:
 * Authorization: Bearer <token>
 *
 * What this middleware does:
 * 1. Reads the Authorization header.
 * 2. Confirms it uses the Bearer token format.
 * 3. Verifies the JWT with JWT_SECRET.
 * 4. Attaches the logged-in user's id to req.userId.
 * 5. Calls next() so the protected controller can run.
 *
 * If the token is missing, invalid, or expired, it returns 401 Unauthorized.
 */

const jwt = require('jsonwebtoken')

const AUTH_ERROR = 'Unauthorized.'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: AUTH_ERROR })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    return next()
  } catch (error) {
    return res.status(401).json({ error: AUTH_ERROR })
  }
}

module.exports = authMiddleware
