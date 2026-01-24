import { Link, useNavigate } from 'react-router-dom'
import { Car, LogOut, User, ArrowRight, HelpCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ hideUserInfo = false }) {
    const { user, logout, viewAsChauffeur, setViewAsChauffeur } = useAuth() || {}
    const navigate = useNavigate()

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
                </Link>

                <div className="navbar-actions">
                    {/* ULTRA VISIBLE SWITCHER FOR PC/MOBILE */}
                    {isAdmin && (
                        <button
                            onClick={() => setViewAsChauffeur(!viewAsChauffeur)}
                            className="btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: viewAsChauffeur ? '#d97706' : '#2dd4bf',
                                color: 'white',
                                padding: '0.75rem 1.25rem',
                                fontSize: '0.9rem',
                                border: '3px solid white',
                                fontWeight: '900',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                animation: !viewAsChauffeur ? 'pulse-btn 2s infinite' : 'none',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Car size={20} />
                            <span className="mobile-hidden">{viewAsChauffeur ? 'RETOUR ADMIN' : 'VUE CHAUFFEUR ICI'}</span>
                            <span className="mobile-only">{viewAsChauffeur ? 'ADMIN' : 'CHAUFFEUR'}</span>
                        </button>
                    )}

                    <style>{`
                        @keyframes pulse-btn {
                            0% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
                            70% { box-shadow: 0 0 0 10px rgba(45, 212, 191, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
                        }
                        @media (min-width: 769px) { .mobile-only { display: none; } }
                        @media (max-width: 768px) { .mobile-hidden { display: none; } }
                    `}</style>
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
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{user.email}</span>
                                    <span className={`user-badge ${user.role === 'SUPER_ADMIN' ? 'badge-super-admin' :
                                        user.role === 'ADMIN' ? 'badge-admin' :
                                            user.role === 'CHAUFFEUR' ? 'badge-chauffeur' : 'badge-user'
                                        }`}>
                                        {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' :
                                            user.role === 'ADMIN' ? 'ADMIN' :
                                                user.role === 'CHAUFFEUR' ? 'CHAUFFEUR' : 'USER'}
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
