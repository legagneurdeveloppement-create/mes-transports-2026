import Navbar from '../components/layout/Navbar'
import { ArrowRight, Star, Shield, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar hideUserInfo={true} />

            {/* Hero Section */}
            <section style={{
                padding: '10rem 0 6rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container flex flex-col items-center" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        color: 'var(--accent-hover)',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        marginBottom: '2rem'
                    }}>
                        <Star size={16} fill="currentColor" />
                        Transport Premium 2026
                    </div>

                    <h1 style={{
                        fontSize: '4rem',
                        marginBottom: '1.5rem',
                        color: 'var(--primary)',
                        letterSpacing: '-0.03em',
                        maxWidth: '900px'
                    }}>
                        L'excellence de vos trajets au <span style={{ color: 'var(--accent)' }}>quotidien</span>.
                    </h1>

                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-light)',
                        marginBottom: '3rem',
                        maxWidth: '600px'
                    }}>
                        Réservez votre chauffeur privé en quelques clics. Ponctualité, confort et sécurité pour tous vos déplacements.
                    </p>

                    <div className="flex gap-4">
                        <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                            Réserver maintenant
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Element */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '800px',
                    height: '800px',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />
            </section>

            {/* Services Section */}
            <section style={{ padding: '6rem 0', background: 'var(--white)' }}>
                <div className="container">
                    <div className="flex flex-col items-center" style={{ marginBottom: '4rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Nos Services</h2>
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
                                <div style={{
                                    width: '3rem',
                                    height: '3rem',
                                    background: 'var(--primary)',
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--accent)',
                                    marginBottom: '1.5rem'
                                }}>
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
            <section style={{ padding: '6rem 0', background: 'var(--primary)', color: 'white' }}>
                <div className="container flex flex-col items-center" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'white' }}>Prêt à partir ?</h2>
                    <p style={{ marginBottom: '3rem', opacity: 0.9, fontSize: '1.25rem' }}>Créez votre compte en 2 minutes et planifiez votre premier trajet.</p>
                    <Link to="/register" className="btn btn-accent" style={{ padding: '1rem 3rem' }}>
                        Commencer <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
                    </Link>
                </div>
            </section>

            <footer style={{ padding: '3rem 0', background: 'var(--bg)', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
                <div className="container flex justify-between items-center">
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>© 2026 Mes Transports</span>
                    <div className="flex gap-4" style={{ color: 'var(--text-light)' }}>
                        <span>Mentions légales</span>
                        <span>Contact</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
