import { useNavigate } from 'react-router-dom'
import HowItWorks from './HowItWorks'

function Home() {
  const navigate = useNavigate()

  return (
    <>
      <section id="home" style={styles.home}>
        <h1 style={styles.title}>
          Welcome to your dashboard!
        </h1>

        <p style={styles.subtitle}>
          Manage your accountability profile, browse submissions, and follow requests in one place.
        </p>

        <div style={styles.actions}>
          <button style={styles.primary} onClick={() => navigate('/questionnaire')}>Questionnaire</button>
          <button style={styles.primary} onClick={() => navigate('/submissions')}>Submissions</button>
          <button style={styles.primary} onClick={() => navigate('/myboard')}>My Board</button>
          {/* <button style={styles.primary} onClick={() => navigate('/chats')}>Chats</button> */}
        </div>
      </section>

      <HowItWorks />
    </>
  )
}

const styles = {
  home: {
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
  }
}

export default Home
