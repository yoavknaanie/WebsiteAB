/**
 * SubmissionController
 * --------------------
 * Centralizes backend actions for buddy-search submissions.
 *
 * Route files should call this controller instead of containing submission
 * logic directly. This keeps Express routes thin and keeps validation,
 * database inserts, and database reads in one place.
 *
 * Planned responsibilities:
 * - Validate incoming questionnaire/submission data.
 * - Use req.userId from JWT auth middleware for ownership.
 * - Insert submissions into PostgreSQL with parameterized SQL.
 * - List submissions for the public board.
 * - List the current user's own submissions.
 *
 * Security notes:
 * - Do not trust a userId sent from the frontend body.
 * - Use req.userId from verified JWT middleware.
 * - Use parameterized SQL queries, never string-concatenated SQL.
 * - Return validation errors as 400 responses.
 * - Return 401 from auth middleware before this controller when the token is
 *   missing, invalid, or expired.
 */

const pool = require('../db/pool')

const STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
}

const SUBMISSION_MESSAGES = {
  CREATE_SUCCESS: 'Submission created successfully.',
  CREATE_FAILED: 'Could not create submission.',
  DELETE_SUCCESS: 'Submission deleted successfully.',
  DELETE_FAILED: 'Could not delete submission.',
  LIST_FAILED: 'Could not load submissions.',
  USER_REQUIRED: 'Logged-in user is required.',
  SUBMISSION_ID_REQUIRED: 'Submission id is required.',
  SUBMISSION_ID_INVALID: 'Submission id must be a positive integer.',
  SUBMISSION_NOT_FOUND: 'Submission was not found for this user.',
  TITLE_REQUIRED: 'Title is required.',
  AGE_REQUIRED: 'Age is required.',
  AGE_INVALID: 'Age must be a number between 13 and 120.',
  GENDER_REQUIRED: 'Gender is required.',
  TIMEZONE_REQUIRED: 'Timezone is required.',
  AVAILABILITY_REQUIRED: 'Availability is required.',
  COMMUNICATION_REQUIRED: 'Communication is required.',
}

