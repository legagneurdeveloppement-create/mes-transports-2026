import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { Shield, Car } from 'lucide-react'
import Calendar from '../components/calendar/Calendar'
import AdminCalendar from '../components/calendar/AdminCalendar'
import ChauffeurDashboard from '../components/chauffeur/ChauffeurDashboard'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
    const { user, viewAsChauffeur } = useAuth()
    const navigate = useNavigate()
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }

        const fetchPending = async () => {
            try {
                if (user?.role === 'SUPER_ADMIN') {
                    const allUsersStr = localStorage.getItem('all_users') || '[]'
                    let allUsers = []
                    try {
                        allUsers = JSON.parse(allUsersStr)
                    } catch (e) {
                        console.error('Error parsing all_users in Dashboard:', e)
                    }
                    const pending = (Array.isArray(allUsers) ? allUsers : []).filter(u => u && !u.approved).length
                    setPendingCount(pending)
                } else if (user?.role === 'CHAUFFEUR') {
                    const { data, error } = await supabase
                        .from('transports')
                        .select('status')
                        .eq('status', 'pending')

                    if (!error && data) {
                        setPendingCount(data.length)
                    } else {
                        const storedEventsStr = localStorage.getItem('transport_events') || '{}'
                        let storedEvents = {}
                        try {
                            storedEvents = JSON.parse(storedEventsStr)
                        } catch (e) {
                            console.error('Error parsing transport_events in Dashboard:', e)
                        }
                        const pending = Object.values(storedEvents || {}).filter(e => e && (e.status === 'pending' || !e.status)).length
                        setPendingCount(pending)
                    }
                }
            } catch (err) {
                console.error('Error in fetchPending:', err)
            }
        }

        fetchPending()

        // Sync realtime for Chauffeur
        let channel;
        if (user.role === 'CHAUFFEUR') {
            channel = supabase
                .channel('dashboard-pending')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transports' }, () => {
                    fetchPending()
                })
                .subscribe()
        }

        return () => {
            if (channel) supabase.removeChannel(channel)
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
                                    user.role === 'ADMIN' ? 'ADMINISTRATEUR' :
                                        user.role === 'CHAUFFEUR' ? 'CHAUFFEUR' : 'UTILISATEUR'}
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

                        {user.role === 'CHAUFFEUR' && pendingCount > 0 && (
                            <div className="notification-alert-badge" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#92400e',
                                background: '#fef3c7',
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                border: '1px solid #fde68a'
                            }}>
                                <span style={{ position: 'relative', display: 'flex' }}>
                                    <span style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        width: '10px',
                                        height: '10px',
                                        background: '#dc2626',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 0 2px white'
                                    }}></span>
                                    🔔
                                </span>
                                {pendingCount} transport{pendingCount > 1 ? 's' : ''} à valider
                            </div>
                        )}
                    </div>
                </header>

                {(user?.role === 'CHAUFFEUR' || (viewAsChauffeur && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'))) ? (
                    <>
                        <div className="chauffeur-view-wrapper">
                            {/* Debug helper for user */}
                            <div style={{ background: '#fef3c7', padding: '0.8rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#92400e', textAlign: 'center', border: '1px solid #f59e0b', fontWeight: '600' }}>
                                💡 Mode Simulation : Vous visualisez l'interface telle qu'un Chauffeur la voit.
                            </div>
                            <ChauffeurDashboard />
                        </div>

                        <section className="card" style={{ marginTop: '2rem' }}>
                            <h2 className="dashboard-section-header">
                                Planning Global des Transports
                            </h2>
                            <Calendar userRole={user.role} />
                        </section>
                    </>
                ) : (
                    <section className="card">
                        <h2 className="dashboard-section-header">
                            Planning des Transports
                        </h2>
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? <AdminCalendar /> : <Calendar userRole={user.role} />}
                    </section>
                )}

                {/* Floating Toggle & Diagnostic - Absolute fallback */}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <div style={{
                        position: 'fixed',
                        top: '5rem',
                        right: '1rem',
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.5rem'
                    }} className="no-print">
                        <div style={{ background: '#334155', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            Role: {user.role} | Vue: {viewAsChauffeur ? 'Chauffeur' : 'Admin'}
                        </div>
                        <button
                            onClick={() => setViewAsChauffeur(!viewAsChauffeur)}
                            className="btn"
                            style={{
                                background: viewAsChauffeur ? '#f59e0b' : '#0891b2',
                                color: 'white',
                                borderRadius: '3rem',
                                padding: '0.8rem 1.2rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                border: '3px solid white',
                                fontWeight: '900',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Car size={20} />
                            {viewAsChauffeur ? 'QUITTER VUE CHAUFFEUR' : 'ACTIVER VUE CHAUFFEUR'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
