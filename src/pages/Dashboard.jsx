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
            <div className="container" style={{ padding: '2rem 1.5rem' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tableau de Bord</h1>
                        <p style={{ color: 'var(--text-light)' }}>
                            Bienvenue, {user.email}. Vous êtes connecté en tant que <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                {user.role === 'SUPER_ADMIN' ? 'ADMINISTRATEUR GÉNÉRAL' :
                                    user.role === 'ADMIN' ? 'ADMINISTRATEUR' : 'UTILISATEUR'}
                            </span>.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {user.role === 'SUPER_ADMIN' && (
                            <Link to="/admin/users" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                                <Shield size={18} /> Gestion des utilisateurs
                                {pendingCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        background: '#dc2626',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}>
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
                    <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        Planning des Transports
                    </h2>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? <AdminCalendar /> : <Calendar userRole={user.role} />}
                </section>
            </div>
        </div>
    )
}
