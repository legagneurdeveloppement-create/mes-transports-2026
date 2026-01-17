import { useState, useEffect } from 'react'
import { Check, X, Calendar as CalendarIcon, Clock, MapPin, History, Inbox, Ban, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ScheduleManagerModal from './ScheduleManagerModal'

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
            // Optimistic update
            updatedEvents[dateKey].status = newStatus
            setEvents(updatedEvents)
            filterTransports(updatedEvents, activeTab)

            // Save to Supabase
            const { error } = await supabase
                .from('transports')
                .update({ status: newStatus })
                .eq('date_key', dateKey)

            if (!error) {
                showToast(newStatus === 'validated' ? 'Transport validé avec succès' :
                    newStatus === 'pending' ? 'Transport rétabli' : 'Transport refusé')
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
            time_arrival_school: scheduleData.time_arrival_school
        }
        setEvents(updatedEvents)
        filterTransports(updatedEvents, activeTab)

        // Save to Supabase
        const { error } = await supabase
            .from('transports')
            .update({
                time_departure_school: scheduleData.time_departure_school,
                time_arrival_school: scheduleData.time_arrival_school
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

    const tabs = [
        { id: 'pending', label: 'En attente', icon: Inbox, color: '#eab308', count: Object.values(events).filter(e => e.status === 'pending' || !e.status).length },
        { id: 'validated', label: 'Validés', icon: Check, color: '#16a34a', count: Object.values(events).filter(e => e.status === 'validated').length },
        { id: 'rejected', label: 'Refusés', icon: Ban, color: '#dc2626', count: Object.values(events).filter(e => e.status === 'rejected').length }
    ]

    return (
        <div className="chauffeur-dashboard">
            <h2 className="dashboard-section-header">Gestion des Transports</h2>

            {/* Tabs */}
            <div className="tabs-container">
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
                <div className={`toast toast-${toast.type}`}>
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

                                    <div className="chauffeur-card-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                                        <div style={{ alignSelf: 'center' }}>
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
