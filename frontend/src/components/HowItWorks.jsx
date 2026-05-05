
// function HowItWorks() {
//   return (
//     <section style={styles.section}>
//       <h2 style={styles.title}>How it works</h2>

//       <div style={styles.steps}>
//         <div style={styles.card}>
//           <span style={styles.step}>1</span>
//           <h3>Create a profile</h3>
//           <p>Share what you want accountability for and your availability.</p>
//         </div>

//         <div style={styles.card}>
//           <span style={styles.step}>2</span>
//           <h3>Find your match</h3>
//           <p>Browse people with similar goals and working styles.</p>
//         </div>

//         <div style={styles.card}>
//           <span style={styles.step}>3</span>
//           <h3>Stay consistent</h3>
//           <p>Check in, show up, and keep each other on track.</p>
//         </div>
//       </div>
//     </section>
//   )
// }
function HowItWorks() {
  return (
    <section id="how-it-works" style={styles.section}>
      <h2 style={styles.title}>How it works</h2>

      <div style={styles.steps}>
        <div style={styles.card}>
          <span style={styles.step}>1</span>
          <h3>Create a profile</h3>
          <p>Share what you want accountability for and your availability.</p>
        </div>

        <div style={styles.card}>
          <span style={styles.step}>2</span>
          <h3>Find your match</h3>
          <p>Browse people with similar goals or connect with a friend.</p>
        </div>

        <div style={styles.card}>
          <span style={styles.step}>3</span>
          <h3>Stay consistent</h3>
          <p>Check in, show up, and keep each other on track.</p>
        </div>
      </div>
    </section>
  )
}

const styles = {
  section: {
    padding: '4rem 2rem',
    backgroundColor: 'white',
    textAlign: 'center'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    marginBottom: '3rem'
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2rem',
    maxWidth: '900px',
    margin: '0 auto'
  },
  card: {
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
  },
  step: {
    display: 'inline-block',
    backgroundColor: 'var(--yellow)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    lineHeight: '36px',
    fontWeight: 600,
    marginBottom: '1rem'
  }
}

export default HowItWorks
