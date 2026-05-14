import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import Questionnaire from '../../components/Questionnare'
import Signup from '../../components/SignUp'

const API_URL = import.meta.env.VITE_API_URL
const randomNumber = () => Math.floor(1000 + Math.random() * 9000)

const renderSignupToQuestionnaire = () => {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
      </Routes>
    </MemoryRouter>,
  )
}

const signupThroughBackend = async ({ username, email, password }) => {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign Up' }))

  expect(await screen.findByRole('heading', { name: 'Looking for a Buddy Questionnaire' })).toBeInTheDocument()
}

const submitQuestionnaire = async () => {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText(/age/i), '27')
  await user.selectOptions(screen.getByLabelText(/gender/i), 'Other')
  await user.type(document.querySelector('#otherGender'), 'Non-binary')
  await user.selectOptions(document.querySelector('#timezone-select'), 'UTC +10')
  await user.type(screen.getByLabelText(/title/i), 'Integration study buddy ticket')
  await user.type(screen.getByLabelText(/description/i), 'Created by the frontend integration test.')
  await user.type(screen.getByLabelText(/goals/i), 'Keep a consistent study schedule.')

  const lookingForInputs = screen.getAllByPlaceholderText(/^#\d$/)
  await user.type(lookingForInputs[0], 'Accountability')
  await user.type(lookingForInputs[1], 'Similar timezone')

  await user.selectOptions(screen.getByRole('combobox', { name: /availability/i }), 'Other')
  await user.type(screen.getByPlaceholderText(/please describe your availability/i), 'Weeknights')
  await user.click(screen.getByLabelText('Chat'))
  await user.click(screen.getByLabelText('Other'))
  await user.type(document.querySelector('#communicationOther'), 'Discord')

  fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form'))

  expect(await screen.findByText('Submission has been uploaded!')).toBeInTheDocument()
}

const findCreatedSubmission = async (title) => {
  const response = await fetch(`${API_URL}/submissions?limit=50`)
  const body = await response.json()

  expect(response.ok).toBe(true)
  return body.submissions.find((submission) => submission.title === title)
}

const deleteSubmission = async (submissionId) => {
  const token = localStorage.getItem('token')

  const response = await fetch(`${API_URL}/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  expect(response.ok).toBe(true)
}

describe('Questionnaire submission integration with backend', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  test('creates a submission through the questionnaire and deletes it through the backend API', async () => {
    const id = randomNumber()
    const username = `test${id}`
    const email = `${username}@example.com`
    const password = `Test${id}pass!`
    const title = 'Integration study buddy ticket'

    renderSignupToQuestionnaire()

    await signupThroughBackend({ username, email, password })
    await submitQuestionnaire()

    let createdSubmission
    await waitFor(async () => {
      createdSubmission = await findCreatedSubmission(title)
      expect(createdSubmission).toBeTruthy()
    })

    expect(createdSubmission).toEqual(
      expect.objectContaining({
        title,
        age: 27,
        gender: 'Non-binary',
        timezone: 'UTC +10',
        availability: 'Weeknights',
        communication: 'Chat, Discord',
      }),
    )

    await deleteSubmission(createdSubmission.id)
  }, 30000)
})
