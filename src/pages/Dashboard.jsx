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
    const { user, loading, viewAsChauffeur } = useAuth()
    const navigate = useNavigate()
    const [pendingCount, setPendingCount] = useState(0)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        if (loading) return
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
    }, [user, navigate, loading])

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'white', color: '#64748b' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Chargement de votre session...</p>
                <p style={{ fontSize: '0.9rem' }}>Veuillez patienter un instant.</p>
            </div>
        </div>
    )

    // Global protection against any render crashes
    if (hasError) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#ef4444' }}>Oups ! Une erreur est survenue.</h2>
                <p>Cela peut arriver après une mise à jour. Essayez de vider le cache de votre navigateur.</p>
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                >
                    Réinitialiser et Recharger
                </button>
            </div>
        )
    }

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
                            {(() => {
                                try {
                                    return <ChauffeurDashboard />
                                } catch (e) {
                                    console.error("Crash in ChauffeurDashboard:", e)
                                    return <div style={{ padding: '1rem', color: '#ef4444' }}>⚠️ Erreur d'affichage du tableau de bord chauffeur.</div>
                                }
                            })()}
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
                        {(() => {
                            try {
                                return (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
                                    ? <AdminCalendar />
                                    : <Calendar userRole={user.role} />
                            } catch (e) {
                                console.error("Render crash in Calendar section:", e)
                                setHasError(true)
                                return null
                            }
                        })()}
                    </section>
                )}
            </div>
        </div>
    )
}
