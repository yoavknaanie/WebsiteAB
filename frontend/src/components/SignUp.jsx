// export default Signup
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL
const SIGNUP_ROUTE = `${API_URL}/auth/signup`

function Signup() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      // Send email + password to the backend as JSON
      const response = await fetch(SIGNUP_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      })

      const data = await response.json()

      // If the server returned an error (e.g. duplicate email), show it
      if (!response.ok) {
        setError(data.error)
        return
      }

      // Store the JWT token so future requests can prove who the user is
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('username', username)
      navigate('/home')
    } catch (err) {
      setError('Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <h2>Create your account</h2>

      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="form-field">
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            required
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div className="form-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            required
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            required
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            required
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--sage)', fontWeight: 500 }}>
          Log in
        </Link>
      </p>
    </section>
  )
}

export default Signup
