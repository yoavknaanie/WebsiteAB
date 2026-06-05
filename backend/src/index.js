/**
 * Backend Server Entry Point
 * --------------------------
 * Loads environment variables, creates the Express app, registers shared
 * middleware, mounts route modules, and starts the HTTP server.
 *
 * Mounted route groups:
 * - /auth handles signup and login.
 * - /submissions handles protected submission create/delete endpoints.
 *
 * dotenv is loaded before local modules so files that read process.env can
 * access values from backend/.env during startup.
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const submissionRoutes = require('./routes/submissionRoutes')

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
// Implemented submissions routes:
// - POST /submissions
// - DELETE /submissions/:id
// Planned but not mounted yet in submissionRoutes:
// - GET /submissions
// - GET /submissions/mine
app.use('/submissions', submissionRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
