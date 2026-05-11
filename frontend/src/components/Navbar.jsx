import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState(() => localStorage.getItem('username'))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isLoggedIn = Boolean(username)

  useEffect(() => {
    setUsername(localStorage.getItem('username'))
    setIsMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUsername(null)
    setIsMenuOpen(false)
  }

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
      <div style={styles.accountMenu}>
        <button
          style={styles.button}
          onClick={isLoggedIn ? () => setIsMenuOpen((open) => !open) : () => navigate('/login')}
        >
          {isLoggedIn ? username : 'Log In'}
        </button>

        {isLoggedIn && isMenuOpen && (
          <button style={styles.logoutButton} onClick={handleLogout}>
            Log Out
          </button>
        )}
      </div>
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
  accountMenu: {
    position: 'relative'
  },
  button: {
    backgroundColor: 'var(--yellow)',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '999px',
    fontWeight: 550,
    cursor: 'pointer'
  },
  logoutButton: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    padding: '0.55rem 1rem',
    borderRadius: '8px',
    fontWeight: 550,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
  }
}

export default Navbar
