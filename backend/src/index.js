/**
 * Entry Point
 * -----------
 * Starts the Express server and registers all routes.
 * All new route files should be imported and mounted here.
 * dotenv is loaded here first so all other files can access process.env.
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
// TODO: Import submissions routes after creating backend/src/routes/submissionRoutes.js.
// const submissionRoutes = require('./routes/submissionRoutes')

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Routes
app.use('/auth', authRoutes)
// TODO: Mount protected submissions routes after adding auth middleware and submission controller.
// Expected route base: POST /submissions, GET /submissions, GET /submissions/mine.
// app.use('/submissions', submissionRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
