import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import EventModal from './EventModal'
import DestinationManagerModal from './DestinationManagerModal'

export default function AdminCalendar() {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [events, setEvents] = useState({})

    // Destinations state - Now using objects to store color as well
    const [destinations, setDestinations] = useState([
        { name: "Aéroport Charles de Gaulle", color: "#3b82f6" },
        { name: "Aéroport d'Orly", color: "#3b82f6" },
        { name: "Gare de Lyon", color: "#22c55e" },
        { name: "Gare du Nord", color: "#22c55e" },
        { name: "Gare Montparnasse", color: "#22c55e" },
        { name: "Paris Centre", color: "#a855f7" },
        { name: "Disneyland Paris", color: "#ec4899" },
        { name: "La Défense", color: "#64748b" },
        { name: "Versailles", color: "#f97316" }
    ])

    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDestManagerOpen, setIsDestManagerOpen] = useState(false)
    const [selectedDateKey, setSelectedDateKey] = useState(null)
    const [selectedEventData, setSelectedEventData] = useState(null)

    useEffect(() => {
        const storedEvents = localStorage.getItem('transport_events')
        if (storedEvents) setEvents(JSON.parse(storedEvents))

        const storedDestinations = localStorage.getItem('transport_destinations')
        if (storedDestinations) {
            const parsed = JSON.parse(storedDestinations)
            // Migration check: if array of strings, convert to objects
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                const migrated = parsed.map(d => ({ name: d, color: '#3b82f6' }))
                setDestinations(migrated)
            } else {
                setDestinations(parsed)
            }
        }
    }, [])

    const saveEvents = (newEvents) => {
        setEvents(newEvents)
        localStorage.setItem('transport_events', JSON.stringify(newEvents))
    }

    const saveDestinations = (newDestinations) => {
        setDestinations(newDestinations)
        localStorage.setItem('transport_destinations', JSON.stringify(newDestinations))
    }

    const changeYear = (delta) => {
        setCurrentYear(currentYear + delta)
    }

    const handleDayClick = (year, month, day) => {
        const dateKey = `${year}-${month}-${day}`
        setSelectedDateKey(dateKey)
        setSelectedEventData(events[dateKey] || null)
        setIsModalOpen(true)
    }

    const handleSaveEvent = (eventData) => {
        if (!eventData) {
            // Delete event
            const newEv = { ...events }
            delete newEv[selectedDateKey]
            saveEvents(newEv)
        } else {
            // Add/Update event
            saveEvents({
                ...events,
                [selectedDateKey]: { ...eventData, type: 'available' }
            })
        }
    }

    const getDaysInMonth = (year, month) => {
        const days = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay()
        return { days, firstDay }
    }

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

    return (
        <div>
            {/* Header / Year Navigation */}
            <div className="flex justify-between items-center no-print" style={{ marginBottom: '2rem' }}>
                <div className="flex gap-2">
                    <button onClick={() => changeYear(-1)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => changeYear(1)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                        <ChevronRight size={24} />
                    </button>
                </div>

                <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {currentYear}
                </h3>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setIsDestManagerOpen(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18} /> Gérer les lieux
                    </button>
                    <button onClick={() => window.print()} className="btn btn-primary">
                        Imprimer l'année
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                marginBottom: '2rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
            }}>
                {destinations.length === 0 && <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Aucun lieu défini.</span>}
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
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: color, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
                                <span style={{ fontWeight: '500', color: '#334155' }}>{name}</span>
                            </div>
                        )
                    })}
            </div>

            {/* Semester 1: Jan - Jun */}
            <div className="print-compact-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                pageBreakAfter: 'always'
            }}>
                {monthNames.slice(0, 6).map((monthName, monthIndex) => {
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1

                    return (
                        <div key={monthName} className="print-compact-month" style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--primary)' }}>{monthName}</h4>

                            {/* Days Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                                    <div key={d} style={{ textAlign: 'center' }}>{d}</div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} />)}

                                {[...Array(days)].map((_, i) => {
                                    const day = i + 1
                                    const dateKey = `${currentYear}-${monthIndex}-${day}`
                                    const hasEvent = events[dateKey]

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => handleDayClick(currentYear, monthIndex, day)}
                                            style={{
                                                aspectRatio: '1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                borderRadius: '0.25rem',
                                                backgroundColor: hasEvent ? hasEvent.color || 'var(--primary)' : 'transparent',
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: '1px solid #f1f5f9',
                                                position: 'relative'
                                            }}
                                            title={hasEvent ? `${hasEvent.title} (${hasEvent.schoolClass || ''})` : ''}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                                <span>{day}</span>
                                                {hasEvent && hasEvent.schoolClass && (
                                                    <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>{hasEvent.schoolClass}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Semester 2: Jul - Dec */}
            <div className="print-compact-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem'
            }}>
                {monthNames.slice(6, 12).map((monthName, i) => {
                    const monthIndex = i + 6
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1

                    return (
                        <div key={monthName} className="print-compact-month" style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--primary)' }}>{monthName}</h4>

                            {/* Days Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                                    <div key={d} style={{ textAlign: 'center' }}>{d}</div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} />)}

                                {[...Array(days)].map((_, i) => {
                                    const day = i + 1
                                    const dateKey = `${currentYear}-${monthIndex}-${day}`
                                    const hasEvent = events[dateKey]

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => handleDayClick(currentYear, monthIndex, day)}
                                            style={{
                                                aspectRatio: '1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                borderRadius: '0.25rem',
                                                backgroundColor: hasEvent ? hasEvent.color || 'var(--primary)' : 'transparent',
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: '1px solid #f1f5f9',
                                                position: 'relative'
                                            }}
                                            title={hasEvent ? `${hasEvent.title} (${hasEvent.schoolClass || ''})` : ''}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                                                <span>{day}</span>
                                                {hasEvent && hasEvent.schoolClass && (
                                                    <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>{hasEvent.schoolClass}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                eventData={selectedEventData}
                selectedDate={selectedDateKey}
                destinations={destinations}
            />

            <DestinationManagerModal
                isOpen={isDestManagerOpen}
                onClose={() => setIsDestManagerOpen(false)}
                destinations={destinations}
                onUpdate={saveDestinations}
            />
        </div>
    )
}
