import Navbar from '../components/layout/Navbar'
import { ArrowRight, Star, Shield, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar hideUserInfo={true} />

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="container flex flex-col items-center" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div className="landing-badge">
                        <Star size={16} fill="currentColor" />
                        Transport Premium 2026
                    </div>

                    <h1 className="landing-title">
                        L'excellence de vos trajets au <span style={{ color: 'var(--accent)' }}>quotidien</span>.
                    </h1>

                    <p className="landing-subtitle">
                        Réservez votre chauffeur privé en quelques clics. Ponctualité, confort et sécurité pour tous vos déplacements.
                    </p>

                    <div className="flex gap-4">
                        <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                            Réserver maintenant
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Element */}
                <div className="landing-background-circle" />
            </section>

            {/* Services Section */}
            <section className="landing-services-section">
                <div className="container">
                    <div className="landing-section-header">
                        <h2 className="landing-section-title">Nos Services</h2>
                        <p style={{ color: 'var(--text-light)' }}>Une expérience de transport adaptée à vos besoins.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            { icon: Shield, title: "Sécurité Maximale", desc: "Chauffeurs vérifiés et véhicules contrôlés." },
                            { icon: Clock, title: "Ponctualité", desc: "Nous respectons votre temps, à chaque trajet." }
                        ].map((item, index) => (
                            <div key={index} className="card" style={{ transition: 'transform 0.3s' }}>
                                <div className="landing-service-icon">
                                    <item.icon size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-light)' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta-section">
                <div className="container flex flex-col items-center" style={{ textAlign: 'center' }}>
                    <h2 className="landing-cta-title">Prêt à partir ?</h2>
                    <p style={{ marginBottom: '3rem', opacity: 0.9, fontSize: '1.25rem' }}>Créez votre compte en 2 minutes et planifiez votre premier trajet.</p>
                    <Link to="/register" className="btn btn-accent" style={{ padding: '1rem 3rem' }}>
                        Commencer <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                    </Link>
                </div>
            </section>


        </div>
    )
}
