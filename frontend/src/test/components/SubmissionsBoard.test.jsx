import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import SubmissionsBoard from '../../components/SubmissionsBoard'
import SubmissionsContext from '../../contexts/SubmissionsContext'

const renderSubmissionsBoard = ({ requests = [] } = {}) => {
  return render(
    <SubmissionsContext.Provider
      value={{
        requests,
        addRequest: vi.fn(),
        cancelRequest: vi.fn(),
        viewerId: 'viewer-1',
      }}
    >
      <SubmissionsBoard />
    </SubmissionsContext.Provider>,
  )
}

const mockSubmissionsResponse = (submissions) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            submissions,
            pagination: {
              limit: 20,
              offset: 0,
              count: submissions.length,
              hasMore: false,
            },
          }),
      }),
    ),
  )
}

const backendSubmission = (overrides = {}) => ({
  id: '1',
  user_id: '10',
  title: 'Accounting study partner',
  age: 25,
  gender: 'Non-binary',
  timezone: 'UTC +10',
  description: 'Looking for focused accounting sessions.',
  goals: 'Finish accounting coursework.',
  looking_for1: 'Accountability',
  looking_for2: 'Friendly',
  looking_for3: null,
  looking_for4: null,
  looking_for5: null,
  availability: 'Weeknights',
  communication: 'Chat, Discord',
  constraints: null,
  created_at: '2026-05-21T00:00:00.000Z',
  ...overrides,
})

describe('SubmissionsBoard', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  test('loads submissions from the backend API and displays normalized fields', async () => {
    mockSubmissionsResponse([backendSubmission()])

    renderSubmissionsBoard()

    expect(screen.getByText('Loading submissions...')).toBeInTheDocument()

    expect(await screen.findByText('Accounting study partner')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/submissions')
    expect(screen.getByText('Looking for focused accounting sessions.')).toBeInTheDocument()
    expect(screen.getByText('Age: 25')).toBeInTheDocument()
    expect(screen.getByText('Gender: Non-binary')).toBeInTheDocument()
    expect(screen.getByText('Availability: Weeknights')).toBeInTheDocument()
    expect(screen.getByText('Communication: Chat, Discord')).toBeInTheDocument()
    expect(screen.getByText('Looking for: Accountability, Friendly')).toBeInTheDocument()
    expect(screen.getByText('Timezone: UTC +10')).toBeInTheDocument()
  })

  test('shows backend load errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Could not load submissions.' }),
        }),
      ),
    )

    renderSubmissionsBoard()

    expect(await screen.findByText('Could not load submissions.')).toBeInTheDocument()
  })

  test('filters submissions by looking-for keywords', async () => {
    mockSubmissionsResponse([
      backendSubmission({
        id: '1',
        title: 'Accounting study partner',
        looking_for1: 'Accountability',
      }),
      backendSubmission({
        id: '2',
        title: 'Design project buddy',
        looking_for1: 'Creative feedback',
        communication: 'Voice Call',
      }),
    ])
    const user = userEvent.setup()

    renderSubmissionsBoard()

    expect(await screen.findByText('Accounting study partner')).toBeInTheDocument()
    expect(screen.getByText('Design project buddy')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('e.g. accountability, study, design'), 'creative')

    expect(screen.queryByText('Accounting study partner')).not.toBeInTheDocument()
    expect(screen.getByText('Design project buddy')).toBeInTheDocument()
  })

  test('filters submissions by selected communication methods', async () => {
    mockSubmissionsResponse([
      backendSubmission({
        id: '1',
        title: 'Chat accountability partner',
        communication: 'Chat, Discord',
      }),
      backendSubmission({
        id: '2',
        title: 'Voice call study partner',
        communication: 'Voice Call',
      }),
    ])
    const user = userEvent.setup()

    renderSubmissionsBoard()

    expect(await screen.findByText('Chat accountability partner')).toBeInTheDocument()
    expect(screen.getByText('Voice call study partner')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Chat'))

    expect(screen.getByText('Chat accountability partner')).toBeInTheDocument()
    expect(screen.queryByText('Voice call study partner')).not.toBeInTheDocument()
  })
})
