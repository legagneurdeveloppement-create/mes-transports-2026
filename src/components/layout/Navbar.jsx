import { Link, useNavigate } from 'react-router-dom'
import { Car, LogOut, User, ArrowRight, HelpCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ hideUserInfo = false }) {
    const { user, logout } = useAuth() || {}
    const navigate = useNavigate()

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-logo">
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
