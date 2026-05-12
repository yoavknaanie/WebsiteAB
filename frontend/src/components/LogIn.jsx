import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const SERVER_ERROR = 'Could not connect to the server. Please try again.'
const LOGIN_ERROR = 'Could not log in. Please try again.'
const API_URL = import.meta.env.VITE_API_URL
const LOGIN_ROUTE = `${API_URL}/auth/login`

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)

      const response = await fetch(LOGIN_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      let data = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        setError(data.error || data.message || LOGIN_ERROR)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      navigate('/questionnaire') // todo: maybe navigate to dashboard instead?
    } catch (err) {
      setError(SERVER_ERROR)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <h2>Welcome back</h2>

      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            required
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            required
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>
          Don't have an account yet?{' '}
          <Link to="/signup" style={{ color: 'var(--sage)', fontWeight: 500 }}>
            Let's set you up
          </Link>
        </p>
      </form>
    </section>
  )
}

export default Login
