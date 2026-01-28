import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Calendar({ userRole }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState({})
    const [destinations, setDestinations] = useState([])
    const [fetchError, setFetchError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setFetchError(null)
            // Fetch Transports
            const { data: tData, error: tError } = await supabase.from('transports').select('*')
            if (tError) {
                console.error('Error fetching transports:', tError)
                setFetchError('Erreur de chargement des transports')
            }
            if (tData) {
                const map = {}
                tData.forEach(e => {
                    const dateKey = e.date_key
                    if (dateKey) {
                        map[dateKey] = {
                            ...e,
                            schoolClass: e.schoolClass || e.school_class
                        }
                    }
                })
                setEvents(map)
            }

            // Fetch Destinations
            const { data: dData, error: dError } = await supabase.from('destinations').select('*')
            if (dError) {
                console.error('Error fetching destinations:', dError)
                setFetchError('Erreur de chargement des lieux (Perm.?)')
            }
            if (dData) {
                console.log('Fetched destinations count:', dData.length)
                setDestinations(dData.map(d => ({
                    ...d,
                    defaultClass: d.default_class || d.defaultClass || ''
                })))
            } else {
                console.warn('Destinations returned null/undefined')
            }
        }

        fetchData()

        const transportChannel = supabase
            .channel('public-transports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transports' }, () => {
                fetchData()
            })
            .subscribe()

        const destinationChannel = supabase
            .channel('public-destinations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, () => {
                fetchData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(transportChannel)
            supabase.removeChannel(destinationChannel)
        }
    }, [])


    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const days = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay()
        return { days, firstDay }
    }

    // Standardized Source of Truth for Destinations (Cloud + Auto-Detect)
    const effectiveDestinations = useMemo(() => {
        const list = [...(destinations || [])];
        const seen = new Set();

        // Add existing from cloud to 'seen'
        list.forEach(d => {
            const dName = (typeof d === 'string' ? d : (d.name || '')).trim().toLowerCase();
            const dClass = (typeof d === 'string' ? '' : (d.defaultClass || d.default_class || '')).trim().toLowerCase();
            seen.add(`${dName}|${dClass}`);
        });

        // Auto-detect from visible events
        Object.values(events || {}).forEach(e => {
            if (!e || !e.title) return;
            const eName = e.title.trim().toLowerCase();
            const eClass = (e.schoolClass || e.school_class || '').trim().toLowerCase();
            const key = `${eName}|${eClass}`;

            if (!seen.has(key)) {
                seen.add(key);
                list.push({
                    name: e.title,
                    color: e.color || '#3b82f6',
                    defaultClass: e.schoolClass || e.school_class || ''
                });
            }
        });
        return list;
    }, [destinations, events]);

    const getEventColor = (event) => {
        if (!event) return 'transparent'
        const eClass = (event.schoolClass || event.school_class || '').trim().toLowerCase()
        const eTitle = (event.title || '').trim().toLowerCase()

        const match = effectiveDestinations.find(d => {
            if (!d) return false
            const dName = (typeof d === 'string' ? d : (d.name || '')).trim().toLowerCase()
            const dClass = (typeof d === 'string' ? '' : (d.defaultClass || d.default_class || '')).trim().toLowerCase()
            return dName === eTitle && (dClass === eClass || dClass === '')
        })
        return match?.color || event.color || 'var(--primary)'
    }

    const { days, firstDay } = getDaysInMonth(currentDate)
    // Adjust for Monday start (0 = Sun, 1 = Mon)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1

    const [selectedEventDetails, setSelectedEventDetails] = useState(null)

    const handleDayClick = (day) => {
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`
        const currentEvent = events[dateKey]

        if (userRole === 'ADMIN') {
            alert("Veuillez utiliser le tableau de bord Admin pour toute modification.")
        } else {
            // Chauffeur or User: show details
            if (currentEvent) {
                setSelectedEventDetails({ ...currentEvent, day, month: currentDate.getMonth(), year: currentDate.getFullYear() })
            }
        }
    }

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
        setSelectedEventDetails(null) // Close modal on month change
    }

    const handlePrint = () => {
        window.print()
    }

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

    return (
        <div>
            <div className="calendar-header no-print">
                <div className="calendar-controls">
                    <button onClick={() => changeMonth(-1)} className="btn btn-outline calendar-control-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => changeMonth(1)} className="btn btn-outline calendar-control-btn">
                        <ChevronRight size={24} />
                    </button>
                </div>

                <h3 className="calendar-title">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>

                <div>
                    <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Imprimer le mois
                    </button>
                </div>
            </div>

            {fetchError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.5rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
                    ⚠️ {fetchError}
                </div>
            )}

            {/* Legend Section: Auto-populates from effective sources */}
            <div className="calendar-legend">
                {effectiveDestinations.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', width: '100%' }}>
                        Chargement des lieux (Auto-chargement)...
                    </div>
                ) : effectiveDestinations.map((dest, idx) => {
                    if (!dest) return null
                    const name = typeof dest === 'string' ? dest : dest.name
                    const color = typeof dest === 'string' ? '#3b82f6' : dest.color
                    return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <div style={{ width: '0.85rem', height: '0.85rem', borderRadius: '50%', backgroundColor: color || '#3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontWeight: '500', color: '#334155' }}>{name}</span>
                        </div>
                    )
                })}
            </div>

            <div className="calendar-weekdays">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="calendar-weekday">{d}</div>
                ))}
            </div>

            <div className="calendar-grid">
                {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} style={{ background: 'transparent' }} />)}

                {[...Array(days)].map((_, i) => {
                    const day = i + 1
                    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`
                    const hasEvent = events[dateKey]
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                    return (
                        <div
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`calendar-day ${isToday ? 'today' : ''} ${userRole === 'ADMIN' ? 'clickable' : ''}`}
                            style={{
                                cursor: userRole === 'ADMIN' ? 'pointer' : 'default',
                                border: isToday ? '3px solid #3b82f6' : '2px solid transparent'
                            }}
                            onMouseEnter={e => {
                                if (userRole === 'ADMIN') {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow)'
                                }
                            }}
                            onMouseLeave={e => {
                                if (userRole === 'ADMIN') {
                                    e.currentTarget.style.transform = 'none'
                                    e.currentTarget.style.boxShadow = 'none'
                                }
                            }}
                        >
                            <div className="calendar-day-header">
                                <span className={`calendar-day-number ${isToday ? 'today' : ''}`}>{day}</span>
                                {userRole === 'ADMIN' && !hasEvent && <Plus size={14} style={{ opacity: 0.3 }} />}
                            </div>

                            {hasEvent && (
                                <div className="calendar-event" style={{
                                    background: getEventColor(hasEvent),
                                    border: hasEvent.status === 'validated' ? '2px solid #16a34a' :
                                        hasEvent.status === 'rejected' ? '2px solid #dc2626' :
                                            hasEvent.status === 'pending' ? '2px dotted #eab308' : 'none'
                                }}>
                                    <span className="event-label">
                                        {hasEvent.title}
                                        {hasEvent.schoolClass && <span style={{ marginLeft: '4px', opacity: 0.8, fontSize: '0.7em' }}>({hasEvent.schoolClass})</span>}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Read-only Detail Modal */}
            {selectedEventDetails && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 3000 }} onClick={() => setSelectedEventDetails(null)}>
                    <div className="modal-content" style={{ maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: getEventColor(selectedEventDetails) }}></div>
                                Détails du Transport
                            </h3>
                            <button className="btn-close" onClick={() => setSelectedEventDetails(null)}>×</button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Destination</label>
                                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)', marginTop: '0.25rem' }}>{selectedEventDetails.title}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Date</label>
                                    <div style={{ fontWeight: '500' }}>{new Date(selectedEventDetails.year, selectedEventDetails.month, selectedEventDetails.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                                </div>
                                {selectedEventDetails.schoolClass && (
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Classe</label>
                                        <div style={{ fontWeight: '500' }}>{selectedEventDetails.schoolClass}</div>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Times Display */}
                            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#0891b2', textTransform: 'uppercase' }}>Départ</h4>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                        {selectedEventDetails.time_departure_origin || '--:--'}
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#0891b2', textTransform: 'uppercase' }}>Retour</h4>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                        {selectedEventDetails.time_departure_destination || '--:--'}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Schedule Steps (if available) */}
                            {(() => {
                                let allerSteps = []
                                let retourSteps = []
                                let stayedOnSite = false
                                try {
                                    if (selectedEventDetails.time_departure_school) {
                                        const rawAller = typeof selectedEventDetails.time_departure_school === 'string'
                                            ? JSON.parse(selectedEventDetails.time_departure_school)
                                            : selectedEventDetails.time_departure_school

                                        if (Array.isArray(rawAller)) {
                                            allerSteps = rawAller
                                        } else if (rawAller && typeof rawAller === 'object') {
                                            allerSteps = rawAller.steps || []
                                            stayedOnSite = rawAller.stayedOnSite || false
                                        }
                                    }
                                    if (selectedEventDetails.time_arrival_school) {
                                        const rawRetour = typeof selectedEventDetails.time_arrival_school === 'string'
                                            ? JSON.parse(selectedEventDetails.time_arrival_school)
                                            : selectedEventDetails.time_arrival_school
                                        retourSteps = Array.isArray(rawRetour) ? rawRetour : (rawRetour?.steps || [])
                                    }
                                    stayedOnSite = stayedOnSite || selectedEventDetails.stayed_on_site || false
                                } catch (e) {
                                    console.error('Error parsing schedule:', e)
                                }

                                const hasDetailedSchedule = (Array.isArray(allerSteps) && allerSteps.length > 0) ||
                                    (Array.isArray(retourSteps) && retourSteps.length > 0) || stayedOnSite

                                if (!hasDetailedSchedule) return null

                                return (
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem' }}>
                                            📋 Horaires détaillés (Chauffeur)
                                        </h4>

                                        {stayedOnSite && (
                                            <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e', background: '#fef3c7', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontWeight: '600', border: '1px solid #f59e0b', display: 'inline-block' }}>
                                                📍 Chauffeur resté sur place
                                            </div>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {/* Aller */}
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0891b2', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    → Aller
                                                </div>
                                                {Array.isArray(allerSteps) && allerSteps.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {allerSteps.map((step, idx) => (
                                                            <div key={idx} style={{ fontSize: '0.85rem', padding: '0.4rem', background: '#f0f9ff', borderRadius: '0.25rem' }}>
                                                                <div style={{ fontWeight: '600', color: '#0891b2' }}>{step.time || '--:--'}</div>
                                                                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{step.location || 'Non spécifié'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune étape</div>
                                                )}
                                            </div>

                                            {/* Retour */}
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f97316', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                    ← Retour
                                                </div>
                                                {Array.isArray(retourSteps) && retourSteps.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {retourSteps.map((step, idx) => (
                                                            <div key={idx} style={{ fontSize: '0.85rem', padding: '0.4rem', background: '#fff7ed', borderRadius: '0.25rem' }}>
                                                                <div style={{ fontWeight: '600', color: '#f97316' }}>{step.time || '--:--'}</div>
                                                                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{step.location || 'Non spécifié'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Aucune étape</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    background: selectedEventDetails.status === 'validated' ? '#dcfce7' : selectedEventDetails.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                    color: selectedEventDetails.status === 'validated' ? '#166534' : selectedEventDetails.status === 'rejected' ? '#991b1b' : '#92400e'
                                }}>
                                    {selectedEventDetails.status === 'validated' ? '✓ Validé' : selectedEventDetails.status === 'rejected' ? '✕ Refusé' : '⌚ En attente'}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedEventDetails(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
