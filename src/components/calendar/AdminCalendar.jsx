import { useState, useEffect, useMemo } from 'react'
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
    const [destinations, setDestinations] = useState([])
    const [fetchError, setFetchError] = useState(null)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDestManagerOpen, setIsDestManagerOpen] = useState(false)
    const [selectedDateKey, setSelectedDateKey] = useState(null)
    const [selectedEventData, setSelectedEventData] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setFetchError(null)
            const { data: transportData, error: tError } = await supabase
                .from('transports')
                .select('*')

            if (tError) {
                console.error('Error fetching transports:', tError)
                setFetchError('Erreur chargement transports')
            }
            if (transportData) {
                const eventMap = {}
                transportData.forEach(item => {
                    if (item && item.date_key) {
                        // Normalize school_class to schoolClass for frontend consistency
                        eventMap[item.date_key] = {
                            ...item,
                            schoolClass: item.schoolClass || item.school_class
                        }
                    }
                })
                setEvents(eventMap)
            } else {
                try {
                    const storedEvents = localStorage.getItem('transport_events')
                    if (storedEvents) {
                        const parsed = JSON.parse(storedEvents)
                        setEvents(parsed && typeof parsed === 'object' ? parsed : {})
                    }
                } catch (e) {
                    console.error('Error loading events from local storage:', e)
                    setEvents({})
                }
            }

            const { data: destData, error: dError } = await supabase
                .from('destinations')
                .select('*')

            if (dError) {
                console.error('Error fetching destinations:', dError)
                setFetchError(prev => prev ? prev + ' & lieux' : 'Erreur chargement lieux')
            }
            if (destData && destData.length > 0) {
                // Map DB snake_case to app camelCase
                setDestinations(destData.map(d => ({
                    ...d,
                    defaultClass: d ? (d.default_class || d.defaultClass) : ''
                })).filter(Boolean))
            } else {
                try {
                    const storedDestinations = localStorage.getItem('transport_destinations')
                    if (storedDestinations) {
                        const parsed = JSON.parse(storedDestinations)
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            if (typeof parsed[0] === 'string') {
                                setDestinations(parsed.map(d => ({ name: d, color: '#3b82f6' })))
                            } else {
                                setDestinations(parsed.filter(Boolean))
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error loading destinations from local storage:', e)
                }
            }
        }

        fetchData()

        // Realtime Subscriptions
        const transportChannel = supabase
            .channel('admin-transports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transports' }, () => {
                fetchData()
            })
            .subscribe()

        const destinationChannel = supabase
            .channel('admin-destinations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, () => {
                fetchData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(transportChannel)
            supabase.removeChannel(destinationChannel)
        }
    }, [])

    // Standardized Source of Truth for Destinations (Cloud + Local + Auto-Detect)
    const effectiveDestinations = useMemo(() => {
        const list = [];
        const seen = new Set();

        // 1. Add explicitly defined destinations from Cloud or local state
        if (Array.isArray(destinations)) {
            destinations.forEach(d => {
                if (!d) return;
                const dName = (typeof d === 'string' ? d : (d.name || '')).trim().toLowerCase();
                const dClass = (typeof d === 'string' ? '' : (d.defaultClass || d.default_class || '')).trim().toLowerCase();
                const key = `${dName}|${dClass}`;
                if (dName && !seen.has(key)) {
                    seen.add(key);
                    list.push(typeof d === 'string' ? { name: d, color: '#3b82f6', defaultClass: '' } : d);
                }
            });
        }

        // 2. FORCE Auto-detect from ALL visible events (Fallback for mobile/no-sync cases)
        if (events && typeof events === 'object') {
            Object.values(events).forEach(e => {
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
        }
        return list;
    }, [destinations, events]);

    const syncLocalToCloud = async () => {
        if (!window.confirm("Voulez-vous envoyer vos transports locaux vers le Cloud ? Cela les rendra visibles sur votre téléphone.")) return

        setIsSyncing(true)
        try {
            const storedEvents = JSON.parse(localStorage.getItem('transport_events') || '{}')
            const entries = Object.entries(storedEvents)

            for (const [dateKey, data] of entries) {
                // Determine the "True" current color from destinations
                const calculatedColor = getEventColor(data)

                await supabase.from('transports').upsert({
                    date_key: dateKey,
                    title: data.title,
                    school_class: data.schoolClass || data.school_class,
                    color: calculatedColor,
                    status: data.status || 'pending',
                    time_departure_origin: data.time_departure_origin,
                    time_departure_destination: data.time_departure_destination,
                    time_departure_school: data.time_departure_school,
                    time_arrival_school: data.time_arrival_school,
                    stayed_on_site: data.stayed_on_site
                })
            }

            // 2. Destinations Sync (Enhanced Safety)
            const currentDests = destinations && destinations.length > 0 ? destinations : JSON.parse(localStorage.getItem('transport_destinations') || '[]')

            if (currentDests.length > 0) {
                // Use a more structured mapping to avoid bad data
                const destsToInsert = currentDests.map(d => {
                    const name = typeof d === 'string' ? d : (d.name || '')
                    const color = typeof d === 'string' ? '#3b82f6' : (d.color || '#3b82f6')
                    const defClass = typeof d === 'string' ? '' : (d.defaultClass || d.default_class || '')
                    return { name, color, default_class: defClass }
                }).filter(innerD => innerD.name.trim() !== '')

                if (destsToInsert.length > 0) {
                    console.log("Syncing destinations...", destsToInsert.length)
                    // Clear existing (except the placeholder ID if any)
                    const { error: delError } = await supabase.from('destinations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                    if (delError) throw new Error("Erreur lors du nettoyage des lieux : " + delError.message)

                    const { error: insError } = await supabase.from('destinations').insert(destsToInsert)
                    if (insError) throw new Error("Erreur lors de l'insertion des lieux : " + insError.message)
                }
            }

            // Refresh local state after sync
            const { data: newData } = await supabase.from('transports').select('*')
            if (newData) {
                const map = {}
                newData.forEach(e => map[e.date_key] = e)
                setEvents(map)
            }

            const { data: newDests } = await supabase.from('destinations').select('*')
            if (newDests) {
                setDestinations(newDests.map(d => ({
                    ...d,
                    defaultClass: d.default_class || d.defaultClass || ''
                })))
            }

            alert("Synchronisation terminée ! Vos données sont maintenant sur le Cloud.")
        } catch (error) {
            console.error('Fatal sync error:', error)
            alert("Erreur lors de la synchronisation : " + (error.message || error))
        } finally {
            setIsSyncing(false)
        }
    }

    const saveEvents = async (newEvents, updatedKey, updatedData) => {
        setEvents(newEvents)
        localStorage.setItem('transport_events', JSON.stringify(newEvents))

        // SMS Notification Logic
        try {
            const allUsersStr = localStorage.getItem('all_users') || '[]'
            let allUsers = []
            try {
                allUsers = JSON.parse(allUsersStr)
            } catch (e) {
                console.error('Error parsing all_users in saveEvents:', e)
            }

            const chauffeurs = (Array.isArray(allUsers) ? allUsers : []).filter(u =>
                u && (u.role === 'CHAUFFEUR' || u.role === 'chauffeur') &&
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
                    time_departure_destination: updatedData.time_departure_destination,
                    time_departure_school: updatedData.time_departure_school,
                    time_arrival_school: updatedData.time_arrival_school,
                    stayed_on_site: updatedData.stayed_on_site
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
            color: d.color,
            default_class: d.defaultClass
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
                const existing = events[selectedDateKey] || {}
                const updatedData = {
                    ...existing,
                    ...eventData,
                    type: 'available',
                    status: eventData.status || existing.status || 'pending'
                }
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
        try {
            const days = new Date(year, month + 1, 0).getDate()
            const firstDay = new Date(year, month, 1).getDay()
            return { days: days || 0, firstDay: firstDay ?? 0 }
        } catch (e) {
            console.error('Error calculating days in month:', e)
            return { days: 0, firstDay: 0 }
        }
    }

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

            {fetchError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.5rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
                    ⚠️ {fetchError}
                </div>
            )}

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
                {effectiveDestinations.length === 0 && (
                    <span style={{ color: '#64748b', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
                        Aucun lieu défini (Détection automatique en cours...)
                    </span>
                )}
                {effectiveDestinations
                    .filter((dest, index, self) =>
                        dest && index === self.findIndex((t) => (
                            t && t.name === dest.name && (t.defaultClass || t.default_class) === (dest.defaultClass || dest.default_class)
                        ))
                    )
                    .map((dest, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: dest.color || '#3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
                            <span style={{ fontWeight: '500', color: '#334155' }}>
                                {dest.name}
                                {dest.defaultClass && <span style={{ color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>({dest.defaultClass})</span>}
                            </span>
                        </div>
                    ))}
            </div>

            <div className="calendar-semester-grid">
                {(monthNames || []).slice(0, 6).map((monthName, monthIndex) => {
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = Math.max(0, firstDay === 0 ? 6 : firstDay - 1)

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
                                    const isToday = new Date().toDateString() === new Date(currentYear, monthIndex, day).toDateString()
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
                                                backgroundColor: hasEvent ? getEventColor(hasEvent) : 'transparent',
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: isToday ? '3px solid #ef4444' : (
                                                    hasEvent?.status === 'validated' ? '3px solid #16a34a' :
                                                        hasEvent?.status === 'rejected' ? '3px solid #dc2626' : 'none'
                                                ),
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
                {(monthNames || []).slice(6, 12).map((monthName, i) => {
                    const monthIndex = i + 6
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = Math.max(0, firstDay === 0 ? 6 : firstDay - 1)
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
                                    const isToday = new Date().toDateString() === new Date(currentYear, monthIndex, day).toDateString()
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
                                                backgroundColor: hasEvent ? getEventColor(hasEvent) : 'transparent',
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: isToday ? '3px solid #ef4444' : (
                                                    hasEvent?.status === 'validated' ? '3px solid #16a34a' :
                                                        hasEvent?.status === 'rejected' ? '3px solid #dc2626' : 'none'
                                                ),
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
