import Navbar from './components/Navbar'
import { Routes, Route } from 'react-router-dom'
import Questionnaire from './components/Questionnaire'
import SignUp from './components/SignUp'
import Login from './components/LogIn'
import SubmissionsBoard from './components/SubmissionsBoard'
import MyBoard from './components/MyBoard'
import Chats from './components/Chats'
import Landing from './components/Landing'
import Home from './components/Home'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
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
