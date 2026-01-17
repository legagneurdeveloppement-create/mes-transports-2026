import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Calendar({ userRole }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState({})
    const [destinations, setDestinations] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Transports
            const { data: tData } = await supabase.from('transports').select('*')
            if (tData) {
                const map = {}
                tData.forEach(e => map[e.date_key] = e)
                setEvents(map)
            }

            // Fetch Destinations
            const { data: dData } = await supabase.from('destinations').select('*')
            if (dData) setDestinations(dData)
        }

        fetchData()

        const channel = supabase
            .channel('public-events')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transports' }, () => {
                fetchData()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])


    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const days = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay()
        return { days, firstDay }
    }

    const { days, firstDay } = getDaysInMonth(currentDate)
    // Adjust for Monday start (0 = Sun, 1 = Mon)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1

    const [selectedEventDetails, setSelectedEventDetails] = useState(null)

    const handleDayClick = (day) => {
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`
        const currentEvent = events[dateKey]

        if (userRole === 'ADMIN') {
            if (currentEvent) {
                if (!window.confirm("Un transport est déjà prévu ce jour-là. Voulez-vous le modifier/supprimer ?")) return
            }

            const title = prompt(
                "Titre du transport (laesser vide pour supprimer) :",
                currentEvent?.title || ""
            )

            if (title) {
                saveEvents({ ...events, [dateKey]: { title, type: 'available' } })
            } else if (title === "") {
                if (currentEvent && !window.confirm("Confirmer la suppression ?")) return
                const newEv = { ...events }
                delete newEv[dateKey]
                saveEvents(newEv)
            }
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

            {/* Legend */}
            <div className="calendar-legend">
                {destinations.length === 0 && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Aucun lieu défini.</span>}
                {destinations
                    .filter((dest, index, self) =>
                        index === self.findIndex((t) => (
                            (typeof t === 'string' ? t : t.name) === (typeof dest === 'string' ? dest : dest.name)
                        ))
                    )
                    .map((dest, idx) => {
                        const name = typeof dest === 'string' ? dest : dest.name
                        const color = typeof dest === 'string' ? '#3b82f6' : dest.color
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <div style={{ width: '0.85rem', height: '0.85rem', borderRadius: '50%', backgroundColor: color, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
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
                                    background: hasEvent.color || 'var(--primary)',
                                    border: hasEvent.status === 'validated' ? '2px solid #16a34a' :
                                        hasEvent.status === 'rejected' ? '2px solid #dc2626' :
                                            hasEvent.status === 'pending' ? '2px dotted #eab308' : 'none',
                                    height: userRole === 'CHAUFFEUR' ? '12px' : 'auto',
                                    borderRadius: userRole === 'CHAUFFEUR' ? '10px' : '4px',
                                    padding: userRole === 'CHAUFFEUR' ? '0' : '2px 4px'
                                }}>
                                    {userRole !== 'CHAUFFEUR' && (
                                        <>
                                            {hasEvent.title}
                                            {hasEvent.schoolClass && <span style={{ marginLeft: '4px', opacity: 0.8, fontSize: '0.7em' }}>({hasEvent.schoolClass})</span>}
                                        </>
                                    )}
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
                                <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: selectedEventDetails.color }}></div>
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
