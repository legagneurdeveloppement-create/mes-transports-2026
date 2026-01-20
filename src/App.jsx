import { Routes, Route } from 'react-router-dom'
import './styles/App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/Admin/UserManagement'
import Help from './pages/Help'

function App() {
  return (
    <div className="app">
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
