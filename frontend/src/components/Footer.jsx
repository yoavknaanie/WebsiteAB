function Footer() {
  return (
    <footer style={styles.footer}>
      <p>© 2025 AccountabilityBuddy. All rights reserved.</p>
    </footer>
  )
}

const styles = {
  footer: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg)', // blends with the page
    color: '#555', // soft text
    fontSize: '0.9rem',
    marginTop: '4rem'
  }
}

export default Footer
