import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import Questionnaire from '../../components/Questionnaire'

describe('Questionnaire submission', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'test-token')
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Submission created successfully.' }),
        }),
      ),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  test('sends a submission request with normalized form fields and auth token', async () => {
    const user = userEvent.setup()

    render(<Questionnaire />)

    await user.type(screen.getByLabelText(/age/i), '25')
    await user.selectOptions(screen.getByLabelText(/gender/i), 'Other')
    await user.type(document.querySelector('#otherGender'), 'Non-binary')
    await user.selectOptions(document.querySelector('#timezone-select'), 'UTC +10')
    await user.type(screen.getByLabelText(/title/i), 'Daily study partner')
    await user.type(screen.getByLabelText(/description/i), 'Looking for focused study sessions.')
    await user.type(screen.getByLabelText(/goals/i), 'Finish my accounting course.')

    const lookingForInputs = screen.getAllByPlaceholderText(/^#\d$/)
    await user.type(lookingForInputs[0], 'Consistent')
    await user.type(lookingForInputs[1], 'Friendly')

    await user.selectOptions(screen.getByRole('combobox', { name: /availability/i }), 'Other')
    await user.type(screen.getByPlaceholderText(/please describe your availability/i), 'Weeknights after 7')
    await user.click(screen.getByLabelText('Chat'))
    await user.click(screen.getByLabelText('Other'))
    await user.type(document.querySelector('#communicationOther'), 'Discord')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/submissions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      }),
    )

    const requestBody = JSON.parse(fetch.mock.calls[0][1].body)
    expect(requestBody).toEqual({
      title: 'Daily study partner',
      age: 25,
      gender: 'Non-binary',
      timezone: 'UTC +10',
      description: 'Looking for focused study sessions.',
      goals: 'Finish my accounting course.',
      looking_for1: 'Consistent',
      looking_for2: 'Friendly',
      looking_for3: '',
      looking_for4: '',
      looking_for5: '',
      availability: 'Weeknights after 7',
      communication: 'Chat, Discord',
      constraints: '',
    })

    expect(await screen.findByText('Submission has been uploaded!')).toBeInTheDocument()
  })

  test('disables the submit button while the submission request is pending', async () => {
    let resolveSubmission
    fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmission = () =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ message: 'Submission created successfully.' }),
            })
        }),
    )

    const user = userEvent.setup()

    render(<Questionnaire />)

    await user.type(screen.getByLabelText(/age/i), '25')
    await user.selectOptions(screen.getByLabelText(/gender/i), 'M')
    await user.type(screen.getByLabelText(/title/i), 'Daily study partner')
    await user.selectOptions(screen.getByRole('combobox', { name: /availability/i }), 'Once daily')
    await user.click(screen.getByLabelText('Chat'))
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled()

    resolveSubmission()

    expect(await screen.findByRole('button', { name: 'Submit' })).toBeEnabled()
  })
})
