import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '1.5rem 1rem',
            marginTop: 'auto',
            borderTop: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '0.875rem',
            background: 'var(--bg)'
        }}>
            <p style={{ margin: 0 }}>
                legagneur.developpement © 2026 Mes Transports
            </p>
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', opacity: 0.7, fontSize: '0.75rem', fontWeight: '500' }}>
                <Link to="/mentions-legales" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Mentions Légales
                </Link>
                <span>•</span>
                <span>v3.1.8 - Mise à jour : 29 Mars 2026</span>
            </div>
        </footer>
    )
}
