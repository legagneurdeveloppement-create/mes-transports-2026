import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { Shield, Car, HelpCircle, RefreshCw, BellRing } from 'lucide-react'
import Calendar from '../components/calendar/Calendar'
import AdminCalendar from '../components/calendar/AdminCalendar'
import ChauffeurDashboard from '../components/chauffeur/ChauffeurDashboard'
import { pushService } from '../lib/pushService'

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
                if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
                    const { count, error } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('approved', false)

                    if (!error) {
                        setPendingCount(count || 0)
                    }
                } else if (user?.role === 'CHAUFFEUR') {
                    const { count, error } = await supabase
                        .from('transports')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'pending')

                    if (!error) {
                        setPendingCount(count || 0)
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
                        window.location.reload();
                    }}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                >
                    Recharger
                </button>
            </div>
        )
    }

    if (!user) return null

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <Navbar />
            <div className="container dashboard-container">
                <PushNotificationBanner user={user} />
                <header className="dashboard-header no-print">
                    <div>
                        <h1 className="dashboard-title">Tableau de bord</h1>
                        <p className="dashboard-subtitle">
                            Connecté en tant que <span className="dashboard-role">
                                {user.role === 'SUPER_ADMIN' ? 'Administrateur Général' :
                                    user.role === 'ADMIN' ? 'Administrateur' :
                                        user.role === 'CHAUFFEUR' ? 'Chauffeur' : 'Utilisateur'}
                            </span>
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                            <span>{user?.email}</span>
                            <span>•</span>
                            <span>v3.1.1-sec</span>
                        </div>
                    </div>
                    <div className="dashboard-actions">
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

                {user.role === 'SUPER_ADMIN' && !viewAsChauffeur && (
                    <section style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h2 className="dashboard-section-header" style={{ marginBottom: 0 }}>Panel Administration</h2>
                            <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#e2e8f0', borderRadius: '0.3rem', color: '#475569' }}>
                                Diagnostics: {window.location.hostname}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            <div className="card" style={{ border: '1px solid var(--accent)', background: 'linear-gradient(to bottom right, #ffffff, #fffdfa)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '0.5rem', color: 'var(--accent)' }}>
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Gestion des Comptes</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Contrôler les accès et les mots de passe</p>
                                    </div>
                                </div>
                                <Link to="/admin/users" className="btn btn-primary w-full" style={{ gap: '0.5rem' }}>
                                    Ouvrir la gestion des utilisateurs
                                    {pendingCount > 0 && <span className="notification-badge" style={{ position: 'relative', top: '0', right: '0', marginLeft: '0.5rem' }}>{pendingCount}</span>}
                                </Link>
                            </div>

                            <div className="card" style={{ border: '1px solid var(--primary)', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.1)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                                        <HelpCircle size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Centre d'Aide</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Consulter les guides d'utilisation</p>
                                    </div>
                                </div>
                                <Link to="/help" className="btn btn-outline w-full">
                                    Voir l'aide
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {(user?.role === 'CHAUFFEUR' || (viewAsChauffeur && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'))) ? (
                    <>
                        <div className="chauffeur-view-wrapper">
                            {viewAsChauffeur && (
                                <div style={{ background: '#fef3c7', padding: '0.8rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#92400e', textAlign: 'center', border: '1px solid #f59e0b', fontWeight: '600' }}>
                                    💡 Mode Simulation : Vous visualisez l'interface telle qu'un Chauffeur la voit.
                                </div>
                            )}
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
                            <Calendar userRole="CHAUFFEUR" />
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

function PushNotificationBanner({ user }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            const supported = ('serviceWorker' in navigator) && ('PushManager' in window);
            setIsSupported(supported);
            if (supported) {
                const sub = await pushService.checkSubscription();
                setIsSubscribed(sub);
            }
            setLoading(false);
        };
        checkStatus();
    }, []);

    const handleSubscribe = async () => {
        setLoading(true);
        const success = await pushService.subscribeUser(user);
        if (success) {
            setIsSubscribed(true);
            alert("✅ Super ! Les notifications sont maintenant activées sur cet appareil.");
        } else {
            alert("❌ Impossible d'activer les notifications. Avez-vous bloqué l'autorisation dans votre navigateur ?");
        }
        setLoading(false);
    };

    if (loading) return null;

    if (!isSupported) {
        return (
            <div className="card" style={{
                background: '#fffbeb',
                color: '#92400e',
                marginBottom: '1.5rem',
                border: '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '0.75rem'
            }}>
                <div style={{ fontSize: '1.5rem' }}>📱</div>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                        Notifications non supportées ici
                    </h3>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>
                        Pour recevoir les alertes sur <b>iPhone / iOS</b>, vous devez ouvrir ce site dans Safari, cliquer sur "Partager" puis <b>"Sur l'écran d'accueil"</b>.
                        Sur Android, assurez-vous d'utiliser Chrome en <b>HTTPS</b>.
                    </p>
                </div>
            </div>
        );
    }

    if (isSubscribed) {
        return (
            <div className="card" style={{
                background: '#f0fdf4',
                color: '#166534',
                marginBottom: '1.5rem',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.8rem 1rem',
                borderRadius: '0.75rem'
            }}>
                <div style={{ fontSize: '1.2rem' }}>✅</div>
                <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>
                        Système d'alertes activé sur cet appareil
                    </h3>
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            marginBottom: '1.5rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BellRing size={20} className="notif-pulse" /> ✨ Alertes Instantanées
                </h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    Voulez-vous être prévenu sur votre téléphone dès qu'un transport est ajouté ou validé ?
                </p>
            </div>
            <button
                onClick={handleSubscribe}
                className="btn btn-primary"
                style={{
                    background: 'white',
                    color: '#0f172a',
                    padding: '0.6rem 1.2rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    fontWeight: 'bold',
                    border: 'none'
                }}
            >
                Activer les notifications
            </button>
        </div>
    );
}
