import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Info, AlertTriangle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function NotificationCenter() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    const fetchNotifications = async () => {
        if (!user) return

        try {
            // Construit la requête : soit email correspond, soit rôle correspond
            // Note: Supabase JS ne permet pas facilement le "OR" entre colonnes sans syntaxe spécifique
            // On va simplifier en récupérant tout et filtrant (si volume faible) ou utiliser .or()

            // Filtre : (user_email = user.email) OR (target_role = user.role)
            // Syntaxe Supabase: .or(`user_email.eq.${user.email},target_role.eq.${user.role}`)

            let query = supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (user.role === 'SUPER_ADMIN') {
                // Super Admin voit tout ce qui est pour ADMIN ou SUPER_ADMIN
                query = query.or(`user_email.eq."${user.email}",target_role.eq.ADMIN,target_role.eq.SUPER_ADMIN`)
            } else {
                query = query.or(`user_email.eq."${user.email}",target_role.eq."${user.role}"`)
            }

            const { data, error } = await query

            if (error) {
                console.error('Erreur chargement notifications:', error)
                return
            }

            if (data) {
                // Dédupliquer les notifications par ID ET par contenu (pour nettoyer les vieux doublons en DB)
                const uniqueMap = new Map()
                data.forEach(notif => {
                    // Clé d'unicité basée sur ID ou le contenu (message + date)
                    const contentKey = `${notif.message}-${notif.related_transport_date}-${notif.type}`
                    if (!uniqueMap.has(notif.id) && !uniqueMap.has(contentKey)) {
                        uniqueMap.set(notif.id, notif)
                        uniqueMap.set(contentKey, notif)
                    }
                })

                const uniqueNotifications = Array.from(new Set(uniqueMap.values()))
                setNotifications(uniqueNotifications)
                setUnreadCount(uniqueNotifications.filter(n => !n.is_read).length)
            }
        } catch (e) {
            console.error('Exception chargement notifications:', e)
        }
    }

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)

        // Refresh when tab becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchNotifications()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            window.removeEventListener('resize', handleResize)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    useEffect(() => {
        if (!user) return

        fetchNotifications()

        // Realtime subscription
        const channel = supabase
            .channel(`notifs-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
                console.log('Realtime Notification update:', payload)
                if (payload.eventType === 'INSERT') {
                    const newNotif = payload.new
                    const isForMe = newNotif.user_email === user.email ||
                        newNotif.target_role === user.role ||
                        (user.role === 'SUPER_ADMIN' && newNotif.target_role === 'ADMIN')

                    if (isForMe) {
                        // 1. Déclencher une notification locale si autorisé
                        if (Notification.permission === 'granted' && ('serviceWorker' in navigator)) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.showNotification('Mes Transports', {
                                    body: newNotif.message,
                                    icon: '/notification-bus.svg',
                                    badge: '/notification-bus.svg',
                                    vibrate: [300, 100, 400, 100, 400, 100, 400],
                                    requireInteraction: true,
                                    silent: false,
                                    data: { url: '/dashboard' }
                                });
                            }).catch(err => console.error('Error showing notification from SW:', err));
                        }

                        setNotifications(prev => {
                            const contentKey = `${newNotif.message}-${newNotif.related_transport_date}-${newNotif.type}`
                            if (prev.some(n => n.id === newNotif.id || (`${n.message}-${n.related_transport_date}-${n.type}` === contentKey))) {
                                return prev
                            }
                            setUnreadCount(c => c + 1)
                            return [newNotif, ...prev]
                        })
                    }
                } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                    fetchNotifications()
                }
            })
            .subscribe((status) => {
                console.log(`Notification subscription status for ${user.id}:`, status)
            })

        // Polling fallback every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [user])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
    }

    const markAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length === 0) return

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <Check size={16} className="text-green-500" />
            case 'warning': return <AlertTriangle size={16} className="text-orange-500" />
            case 'error': return <X size={16} className="text-red-500" />
            default: return <Info size={16} className="text-blue-500" />
        }
    }

    if (!user) return null

    // Mobile specific styles
    const mobileStyles = isMobile ? {
        position: 'fixed',
        top: '60px',
        left: '10px',
        right: '10px',
        width: 'auto',
        maxWidth: 'none',
        transform: 'none'
    } : {
        position: 'absolute',
        top: '100%',
        right: '0',
        width: '320px',
        maxWidth: 'calc(100vw - 2rem)',
        marginTop: '0.5rem'
    }

    return (
        <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`btn-icon relative ${unreadCount > 0 ? 'notif-pulse' : ''}`}
                style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: unreadCount > 0 ? 'var(--primary)' : '#334155',
                    borderRadius: '50%',
                    display: 'flex',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                }}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-bounce-subtle' : ''} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        minWidth: '1.2em',
                        height: '1.2em',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        border: '2px solid white'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    ...mobileStyles,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0',
                    zIndex: 1000
                }}>
                    <div style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        background: 'white'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        background: notif.is_read ? 'white' : '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    className="notification-item"
                                >
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                        <div style={{ marginTop: '2px' }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.4' }}>
                                                {notif.message}
                                            </p>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                {new Date(notif.created_at).toLocaleString('fr-FR', {
                                                    day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        {!notif.is_read && (
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
