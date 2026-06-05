import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import Signup from '../../components/SignUp'

// Keep generated signup users unlikely to collide with existing database rows.
const randomNumber = () => Math.floor(1000 + Math.random() * 9000)

const renderSignup = () => {
  // Render the signup component inside a small test router.
  // This lets the test verify that navigate('/home') works.
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<h1>Home page</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const submitSignupForm = async ({ username, email, password, submitDirectly = false }) => {
  // userEvent simulates real user actions such as typing and clicking.
  const user = userEvent.setup()

  // getByLabelText finds inputs by their visible label text.
  // This works because SignUp.jsx connects labels to inputs with htmlFor/id.
  await user.type(screen.getByLabelText('Username'), username)
  const emailInput = screen.getByLabelText('Email')
  await user.type(emailInput, email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), password)

  const submitButton = screen.getByRole('button', { name: 'Sign Up' })
  if (submitDirectly) {
    // Invalid email is normally blocked by the browser before React submit runs.
    // This direct submit lets us test the backend invalid-email response.
    fireEvent.submit(submitButton.closest('form'))
    return
  }

  // For normal cases, click the submit button like a user would.
  await user.click(submitButton)
}

describe('Signup integration with backend', () => {
  beforeEach(() => {
    // Each test starts with clean browser-like storage.
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    // Remove the rendered component from the fake DOM after each test.
    cleanup()
  })

  test('creates a user and navigates to home', async () => {
    // This test calls the real backend and creates a real database user.
    const id = randomNumber()
    const username = `test${id}`
    const password = `Test${id}pass!`

    renderSignup()

    await submitSignupForm({
      username,
      email: `${username}@example.com`,
      password,
    })

    // findByRole waits until the home heading appears after navigation.
    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument()
    // Successful signup should store auth/session data in sessionStorage.
    expect(sessionStorage.getItem('token')).toBeTruthy()
    expect(sessionStorage.getItem('username')).toBe(username)
  })

  test('shows an error for a password shorter than 8 characters', async () => {
    const username = `test${randomNumber()}`

    renderSignup()

    await submitSignupForm({
      username,
      email: `${username}@example.com`,
      password: 'Abc123!',
    })

    // The form should stay on signup instead of navigating after a backend error.
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Home page' })).not.toBeInTheDocument()
    })
    // The exact backend wording may change, so this checks for the important idea.
    expect(await screen.findByText(/password.*8|8.*password|at least/i)).toBeInTheDocument()
  })

  test('shows an error for an invalid email format', async () => {
    const username = `test${randomNumber()}`

    renderSignup()

    await submitSignupForm({
      username,
      email: 'invalid-email',
      password: `Test${randomNumber()}pass!`,
      submitDirectly: true,
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Home page' })).not.toBeInTheDocument()
    })
    // Verify the frontend displays the backend email validation error.
    expect(await screen.findByText(/invalid email|email format/i)).toBeInTheDocument()
  })

  test('shows an error for a username shorter than 3 characters', async () => {
    renderSignup()

    await submitSignupForm({
      username: 'te',
      email: `test${randomNumber()}@example.com`,
      password: `Test${randomNumber()}pass!`,
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Home page' })).not.toBeInTheDocument()
    })
    // Verify the frontend displays the backend username minimum-length error.
    expect(await screen.findByText(/username.*at least|at least.*username|3 characters/i)).toBeInTheDocument()
  })

  test('shows an error for a username longer than 30 characters', async () => {
    renderSignup()

    await submitSignupForm({
      username: `test${'x'.repeat(31)}`,
      email: `test${randomNumber()}@example.com`,
      password: `Test${randomNumber()}pass!`,
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Home page' })).not.toBeInTheDocument()
    })
    // Verify the frontend displays the backend username maximum-length error.
    expect(await screen.findByText(/username.*30|30.*username|characters or less/i)).toBeInTheDocument()
  })
})
