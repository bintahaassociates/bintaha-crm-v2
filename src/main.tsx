import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AgentProvider } from './lib/auth'
import AgentLogin from './pages/AgentLogin'
import AgentDashboard from './pages/AgentDashboard'
import OwnerDashboard from './pages/OwnerDashboard'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AgentProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/agent" replace />} />
          <Route path="/agent" element={<AgentLogin />} />
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="*" element={<Navigate to="/agent" replace />} />
        </Routes>
      </AgentProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
