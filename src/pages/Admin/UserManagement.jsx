import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Shield, Trash2, ArrowLeft, Pencil, Eye, EyeOff, Key } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function UserManagement() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({
        role: 'USER',
        full_name: '',
        direction: '',
        phone: '',
        managed_password: ''
    })
    const [showPasswords, setShowPasswords] = useState({}) // Toggle visibility per user
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [saving, setSaving] = useState(false)

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
            full_name: user.full_name || '',
            direction: user.direction || '',
            phone: user.phone || '',
            managed_password: user.managed_password || ''
        })
        setError('')
        // Auto-scroll to top where the edit form appears
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const togglePasswordVisibility = (userId) => {
        setShowPasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }))
    }

    const handleSaveEdit = async () => {
        if (!editingUser) return

        try {
            setSaving(true)
            setError('')
            setSuccessMsg('')

            console.log('DEBUG: Mise à jour du profil pour:', editingUser.email)

            // 1. Mise à jour du profil (Rôle, Direction, Note du mot de passe)
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({
                    role: formData.role,
                    full_name: formData.full_name,
                    direction: formData.direction,
                    phone: formData.phone,
                    managed_password: formData.managed_password
                })
                .eq('id', editingUser.id)

            if (updateError) throw updateError

            // 2. SYNCHRONISATION DU VRAI MOT DE PASSE (Auth)
            // On ne le fait que si le mot de passe a été modifié dans le champ
            if (formData.managed_password && formData.managed_password !== editingUser.managed_password) {
                console.log('DEBUG: Synchronisation du mot de passe Auth...')
                const { error: rpcError } = await supabase.rpc('admin_update_user_password', {
                    user_id: editingUser.id,
                    new_password: formData.managed_password
                })

                if (rpcError) {
                    console.error('DEBUG: Erreur RPC Password:', rpcError)
                    throw new Error("Le profil est mis à jour, mais le mot de passe de connexion n'a pas pu être changé. Vérifiez que vous avez bien exécuté le script SQL fourni.")
                }
                console.log('DEBUG: Mot de passe Auth synchronisé !')
            }

            // Mise à jour de l'état local
            setUsers(prevUsers => prevUsers.map(u =>
                u.id === editingUser.id
                    ? {
                        ...u,
                        role: formData.role,
                        full_name: formData.full_name,
                        direction: formData.direction,
                        phone: formData.phone,
                        managed_password: formData.managed_password
                    }
                    : u
            ))

            setSuccessMsg('Utilisateur et mot de passe mis à jour avec succès.')
            setTimeout(() => {
                setEditingUser(null)
                setSuccessMsg('')
            }, 1500)
        } catch (err) {
            console.error('Error updating user:', err)
            setError(err.message || 'Erreur lors de la sauvegarde.')
        } finally {
            setSaving(false)
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
                        <h1 className="admin-title">Gestion des Utilisateurs <span style={{ fontSize: '0.4em', background: 'var(--accent)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '1rem', verticalAlign: 'middle', marginLeft: '0.5rem' }}>v3.1.7</span></h1>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        ℹ️ Pour ajouter un nouvel utilisateur, demandez-lui de s'inscrire via la page d'inscription. Vous pourrez ensuite valider son compte ici.
                    </p>
                </div>

                {editingUser && (
                    <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--accent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', overflowWrap: 'anywhere' }}>
                                Modifier l'utilisateur
                                <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginTop: '0.25rem' }}>
                                    {editingUser.email}
                                </span>
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', flexShrink: 0 }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Nom Complet</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Prénom Nom"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
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
                                        placeholder="Ex: Nord, Sud..."
                                        value={formData.direction}
                                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Téléphone</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="06..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                    🔑 Mot de passe (Saisir pour modifier)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswords['edit'] ? 'text' : 'password'}
                                        className="input"
                                        placeholder="Nouveau mot de passe pour cet utilisateur"
                                        value={formData.managed_password}
                                        onChange={(e) => setFormData({ ...formData, managed_password: e.target.value })}
                                        style={{ paddingRight: '2.5rem', border: '1px solid var(--accent)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility('edit')}
                                        style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                        {showPasswords['edit'] ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    Note: Modifier ce champ changera le mot de passe réel de l'utilisateur.
                                </p>
                            </div>

                            <div className="admin-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', pt: '1rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={handleSaveEdit}
                                    className="btn btn-primary"
                                    disabled={saving}
                                    style={{ padding: '0.75rem 2rem' }}
                                >
                                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
                        ⚠️ {error}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '1rem', background: '#f0fdf4', color: '#16a34a', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                        ✅ {successMsg}
                    </div>
                )}

                <div className="table-container">
                    <table className="responsive-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Role</th>
                                <th>Direction</th>
                                <th>Mot de passe</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Aucun utilisateur trouvé.</td>
                                </tr>
                            ) : users.map(u => (
                                <tr key={u.id}>
                                    <td data-label="Utilisateur">
                                        <div style={{ fontWeight: '600' }}>{u.full_name || 'Sans nom'}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', overflowWrap: 'anywhere' }}>{u.email}</div>
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
                                    <td data-label="Mot de passe">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                fontFamily: u.managed_password && !showPasswords[u.id] ? 'password' : 'inherit',
                                                fontSize: u.managed_password && !showPasswords[u.id] ? '1.2rem' : '0.9rem',
                                                color: u.managed_password ? 'var(--text)' : '#cbd5e1'
                                            }}>
                                                {u.managed_password
                                                    ? (showPasswords[u.id] ? u.managed_password : '••••••••')
                                                    : 'Non défini'}
                                            </span>
                                            {u.managed_password && (
                                                <button
                                                    onClick={() => togglePasswordVisibility(u.id)}
                                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                                                    title={showPasswords[u.id] ? "Masquer" : "Afficher"}
                                                >
                                                    {showPasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            )}
                                        </div>
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
