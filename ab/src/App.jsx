import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import { Routes, Route } from 'react-router-dom'
import Questionnaire from './components/Questionnare'
import SignUp from './components/SignUp'
import Login from './components/LogIn'
import SubmissionsBoard from './components/SubmissionsBoard'
import MyBoard from './components/MyBoard'
import Chats from './components/Chats'

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
        <Route path="/submissions" element={<SubmissionsBoard />} />
        <Route path="/myboard" element={<MyBoard />} />
  <Route path="/chats" element={<Chats />} />
      </Routes>
    </>
  )
}

export default App