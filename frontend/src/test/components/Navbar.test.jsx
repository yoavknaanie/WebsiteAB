import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import Navbar from '../../components/Navbar'

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  test('shows Log In when no username is saved', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
  })

  test('shows the saved username and opens the logout menu', async () => {
    localStorage.setItem('username', 'yoav')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const usernameButton = screen.getByRole('button', { name: 'yoav' })
    expect(usernameButton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log Out' })).not.toBeInTheDocument()

    await user.click(usernameButton)

    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
  })

  test('logs out by clearing localStorage and showing Log In again', async () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('username', 'yoav')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'yoav' }))
    await user.click(screen.getByRole('button', { name: 'Log Out' }))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'yoav' })).not.toBeInTheDocument()
  })
})
