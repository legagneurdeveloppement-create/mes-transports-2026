import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Settings, CloudUpload, RefreshCw } from 'lucide-react'
import EventModal from './EventModal'
import DestinationManagerModal from './DestinationManagerModal'
import { supabase } from '../../lib/supabase'
import { smsService } from '../../lib/smsService'

export default function AdminCalendar() {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [events, setEvents] = useState({})
    const [isSyncing, setIsSyncing] = useState(false)

    // Destinations state
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

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDestManagerOpen, setIsDestManagerOpen] = useState(false)
    const [selectedDateKey, setSelectedDateKey] = useState(null)
    const [selectedEventData, setSelectedEventData] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            const { data: transportData, error: tError } = await supabase
                .from('transports')
                .select('*')

            if (!tError && transportData) {
                const eventMap = {}
                transportData.forEach(item => {
                    eventMap[item.date_key] = item
                })
                setEvents(eventMap)
            } else {
                const storedEvents = localStorage.getItem('transport_events')
                if (storedEvents) setEvents(JSON.parse(storedEvents))
            }

            const { data: destData, error: dError } = await supabase
                .from('destinations')
                .select('*')

            if (!dError && destData && destData.length > 0) {
                setDestinations(destData)
            } else {
                const storedDestinations = localStorage.getItem('transport_destinations')
                if (storedDestinations) {
                    const parsed = JSON.parse(storedDestinations)
                    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                        setDestinations(parsed.map(d => ({ name: d, color: '#3b82f6' })))
                    } else {
                        setDestinations(parsed)
                    }
                }
            }
        }

        fetchData()
    }, [])

    const syncLocalToCloud = async () => {
        if (!window.confirm("Voulez-vous envoyer vos transports locaux vers le Cloud ? Cela les rendra visibles sur votre téléphone.")) return

        setIsSyncing(true)
        try {
            const storedEvents = JSON.parse(localStorage.getItem('transport_events') || '{}')
            const entries = Object.entries(storedEvents)

            for (const [dateKey, data] of entries) {
                await supabase.from('transports').upsert({
                    date_key: dateKey,
                    title: data.title,
                    school_class: data.schoolClass,
                    color: data.color,
                    status: data.status || 'pending',
                    time_departure_origin: data.time_departure_origin,
                    time_departure_destination: data.time_departure_destination
                })
            }

            // Refresh local state after sync
            const { data } = await supabase.from('transports').select('*')
            if (data) {
                const map = {}
                data.forEach(e => map[e.date_key] = e)
                setEvents(map)
            }

            alert("Synchronisation terminée ! Vos données sont maintenant sur le Cloud.")
        } catch (error) {
            console.error(error)
            alert("Erreur lors de la synchronisation.")
        } finally {
            setIsSyncing(false)
        }
    }

    const saveEvents = async (newEvents, updatedKey, updatedData) => {
        setEvents(newEvents)
        localStorage.setItem('transport_events', JSON.stringify(newEvents))

        // SMS Notification Logic
        try {
            const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
            const chauffeurs = allUsers.filter(u =>
                (u.role === 'CHAUFFEUR' || u.role === 'chauffeur') &&
                u.phone &&
                u.phone.trim() !== ''
            )

            if (chauffeurs.length > 0 && updatedKey) {
                const recipientPhones = chauffeurs.map(u => u.phone)
                let message = ''

                if (!updatedData) {
                    // Deletion
                    message = `Info Transport: Le transport du ${updatedKey} a été ANNULÉ par l'administrateur.`
                } else {
                    // Creation or Update
                    const isNew = !events[updatedKey]
                    const action = isNew ? 'NOUVEAU transport' : 'MODIFICATION transport'
                    message = `Info Transport: ${action} le ${updatedKey}. ${updatedData.title} (${updatedData.schoolClass || 'N/A'})\nDépart: ${updatedData.time_departure_origin || '?'}`
                }

                if (message) {
                    await smsService.sendSMS(recipientPhones, message)
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi du SMS aux chauffeurs:", error)
        }

        if (updatedKey) {
            if (!updatedData) {
                await supabase.from('transports').delete().eq('date_key', updatedKey)
            } else {
                await supabase.from('transports').upsert({
                    date_key: updatedKey,
                    title: updatedData.title,
                    school_class: updatedData.schoolClass,
                    color: updatedData.color,
                    status: updatedData.status || 'pending',
                    time_departure_origin: updatedData.time_departure_origin,
                    time_departure_destination: updatedData.time_departure_destination
                })
            }
        }
    }

    const saveDestinations = async (newDestinations) => {
        setDestinations(newDestinations)
        localStorage.setItem('transport_destinations', JSON.stringify(newDestinations))
        await supabase.from('destinations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('destinations').insert(newDestinations.map(d => ({
            name: d.name,
            color: d.color
        })))
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

    const handleSaveEvent = async (eventData) => {
        try {
            if (!selectedDateKey) return

            if (!eventData) {
                // Deletion
                const newEv = { ...events }
                if (newEv[selectedDateKey]) {
                    delete newEv[selectedDateKey]
                    await saveEvents(newEv, selectedDateKey, null)
                }
            } else {
                // Update / Create
                const updatedData = { ...eventData, type: 'available', status: eventData.status || 'pending' }
                saveEvents({
                    ...events,
                    [selectedDateKey]: updatedData
                }, selectedDateKey, updatedData)
            }
        } catch (error) {
            console.error("Erreur lors de la sauvegarde/suppression:", error)
            alert("Une erreur est survenue lors de l'opération.")
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
            <div className="admin-header no-print">
                <div className="flex gap-2">
                    <button onClick={() => changeYear(-1)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => changeYear(1)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                        <ChevronRight size={24} />
                    </button>
                </div>

                <h3 className="admin-title" style={{ fontSize: '2rem', marginBottom: 0 }}>
                    {currentYear}
                </h3>

                <div className="admin-header-actions">
                    <button
                        onClick={syncLocalToCloud}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0891b2', borderColor: '#0891b2' }}
                        disabled={isSyncing}
                    >
                        {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                        {isSyncing ? "Envoi..." : "Envoyer vers Cloud"}
                    </button>
                    <button onClick={() => setIsDestManagerOpen(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18} /> Gérer les lieux
                    </button>
                    <button onClick={() => window.print()} className="btn btn-primary">
                        Imprimer l'année
                    </button>
                </div>
            </div>

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
                        index === self.findIndex((t) => (t.name === dest.name))
                    )
                    .map((dest, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: dest.color, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontWeight: '500', color: '#334155' }}>
                                {dest.name}
                                {dest.defaultClass && <span style={{ color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>({dest.defaultClass})</span>}
                            </span>
                        </div>
                    ))}
            </div>

            <div className="calendar-semester-grid">
                {monthNames.slice(0, 6).map((monthName, monthIndex) => {
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1

                    return (
                        <div key={monthName} className="print-compact-month" style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--primary)' }}>{monthName}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
                                    <div key={index} style={{ textAlign: 'center' }}>{d}</div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px' }}>
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
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                borderRadius: '0.25rem',
                                                backgroundColor: hasEvent ? hasEvent.color || 'var(--primary)' : 'transparent',
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: hasEvent?.status === 'validated' ? '3px solid #16a34a' :
                                                    hasEvent?.status === 'rejected' ? '3px solid #dc2626' : '1px solid #f1f5f9',
                                                position: 'relative',
                                                boxShadow: hasEvent?.status === 'pending' ? '0 0 0 2px #eab308' : 'none'
                                            }}
                                            title={hasEvent ? `${hasEvent.title} (${hasEvent.schoolClass || ''})` : ''}
                                        >
                                            {day}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="calendar-semester-grid" style={{ marginTop: '1.5rem' }}>
                {monthNames.slice(6, 12).map((monthName, i) => {
                    const monthIndex = i + 6
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1
                    return (
                        <div key={monthName} className="print-compact-month" style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--primary)' }}>{monthName}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, index) => (
                                    <div key={index} style={{ textAlign: 'center' }}>{d}</div>
                                ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px' }}>
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
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                borderRadius: '0.25rem',
                                                backgroundColor: hasEvent ? hasEvent.color || 'var(--primary)' : 'transparent',
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: hasEvent?.status === 'validated' ? '3px solid #16a34a' :
                                                    hasEvent?.status === 'rejected' ? '3px solid #dc2626' : '1px solid #f1f5f9',
                                                position: 'relative',
                                                boxShadow: hasEvent?.status === 'pending' ? '0 0 0 2px #eab308' : 'none'
                                            }}
                                            title={hasEvent ? `${hasEvent.title} (${hasEvent.schoolClass || ''})` : ''}
                                        >
                                            {day}
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
