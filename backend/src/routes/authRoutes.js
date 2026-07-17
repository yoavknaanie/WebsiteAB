/**
 * Auth Routes
 * -----------
 * Maps HTTP endpoints to their corresponding controller methods.
 * This file only defines the routes — no logic lives here.
 *
 * POST /auth/signup → AuthController.signup
 * POST /auth/login  → AuthController.login
 */
const express = require('express')
const authController = require('../controllers/AuthController')
const { authRateLimiter } = require('../middleware/rateLimitMiddleware')

const router = express.Router()

router.post('/signup', authRateLimiter, (req, res) => authController.signup(req, res))
router.post('/login', authRateLimiter, (req, res) => authController.login(req, res))

module.exports = router
