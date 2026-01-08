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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
            <div style={{ padding: '1rem' }}>
                <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex', gap: '0.5rem', border: 'none' }}>
                    ← Retour à l'accueil
                </Link>
            </div>

            <div className="container flex items-center justify-center" style={{ flex: 1, padding: '2rem 0' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                    <div className="flex flex-col items-center" style={{ marginBottom: '2rem' }}>
                        <div style={{
                            background: 'rgba(212, 175, 55, 0.1)',
                            padding: '1rem',
                            borderRadius: '50%',
                            marginBottom: '1rem',
                            color: 'var(--accent)'
                        }}>
                            <LogIn size={32} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem' }}>Connexion</h1>
                        <p style={{ color: 'var(--text-light)' }}>Accédez à votre espace</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            borderRadius: '0.375rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>
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

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                        Pas encore de compte ? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>S'inscrire</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
