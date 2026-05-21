import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import Login from '../../components/LogIn'
import Navbar from '../../components/Navbar'
import Signup from '../../components/SignUp'

const randomNumber = () => Math.floor(1000 + Math.random() * 9000)

const renderAuthFlow = () => {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Navbar />
      <Routes>
        <Route path="/" element={<h1>Landing page</h1>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<h1>Home page</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const fillSignupForm = async ({ username, email, password }) => {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign Up' }))
}

const fillLoginForm = async ({ email, password }) => {
  const user = userEvent.setup()

  await user.clear(screen.getByLabelText('Email'))
  await user.type(screen.getByLabelText('Email'), email)
  await user.clear(screen.getByLabelText('Password'))
  await user.type(screen.getByLabelText('Password'), password)
  fireEvent.submit(screen.getByLabelText('Email').closest('form'))
}

const logoutFromNavbar = async (username) => {
  const user = userEvent.setup()

  await user.click(screen.getByRole('button', { name: username }))
  await user.click(screen.getByRole('button', { name: 'Log Out' }))
}

describe('Auth flow integration with backend', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  test('signs up, logs out, rejects a wrong password, logs in, keeps username after navigation, and logs out', async () => {
    const id = randomNumber()
    const username = `test${id}`
    const email = `${username}@example.com`
    const password = `Test${id}pass!`

    renderAuthFlow()

    await fillSignupForm({ username, email, password })

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: username })).toBeInTheDocument()

    await logoutFromNavbar(username)

    expect(sessionStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('username')).toBeNull()
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await fillLoginForm({ email, password: `${password}wrong` })

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Home page' })).not.toBeInTheDocument()

    await fillLoginForm({ email, password })

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: username })).toBeInTheDocument()

    await userEvent.click(screen.getByText('Accountabuddy'))

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: username })).toBeInTheDocument()

    await logoutFromNavbar(username)

    expect(sessionStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('username')).toBeNull()
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument()
  })
})
