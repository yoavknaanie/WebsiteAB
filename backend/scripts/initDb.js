/**
 * Database Initialization Script
 * ------------------------------
 * Run with:
 * npm run db:init
 *
 * What this script does:
 * 1. Loads backend/.env so DATABASE_URL is available.
 * 2. Reads migrations/001_create_users.sql from disk.
 * 3. Sends that SQL to PostgreSQL using the shared connection pool.
 * 4. Closes the database connection after the migration finishes.
 *
 * The migration uses CREATE TABLE IF NOT EXISTS, so running this script again
 * will not delete existing users.
 */
require('dotenv').config()

const fs = require('fs/promises')
const path = require('path')
const pool = require('../src/db/pool')

async function initDb() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_create_users.sql')
  const sql = await fs.readFile(migrationPath, 'utf8')

  // Executes the users table migration against the database in DATABASE_URL.
  await pool.query(sql)
  await pool.end()

  console.log('Database initialized.')
}

initDb().catch(async (error) => {
  // Make sure the Node process can exit even if migration setup fails.
  await pool.end().catch(() => {})
  console.error('Database initialization failed:', error.message)
  process.exit(1)
})
