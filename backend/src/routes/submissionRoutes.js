/**
 * Submission Routes
 * -----------------
 * Maps submission-related HTTP endpoints to their controller methods.
 * Responsibilities:
 * - Define route paths.
 * - Attach middleware such as JWT authentication.
 * - Forward the request to the submission controller.
 *
 * The route logic itself should live in:
 * backend/src/controllers/SubmissionController.js
 *
 * Planned endpoints:
 * - POST /submissions
 *   Creates a new buddy-search submission for the logged-in user.
 *
 * - GET /submissions
 *   Lists submissions for the public submissions board.
 *
 * - GET /submissions/mine
 *   Lists submissions created by the logged-in user.
 *
 * Auth note:
 * Creating a submission should be protected by JWT middleware.
 * The frontend should send:
 * Authorization: Bearer <token>
 *
 * The middleware should verify the token and attach:
 * req.userId = decoded.userId
 *
 * Then the controller can safely use req.userId as the submission owner.
 */

const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const submissionController = require('../controllers/SubmissionController')

// Create a new submission for the logged-in user.
router.post('/', authMiddleware, (req, res) => submissionController.create(req, res))

// Delete one of the logged-in user's submissions by submission id.
router.delete('/:id', authMiddleware, (req, res) => submissionController.delete(req, res))

// List public submissions for the submissions board.
router.get('/', (req, res) => submissionController.list(req, res))

// TODO: Uncomment after SubmissionController.listMine database logic is implemented.
// router.get('/mine', authMiddleware, (req, res) => submissionController.listMine(req, res))

module.exports = router
