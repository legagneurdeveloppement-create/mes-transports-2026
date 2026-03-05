import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import {
    Calendar, CheckCircle, XCircle, Clock, MapPin,
    Settings, Shield, User, Smartphone, CalendarPlus,
    HelpCircle, ArrowRight, Printer, Bell, Info, Mail, Lock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Help() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(
        user?.role === 'CHAUFFEUR' ? 'chauffeur' :
            (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? 'admin' : 'general')
    )

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            <style>{styles}</style>
            <Navbar />
            <div className="container help-container">
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
                        <HelpCircle size={32} className="help-icon" /> <span>Centre d'Aide Mes Transports</span>
                    </h1>
                    <p className="help-subtitle mobile-hidden" style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
                        Retrouvez ici tous les guides pour utiliser efficacement l'application.
                    </p>
                </header>

                <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        >
                            <Info size={18} /> Général & Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('chauffeur')}
                            className={`tab-btn ${activeTab === 'chauffeur' ? 'active' : ''}`}
                        >
                            <CarIcon /> Espace Chauffeur
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                        >
                            <ShieldIcon /> Espace Admin
                        </button>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        {activeTab === 'general' && <GeneralGuide />}
                        {activeTab === 'chauffeur' && <ChauffeurGuide />}
                        {activeTab === 'admin' && <AdminGuide />}
                    </div>
                </div>
            </div>
        </div>
    )
}

