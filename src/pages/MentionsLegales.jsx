import React from 'react';
import { Link } from 'react-router-dom';

const MentionsLegales = () => {
    return (
        <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
            <Link
                to="/"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-light)',
                    textDecoration: 'none',
                    marginBottom: '2rem',
                    fontWeight: '500'
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Retour à l'accueil
            </Link>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Mentions Légales</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '3rem' }}>En vigueur au 29 Mars 2026</p>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                        1. Éditeur du site
                    </h2>
                    <p>
                        L'édition du site <strong>Mes Transports</strong> est assurée par :<br />
                        <strong>legagneur developpement</strong><br />
                        2 les saussois, 21430 Brazey en Morvan<br />
                        Email : legagneur.developpement@gmail.com<br />
                        SIRET : 000 000 000 00000<br />
                        URL du site : <strong>https://mes-transports-prod.vercel.app</strong>
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                        2. Hébergeur
                    </h2>
                    <p>
                        <strong>Hébergement du site (Frontend) :</strong><br />
                        Vercel Inc.<br />
                        440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
                        Site web : https://vercel.com
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        <strong>Gestion des données (Backend & Base de données) :</strong><br />
                        Supabase Inc.<br />
                        970 Summer St, Stamford, CT 06905, USA<br />
                        Site web : https://supabase.com
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                        3. Propriété intellectuelle
                    </h2>
                    <p>
                        L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle.
                        Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site,
                        quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de l'éditeur.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                        4. Données personnelles & RGPD
                    </h2>
                    <p>
                        L’application <strong>Mes Transports</strong> collecte des données personnelles (noms, prénoms, coordonnées, trajets)
                        nécessaires au bon fonctionnement du service de transport.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Conformément à la loi « informatique et libertés » et au Règlement Général sur la Protection des Données (RGPD),
                        vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
                        Pour exercer ce droit, vous pouvez nous contacter par email à l'adresse indiquée ci-dessus.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                        5. Cookies
                    </h2>
                    <p>
                        L’application utilise des cookies techniques strictement nécessaires à la navigation et à l'authentification des utilisateurs.
                        Aucun cookie de traçage publicitaire n'est utilisé.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                        6. Responsabilité
                    </h2>
                    <p>
                        L'éditeur s'efforce de fournir des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable
                        des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>
                <p>© 2026 Mes Transports - Tous droits réservés.</p>
            </div>
        </div>
    );
};

export default MentionsLegales;
