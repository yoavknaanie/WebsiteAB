import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import Hero from '../../components/Hero'
import Home from '../../components/Home'
import Landing from '../../components/Landing'

describe('Landing and home navigation', () => {
  afterEach(() => {
    cleanup()
  })

  test('landing page keeps only public hero actions', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How it works' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Questionnaire' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submissions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'My Board' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chats' })).not.toBeInTheDocument()
  })

  test('hero get started button navigates to signup', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/signup" element={<h1>Signup page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Get Started' }))

    expect(screen.getByRole('heading', { name: 'Signup page' })).toBeInTheDocument()
  })

  test('hero login button navigates to login', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument()
  })

  test('home page shows app navigation without chats for now', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Questionnaire' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submissions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'My Board' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chats' })).not.toBeInTheDocument()
  })

  test('home questionnaire button navigates to questionnaire', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/questionnaire" element={<h1>Questionnaire page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Questionnaire' }))

    expect(screen.getByRole('heading', { name: 'Questionnaire page' })).toBeInTheDocument()
  })

  test('home submissions button navigates to submissions', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/submissions" element={<h1>Submissions page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Submissions' }))

    expect(screen.getByRole('heading', { name: 'Submissions page' })).toBeInTheDocument()
  })

  test('home my board button navigates to my board', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/myboard" element={<h1>My Board page</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'My Board' }))

    expect(screen.getByRole('heading', { name: 'My Board page' })).toBeInTheDocument()
  })
})