function GeneralGuide() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <GuideSection
                title="1. Accès et Inscription"
                icon={<Lock className="text-secondary" />}
            >
                <ul className="guide-list">
                    <li><strong>Inscription :</strong> Après avoir créé votre compte, celui-ci est placé "en attente". Un administrateur doit l'approuver pour que vous puissiez accéder à l'intégralité des fonctions.</li>
                    <li><strong>Statut Approbation :</strong> Si vous voyez un message "Compte en attente", contactez votre responsable.</li>
                    <li><strong>Rôles :</strong> L'interface change selon si vous êtes Utilisateur (lecture seule), Chauffeur (gestion des courses) ou Administrateur (gestion du planning).</li>
                </ul>
            </GuideSection>

            <GuideSection
                title="2. Notifications Push & Alertes"
                icon={<Bell className="text-primary" />}
            >
                <p>L'application utilise plusieurs moyens pour vous avertir des changements :</p>
                <ul className="guide-list">
                    <li><strong>SMS :</strong> Envoyés aux chauffeurs lors d'une nouvelle assignation urgente ou d'une modification de dernière minute.</li>
                    <li><strong>Notifications Web (Push) :</strong> Si vous l'autorisez dans votre navigateur, une alerte apparaîtra sur votre écran (même si l'application est fermée).</li>
                    <li><strong>Service Worker :</strong> Notre PWA permet de recevoir des alertes même hors-ligne si l'appareil est connecté à Internet.</li>
                </ul>
                <div className="tip-box">
                    🔔 <strong>Conseil :</strong> Pensez à "Autoriser" les notifications quand le navigateur vous le demande pour ne rater aucune course.
                </div>
            </GuideSection>

            <GuideSection
                title="3. Aide Technique"
                icon={<Settings className="text-dark" />}
            >
                <p>Pour un fonctionnement optimal :</p>
                <ul className="guide-list">
                    <li>Utilisez le navigateur <strong>Google Chrome</strong> ou <strong>Safari</strong> (sur iPhone).</li>
                    <li>L'application peut être installée comme une "App" (PWA) sur votre écran d'accueil via le menu "Partager" ou "Installer l'application" de votre navigateur.</li>
                </ul>
            </GuideSection>
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
                <p>Dès qu'un administrateur vous assigne un transport, il apparaît dans l'onglet <strong>En attente</strong> de votre Dashboard.</p>
                <ul className="guide-list">
                    <li>Cliquez sur <button className="btn-mini btn-success"><CheckCircle size={14} /> Valider</button> pour accepter la course. Cela informe immédiatement l'admin.</li>
                    <li>Cliquez sur <button className="btn-mini btn-danger"><XCircle size={14} /> Refuser</button> si vous avez un empêchement.</li>
                </ul>
                <div className="tip-box">
                    💡 <strong>Info :</strong> L'administrateur reçoit automatiquement une notification quand vous répondez à une demande.
                </div>
            </GuideSection>

            <GuideSection
                title="2. Saisir vos Horaires Réels"
                icon={<Clock className="text-warning" />}
            >
                <p>Indispensable pour le suivi de votre temps de travail :</p>
                <ol className="guide-steps">
                    <li>Sur la fiche du transport, cliquez sur <strong><Settings size={14} /> Gérer horaires</strong>.</li>
                    <li>Saisissez l'heure de départ et d'arrivée pour l'<strong>Aller</strong>.</li>
                    <li>Faites de même pour le <strong>Retour</strong>.</li>
                    <li><strong>📍 Resté sur place :</strong> Cochez cette case si vous n'êtes pas rentré ou reparti pour une autre course entre l'aller et le retour.</li>
                </ol>
            </GuideSection>

            <GuideSection
                title="3. Rappels Automatiques (Agenda)"
                icon={<CalendarPlus className="text-primary" />}
            >
                <p>Pour ne rien oublier :</p>
                <p>Cliquez sur le bouton <strong>📅 Rappel</strong> pour exporter le trajet dans le calendrier de votre téléphone (Android/iOS). Cela créera :</p>
                <ul className="guide-list">
                    <li>🔔 Une première alerte 24 heures avant.</li>
                    <li>🔔 Une seconde alerte 1 heure avant le départ.</li>
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
                <p>Cliquez simplement sur un jour vide dans le calendrier.</p>
                <ul className="guide-list">
                    <li><strong>Destinations :</strong> Sélectionnez un lieu existant pour automatiser les couleurs et les paramètres.</li>
                    <li><strong>Chauffeur :</strong> Vous pouvez assigner un chauffeur immédiatement ou plus tard.</li>
                    <li><strong>Actions Groupées :</strong> Maintenez <code>Ctrl</code> (Windows) ou <code>Cmd</code> (Mac) pour sélectionner plusieurs dates d'un coup.</li>
                </ul>
                <div className="tip-box">
                    📱 <strong>SMS automatique :</strong> Le chauffeur reçoit un SMS si son numéro est valide dès que vous sauvegardez.
                </div>
            </GuideSection>

            <GuideSection
                title="2. Gestion des Utilisateurs"
                icon={<User className="text-success" />}
            >
                <ul className="guide-list">
                    <li><strong>Approuver :</strong> Un nouvel inscrit ne peut rien voir tant que vous ne l'approuvez pas.</li>
                    <li><strong>Rôles :</strong> Changez un utilisateur en 'CHAUFFEUR' ou 'ADMIN' selon vos besoins.</li>
                    <li><strong>Mots de passe :</strong> Si un utilisateur oublie ses accès, vous pouvez lui réinitialiser son mot de passe depuis cet écran.</li>
                </ul>
            </GuideSection>

            <GuideSection
                title="3. Impression & Export"
                icon={<Printer className="text-dark" />}
            >
                <p>L'icône d'imprimante permet de télécharger un fichier PDF ou d'imprimer directement le planning mensuel/annuel dans une mise en page soignée.</p>
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
.tab-btn {
    flex: 1;
    min-width: 150px;
    padding: 1.25rem 1rem;
    background: transparent;
    color: var(--text-light);
    border: none;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    alignItems: center;
    justifyContent: center;
    gap: 0.6rem;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
}
.tab-btn:hover {
    background: #f8fafc;
}
.tab-btn.active {
    background: #f0f9ff;
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
}
.guide-list {
    list-style: disc;
    padding-left: 1.5rem;
    margin: 1rem 0;
}
.guide-list li {
    margin-bottom: 0.75rem;
    line-height: 1.5;
}
.help-container {
    padding: 2rem;
}
p {
    margin-bottom: 1rem;
    line-height: 1.6;
}
p:last-child {
    margin-bottom: 0;
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
    border-left: 44px solid #0ea5e9;
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
    .help-container {
        padding: 1rem !important;
    }
    .help-header {
        margin-bottom: 1.5rem !important;
        padding-top: 3.5rem !important;
    }
    
    .help-close-btn {
        padding: 0.4rem 0.8rem !important;
        font-size: 0.8rem !important;
        top: -0.5rem !important;
    }

    .help-page-title {
        font-size: 1.5rem !important;
        margin-top: 1rem !important;
    }

    .help-subtitle {
        font-size: 0.9rem !important;
    }

    section {
        padding: 1rem !important;
    }

    h3 {
        font-size: 1rem !important;
        gap: 0.5rem !important;
    }

    .guide-list li, .guide-steps li {
        font-size: 0.95rem !important;
        line-height: 1.6 !important;
    }

    .tip-box {
        padding: 0.75rem !important;
        font-size: 0.85rem !important;
    }

    /* Tabs mobile layout */
    .card > div:first-child {
        flex-direction: column !important;
    }

    .tab-btn { padding: 1rem !important; min-width: 100% !important; border-bottom: 1px solid #e2e8f0 !important; }
    .tab-btn.active { border-bottom: 1px solid var(--primary) !important; }

    /* Paragraphs wrapping */
    p {
        line-height: 1.6 !important;
    }
    /* Guide section padding */
    .card > div:last-child {
        padding: 1rem !important;
    }
}
`
