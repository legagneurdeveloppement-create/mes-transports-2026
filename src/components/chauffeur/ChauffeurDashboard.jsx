import { useState, useEffect } from 'react'
import { Check, X, Calendar as CalendarIcon, Clock, MapPin, History, Inbox, Ban, Settings, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ScheduleManagerModal from './ScheduleManagerModal'
import { smsService } from '../../lib/smsService'

export default function ChauffeurDashboard() {
    const [events, setEvents] = useState({})
    const [filteredTransports, setFilteredTransports] = useState([])
    const [activeTab, setActiveTab] = useState('pending')
    const [toast, setToast] = useState(null)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [selectedTransport, setSelectedTransport] = useState(null)

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
                const storedEvents = localStorage.getItem('transport_events')
                if (storedEvents) {
                    const parsed = JSON.parse(storedEvents)
                    setEvents(parsed)
                    filterTransports(parsed, activeTab)
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
    }, [activeTab])

    const filterTransports = (allEvents, tab) => {
        const list = Object.entries(allEvents)
            .map(([dateKey, data]) => ({
                dateKey,
                ...data
            }))
            .filter(t => {
                const status = t.status || 'pending'
                if (tab === 'pending') return status === 'pending'
                return status === tab
            })
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

        setFilteredTransports(list)
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleStatusUpdate = async (e, dateKey, newStatus) => {
        e.preventDefault()
        e.stopPropagation()

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
                    try {
                        const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
                        // Filter Admins and Super Admins
                        const admins = allUsers.filter(u =>
                            (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') &&
                            u.phone &&
                            u.phone.trim() !== ''
                        )

                        if (admins.length > 0) {
                            const recipientPhones = admins.map(u => u.phone)
                            const action = newStatus === 'validated' ? 'VALIDÉ ✅' : 'REFUSÉ ❌'
                            const dateStr = formatDate(dateKey)
                            const smsBody = `Info Transport:\nLe transport "${transport.title}" du ${dateStr} a été ${action} par le chauffeur.`

                            await smsService.sendSMS(recipientPhones, smsBody)
                            message += ' + Notif SMS envoyée'
                        }
                    } catch (smsError) {
                        console.error('Erreur envoi SMS:', smsError)
                    }
                }

                showToast(message)
            } else {
                showToast('Erreur lors de la mise à jour', 'error')
            }
        }
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
        updatedEvents[selectedTransport.dateKey] = {
            ...updatedEvents[selectedTransport.dateKey],
            time_departure_school: scheduleData.time_departure_school,
            time_arrival_school: scheduleData.time_arrival_school,
            stayed_on_site: scheduleData.stayed_on_site
        }
        setEvents(updatedEvents)
        filterTransports(updatedEvents, activeTab)

        // Save to Supabase
        const { error } = await supabase
            .from('transports')
            .update({
                time_departure_school: scheduleData.time_departure_school,
                time_arrival_school: scheduleData.time_arrival_school,
                stayed_on_site: scheduleData.stayed_on_site
            })
            .eq('date_key', selectedTransport.dateKey)

        if (!error) {
            showToast('Horaires enregistrés avec succès')
        } else {
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

    const calculateMonthlyHours = () => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        let totalAllerMinutes = 0
        let totalRetourMinutes = 0
        let transportCount = 0

        Object.entries(events).forEach(([dateKey, transport]) => {
            const [year, month] = dateKey.split('-').map(Number)
            if (year === currentYear && month === currentMonth) {
                // Calculate Aller duration
                try {
                    if (transport.time_departure_school) {
                        const allerSteps = typeof transport.time_departure_school === 'string'
                            ? JSON.parse(transport.time_departure_school)
                            : transport.time_departure_school

                        if (Array.isArray(allerSteps) && allerSteps.length >= 2) {
                            const validSteps = allerSteps.filter(s => s.time && s.time.trim())
                            if (validSteps.length >= 2) {
                                const firstTime = validSteps[0].time
                                const lastTime = validSteps[validSteps.length - 1].time
                                const [h1, m1] = firstTime.split(':').map(Number)
                                const [h2, m2] = lastTime.split(':').map(Number)
                                const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
                                if (minutes > 0) {
                                    totalAllerMinutes += minutes
                                    transportCount++
                                }
                            }
                        }
                    }

                    // Calculate Retour duration
                    if (transport.time_arrival_school) {
                        const retourSteps = typeof transport.time_arrival_school === 'string'
                            ? JSON.parse(transport.time_arrival_school)
                            : transport.time_arrival_school

                        if (Array.isArray(retourSteps) && retourSteps.length >= 2) {
                            const validSteps = retourSteps.filter(s => s.time && s.time.trim())
                            if (validSteps.length >= 2) {
                                const firstTime = validSteps[0].time
                                const lastTime = validSteps[validSteps.length - 1].time
                                const [h1, m1] = firstTime.split(':').map(Number)
                                const [h2, m2] = lastTime.split(':').map(Number)
                                const minutes = (h2 * 60 + m2) - (h1 * 60 + m1)
                                if (minutes > 0) totalRetourMinutes += minutes
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error calculating hours for transport:', dateKey, e)
                }
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

    const tabs = [
        { id: 'pending', label: 'En attente', icon: Inbox, color: '#eab308', count: Object.values(events).filter(e => e.status === 'pending' || !e.status).length },
        { id: 'validated', label: 'Validés', icon: Check, color: '#16a34a', count: Object.values(events).filter(e => e.status === 'validated').length },
        { id: 'rejected', label: 'Refusés', icon: Ban, color: '#dc2626', count: Object.values(events).filter(e => e.status === 'rejected').length }
    ]

    const monthlyStats = calculateMonthlyHours()
    const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const { Printer } = require('lucide-react'); // Need to ensure Printer is imported or used from existing import if available. 
    // Actually, I should add Printer to the import at the top, but I am editing the body here.
    // I will do a multi_replace to handle imports and the body correctly.

    // Wait, I should use multi_replace for this file since I need to touch imports and the body. 
    // I will cancel this tool call and use multi_replace.
    return (
        <div className="chauffeur-dashboard">
            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print, .dashboard-actions, .navbar, .dashboard-header, .tabs-container, .chauffeur-card-actions, .toast {
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

            {/* Monthly Hours Summary */}
            {monthlyStats.transportCount > 0 && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderRadius: '0.75rem',
                    border: '1px solid #0891b2',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📊</span>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)', margin: 0 }}>
                            Récapitulatif - {currentMonthName}
                        </h3>
                    </div>
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
                </div>
            )}

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
                {filteredTransports.length === 0 ? (
                    <div className="card empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                        <div className="empty-icon" style={{ opacity: 0.2, marginBottom: '1rem' }}>
                            {activeTab === 'pending' ? <Inbox size={64} /> : activeTab === 'validated' ? <Check size={64} /> : <Ban size={64} />}
                        </div>
                        <p>Aucun transport {activeTab === 'pending' ? 'en attente' : activeTab === 'validated' ? 'validé' : 'refusé'}.</p>
                    </div>
                ) : (
                    <div className="transports-list" style={{ display: 'grid', gap: '1rem' }}>
                        {filteredTransports.map((transport) => (
                            <div key={transport.dateKey} className="card transport-card" style={{ borderLeft: `4px solid ${tabs.find(t => t.id === (transport.status || 'pending')).color}` }}>
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
                                        </div>
                                    </div>

                                    <div className="chauffeur-card-actions no-print" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                        ))}
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
