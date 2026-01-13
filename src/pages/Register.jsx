import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const { register } = useAuth()
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        try {
            register(formData)
            setSuccess(true)
        } catch (err) {
            setError(err.message)
        }
    }

    if (success) {
        return (
            <div className="auth-page">
                <div className="container auth-container">
                    <div className="card text-center auth-card">
                        <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                            <UserPlus size={48} />
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>Inscription réussie !</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
                            Votre compte a été créé avec succès. Il est maintenant en attente d'approbation par l'administrateur général.
                        </p>
                        <Link to="/login" className="btn btn-primary w-full">
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-nav">
                <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex', gap: '0.5rem', border: 'none' }}>
                    ← Retour à l'accueil
                </Link>
            </div>

            <div className="container auth-container">
                <div className="card auth-card">
                    <div className="auth-header">
                        <div className="auth-icon-wrapper">
                            <UserPlus size={32} />
                        </div>
                        <h1 className="auth-title">Créer un compte</h1>
                        <p className="auth-subtitle">Rejoignez Mes Transports</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nom complet</label>
                            <input
                                type="text"
                                name="name"
                                className="input"
                                placeholder="Votre nom"
                                required
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                            <input
                                type="email"
                                name="email"
                                className="input"
                                placeholder="Ex: admin@demo.com pour Admin"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Mot de passe</label>
                            <input
                                type="password"
                                name="password"
                                className="input"
                                placeholder="********"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            S'inscrire
                        </button>
                    </form>

                    <div className="auth-footer">
                        Déjà un compte ? <Link to="/login" className="auth-footer-link">Se connecter</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
