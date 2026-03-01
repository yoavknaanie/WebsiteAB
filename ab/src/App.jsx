import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import { Routes, Route } from 'react-router-dom'
import Questionnaire from './components/Questionnare'
import SignUp from './components/SignUp'
import Login from './components/LogIn'

function Landing() {
  return(
    <>
    <Hero/>
    <HowItWorks/>
    </>
  )
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/questionnaire" element={<Questionnaire/>} />
      </Routes>
    </>
  )
}

export default App