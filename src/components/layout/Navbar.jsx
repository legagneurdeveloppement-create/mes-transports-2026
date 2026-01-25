import { Link, useNavigate } from 'react-router-dom'
import { Car, LogOut, User, ArrowRight, HelpCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Navbar({ hideUserInfo = false }) {
    const { user, logout, viewAsChauffeur, setViewAsChauffeur } = useAuth() || {}
    const navigate = useNavigate()
    const [dbStatus, setDbStatus] = useState('connecting')

    useEffect(() => {
        const channel = supabase.channel('status-check')
            .on('system', { event: '*' }, (payload) => {
                console.log('Realtime System:', payload)
            })
            .subscribe((status) => {
                setDbStatus(status)
            })
        return () => { supabase.removeChannel(channel) }
    }, [])

    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-logo" onClick={() => viewAsChauffeur && setViewAsChauffeur(false)}>
                    <img
                        src="/logo.jpg"
                        alt="Logo Mes Transports"
                        className="navbar-logo-img"
                    />
                    <span className="navbar-logo-text">
                        Mes Transports
                    </span>
                    <div
                        title={`Statut Synchro: ${dbStatus}`}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dbStatus === 'SUBSCRIBED' ? '#22c55e' : dbStatus === 'connecting' ? '#eab308' : '#ef4444',
                            marginLeft: '-0.25rem',
                            marginTop: '-0.5rem',
                            border: '1px solid white'
                        }}
                    ></div>
                </Link>

                <div className="navbar-actions">
                    {/* Simple View Switcher for Admins */}
                    {isAdmin && (
                        <button
                            onClick={() => setViewAsChauffeur(!viewAsChauffeur)}
                            className="btn btn-outline"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: viewAsChauffeur ? '#f59e0b' : 'transparent',
                                color: viewAsChauffeur ? 'white' : '#64748b',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}
                        >
                            <Car size={18} />
                            <span className="mobile-hidden">{viewAsChauffeur ? 'QUITTER SIMULATION' : 'VUE CHAUFFEUR'}</span>
                            <span className="mobile-only">{viewAsChauffeur ? 'ADMIN' : 'CHAUFFEUR'}</span>
                        </button>
                    )}
                    {user ? (
                        hideUserInfo ? (
                            <div className="flex gap-4 items-center">
                                <Link to="/dashboard" className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem' }}>
                                    Accéder à mon espace <ArrowRight size={18} />
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="btn"
                                    style={{ color: 'var(--text-light)', fontSize: '0.9rem', padding: '0.5rem' }}
                                    title="Se déconnecter"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/help" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', color: '#64748b' }} title="Aide">
                                    <HelpCircle size={20} /> <span className="mobile-hidden">Aide</span>
                                </Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="flex-col-mobile justify-center items-center">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>{user.email}</span>
                                    <span className={`user-badge ${user.role === 'SUPER_ADMIN' ? 'badge-super-admin' :
                                        user.role === 'ADMIN' ? 'badge-admin' :
                                            user.role === 'CHAUFFEUR' ? 'badge-chauffeur' : 'badge-user'
                                        }`}>
                                        <span className="mobile-hidden">
                                            {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' :
                                                user.role === 'ADMIN' ? 'ADMIN' :
                                                    user.role === 'CHAUFFEUR' ? 'CHAUFFEUR' : 'USER'}
                                        </span>
                                        <span className="mobile-only">
                                            {user.role === 'SUPER_ADMIN' ? 'S.ADMIN' :
                                                user.role === 'ADMIN' ? 'ADM' :
                                                    user.role === 'CHAUFFEUR' ? 'CHF' : 'USR'}
                                        </span>
                                    </span>
                                </div>
                                <button onClick={logout} className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                    Déconnexion
                                </button>
                            </>
                        )
                    ) : (
                        <>
                            <Link to="/login" className="btn" style={{ color: 'var(--primary)' }}>
                                Connexion
                            </Link>
                            <Link to="/register" className="btn btn-primary" style={{
                                background: 'var(--primary)',
                                boxShadow: 'var(--shadow)'
                            }}>
                                Inscription
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
