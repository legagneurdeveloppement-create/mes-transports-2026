import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function Calendar({ userRole }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState({})
    const [destinations, setDestinations] = useState([])

    useEffect(() => {
        const stored = localStorage.getItem('transport_events')
        if (stored) setEvents(JSON.parse(stored))

        const storedDestinations = localStorage.getItem('transport_destinations')
        if (storedDestinations) {
            setDestinations(JSON.parse(storedDestinations))
        }
    }, [])

    const saveEvents = (newEvents) => {
        setEvents(newEvents)
        localStorage.setItem('transport_events', JSON.stringify(newEvents))
    }

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

    const handleDayClick = (day) => {
        if (userRole !== 'ADMIN') return

        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`
        const currentEvent = events[dateKey]

        if (currentEvent) {
            if (!window.confirm("Un transport est déjà prévu ce jour-là. Voulez-vous le modifier/supprimer ?")) return
        }

        const title = prompt(
            "Titre du transport (laisser vide pour supprimer) :",
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
    }

    const changeMonth = (delta) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
    }

    const handlePrint = () => {
        window.print()
    }

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

    return (
        <div>
            <div className="flex justify-between items-center no-print" style={{ marginBottom: '1.5rem' }}>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => changeMonth(1)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                        <ChevronRight size={24} />
                    </button>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>

                <div>
                    <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Imprimer le mois
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                padding: '0.75rem 1rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
            }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-light)', fontSize: '0.875rem' }}>{d}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
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
                            className="print-compact-day"
                            style={{
                                minHeight: '120px',
                                background: 'white',
                                borderRadius: '0.5rem',
                                padding: '0.75rem',
                                cursor: userRole === 'ADMIN' ? 'pointer' : 'default',
                                border: isToday ? '2px solid var(--accent)' : '1px solid #e2e8f0',
                                position: 'relative',
                                transition: 'transform 0.2s, box-shadow 0.2s'
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
                            <div style={{
                                fontWeight: 'bold',
                                marginBottom: '0.5rem',
                                color: isToday ? 'var(--accent)' : 'var(--text)',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                {day}
                                {userRole === 'ADMIN' && !hasEvent && <Plus size={14} style={{ opacity: 0.3 }} />}
                            </div>

                            {hasEvent && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    background: hasEvent.color || 'var(--primary)',
                                    color: 'white',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '0.35rem',
                                    fontWeight: '500',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    {hasEvent.title}
                                    {hasEvent.schoolClass && <span style={{ marginLeft: '4px', opacity: 0.8, fontSize: '0.7em' }}>({hasEvent.schoolClass})</span>}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
