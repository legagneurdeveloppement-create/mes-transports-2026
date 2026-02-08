import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const { login, loading } = useAuth()
    const navigate = useNavigate()
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
            navigate('/dashboard')
        } catch (err) {
            let message = err.message
            // Traduction des erreurs communes de Supabase
            if (message === 'Email not confirmed') {
                message = "Votre adresse email n'a pas encore été confirmée. Veuillez vérifier vos messages ou contacter un administrateur."
            } else if (message === 'Invalid login credentials') {
                message = "Email ou mot de passe incorrect."
            } else if (message === 'User not found') {
                message = "Cet utilisateur n'existe pas."
            }
            setError(message)
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

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                marginTop: '1rem',
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">🌀</span> Connexion...
                                </>
                            ) : (
                                'Se connecter'
                            )}
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
