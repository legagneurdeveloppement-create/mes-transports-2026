import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import {
    Calendar, CheckCircle, XCircle, Clock, MapPin,
    Settings, Shield, User, Smartphone, CalendarPlus,
    HelpCircle, ArrowRight, Printer, CloudUpload
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
                title="1. Planifier un Transport (Base)"
                icon={<Calendar className="text-primary" />}
            >
                <p>Cliquez sur une date dans le calendrier pour ouvrir le formulaire.</p>
                <ul className="guide-list">
                    <li><strong>Destination :</strong> Sélectionnez une ville ou un lieu existant. La couleur s'ajustera automatiquement.</li>
                    <li><strong>Classe :</strong> Indiquez le groupe concerné (ex: CP, 6ème).</li>
                    <li><strong>Horaires :</strong> Définissez l'heure de départ et de retour prévues.</li>
                </ul>
                <div className="tip-box">
                    📱 <strong>Notification :</strong> Lors de la création ou modification, le chauffeur reçoit un SMS si son numéro est renseigné.
                </div>
            </GuideSection>

            <GuideSection
                title="2. Sélection Multiple & Actions Groupées (Nouveau)"
                icon={<CalendarPlus className="text-warning" />}
            >
                <p>Pour planifier rapidement plusieurs jours (ex: tous les lundis du mois) :</p>
                <ol className="guide-steps">
                    <li>Activez le bouton <strong>"Sélection Multiple"</strong> en haut du calendrier (il devient violet).</li>
                    <li>Cliquez sur tous les jours souhaités (ils s'entourent de violet).</li>
                    <li>Cliquez sur le bouton <strong>"Planifier X dates"</strong> qui apparaît.</li>
                </ol>
                <p>Dans la fenêtre qui s'ouvre :</p>
                <ul className="guide-list">
                    <li>Remplissez les infos : elles s'appliqueront à <strong>toutes</strong> les dates sélectionnées.</li>
                    <li>Pour supprimer, cliquez sur le bouton <strong>Supprimer</strong> en bas à gauche : cela effacera tous les transports sélectionnés.</li>
                </ul>
                <div className="tip-box">
                    💡 <strong>Astuce pro :</strong> Vous pouvez aussi maintenir la touche <code>Ctrl</code> (ou <code>Cmd</code>) enfoncée pour sélectionner des dates sans activer le bouton.
                </div>
            </GuideSection>

            <GuideSection
                title="3. Gestion des Utilisateurs"
                icon={<User className="text-success" />}
            >
                <p>Accédez à la gestion via le menu principal ou l'icône <Shield size={14} />.</p>
                <ul className="guide-list">
                    <li><strong>Approuver :</strong> Validez les nouveaux inscrits pour qu'ils puissent se connecter.</li>
                    <li><strong>Rôle :</strong> Définissez qui est Chauffeur, Admin ou simple Utilisateur.</li>
                    <li><strong>Direction :</strong> Attribuez une structure (Commune, Société...) pour soigner l'affichage.</li>
                </ul>
            </GuideSection>

            <GuideSection
                title="4. Impression & Export"
                icon={<Printer className="text-dark" />}
            >
                <ul className="guide-list">
                    <li><strong>Imprimer le mois :</strong> Utilisez le bouton d'impression du navigateur (Ctrl+P) ou le bouton dédié sur le Dashboard. L'affichage s'adapte automatiquement au format papier.</li>
                    <li><strong>Envoyer vers Cloud :</strong> Si vous utilisez l'application sur plusieurs appareils (PC + Téléphone), pensez à cliquer sur le bouton <span style={{ color: '#0891b2' }}><CloudUpload size={14} /> Envoyer vers Cloud</span> pour synchroniser vos dernières modifications.</li>
                </ul>
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

    .card > div:first-child button {
        padding: 1rem !important;
        font-size: 1rem !important;
        border-bottom: 1px solid #e2e8f0 !important;
        width: 100% !important;
    }
    .card > div:first-child button:last-child {
        border-bottom: none !important;
    }

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
