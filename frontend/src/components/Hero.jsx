import { useNavigate } from "react-router-dom"

function Hero() {
  const navigate = useNavigate()

  return (
    <section id="hero" style={styles.hero}>
      <h1 style={styles.title}>
        Find your accountability <br /> buddy
      </h1>

      <p style={styles.subtitle}>
        Stay consistent with someone who keeps you on track — <br/>
        for studying, fitness, habits, focus sessions and goals
      </p>

      <div style={styles.actions}>
        <div style={styles.primaryActions}>
          <button style={styles.primary} onClick={() => navigate('/signup')}>Get Started</button>
          <button style={styles.primary} onClick={() => navigate('/login')}>Log in</button>
        </div>
        <a href="#how-it-works" style={styles.secondary}>
          How it works
        </a>
      </div>
    </section>
  )
}

const styles = {
  hero: {
    padding: '5rem 2rem',
    textAlign: 'center',
    maxWidth: '900px',
    margin: '0 auto'
  },

  title: {
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '1.5rem',
    color: 'var(--dark)'
  },

  subtitle: {
    fontSize: '1.15rem',
    maxWidth: '600px',
    margin: '0 auto 2.5rem',
    color: '#555'
  },

  actions: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },

  primaryActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },

  primary: {
    backgroundColor: 'var(--sage)',
    color: 'white',
    border: 'none',
    padding: '0.9rem 1.8rem',
    borderRadius: '999px',
    fontWeight: 500,
    fontSize: '1rem',
    cursor: 'pointer'
  },

  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--dark)',
    border: '2px solid var(--dark)',
    padding: '0.8rem 1.6rem',
    borderRadius: '999px',
    fontWeight: 500,
    fontSize: '1rem',
    cursor: 'pointer'
  }
}

export default Hero
