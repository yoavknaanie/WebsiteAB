import React from 'react'
import { useNavigate } from "react-router-dom"

function Navbar() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const isLoggedIn = Boolean(username)

  const goToHero = () => {
    // Navigate to "/" and scroll to hero after page loads
    navigate('/', { replace: false }) // go to home page
    setTimeout(() => {
      const element = document.getElementById('hero')
      if (element) element.scrollIntoView({ behavior: 'smooth' })
    }, 50) // small delay to ensure page renders
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.logo} onClick={goToHero}>
        Accountabuddy
      </div>
      <button
        style={styles.button}
        onClick={isLoggedIn ? undefined : () => navigate('/login')}
        disabled={isLoggedIn}
      >
        {isLoggedIn ? username : 'Log In'}
      </button>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white'
  },
  logo: {
    fontWeight: 600,
    fontSize: '1.2rem',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit'
  },
  button: {
    backgroundColor: 'var(--yellow)',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '999px',
    fontWeight: 550,
    cursor: 'pointer'
  }
}

export default Navbar
