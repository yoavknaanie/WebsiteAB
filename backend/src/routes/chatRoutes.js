/**
 * Chat Routes
 * -----------
 * Maps authenticated chat endpoints to ChatController.
 */

const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const chatController = require('../controllers/ChatController')

router.post('/', authMiddleware, (req, res) => chatController.create(req, res))
router.get('/', authMiddleware, (req, res) => chatController.list(req, res))
router.get('/:id/messages', authMiddleware, (req, res) => chatController.listMessages(req, res))
router.post('/:id/messages', authMiddleware, (req, res) => chatController.sendMessage(req, res))

module.exports = router
