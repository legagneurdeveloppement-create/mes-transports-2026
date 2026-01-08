import { Link, useNavigate } from 'react-router-dom'
import { Car, LogOut, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ hideUserInfo = false }) {
    const { user, logout } = useAuth() || {}
    const navigate = useNavigate()

    return (
        <nav style={{
            padding: '1.5rem 0',
            position: 'relative',
            width: '100%',
            zIndex: 50,
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div className="container flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                    <img
                        src="/logo.jpg"
                        alt="Logo Mes Transports"
                        style={{
                            height: '48px',
                            width: 'auto',
                            borderRadius: '0.5rem',
                        }}
                    />
                    <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: 'var(--primary)',
                        letterSpacing: '-0.025em'
                    }}>
                        Mes Transports
                    </span>
                </Link>

                <div className="flex items-center gap-4">
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{user.email}</span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: user.role === 'SUPER_ADMIN' ? '#dc2626' :
                                            user.role === 'ADMIN' ? '#2563eb' : '#16a34a',
                                        color: 'white'
                                    }}>
                                        {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' :
                                            user.role === 'ADMIN' ? 'ADMIN' : 'USER'}
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
