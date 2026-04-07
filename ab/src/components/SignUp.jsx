// import { useNavigate } from 'react-router-dom'

// function Signup() {
//   const navigate = useNavigate()

//   return (
//     <section className="section">
//       <h2>Create your account</h2>

//       <form>
//         <div className="form-field">
//           <label>Email</label>
//           <input type="email" required className="form-input" />
//         </div>

//         <div className="form-field">
//           <label>Password</label>
//           <input type="password" required className="form-input" />
//         </div>

//         <div className="form-field">
//           <label>Confirm Password</label>
//           <input type="password" required className="form-input" />
//         </div>

//         <button className="btn">Sign Up</button>
//       </form>

//       <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>
//         Already have an account?{' '}
//         <span
//           style={{ color: 'var(--sage)', fontWeight: 500, cursor: 'pointer' }}
//           onClick={() => navigate('/login')}
//         >
//           Log in
//         </span>
//       </p>
//     </section>
//   )
// }

// export default Signup
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'


function Signup() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
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
      const response = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      })

      const data = await response.json()

      // If the server returned an error (e.g. duplicate email), show it
      if (!response.ok) {
        setError(data.error)
        return
      }

      // Store the JWT token so future requests can prove who the user is
      localStorage.setItem('token', data.token)
      navigate('/questionnaire')
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

        <div className="form-field">
          <label>Confirm Password</label>
          <input
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
