import { Routes, Route } from 'react-router-dom'
import './styles/App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/Admin/UserManagement'
import Help from './pages/Help'
import MentionsLegales from './pages/MentionsLegales'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/auth/ProtectedRoute'


function App() {

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="/help" element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />

          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App
