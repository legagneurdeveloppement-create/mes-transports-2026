import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import {
    Calendar, CheckCircle, XCircle, Clock, MapPin,
    Settings, Shield, User, Smartphone, CalendarPlus,
    HelpCircle, ArrowRight, Printer
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Help() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(user?.role === 'CHAUFFEUR' ? 'chauffeur' : 'admin')

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <style>{styles}</style>
            <Navbar />
            <div className="container" style={{ padding: '2rem' }}>
                <header className="help-header" style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-outline help-close-btn"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> <span className="mobile-hidden">Fermer / Retour</span><span className="mobile-only">Retour</span>
                    </button>
                    <h1 className="help-page-title mobile-hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                        <HelpCircle size={32} className="help-icon" /> <span>Centre d'Aide</span>
                    </h1>
                    <p className="help-subtitle mobile-hidden" style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
                        Retrouvez ici tous les guides pour utiliser efficacement l'application Mes Transports.
                    </p>
                </header>

                <div className="card" style={{ maxWidth: '900px', margin: '0 auto', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                        <button
                            onClick={() => setActiveTab('chauffeur')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === 'chauffeur' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'chauffeur' ? 'white' : 'var(--text-light)',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <CarIcon /> Espace Chauffeur
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === 'admin' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'admin' ? 'white' : 'var(--text-light)',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <ShieldIcon /> Espace Admin / Super Admin
                        </button>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        {activeTab === 'chauffeur' ? <ChauffeurGuide /> : <AdminGuide />}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ChauffeurGuide() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <GuideSection
                title="1. Recevoir et Valider un Transport"
                icon={<CheckCircle className="text-success" />}
            >
                <p>Dès qu'un administrateur vous assigne un transport, il apparaît dans l'onglet <strong>En attente</strong>.</p>
                <ul className="guide-list">
                    <li>Cliquez sur <button className="btn-mini btn-success"><CheckCircle size={14} /> Valider</button> pour accepter la course.</li>
                    <li>Cliquez sur <button className="btn-mini btn-danger"><XCircle size={14} /> Refuser</button> si vous n'êtes pas disponible.</li>
                </ul>
                <div className="tip-box">
                    💡 <strong>Info :</strong> L'administrateur reçoit automatiquement un SMS quand vous acceptez ou refusez.
                </div>
            </GuideSection>

            <GuideSection
                title="2. Saisir vos Horaires Réels"
                icon={<Clock className="text-warning" />}
            >
                <p>Pour chaque transport, il est important de noter vos heures exactes pour le calcul de vos heures travaillées.</p>
                <ol className="guide-steps">
                    <li>Sur la carte du transport, cliquez sur <strong><Settings size={14} /> Gérer horaires</strong>.</li>
                    <li>Dans la section <strong>Aller</strong>, ajoutez vos heures de départ et d'arrivée.</li>
                    <li>Faites de même pour le <strong>Retour</strong>.</li>
                    <li>Si vous restez sur place entre l'aller et le retour, cochez la case <strong>📍 Resté sur place</strong>.</li>
                </ol>
            </GuideSection>

            <GuideSection
                title="3. Rappels Automatiques"
                icon={<CalendarPlus className="text-primary" />}
            >
                <p>Ne manquez jamais un départ !</p>
                <p>Cliquez sur le bouton <strong>📅 Rappel</strong> présent sur chaque fiche transport pour l'ajouter à l'agenda de votre téléphone. Cela configurera deux alarmes :</p>
                <ul className="guide-list">
                    <li>🔔 24 heures avant</li>
                    <li>🔔 1 heure avant</li>
                </ul>
            </GuideSection>
        </div>
    )
}

function AdminGuide() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <GuideSection
                title="1. Planifier un Transport"
                icon={<Calendar className="text-primary" />}
            >
                <p>Cliquez sur une date dans le calendrier pour ouvrir le formulaire de création.</p>
                <ul className="guide-list">
                    <li>Remplissez la <strong>Destination</strong> (ou choisissez dans la liste).</li>
                    <li>Assignez une <strong>Classe</strong> et une <strong>Couleur</strong>.</li>
                    <li>Définissez les heures prévues.</li>
                </ul>
                <div className="tip-box">
                    📱 <strong>SMS :</strong> Si vous modifiez un transport existant, le chauffeur concerné recevra une notification SMS.
                </div>
            </GuideSection>

            <GuideSection
                title="2. Gestion des Utilisateurs (Super Admin)"
                icon={<Shield className="text-danger" />}
            >
                <div className="tip-box" style={{ marginTop: 0, marginBottom: '1rem', borderLeftColor: '#dc2626', background: '#fef2f2', color: '#991b1b' }}>
                    🔒 <strong>Réservé au Super Administrateur</strong>
                </div>
                <p>Accédez à la page <strong>Gestion des utilisateurs</strong> via le bouton <Shield size={14} /> en haut à droite.</p>
                <ul className="guide-list">
                    <li>Approuvez les nouveaux comptes en attente.</li>
                    <li>Modifiez les informations (Email, Téléphone, Rôle) avec le bouton ✏️.</li>
                    <li>Supprimez un accès si nécessaire.</li>
                </ul>
            </GuideSection>

            <GuideSection
                title="3. Impression des Plannings"
                icon={<Printer className="text-dark" />}
            >
                <p>Vous pouvez imprimer une vue propre du planning :</p>
                <ol className="guide-steps">
                    <li>Sur le Dashboard, un bouton <strong>🖨️ Imprimer</strong> est disponible.</li>
                    <li>L'impression est optimisée pour masquer les menus et ne garder que l'essentiel (liste des transports).</li>
                </ol>
            </GuideSection>
        </div>
    )
}

function GuideSection({ title, icon, children }) {
    return (
        <section style={{
            background: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            padding: '1.5rem'
        }}>
            <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#1e293b'
            }}>
                {icon}
                {title}
            </h3>
            <div style={{ color: '#475569', lineHeight: '1.6' }}>
                {children}
            </div>
        </section>
    )
}

// Icons wrappers for simplicity in tab buttons
const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M7 17V7m0 10H5M2 12h20" /></svg>
)
const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
)

const styles = `
.guide-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
}
.guide-list li {
    display: flex;
    alignItems: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}
.guide-steps {
    padding-left: 1.25rem;
    margin: 1rem 0;
}
.guide-steps li {
    margin-bottom: 0.5rem;
}
.btn-mini {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    border: none;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
}
.btn-success { background: #16a34a; }
.btn-danger { background: #dc2626; }
.tip-box {
    background: #f0f9ff;
    border-left: 4px solid #0ea5e9;
    padding: 1rem;
    font-size: 0.9rem;
    color: #0c4a6e;
    margin-top: 1rem;
    border-radius: 0 0.25rem 0.25rem 0;
}
.text-success { color: #16a34a; }
.text-warning { color: #f59e0b; }
.text-danger { color: #dc2626; }
.text-primary { color: #0ea5e9; }
.text-secondary { color: #64748b; }
.text-dark { color: #1e293b; }

@media (max-width: 768px) {
    .help-header {
        margin-bottom: 1rem !important;
        padding-top: 3rem !important;
    }
    
    .help-close-btn {
        padding: 0.4rem 0.8rem !important;
        font-size: 0.85rem !important;
    }
}
`
