import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import Navbar from '../../components/Navbar'

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
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

  test('ignores stale localStorage username after auth moved to sessionStorage', () => {
    localStorage.setItem('username', 'stale-user')

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'stale-user' })).not.toBeInTheDocument()
  })

  test('shows the saved username and opens the logout menu', async () => {
    sessionStorage.setItem('username', 'yoav')
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

  test('logs out by clearing sessionStorage and showing Log In again', async () => {
    sessionStorage.setItem('token', 'test-token')
    sessionStorage.setItem('username', 'yoav')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'yoav' }))
    await user.click(screen.getByRole('button', { name: 'Log Out' }))

    expect(sessionStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('username')).toBeNull()
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'yoav' })).not.toBeInTheDocument()
  })

  test('sends logged-in users to home when clicking the logo', async () => {
    sessionStorage.setItem('username', 'yoav')
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/submissions']}>
        <Navbar />
        <Routes>
          <Route path="/submissions" element={<h1>Submissions page</h1>} />
          <Route path="/home" element={<h1>Home page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByText('Accountabuddy'))

    expect(screen.getByRole('heading', { name: 'Home page' })).toBeInTheDocument()
  })

  test('sends logged-out users to login from the account button', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
        <Routes>
          <Route path="/" element={<h1>Landing page</h1>} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Log In' }))

    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument()
  })
})
