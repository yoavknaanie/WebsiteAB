const pool = require('../db/pool')

class SubmissionRepository {
  async createSubmission(submissionData) {
    const result = await pool.query(
      `
        INSERT INTO submissions (
          user_id,
          title,
          age,
          gender,
          timezone,
          description,
          goals,
          looking_for1,
          looking_for2,
          looking_for3,
          looking_for4,
          looking_for5,
          availability,
          communication,
          constraints
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `,
      [
        submissionData.userId,
        submissionData.title,
        submissionData.age,
        submissionData.gender,
        submissionData.timezone,
        submissionData.description,
        submissionData.goals,
        submissionData.looking_for1,
        submissionData.looking_for2,
        submissionData.looking_for3,
        submissionData.looking_for4,
        submissionData.looking_for5,
        submissionData.availability,
        submissionData.communication,
        submissionData.constraints,
      ],
    )

    return result.rows[0]
  }

  async deleteSubmissionById({ submissionId, userId }) {
    const result = await pool.query(
      `
        DELETE FROM submissions
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `,
      [submissionId, userId],
    )

    return result.rows[0]
  }

  async listSubmissions({ limit, offset }) {
    const result = await pool.query(
      `
        SELECT
          submissions.id,
          submissions.user_id,
          users.username AS publisher_username,
          submissions.title,
          submissions.age,
          submissions.gender,
          submissions.timezone,
          submissions.description,
          submissions.goals,
          submissions.looking_for1,
          submissions.looking_for2,
          submissions.looking_for3,
          submissions.looking_for4,
          submissions.looking_for5,
          submissions.availability,
          submissions.communication,
          submissions.constraints,
          submissions.created_at
        FROM submissions
        JOIN users ON users.id = submissions.user_id
        ORDER BY submissions.created_at DESC, submissions.id DESC
        LIMIT $1 OFFSET $2
      `,
      [limit + 1, offset],
    )

    return {
      submissions: result.rows.slice(0, limit),
      hasMore: result.rows.length > limit,
    }
  }
}

module.exports = new SubmissionRepository()
