/**
 * Database Initialization Script
 * ------------------------------
 * Run with:
 * npm run db:init
 *
 * What this script does:
 * 1. Loads backend/.env so DATABASE_URL is available.
 * 2. Reads every .sql file in backend/migrations.
 * 3. Sorts migration files by filename, for example 001 before 002.
 * 4. Sends each SQL file to PostgreSQL using the shared connection pool.
 * 5. Closes the database connection after the migrations finish.
 *
 * The migrations use IF NOT EXISTS where possible, so running this script again
 * should not delete existing data.
 */
require('dotenv').config()

const fs = require('fs/promises')
const path = require('path')
const pool = require('../src/db/pool')

async function initDb() {
  const migrationsDir = path.join(__dirname, '..', 'migrations')
  const migrationFiles = (await fs.readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()

  for (const fileName of migrationFiles) {
    const migrationPath = path.join(migrationsDir, fileName)
    const sql = await fs.readFile(migrationPath, 'utf8')

    console.log(`Running migration: ${fileName}`)
    await pool.query(sql)
  }

  await pool.end()

  console.log('Database initialized.')
}

initDb().catch(async (error) => {
  // Make sure the Node process can exit even if migration setup fails.
  await pool.end().catch(() => {})
  console.error('Database initialization failed:', error.message)
  process.exit(1)
})
