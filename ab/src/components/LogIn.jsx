import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate();

  return (
    <section className="section">
      <h2>Welcome back</h2>

      <form>
        <div className="form-field">
          <label>Email</label>
          <input type="email" required className="form-input" />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input type="password" required className="form-input" />
        </div>

        <button className="btn">Log In</button>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>
            Don’t have an account yet?{' '}
        <span
            style={{ color: 'var(--sage)', fontWeight: 500, cursor: 'pointer' }}
            onClick={() => navigate('/SignUp')}
        >
            Let’s set you up
        </span>
        </p>
      </form>
    </section>
  )
}

export default Login
