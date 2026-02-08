import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Check, X, Calendar as CalendarIcon, Clock, MapPin, History, Inbox, Ban, Settings, Printer, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ScheduleManagerModal from './ScheduleManagerModal'
import { smsService } from '../../lib/smsService'
import { generateICS } from '../../lib/calendarService'

export default function ChauffeurDashboard() {
    const { user } = useAuth()
    const [events, setEvents] = useState({})
    const [filteredTransports, setFilteredTransports] = useState([])
    const [activeTab, setActiveTab] = useState('pending')
    const [toast, setToast] = useState(null)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [selectedTransport, setSelectedTransport] = useState(null)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [searchDate, setSearchDate] = useState('')
    const [isFilteredByMonth, setIsFilteredByMonth] = useState(true)

    useEffect(() => {
        const fetchTransports = async () => {
            const { data, error } = await supabase
                .from('transports')
                .select('*')

            if (!error && data) {
                const eventMap = {}
                data.forEach(item => {
                    eventMap[item.date_key] = item
                })
                setEvents(eventMap)
                filterTransports(eventMap, activeTab)
            } else {
                // Fallback to local storage if Supabase is blocked (RLS) or offline
                try {
                    const storedEvents = localStorage.getItem('transport_events')
                    if (storedEvents) {
                        const parsed = JSON.parse(storedEvents)
                        if (parsed && typeof parsed === 'object') {
                            setEvents(parsed)
                            filterTransports(parsed, activeTab)
                        } else {
                            setEvents({})
                        }
                    }
                } catch (err) {
                    console.error('Error loading events from localStorage:', err)
                    setEvents({})
                }
            }
        }

        fetchTransports()

        // Realtime subscription
        const channel = supabase
            .channel('transports-all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transports' }, (payload) => {
                fetchTransports() // Refresh on any change
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeTab, selectedMonth, selectedYear, searchDate, isFilteredByMonth])

    const filterTransports = (allEvents, tab) => {
        const list = Object.entries(allEvents || {})
            .map(([dateKey, data]) => ({
                dateKey,
                ...(data || {})
            }))
            .filter(t => {
                const status = t.status || 'pending'
                const tabMatch = tab === 'pending' ? status === 'pending' : status === tab

                if (!tabMatch) return false

                // Date filtering
                if (searchDate) {
                    const [y, m, d] = searchDate.split('-').map(Number)
                    const normalizedSearchDate = `${y}-${m - 1}-${d}`
                    return t.dateKey === normalizedSearchDate
                }

                if (isFilteredByMonth) {
                    const [year, month] = t.dateKey.split('-').map(Number)
                    return year === selectedYear && month === selectedMonth
                }

                return true
            })
            .sort((a, b) => {
                const [yA, mA, dA] = (a.dateKey || '').split('-').map(Number)
                const [yB, mB, dB] = (b.dateKey || '').split('-').map(Number)
                if (yA !== yB) return yA - yB
                if (mA !== mB) return mA - mB
                return dA - dB
            })

        setFilteredTransports(list)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const [isUpdating, setIsUpdating] = useState(false)

    const handleStatusUpdate = async (e, dateKey, newStatus) => {
        e.preventDefault()
        e.stopPropagation()

        if (isUpdating) return
        setIsUpdating(true)

        const updatedEvents = { ...events }
        if (updatedEvents[dateKey]) {
            const transport = updatedEvents[dateKey]

            // Optimistic update
            transport.status = newStatus
            setEvents(updatedEvents)
            filterTransports(updatedEvents, activeTab)

            // Save to Supabase
            const { error } = await supabase
                .from('transports')
                .update({ status: newStatus })
                .eq('date_key', dateKey)

            if (!error) {
                let message = newStatus === 'validated' ? 'Transport validé avec succès' :
                    newStatus === 'pending' ? 'Transport rétabli' : 'Transport refusé'

                // NOTIFICATION SMS AUX ADMINS
                if (newStatus === 'validated' || newStatus === 'rejected') {
                    const actionLabel = newStatus === 'validated' ? 'validé' : 'refusé';
                    const dateStr = formatDate(dateKey);
                    const chauffeurName = user?.name || 'Un chauffeur';

                    // 1. Notification Interne (Supabase)
                    try {
                        await supabase.from('notifications').insert([
                            {
                                target_role: 'ADMIN', // Cible ADMIN et SUPER_ADMIN (via UI)
                                message: `${chauffeurName} a ${actionLabel} le transport "${transport.title}" du ${dateStr}.`,
                                type: newStatus === 'validated' ? 'success' : 'warning',
                                related_transport_date: dateKey,
                                meta: { transport_title: transport.title, chauffeur_email: user?.email }
                            },
                            {
                                target_role: 'CHAUFFEUR', // Informe les autres chauffeurs
                                message: `${chauffeurName} a ${actionLabel} le transport "${transport.title}" du ${dateStr}.`,
                                type: 'info',
                                related_transport_date: dateKey,
                                meta: { transport_title: transport.title, chauffeur_email: user?.email }
                            }
                        ]);
                    } catch (notifError) {
                        console.error('Erreur création notification:', notifError);
                    }

                    // 2. SMS (Existant)
                    // 2. SMS (Existant)
                    try {
                        const { data: admins } = await supabase
                            .from('profiles')
                            .select('phone')
                            .in('role', ['ADMIN', 'SUPER_ADMIN'])
                            .not('phone', 'is', null)
                            .neq('phone', '')

                        if (admins && admins.length > 0) {
                            const recipientPhones = admins.map(u => u.phone)
                            const action = newStatus === 'validated' ? 'VALIDÉ ✅' : 'REFUSÉ ❌'
                            const smsMessage = `CHAUFFEUR: ${chauffeurName} a ${action} le transport "${transport.title}" du ${dateStr}.`;

                            for (const phone of recipientPhones) {
                                await smsService.sendSMS(phone, smsMessage);
                            }
                        }
                    } catch (smsError) {
                        console.error('Erreur envoi SMS:', smsError);
                    }
                }

                showToast(message)
            } else {
                console.error('Error updating status:', error)
                showToast('Erreur lors de la mise à jour', 'error')
                // Revert optimistic update?
            }
        }
        setIsUpdating(false)
    }
    const handleOpenScheduleModal = (e, transport) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedTransport(transport)
        setIsScheduleModalOpen(true)
    }

    const handleSaveSchedule = async (scheduleData) => {
        if (!selectedTransport) return

        const updatedEvents = { ...events }
        setIsScheduleModalOpen(false)

        // Update only the JSON columns that exist
        const { error } = await supabase
            .from('transports')
            .update({
                time_departure_school: scheduleData.time_departure_school,
                time_arrival_school: scheduleData.time_arrival_school
                // Note: stayed_on_site is stored in time_departure_school JSON, not as a separate column
            })
            .eq('date_key', selectedTransport.dateKey)

        if (!error) {
            showToast('Horaires enregistrés avec succès')
            // Refresh data to show updated schedule
            const { data } = await supabase.from('transports').select('*')
            if (data) {
                const eventMap = {}
                data.forEach(item => {
                    eventMap[item.date_key] = item
                })
                setEvents(eventMap)
                filterTransports(eventMap, activeTab)
            }
        } else {
            console.error('Error saving schedule:', error)
            showToast('Erreur lors de l\'enregistrement', 'error')
        }
    }

    const formatDate = (dateKey) => {
        const [year, month, day] = dateKey.split('-').map(Number)
        return new Date(year, month, day).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const getTransportDurations = (transport) => {
        let allerMinutes = 0
        let retourMinutes = 0

        if (!transport) return { allerMinutes, retourMinutes, totalMinutes: 0 }

        // Calculate Aller duration
        try {
            if (transport.time_departure_school) {
                let rawAller = []
                try {
                    rawAller = typeof transport.time_departure_school === 'string'
                        ? JSON.parse(transport.time_departure_school || '[]')
                        : transport.time_departure_school
                } catch (pe) {
                    rawAller = []
                }

                let allerSteps = []
                if (Array.isArray(rawAller)) {
                    allerSteps = rawAller
                } else if (rawAller && typeof rawAller === 'object') {
                    allerSteps = rawAller.steps || []
                }

                if (allerSteps.length >= 2) {
                    const validSteps = allerSteps.filter(s => s.time && s.time.trim())
                    if (validSteps.length >= 2) {
                        const firstTime = validSteps[0].time
                        const lastTime = validSteps[validSteps.length - 1].time
                        const [h1, m1] = firstTime.split(':').map(Number)
                        const [h2, m2] = lastTime.split(':').map(Number)
                        const mins = (h2 * 60 + m2) - (h1 * 60 + m1)
                        if (mins > 0) allerMinutes = mins
                    }
                }
            }

            // Calculate Retour duration
            if (transport.time_arrival_school) {
                let retourSteps = []
                try {
                    const parsed = typeof transport.time_arrival_school === 'string'
                        ? JSON.parse(transport.time_arrival_school || '[]')
                        : transport.time_arrival_school
                    retourSteps = Array.isArray(parsed) ? parsed : (parsed?.steps || [])
                } catch (pe) {
                    retourSteps = []
                }

                if (retourSteps.length >= 2) {
                    const validSteps = retourSteps.filter(s => s.time && s.time.trim())
                    if (validSteps.length >= 2) {
                        const firstTime = validSteps[0].time
                        const lastTime = validSteps[validSteps.length - 1].time
                        const [h1, m1] = firstTime.split(':').map(Number)
                        const [h2, m2] = lastTime.split(':').map(Number)
                        const mins = (h2 * 60 + m2) - (h1 * 60 + m1)
                        if (mins > 0) retourMinutes = mins
                    }
                }
            }
        } catch (e) {
            console.error('Error calculating durations for transport:', e)
        }

        return {
            allerMinutes,
            retourMinutes,
            totalMinutes: allerMinutes + retourMinutes,
            allerFormatted: `${Math.floor(allerMinutes / 60)}h${(allerMinutes % 60).toString().padStart(2, '0')}`,
            retourFormatted: `${Math.floor(retourMinutes / 60)}h${(retourMinutes % 60).toString().padStart(2, '0')}`,
            totalFormatted: `${Math.floor((allerMinutes + retourMinutes) / 60)}h${((allerMinutes + retourMinutes) % 60).toString().padStart(2, '0')}`
        }
    }

    const calculateMonthlyHours = () => {
        let totalAllerMinutes = 0
        let totalRetourMinutes = 0
        let transportCount = 0

        Object.entries(events || {}).forEach(([dateKey, transport]) => {
            if (!dateKey || !transport) return
            const parts = dateKey.split('-').map(Number)
            if (parts.length < 2) return
            const [year, month] = parts
            if (year === selectedYear && month === selectedMonth) {
                transportCount++
                const { allerMinutes, retourMinutes } = getTransportDurations(transport)
                totalAllerMinutes += allerMinutes
                totalRetourMinutes += retourMinutes
            }
        })

        const totalMinutes = totalAllerMinutes + totalRetourMinutes
        return {
            allerHours: Math.floor(totalAllerMinutes / 60),
            allerMinutes: totalAllerMinutes % 60,
            retourHours: Math.floor(totalRetourMinutes / 60),
            retourMinutes: totalRetourMinutes % 60,
            totalHours: Math.floor(totalMinutes / 60),
            totalMinutes: totalMinutes % 60,
            transportCount
        }
    }

    const eventsValues = Object.values(events || {})
    const tabs = [
        { id: 'pending', label: 'En attente', icon: Inbox, color: '#eab308', count: eventsValues.filter(e => e && (e.status === 'pending' || !e.status)).length },
        { id: 'validated', label: 'Validés', icon: Check, color: '#16a34a', count: eventsValues.filter(e => e && e.status === 'validated').length },
        { id: 'rejected', label: 'Refusés', icon: Ban, color: '#dc2626', count: eventsValues.filter(e => e && e.status === 'rejected').length }
    ]

    const monthlyStats = calculateMonthlyHours()
    const currentMonthLabel = new Date(selectedYear, selectedMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    const changeMonth = (offset) => {
        let newMonth = selectedMonth + offset
        let newYear = selectedYear
        if (newMonth < 0) {
            newMonth = 11
            newYear--
        } else if (newMonth > 11) {
            newMonth = 0
            newYear++
        }
        setSelectedMonth(newMonth)
        setSelectedYear(newYear)
    }
    return (
        <div className="chauffeur-dashboard">
            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print, .dashboard-actions, .navbar, .dashboard-header, .tabs-container, .chauffeur-card-actions, .toast, .tab-content, .filter-bar, .dashboard-section-header {
                        display: none !important;
                    }
                    .chauffeur-dashboard {
                        padding: 0 !important;
                        background: white !important;
                    }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                        break-inside: avoid;
                        margin-bottom: 1rem !important;
                    }
                    .transport-card {
                        border-left-width: 8px !important;
                        page-break-inside: avoid;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .dashboard-container {
                        padding: 0 !important;
                        max-width: none !important;
                        margin: 0 !important;
                    }
                }
                
                .summary-header {
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 1rem;
                }
                
                .summary-controls {
                    display: flex; 
                    gap: 0.25rem;
                }

                @media (max-width: 480px) {
                    .summary-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    .summary-controls {
                        width: 100%;
                        justify-content: center;
                    }
                }

                .filter-bar {
                    margin-top: 1rem;
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    align-items: center;
                    background: rgba(255,255,255,0.4);
                    padding: 0.85rem;
                    border-radius: 0.5rem;
                    border: 1px solid rgba(8, 145, 178, 0.2);
                }

                .filter-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1 1 auto;
                    min-width: 200px;
                }

                @media (max-width: 768px) {
                    .filter-bar {
                        margin-bottom: 1rem !important;
                        padding: 1rem !important;
                    }
                    .filter-item {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.5rem !important;
                    }
                    .filter-item input[type="date"] {
                        width: 100% !important;
                        min-height: 44px !important;
                    }
                    .filter-actions {
                        width: 100% !important;
                        justify-content: flex-start !important;
                    }
                }
                
                .filter-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
            `}</style>

            <div className="dashboard-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Gestion des Transports</span>
                <button
                    onClick={() => window.print()}
                    className="btn btn-outline no-print"
                    style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Printer size={18} /> Imprimer
                </button>
            </div>

            <div className="filter-bar" id="debug-filter-bar-unique" style={{ display: 'flex !important', visibility: 'visible !important', opacity: '1 !important' }}>
                <div className="filter-item">
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>📅 Sauter à une date :</label>
                    <input
                        type="date"
                        className="input"
                        value={searchDate}
                        onChange={(e) => {
                            setSearchDate(e.target.value)
                            if (e.target.value) {
                                setIsFilteredByMonth(false)
                                const d = new Date(e.target.value)
                                setSelectedMonth(d.getMonth())
                                setSelectedYear(d.getFullYear())
                            }
                        }}
                        style={{
                            padding: '0.4rem',
                            fontSize: '0.85rem',
                            border: '1px solid #0891b2',
                            borderRadius: '0.375rem',
                            width: 'auto'
                        }}
                    />
                </div>

                <div className="filter-actions">
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                        <input
                            type="checkbox"
                            checked={isFilteredByMonth}
                            onChange={(e) => {
                                setIsFilteredByMonth(e.target.checked)
                                if (e.target.checked) setSearchDate('')
                            }}
                            style={{ width: '16px', height: '16px' }}
                        />
                        Filtrer par mois
                    </label>

                    {(searchDate || !isFilteredByMonth) && (
                        <button
                            onClick={() => {
                                setSearchDate('')
                                setIsFilteredByMonth(true)
                                setSelectedMonth(new Date().getMonth())
                                setSelectedYear(new Date().getFullYear())
                            }}
                            className="btn btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', minWidth: 'auto', background: 'white' }}
                        >
                            Retirer les filtres
                        </button>
                    )}
                </div>
            </div>



            {/* Tabs */}
            <div className="tabs-container no-print">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        style={{ '--tab-color': tab.color, position: 'relative' }}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span style={{
                                marginLeft: '0.4rem',
                                background: tab.id === activeTab ? tab.color : '#cbd5e1',
                                color: 'white',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className={`toast toast-${toast.type} no-print`}>
                    {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    {toast.message}
                </div>
            )}

            <div className="tab-content">
                {/* Monthly Hours Summary - Only in Pending Tab */}
                {activeTab === 'pending' && (
                    <div className="monthly-summary-container" style={{
                        marginBottom: '1.5rem',
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '0.75rem',
                        border: '1px solid #0891b2',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div className="summary-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>📊</span>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)', margin: 0 }}>
                                    Récapitulatif - <span style={{ textTransform: 'capitalize' }}>{currentMonthLabel}</span>
                                </h3>
                            </div>
                            <div className="no-print summary-controls">
                                <button onClick={() => changeMonth(-1)} className="btn btn-outline" style={{ padding: '0.25rem', minWidth: 'auto' }}><ChevronLeft size={18} /></button>
                                <button onClick={() => { setSelectedMonth(new Date().getMonth()); setSelectedYear(new Date().getFullYear()) }} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto' }}>Aujourd'hui</button>
                                <button onClick={() => changeMonth(1)} className="btn btn-outline" style={{ padding: '0.25rem', minWidth: 'auto' }}><ChevronRight size={18} /></button>
                            </div>
                        </div>

                        {monthlyStats.transportCount > 0 ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                    <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600' }}>Aller</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0891b2' }}>
                                            {monthlyStats.allerHours}h{monthlyStats.allerMinutes.toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600' }}>Retour</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f97316' }}>
                                            {monthlyStats.retourHours}h{monthlyStats.retourMinutes.toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#0891b2', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'white', marginBottom: '0.25rem', fontWeight: '600', opacity: 0.9 }}>Total</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>
                                            {monthlyStats.totalHours}h{monthlyStats.totalMinutes.toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                    {monthlyStats.transportCount} transport{monthlyStats.transportCount > 1 ? 's' : ''} comptabilisé{monthlyStats.transportCount > 1 ? 's' : ''}
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.9rem', background: 'rgba(255,255,255,0.5)', borderRadius: '0.5rem', border: '1px dashed #0891b2' }}>
                                Aucune heure de travail saisie pour ce mois
                            </div>
                        )}
                    </div>
                )}
                {/* Notice for pending transports in other months */}
                {activeTab === 'pending' && isFilteredByMonth && filteredTransports.length === 0 && eventsValues.filter(e => e && (e.status === 'pending' || !e.status)).length > 0 && (
                    <div className="no-print" style={{
                        textAlign: 'center',
                        padding: '1.25rem',
                        background: '#fffbeb',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #f59e0b',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>ℹ️</div>
                        <p style={{ color: '#92400e', fontWeight: '600', marginBottom: '0.85rem', fontSize: '0.95rem' }}>
                            Vous avez {eventsValues.filter(e => e && (e.status === 'pending' || !e.status)).length} transport(s) en attente dans d'autres mois.
                        </p>
                        <button
                            onClick={() => {
                                setIsFilteredByMonth(false)
                                setSearchDate('')
                            }}
                            className="btn btn-primary"
                            style={{
                                fontSize: '0.9rem',
                                padding: '0.6rem 1.25rem',
                                background: '#f59e0b',
                                border: 'none'
                            }}
                        >
                            Voir tous les transports en attente
                        </button>
                    </div>
                )}

                {filteredTransports.length === 0 ? (
                    <div className="card empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                        <div className="empty-icon" style={{ opacity: 0.2, marginBottom: '1rem' }}>
                            {activeTab === 'pending' ? <Inbox size={64} /> : activeTab === 'validated' ? <Check size={64} /> : <Ban size={64} />}
                        </div>
                        <p>Aucun transport {activeTab === 'pending' ? 'en attente' : activeTab === 'validated' ? 'validé' : 'refusé'}.</p>
                    </div>
                ) : (
                    <div className="transports-list" style={{ display: 'grid', gap: '1rem' }}>
                        {filteredTransports.map((transport) => {
                            const transportStatus = transport.status || 'pending'
                            const currentTab = tabs.find(t => t.id === transportStatus) || tabs[0]

                            return (
                                <div key={transport.dateKey} className="card transport-card" style={{ borderLeft: `4px solid ${currentTab.color}` }}>
                                    <div className="transport-card-inner">
                                        <div className="transport-info">
                                            <div className="transport-title">
                                                <MapPin size={18} className="text-primary" />
                                                {transport.title}
                                            </div>
                                            <div className="transport-meta">
                                                <div className="meta-item">
                                                    <CalendarIcon size={14} />
                                                    {formatDate(transport.dateKey)}
                                                </div>
                                                {transport.schoolClass && (
                                                    <div className="meta-item">
                                                        <Clock size={14} />
                                                        {transport.schoolClass}
                                                    </div>
                                                )}
                                                {(() => {
                                                    const { allerFormatted, retourFormatted, totalFormatted, totalMinutes } = getTransportDurations(transport);
                                                    if (totalMinutes === 0) return null;
                                                    return (
                                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                                            <div className="meta-item" style={{ color: '#0891b2', fontWeight: '600' }}>
                                                                <Clock size={12} /> Aller: {allerFormatted}
                                                            </div>
                                                            <div className="meta-item" style={{ color: '#f97316', fontWeight: '600' }}>
                                                                <Clock size={12} /> Retour: {retourFormatted}
                                                            </div>
                                                            <div className="meta-item" style={{ color: 'var(--primary)', fontWeight: '700', borderLeft: '1px solid #cbd5e1', paddingLeft: '0.75rem' }}>
                                                                Σ Total: {totalFormatted}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="chauffeur-card-actions no-print" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => generateICS(transport)}
                                                className="btn btn-outline"
                                                title="Ajouter à mon calendrier (Rappels)"
                                                style={{ flex: '1 1 auto' }}
                                            >
                                                <CalendarPlus size={18} /> <span>Rappel</span>
                                            </button>
                                            <button
                                                onClick={(e) => handleOpenScheduleModal(e, transport)}
                                                className="btn btn-outline"
                                                style={{ flex: '1 1 auto', minWidth: '140px' }}
                                            >
                                                <Settings size={18} /> <span>Gérer horaires</span>
                                            </button>
                                            {activeTab === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(e, transport.dateKey, 'rejected')}
                                                        className="btn btn-action btn-reject"
                                                        style={{ flex: '1 1 auto' }}
                                                    >
                                                        <X size={18} /> <span>Refuser</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleStatusUpdate(e, transport.dateKey, 'validated')}
                                                        className="btn btn-action btn-validate"
                                                        style={{ flex: '1 1 auto' }}
                                                    >
                                                        <Check size={18} /> <span>Valider</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {activeTab !== 'pending' && (
                                            <div className="no-print" style={{ alignSelf: 'center' }}>
                                                <button
                                                    onClick={(e) => handleStatusUpdate(e, transport.dateKey, 'pending')}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                >
                                                    <History size={14} style={{ marginRight: '0.4rem' }} /> Rétablir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                        )}
                    </div>
                )}
            </div>

            <ScheduleManagerModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                transport={selectedTransport}
                onSave={handleSaveSchedule}
            />
        </div>
    )
}
