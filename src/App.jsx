import { Routes, Route } from 'react-router-dom'
import './styles/App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/Admin/UserManagement'
import Help from './pages/Help'

import { useAuth } from './context/AuthContext'

function App() {
  const { viewAsChauffeur, setViewAsChauffeur, user } = useAuth() || {}

  return (
    <div className="app">
      {viewAsChauffeur && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div style={{
          background: '#f59e0b',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <span>🚧 MODE SIMULATION CHAUFFEUR ACTIF</span>
          <button
            onClick={() => setViewAsChauffeur(false)}
            style={{
              background: 'white',
              color: '#f59e0b',
              border: 'none',
              padding: '0.2rem 0.6rem',
              borderRadius: '0.3rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}
          >
            Quitter
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </div>
  )
}

export default App
