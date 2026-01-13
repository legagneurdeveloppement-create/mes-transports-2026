import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await login(formData.email, formData.password)
        } catch (err) {
            setError(err.message)
        }
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
                        <div className="auth-icon-wrapper gold">
                            <LogIn size={32} />
                        </div>
                        <h1 className="auth-title">Connexion</h1>
                        <p className="auth-subtitle">Accédez à votre espace</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                            <input
                                type="email"
                                name="email"
                                className="input"
                                placeholder="Votre email"
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
                            Se connecter
                        </button>
                    </form>

                    <div className="auth-footer">
                        Pas encore de compte ? <Link to="/register" className="auth-footer-link">S'inscrire</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
