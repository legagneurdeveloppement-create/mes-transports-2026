import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Shield, User, Trash2, ArrowLeft } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    })
    const [error, setError] = useState('')

    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('all_users') || '[]')
        setUsers(storedUsers)
    }, [])

    const saveUsers = (updatedUsers) => {
        setUsers(updatedUsers)
        localStorage.setItem('all_users', JSON.stringify(updatedUsers))
    }

    const handleApprove = (email) => {
        const updated = users.map(u => u.email === email ? { ...u, approved: true } : u)
        saveUsers(updated)
    }

    const handleDelete = (email) => {
        if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
            const updated = users.filter(u => u.email !== email)
            saveUsers(updated)
        }
    }

    const handleChangeRole = (email, newRole) => {
        const updated = users.map(u => u.email === email ? { ...u, role: newRole } : u)
        saveUsers(updated)
    }

    const handleAddUser = (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (users.find(u => u.email === newUser.email)) {
            setError('Cet email est déjà utilisé')
            return
        }

        const userToAdd = {
            ...newUser,
            approved: true // Auto-approve users created by Super Admin
        }

        const updated = [...users, userToAdd]
        saveUsers(updated)
        setNewUser({ name: '', email: '', password: '', role: 'USER' })
        setShowAddForm(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
            <div className="container">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <Link to="/dashboard" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                            <ArrowLeft size={18} /> Retour au Dashboard
                        </Link>
                        <h1 className="admin-title">Gestion des Utilisateurs</h1>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <User size={18} /> {showAddForm ? 'Annuler' : 'Ajouter un utilisateur'}
                    </button>
                </div>

                {showAddForm && (
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Nouvel Utilisateur</h3>
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                borderRadius: '0.375rem',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleAddUser} className="admin-form">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Nom complet</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Mot de passe</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Rôle</label>
                                <select
                                    className="input"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="USER">Utilisateur</option>
                                    <option value="ADMIN">Administrateur</option>
                                    <option value="SUPER_ADMIN">Super Administrateur</option>
                                </select>
                            </div>
                            <div className="admin-form-actions">
                                <button type="submit" className="btn btn-primary">
                                    Créer l'utilisateur
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="table-container">
                    <table className="responsive-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.email}>
                                    <td data-label="Utilisateur">
                                        <div style={{ fontWeight: '600' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{u.email}</div>
                                    </td>
                                    <td data-label="Rôle">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleChangeRole(u.email, e.target.value)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '0.875rem',
                                                background: 'white',
                                                width: '100%' // Full width on mobile
                                            }}
                                            disabled={u.role === 'SUPER_ADMIN'}
                                        >
                                            <option value="USER">Utilisateur</option>
                                            <option value="ADMIN">Administrateur</option>
                                            {u.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                                        </select>
                                    </td>
                                    <td data-label="Statut">
                                        {u.approved ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                color: '#16a34a',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                background: '#f0fdf4',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem'
                                            }}>
                                                <Check size={14} /> Approuvé
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                color: '#ca8a04',
                                                fontSize: '0.875rem',
                                                fontWeight: '500',
                                                background: '#fefce8',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem'
                                            }}>
                                                En attente
                                            </span>
                                        )}
                                    </td>
                                    <td data-label="Actions">
                                        <div className="table-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            {!u.approved && (
                                                <button
                                                    onClick={() => handleApprove(u.email)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                                                >
                                                    Approuver
                                                </button>
                                            )}
                                            {u.role !== 'SUPER_ADMIN' && (
                                                <button
                                                    onClick={() => handleDelete(u.email)}
                                                    className="btn btn-outline"
                                                    style={{
                                                        padding: '0.4rem',
                                                        color: '#dc2626',
                                                        borderColor: '#fee2e2',
                                                        background: '#fff5f5'
                                                    }}
                                                >
                                                    <Trash2 size={18} />
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
