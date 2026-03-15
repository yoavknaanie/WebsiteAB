import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { SubmissionsProvider } from './contexts/SubmissionsContext'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SubmissionsProvider>
        <App />
        <Toaster position="bottom-right" />
      </SubmissionsProvider>
    </BrowserRouter>
  </React.StrictMode>
)