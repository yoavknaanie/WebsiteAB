/**
 * Auth Routes
 * -----------
 * Maps HTTP endpoints to their corresponding controller methods.
 * This file only defines the routes — no logic lives here.
 *
 * POST /auth/signup → AuthController.signup
 */

const express = require('express')
const router = express.Router()
const authController = require('../controllers/AuthController')

router.post('/signup', (req, res) => authController.signup(req, res))

module.exports = router
