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
const router = express.Router()
const authController = require('../controllers/AuthController')

router.post('/signup', (req, res) => authController.signup(req, res))
router.post('/login', (req, res) => authController.login(req, res))

module.exports = router