class SubmissionController {
  #createValidationError(message) {
    const error = new Error(message)
    error.status = STATUS.BAD_REQUEST
    return error
  }

  #normalizeRequiredString(value) {
    return typeof value === 'string' ? value.trim() : ''
  }

  #normalizeOptionalString(value) {
    if (typeof value !== 'string') {
      return null
    }

    const trimmedValue = value.trim()
    return trimmedValue || null
  }

  #normalizeAge(age) {
    if (age === null || age === undefined || age === '') {
      return null
    }

    return Number(age)
  }

  #getSubmissionData(req) {
    return {
      userId: req.userId,
      title: req.body.title,
      age: req.body.age,
      gender: req.body.gender,
      timezone: req.body.timezone,
      description: req.body.description,
      goals: req.body.goals,
      looking_for1: req.body.looking_for1,
      looking_for2: req.body.looking_for2,
      looking_for3: req.body.looking_for3,
      looking_for4: req.body.looking_for4,
      looking_for5: req.body.looking_for5,
      availability: req.body.availability,
      communication: req.body.communication,
      constraints: req.body.constraints,
    }
  }

  #normalizeSubmissionData(submissionData) {
    return {
      userId: submissionData.userId,
      title: this.#normalizeRequiredString(submissionData.title),
      age: this.#normalizeAge(submissionData.age),
      gender: this.#normalizeRequiredString(submissionData.gender),
      timezone: this.#normalizeRequiredString(submissionData.timezone),
      description: this.#normalizeOptionalString(submissionData.description),
      goals: this.#normalizeOptionalString(submissionData.goals),
      looking_for1: this.#normalizeOptionalString(submissionData.looking_for1),
      looking_for2: this.#normalizeOptionalString(submissionData.looking_for2),
      looking_for3: this.#normalizeOptionalString(submissionData.looking_for3),
      looking_for4: this.#normalizeOptionalString(submissionData.looking_for4),
      looking_for5: this.#normalizeOptionalString(submissionData.looking_for5),
      availability: this.#normalizeRequiredString(submissionData.availability),
      communication: this.#normalizeRequiredString(submissionData.communication),
      constraints: this.#normalizeOptionalString(submissionData.constraints),
    }
  }

  #validateSubmissionData(submissionData) {
    if (!submissionData.userId) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.USER_REQUIRED)
    }

    if (!submissionData.title) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.TITLE_REQUIRED)
    }

    if (submissionData.age === null) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.AGE_REQUIRED)
    }

    if (!Number.isInteger(submissionData.age) || submissionData.age < 13 || submissionData.age > 120) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.AGE_INVALID)
    }

    if (!submissionData.gender) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.GENDER_REQUIRED)
    }

    if (!submissionData.timezone) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.TIMEZONE_REQUIRED)
    }

    if (!submissionData.availability) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.AVAILABILITY_REQUIRED)
    }

    if (!submissionData.communication) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.COMMUNICATION_REQUIRED)
    }
  }

  async #createSubmission(submissionData) {
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

  #logSubmissionCreation(newSubmission) {
    console.log(SUBMISSION_MESSAGES.CREATE_SUCCESS, {
      id: newSubmission.id,
      userId: newSubmission.user_id,
      title: newSubmission.title,
    })
  }

  #getDeleteSubmissionData(req) {
    return {
      userId: req.userId,
      submissionId: req.params.id,
    }
  }

  #normalizeDeleteSubmissionData(deleteData) {
    return {
      userId: deleteData.userId,
      submissionId: Number(deleteData.submissionId),
    }
  }

  #validateDeleteSubmissionData(deleteData) {
    if (!deleteData.userId) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.USER_REQUIRED)
    }

    if (!deleteData.submissionId) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.SUBMISSION_ID_REQUIRED)
    }

    if (!Number.isInteger(deleteData.submissionId) || deleteData.submissionId <= 0) {
      throw this.#createValidationError(SUBMISSION_MESSAGES.SUBMISSION_ID_INVALID)
    }
  }

  async #deleteSubmissionById(deleteData) {
    const result = await pool.query(
      `
        DELETE FROM submissions
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `,
      [deleteData.submissionId, deleteData.userId],
    )

    return result.rows[0]
  }

  #logSubmissionDeletion(deletedSubmission) {
    console.log(SUBMISSION_MESSAGES.DELETE_SUCCESS, {
      id: deletedSubmission.id,
      userId: deletedSubmission.user_id,
      title: deletedSubmission.title,
    })
  }

  /**
   * POST /submissions
   *
   * Planned flow:
   * 1. Receive validated logged-in user id from req.userId.
   * 2. Read questionnaire fields from req.body.
   * 3. Validate required fields.
   * 4. Insert the submission into PostgreSQL.
   * 5. Return 201 Created with the new submission.
   */
  async create(req, res) {
    try {
      const submissionData = this.#getSubmissionData(req)
      const normalizedSubmissionData = this.#normalizeSubmissionData(submissionData)

      this.#validateSubmissionData(normalizedSubmissionData)

      const newSubmission = await this.#createSubmission(normalizedSubmissionData)

      this.#logSubmissionCreation(newSubmission)

      return res.status(STATUS.CREATED).json({
        message: SUBMISSION_MESSAGES.CREATE_SUCCESS,
        submission: newSubmission,
      })
    } catch (error) {
      if (error.status === STATUS.BAD_REQUEST) {
        return res.status(STATUS.BAD_REQUEST).json({ error: error.message })
      }

      console.error('Submission creation failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({
        error: SUBMISSION_MESSAGES.CREATE_FAILED,
      })
    }
  }

  /**
   * DELETE /submissions/:id
   *
   * Deletes one submission owned by the logged-in user.
   *
   * The submission id comes from req.params.id.
   * The user id comes from req.userId, attached by authMiddleware.
   *
   * The SQL query checks both id and user_id so a user cannot delete another
   * user's submission.
   */
  async delete(req, res) {
    try {
      const deleteData = this.#getDeleteSubmissionData(req)
      const normalizedDeleteData = this.#normalizeDeleteSubmissionData(deleteData)

      this.#validateDeleteSubmissionData(normalizedDeleteData)

      const deletedSubmission = await this.#deleteSubmissionById(normalizedDeleteData)

      if (!deletedSubmission) {
        return res.status(STATUS.NOT_FOUND).json({
          error: SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND,
        })
      }

      this.#logSubmissionDeletion(deletedSubmission)

      return res.status(STATUS.OK).json({
        message: SUBMISSION_MESSAGES.DELETE_SUCCESS,
        submission: deletedSubmission,
      })
    } catch (error) {
      if (error.status === STATUS.BAD_REQUEST) {
        return res.status(STATUS.BAD_REQUEST).json({ error: error.message })
      }

      console.error('Submission deletion failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({
        error: SUBMISSION_MESSAGES.DELETE_FAILED,
      })
    }
  }

    /**
   * GET /submissions
   *
   * Planned flow:
   * 1. Load public submissions from PostgreSQL.
   * 2. Sort newest first.
   * 3. Return submissions for the board.
   */
  async list(req, res) {
    return res.status(STATUS.SERVER_ERROR).json({
      error: 'TODO: SubmissionController.list is not implemented yet.',
    })
  }

  /**
   * GET /submissions/mine
   *
   * Planned flow:
   * 1. Receive logged-in user id from req.userId.
   * 2. Load only that user's submissions.
   * 3. Return them for My Board.
   */
  async listMine(req, res) {
    return res.status(STATUS.SERVER_ERROR).json({
      error: 'TODO: SubmissionController.listMine is not implemented yet.',
    })
  }
}

module.exports = new SubmissionController()
