import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const friendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect email or password.'
    case 'auth/invalid-email': return 'Please enter a valid email address.'
    case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.'
    default: return 'Something went wrong. Please try again.'
  }
}

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
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/questionnaire')
    } catch (err) {
      setError(friendlyError(err.code))
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
          <label>Email</label>
          <input
            type="email"
            required
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            required
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
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
