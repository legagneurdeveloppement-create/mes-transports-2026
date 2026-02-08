import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Shield, Trash2, ArrowLeft, Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function UserManagement() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({
        role: 'USER',
        direction: ''
    })
    const [error, setError] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('Impossible de charger les utilisateurs.')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ approved: !currentStatus })
                .eq('id', userId)

            if (error) throw error

            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, approved: !currentStatus } : u))
        } catch (err) {
            console.error('Error updating approval:', err)
            setError('Erreur lors de la mise à jour du statut.')
        }
    }

    const handleDelete = async (userId) => {
        if (window.confirm('Voulez-vous vraiment supprimer le profil de cet utilisateur ? (Le compte de connexion existera toujours mais sans accès)')) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', userId)

                if (error) throw error

                setUsers(users.filter(u => u.id !== userId))
            } catch (err) {
                console.error('Error deleting user:', err)
                setError('Erreur lors de la suppression.')
            }
        }
    }

    const handleEditUser = (user) => {
        setEditingUser(user)
        setFormData({
            role: user.role,
            direction: user.direction || ''
        })
        setError('')
    }

    const handleSaveEdit = async () => {
        if (!editingUser) return

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: formData.role,
                    direction: formData.direction
                })
                .eq('id', editingUser.id)

            if (error) throw error

            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u))
            setEditingUser(null)
        } catch (err) {
            console.error('Error updating user:', err)
            setError('Erreur lors de la sauvegarde.')
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
            <div className="container">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <Link to="/dashboard" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                            <ArrowLeft size={18} /> Retour au tableau de bord
                        </Link>
                        <h1 className="admin-title">Gestion des Utilisateurs <span style={{ fontSize: '0.4em', background: 'var(--accent)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', verticalAlign: 'middle', marginLeft: '0.5rem' }}>v3.0-sec</span></h1>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        ℹ️ Pour ajouter un nouvel utilisateur, demandez-lui de s'inscrire via la page d'inscription. Vous pourrez ensuite valider son compte ici.
                    </p>
                </div>

                {editingUser && (
                    <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                                Modifier {editingUser.email}
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="admin-form">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Rôle</label>
                                <select
                                    className="input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="CHAUFFEUR">Chauffeur</option>
                                    <option value="USER">Utilisateur</option>
                                    <option value="ADMIN">Administrateur</option>
                                    <option value="SUPER_ADMIN">Super Administrateur</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Direction</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.direction}
                                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                />
                            </div>
                            <div className="admin-form-actions">
                                <button onClick={handleSaveEdit} className="btn btn-primary">
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <div className="table-container">
                    <table className="responsive-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Role</th>
                                <th>Direction</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Aucun utilisateur trouvé.</td>
                                </tr>
                            ) : users.map(u => (
                                <tr key={u.id}>
                                    <td data-label="Utilisateur">
                                        <div style={{ fontWeight: '600' }}>{u.full_name || 'Sans nom'}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{u.email}</div>
                                        {u.phone && <div style={{ fontSize: '0.8rem', color: '#0891b2' }}>{u.phone}</div>}
                                    </td>
                                    <td data-label="Rôle">
                                        <span className={`role-badge role-${u.role?.toLowerCase()}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td data-label="Direction">
                                        {u.direction || '-'}
                                    </td>
                                    <td data-label="Statut">
                                        {u.approved ? (
                                            <span style={{ color: '#16a34a', background: '#f0fdf4', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                                                Approuvé
                                            </span>
                                        ) : (
                                            <span style={{ color: '#ca8a04', background: '#fefce8', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                                                En attente
                                            </span>
                                        )}
                                    </td>
                                    <td data-label="Actions">
                                        <div className="table-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="btn btn-outline"
                                                title="Modifier"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleApprove(u.id, u.approved)}
                                                className={`btn ${u.approved ? 'btn-outline' : 'btn-primary'}`}
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                title={u.approved ? "Désapprouver" : "Approuver"}
                                            >
                                                {u.approved ? <X size={16} /> : <Check size={16} />}
                                            </button>

                                            {u.role !== 'SUPER_ADMIN' && (
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="btn btn-outline"
                                                    style={{ color: '#dc2626', borderColor: '#fee2e2', background: '#fff5f5' }}
                                                    title="Supprimer le profil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
