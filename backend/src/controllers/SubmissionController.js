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

const STATUS = {
  CREATED: 201,
  BAD_REQUEST: 400,
  SERVER_ERROR: 500,
}

const SUBMISSION_MESSAGES = {
  CREATE_SUCCESS: 'Submission created successfully.',
  CREATE_FAILED: 'Could not create submission.',
  LIST_FAILED: 'Could not load submissions.',
}

class SubmissionController {
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
    return res.status(STATUS.SERVER_ERROR).json({
      error: 'TODO: SubmissionController.create is not implemented yet.',
    })
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
