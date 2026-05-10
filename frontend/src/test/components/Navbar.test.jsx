import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test } from 'vitest'
import Navbar from '../../components/Navbar'

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('shows Log In when no username is saved', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
  })

  test('shows the saved username and disables the button', () => {
    localStorage.setItem('username', 'yoav')

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const usernameButton = screen.getByRole('button', { name: 'yoav' })
    expect(usernameButton).toBeInTheDocument()
    expect(usernameButton).toBeDisabled()
  })
})
