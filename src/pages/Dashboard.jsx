import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { Shield } from 'lucide-react'
import Calendar from '../components/calendar/Calendar' // To be created
import AdminCalendar from '../components/calendar/AdminCalendar'

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        if (!user) {
            navigate('/login')
        }

        // Count pending users for Super Admin
        if (user?.role === 'SUPER_ADMIN') {
            const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
            const pending = allUsers.filter(u => !u.approved).length
            setPendingCount(pending)
        }
    }, [user, navigate])

    if (!user) return null

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <Navbar />
            <div className="container dashboard-container">
                <header className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Tableau de Bord</h1>
                        <p className="dashboard-welcome">
                            Bienvenue, {user.email}. Vous êtes connecté en tant que <span className="dashboard-role">
                                {user.role === 'SUPER_ADMIN' ? 'ADMINISTRATEUR GÉNÉRAL' :
                                    user.role === 'ADMIN' ? 'ADMINISTRATEUR' : 'UTILISATEUR'}
                            </span>.
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        {user.role === 'SUPER_ADMIN' && (
                            <Link to="/admin/users" className="btn btn-outline dashboard-actions-link">
                                <Shield size={18} /> Gestion des utilisateurs
                                {pendingCount > 0 && (
                                    <span className="notification-badge">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        )}
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                            <div className="btn btn-primary">
                                Paramètres Admin
                            </div>
                        )}
                    </div>
                </header>

                {/* Calendar Section */}
                <section className="card">
                    <h2 className="dashboard-section-header">
                        Planning des Transports
                    </h2>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? <AdminCalendar /> : <Calendar userRole={user.role} />}
                </section>
            </div>
        </div>
    )
}
