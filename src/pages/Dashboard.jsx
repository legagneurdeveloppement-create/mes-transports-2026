import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { Shield, Car, HelpCircle, RefreshCw, BellRing, X } from 'lucide-react'
import Calendar from '../components/calendar/Calendar'
import AdminCalendar from '../components/calendar/AdminCalendar'
import ChauffeurDashboard from '../components/chauffeur/ChauffeurDashboard'
import { pushService } from '../lib/pushService'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
    const { user, loading, viewAsChauffeur } = useAuth()
    const navigate = useNavigate()
    const [pendingCount, setPendingCount] = useState(0)
    const [hasError] = useState(false)

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
                            <span>v3.1.7</span>
                        </div>
                    </div>
                </header>

                {user.role === 'SUPER_ADMIN' && !viewAsChauffeur && (
                    <section className="no-print" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h2 className="dashboard-section-header" style={{ marginBottom: 0 }}>Panel Administration</h2>
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
                            <ChauffeurDashboard />
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
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
                            ? <AdminCalendar />
                            : <Calendar userRole={user.role} />
                        }
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
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Vérifier si l'utilisateur a déjà fermé la bannière sur cet appareil
        const dismissed = localStorage.getItem('push-banner-dismissed');
        if (dismissed === 'true') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible(false);
        }

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

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('push-banner-dismissed', 'true');
    };

    const handleSubscribe = async () => {
        setLoading(true);
        const result = await pushService.subscribeUser(user);
        if (result.success) {
            setIsSubscribed(true);
            alert("✅ Super ! Les notifications sont maintenant activées sur cet appareil.");
        } else {
            alert(`❌ Impossible d'activer les notifications : ${result.message}\n\nAvez-vous bien ajouté ce site sur votre écran d'accueil ?`);
        }
        setLoading(false);
    };

    if (loading || !isSupported || isSubscribed || !isVisible) return null;

    return (
        <div className="card no-print" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            marginBottom: '1.5rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.5s ease-out',
            position: 'relative'
        }}>
            <button
                onClick={handleDismiss}
                style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    opacity: 0.5,
                    cursor: 'pointer',
                    padding: '0.2rem'
                }}
                title="Ne plus afficher"
            >
                <X size={18} />
            </button>
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
