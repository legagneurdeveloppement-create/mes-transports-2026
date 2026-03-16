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
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.7 }}>
                v3.1.7 - Mise à jour : 16 Mars 2026 (Nuit)
            </p>
        </footer>
    )
}
