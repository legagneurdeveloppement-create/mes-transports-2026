import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Settings, CloudUpload, RefreshCw, Trash2 } from 'lucide-react'
import EventModal from './EventModal'
import DestinationManagerModal from './DestinationManagerModal'
import { supabase } from '../../lib/supabase'
import { smsService } from '../../lib/smsService'

export default function AdminCalendar() {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [events, setEvents] = useState({})

    // Destinations state
    const [destinations, setDestinations] = useState([])
    const [fetchError, setFetchError] = useState(null)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDestManagerOpen, setIsDestManagerOpen] = useState(false)
    const [selectedDateKey, setSelectedDateKey] = useState(null)
    const [selectedDates, setSelectedDates] = useState([])
    const [isSelectionMode, setIsSelectionMode] = useState(false) // Explicit selection mode
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
            if (transportData && transportData.length > 0) {
                const eventMap = {}
                transportData.forEach(item => {
                    if (item && item.date_key) {
                        eventMap[item.date_key] = {
                            ...item,
                            schoolClass: item.schoolClass || item.school_class
                        }
                    }
                })
                setEvents(eventMap)
            } else {
                setEvents({})
            }

            const { data: destData, error: dError } = await supabase
                .from('destinations')
                .select('*')

            if (dError) {
                console.error('Error fetching destinations:', dError)
                setFetchError(prev => prev ? prev + ' & lieux' : 'Erreur chargement lieux')
            }

            if (destData && destData.length > 0) {
                setDestinations(destData.filter(Boolean))
            } else {
                setDestinations([])
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
        const dedupedList = [];
        const seen = new Set();

        // Fonction utile pour dédoublonner
        const addUnique = (item) => {
            if (!item) return;
            const name = (typeof item === 'string' ? item : item.name || '').trim();
            const lowerName = name.toLowerCase();
            if (lowerName && !seen.has(lowerName)) {
                seen.add(lowerName);
                dedupedList.push(typeof item === 'string' ? { name, color: '#3b82f6' } : {
                    ...item,
                    name,
                    color: item.color || '#3b82f6',
                    defaultClass: item.defaultClass || item.default_class || ''
                });
            }
        };

        // 1. Destinations officielles (Cloud/Local state)
        if (Array.isArray(destinations)) {
            destinations.forEach(addUnique);
        }

        // 2. Détection automatique (Events)
        if (events && typeof events === 'object') {
            Object.values(events).forEach(addUnique);
        }

        return dedupedList;
    }, [destinations, events]);



    const saveEvents = async (newEvents, updatedKeys, updatedData) => {
        setEvents(newEvents)

        const keys = Array.isArray(updatedKeys) ? updatedKeys : (updatedKeys ? [updatedKeys] : [])

        // Notification Logic (Push + SMS Simulé)
        try {
            const { data: chauffeurs } = await supabase
                .from('profiles')
                .select('phone')
                .or('role.eq.CHAUFFEUR,role.eq.chauffeur')
                .not('phone', 'is', null)
                .neq('phone', '')

            if (chauffeurs && chauffeurs.length > 0 && keys.length > 0) {
                const recipientPhones = chauffeurs.map(u => u.phone)
                let message = ''

                if (!updatedData) {
                    // Deletion
                    message = `Mes Transports: Les transports des dates suivantes ont été ANNULÉS: ${keys.map(k => {
                        const [, m, d] = k.split('-');
                        return `${d}/${parseInt(m) + 1}`;
                    }).join(', ')}.`
                } else {
                    // Creation or Update
                    const actionLabel = keys.length > 1 ? 'de NOUVEAUX transports en attente' : 'un NOUVEAU transport en attente';
                    const datesStr = keys.map(k => {
                        const [, m, d] = k.split('-');
                        return `${d}/${parseInt(m) + 1}`;
                    }).join(', ');

                    message = `Mes Transports: Vous avez ${actionLabel} pour le ${datesStr}.\nLieu: ${updatedData.title}\nDépart prévu: ${updatedData.time_departure_origin || 'Non défini'}`;
                }

                if (message) {
                    // 1. Simuler l'envoi SMS
                    await smsService.sendSMS(recipientPhones, message)

                    // 2. Déclencher la notification Push en insérant dans public.notifications
                    try {
                        await supabase.from('notifications').insert([{
                            target_role: 'CHAUFFEUR',
                            message: message,
                            type: updatedData ? 'info' : 'warning',
                            related_transport_date: keys[0],
                            meta: { action: updatedData ? 'created' : 'deleted' }
                        }])
                        console.log('Notification Push enregistrée avec succès.')
                    } catch (pushErr) {
                        console.error('Erreur lors de la création de la notification Push:', pushErr)
                    }
                }
            }
        } catch (error) {
            console.error("Erreur lors de la création des notifications:", error)
        }

        if (keys.length > 0) {
            for (const key of keys) {
                if (!updatedData) {
                    await supabase.from('transports').delete().eq('date_key', key)
                } else {
                    await supabase.from('transports').upsert({
                        date_key: key,
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
    }

    const saveDestinations = async (newDestinations) => {
        setDestinations(newDestinations)
        await supabase.from('destinations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('destinations').insert(newDestinations.map(d => ({
            name: d.name,
            color: d.color
            // Removed default_class as it doesn't exist in DB schema
        })))
    }

    const handleDeleteDestination = async (destToDelete) => {
        const nameToDelete = typeof destToDelete === 'string' ? destToDelete : destToDelete.name
        const classToDelete = (typeof destToDelete === 'string' ? '' : (destToDelete.defaultClass || destToDelete.default_class || '')).trim().toLowerCase()

        // 1. Update Destinations List
        const updatedDests = effectiveDestinations.filter(d => {
            const dName = (typeof d === 'string' ? d : d.name).trim().toLowerCase()
            const dClass = (typeof d === 'string' ? '' : (d.defaultClass || d.default_class || '')).trim().toLowerCase()
            return !(dName === nameToDelete.trim().toLowerCase() && dClass === classToDelete)
        })

        // 2. Clear associated events in local state
        const newEvents = { ...events }
        let deletedEventsCount = 0
        Object.keys(newEvents).forEach(key => {
            const ev = newEvents[key]
            const evName = (ev.title || '').trim().toLowerCase()
            const evClass = (ev.schoolClass || ev.school_class || '').trim().toLowerCase()
            if (evName === nameToDelete.trim().toLowerCase() && (evClass === classToDelete || classToDelete === '')) {
                delete newEvents[key]
                deletedEventsCount++
            }
        })

        // 3. Update state
        setEvents(newEvents)
        setDestinations(updatedDests)

        // 4. Sync with Cloud (Cascade Delete)
        try {
            // Delete destination from DB
            await supabase.from('destinations').delete().eq('name', nameToDelete)

            // Delete associated transports from DB
            if (deletedEventsCount > 0) {
                await supabase.from('transports')
                    .delete()
                    .eq('title', nameToDelete)
                // We don't filter by class here to be thorough, but we could if needed
            }

            alert(`Lieu "${nameToDelete}" supprimé avec succès${deletedEventsCount > 0 ? ` (+ ${deletedEventsCount} transports)` : ''}.`)
        } catch (error) {
            console.error('Error during cascade delete:', error)
            alert("Erreur lors de la suppression sur le serveur.")
        }
    }

    const changeYear = (delta) => {
        setCurrentYear(currentYear + delta)
    }

    const handleDeleteMonth = async (monthIndex) => {
        const monthName = monthNames[monthIndex]
        if (!window.confirm(`Voulez-vous vraiment supprimer TOUS les transports de ${monthName} ${currentYear} ?`)) return

        const prefix = `${currentYear}-${monthIndex}-`
        const keysToDelete = Object.keys(events).filter(key => key.startsWith(prefix))

        if (keysToDelete.length === 0) {
            alert(`Aucun transport trouvé en ${monthName}.`)
            return
        }

        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('transports')
                .delete()
                .in('date_key', keysToDelete)

            if (error) throw error

            // Update local state
            const newEvents = { ...events }
            keysToDelete.forEach(key => delete newEvents[key])
            setEvents(newEvents)

            alert(`${keysToDelete.length} transport(s) supprimé(s) pour le mois de ${monthName}.`)
        } catch (err) {
            console.error('Error deleting month:', err)
            alert('Erreur lors de la suppression du mois.')
        }
    }

    const handleDayClick = (year, month, day, e) => {
        const dateKey = `${year}-${month}-${day}`

        // If selection mode is active OR if user holds Ctrl/Meta
        if (isSelectionMode || (e && (e.ctrlKey || e.metaKey))) {
            // Toggle selection
            setSelectedDates(prev =>
                prev.includes(dateKey)
                    ? prev.filter(k => k !== dateKey)
                    : [...prev, dateKey]
            )
        } else {
            // Standard behavior: Single selection -> Open Modal
            // But if we have selected dates and user clicks a new one without Ctrl/Mode, 
            // should we reset selection? Yes, standard behavior usually implies reset selection on new click.
            setSelectedDateKey(dateKey)
            setSelectedDates([dateKey]) // Reset multi-selection to single focus
            setSelectedEventData(events[dateKey] || null)
            setIsModalOpen(true)
        }
    }

    const handleSaveEvent = async (eventData) => {
        try {
            if (selectedDates.length === 0) return

            if (!eventData) {
                // Deletion
                const newEv = { ...events }
                let deletedCount = 0
                selectedDates.forEach(key => {
                    if (newEv[key]) {
                        delete newEv[key]
                        deletedCount++
                    }
                })
                if (deletedCount > 0) {
                    await saveEvents(newEv, selectedDates, null)
                }
            } else {
                // Update / Create
                const newEv = { ...events }
                selectedDates.forEach(key => {
                    const existing = newEv[key] || {}
                    newEv[key] = {
                        ...existing,
                        ...eventData,
                        type: 'available',
                        status: eventData.status || existing.status || 'pending'
                    }
                })
                await saveEvents(newEv, selectedDates, eventData)
            }
            setSelectedDates([])
            setSelectedDateKey(null)
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
            {/* Print-only title */}
            <h1 className="print-only-title">{currentYear}</h1>

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
                    {/* Selection Mode Toggle */}
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode)
                            if (isSelectionMode) {
                                // Optional: Clear selection when turning off? 
                                // Better UX: Keep selection but allow normal clicking again.
                            }
                        }}
                        className={`btn ${isSelectionMode ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: isSelectionMode ? '#8b5cf6' : 'transparent',
                            borderColor: '#8b5cf6',
                            color: isSelectionMode ? 'white' : '#8b5cf6'
                        }}
                        title="Activer pour sélectionner plusieurs dates sans ouvrir le formulaire"
                    >
                        {isSelectionMode ? 'Mode Sélection ACTIF' : 'Sélection Multiple'}
                    </button>

                    {selectedDates.length > 0 && (
                        <button
                            onClick={() => {
                                setSelectedEventData(null) // Reset event data for new entry
                                setIsModalOpen(true)
                            }}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: isSelectionMode ? '#8b5cf6' : 'var(--primary)',
                                animation: 'pulse 2s infinite'
                            }}
                        >
                            {selectedDates.length > 1 ? `Planifier ${selectedDates.length} dates` : 'Planifier'}
                        </button>
                    )}

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

            <div className="calendar-legend-container">
                {effectiveDestinations.length === 0 && (
                    <span style={{ color: '#64748b', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>
                        Aucun lieu défini (Détection automatique en cours...)
                    </span>
                )}
                {effectiveDestinations
                    .map((dest, idx) => (
                        <div key={idx} className="legend-item">
                            <div className="legend-dot" style={{ backgroundColor: dest.color || '#3b82f6' }}></div>
                            <span className="legend-text">
                                {dest.name}
                                {(dest.defaultClass || dest.default_class) && <span className="legend-class">({dest.defaultClass || dest.default_class})</span>}
                            </span>
                        </div>
                    ))}
            </div>

            <div className="calendar-semester-grid">
                {(monthNames || []).map((monthName, monthIndex) => {
                    const { days, firstDay } = getDaysInMonth(currentYear, monthIndex)
                    const startOffset = Math.max(0, firstDay === 0 ? 6 : firstDay - 1)

                    return (
                        <div key={monthName} className="print-compact-month" style={{ maxWidth: '350px', margin: '0 auto', width: '100%', background: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div style={{ width: '24px' }}></div> {/* Spacer */}
                                <h4 style={{ textAlign: 'center', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>{monthName}</h4>
                                <button
                                    onClick={() => handleDeleteMonth(monthIndex)}
                                    className="no-print"
                                    title={`Supprimer tout le mois de ${monthName}`}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
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
                                            onClick={(e) => handleDayClick(currentYear, monthIndex, day, e)}
                                            style={{
                                                aspectRatio: '1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                borderRadius: '0.25rem',
                                                backgroundColor: hasEvent ? getEventColor(hasEvent) : (selectedDates.includes(dateKey) ? '#ddd6fe' : 'transparent'),
                                                color: hasEvent ? 'white' : 'inherit',
                                                border: selectedDates.includes(dateKey) ? '3px solid #8b5cf6' : (
                                                    isToday ? '3px solid #3b82f6' : (
                                                        hasEvent?.status === 'validated' ? '3px solid #16a34a' :
                                                            hasEvent?.status === 'rejected' ? '3px solid #dc2626' : 'none'
                                                    )
                                                ),
                                                position: 'relative',
                                                boxShadow: hasEvent?.status === 'pending' ? '0 0 0 2px #eab308' : 'none',
                                                transform: selectedDates.includes(dateKey) ? 'scale(0.95)' : 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            title={hasEvent ? `${hasEvent.title} (${hasEvent.schoolClass || ''})` : ''}
                                        >
                                            <span className="day-number">{day}</span>
                                            {hasEvent && <span className="print-day-label">{hasEvent.title}</span>}
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
                selectedDates={selectedDates}
                destinations={effectiveDestinations}
            />

            <DestinationManagerModal
                isOpen={isDestManagerOpen}
                onClose={() => setIsDestManagerOpen(false)}
                destinations={effectiveDestinations}
                onUpdate={saveDestinations}
                onDelete={handleDeleteDestination}
            />
        </div>
    )
}
