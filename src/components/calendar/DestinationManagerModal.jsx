import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check, RotateCcw } from 'lucide-react'

export default function DestinationManagerModal({ isOpen, onClose, destinations, onUpdate }) {
    const [newDestination, setNewDestination] = useState('')
    const [newDefaultClass, setNewDefaultClass] = useState('')
    const [newColor, setNewColor] = useState('#3b82f6') // Default blue
    const [isCustomDestination, setIsCustomDestination] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(null)
    const [editingIndex, setEditingIndex] = useState(null)
    const [error, setError] = useState('')

    // Extract unique names from destinations list
    const uniqueExistingNames = Array.from(new Set(destinations.map(d => typeof d === 'string' ? d : d.name))).sort()


    const schoolClasses = [
        "MAT / CP", "CE / CM",
        "Petite Section", "Moyenne Section", "Grande Section",
        "CP", "CE1", "CE2", "CM1", "CM2",
        "6ème", "5ème", "4ème", "3ème",
        "Seconde", "Première", "Terminale"
    ]

    // Predefined colors (same as EventModal)
    const colors = [
        { name: 'Bleu', value: '#3b82f6' },
        { name: 'Vert', value: '#22c55e' },
        { name: 'Rouge', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Violet', value: '#a855f7' },
        { name: 'Rose', value: '#ec4899' },
        { name: 'Gris', value: '#64748b' },
    ]

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        const trimmedName = newDestination.trim()
        if (trimmedName) {
            // Check for duplicates (excluding the one we are editing)
            const exists = (destinations || []).some((d, idx) => {
                if (editingIndex !== null && idx === editingIndex) return false
                const dName = typeof d === 'string' ? d : d.name
                const dClass = typeof d === 'string' ? '' : (d.defaultClass || '')
                return dName.toLowerCase() === trimmedName.toLowerCase() && dClass === newDefaultClass
            })

            if (exists) {
                setError(`Ce lieu avec cette classe (${newDefaultClass || 'Sans classe'}) existe déjà.`)
                return
            }

            if (editingIndex !== null) {
                // Update existing
                const updatedDestinations = [...destinations]
                updatedDestinations[editingIndex] = {
                    ... (typeof destinations[editingIndex] === 'object' ? destinations[editingIndex] : {}),
                    name: trimmedName,
                    color: newColor,
                    defaultClass: newDefaultClass
                }
                onUpdate(updatedDestinations)
                setEditingIndex(null)
            } else {
                // Add new
                onUpdate([...destinations, { name: trimmedName, color: newColor, defaultClass: newDefaultClass }])
            }

            setNewDestination('')
            setNewDefaultClass('')
            setNewColor('#3b82f6')
            setIsCustomDestination(false)
            setError('')
        }
    }

    const startEditing = (index) => {
        const dest = destinations[index]
        setEditingIndex(index)
        setNewDestination(typeof dest === 'string' ? dest : dest.name)
        setNewDefaultClass(typeof dest === 'string' ? '' : (dest.defaultClass || ''))
        setNewColor(typeof dest === 'string' ? '#3b82f6' : (dest.color || '#3b82f6'))
        setIsCustomDestination(true) // Always use input when editing
        setError('')
    }

    const cancelEditing = () => {
        setEditingIndex(null)
        setNewDestination('')
        setNewDefaultClass('')
        setNewColor('#3b82f6')
        setIsCustomDestination(false)
        setError('')
    }

    const handleDelete = (destToRemove) => {
        const name = typeof destToRemove === 'string' ? destToRemove : destToRemove.name
        onUpdate(destinations.filter(d => (typeof d === 'string' ? d : d.name) !== name))
        setConfirmingDelete(null)
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        Gérer les lieux et couleurs
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Confirmation Overlay */}
                {confirmingDelete && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        zIndex: 10,
                        borderRadius: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <Trash2 size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Confirmer la suppression ?</h4>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                            Voulez-vous vraiment supprimer "<strong>{typeof confirmingDelete === 'string' ? confirmingDelete : confirmingDelete.name}</strong>" ?
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            width: '100%',
                            flexDirection: window.innerWidth < 400 ? 'column' : 'row'
                        }}>
                            <button
                                onClick={() => setConfirmingDelete(null)}
                                className="btn"
                                style={{ flex: 1, backgroundColor: '#f1f5f9', minHeight: '3rem' }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDelete(confirmingDelete)}
                                className="btn"
                                style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', minHeight: '3rem' }}
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {/* Logic to choose between Select (existing) and Input (new) */}
                            {(!isCustomDestination && uniqueExistingNames.length > 0 && editingIndex === null) ? (
                                <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        value={uniqueExistingNames.includes(newDestination) ? newDestination : ''}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            if (val === 'NEW') {
                                                setIsCustomDestination(true)
                                                setNewDestination('')
                                            } else {
                                                setNewDestination(val)
                                                // Auto-set color from existing item if possible
                                                const existing = destinations.find(d => (typeof d === 'string' ? d : d.name) === val)
                                                if (existing) {
                                                    setNewColor(typeof existing === 'string' ? '#3b82f6' : existing.color)
                                                }
                                            }
                                        }}
                                        className="input"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                    >
                                        <option value="" disabled>Choisir un lieu existant...</option>
                                        {uniqueExistingNames.map((name, i) => (
                                            <option key={i} value={name}>{name}</option>
                                        ))}
                                        <option value="NEW">➕ Nouveau lieu...</option>
                                    </select>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={newDestination}
                                        onChange={(e) => {
                                            setNewDestination(e.target.value)
                                            if (error) setError('')
                                        }}
                                        placeholder="Nom du lieu (ex: Gymnase)..."
                                        className="input"
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                        autoFocus={isCustomDestination}
                                    />
                                    {uniqueExistingNames.length > 0 && editingIndex === null && (
                                        <button
                                            type="button"
                                            onClick={() => { setIsCustomDestination(false); setNewDestination('') }}
                                            style={{
                                                fontSize: '0.8rem',
                                                color: '#64748b',
                                                background: 'none',
                                                border: 'none',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Liste
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={newDefaultClass}
                                onChange={(e) => {
                                    setNewDefaultClass(e.target.value)
                                    if (error) setError('')
                                }}
                                className="input"
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.9rem' }}
                            >
                                <option value="">Classe par défaut (Optionnel)</option>
                                {schoolClasses.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingIndex !== null ? (
                                    <>
                                        <button
                                            type="submit"
                                            className="btn"
                                            style={{ backgroundColor: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                            <Check size={18} /> Enregistrer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="btn"
                                            style={{ backgroundColor: '#64748b', color: 'white' }}
                                            title="Annuler"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <button type="submit" className="btn btn-primary" disabled={!newDestination.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Plus size={18} /> Ajouter
                                    </button>
                                )}
                            </div>
                        </div>
                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '500' }}>
                                {error}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Couleur :</span>
                        {colors.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setNewColor(c.value)}
                                style={{
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    borderRadius: '50%',
                                    backgroundColor: c.value,
                                    border: newColor === c.value ? '2px solid black' : '2px solid transparent',
                                    cursor: 'pointer'
                                }}
                                title={c.name}
                            />
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>ou</span>
                            <input
                                type="color"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                style={{
                                    width: '2.5rem',
                                    height: '1.5rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer'
                                }}
                                title="Choisir une couleur personnalisée"
                            />
                            <input
                                type="text"
                                value={newColor}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val.startsWith('#')) {
                                        if (val.length <= 7) setNewColor(val)
                                    } else {
                                        if (val.length <= 6) setNewColor('#' + val)
                                    }
                                }}
                                style={{
                                    width: '5.5rem',
                                    padding: '0.2rem 0.5rem',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace',
                                    backgroundColor: 'white'
                                }}
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                </form>

                <div style={{ overflowY: 'auto', flex: 1, borderTop: '1px solid #e2e8f0' }}>
                    {destinations.length === 0 ? (
                        <p style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>Aucun lieu défini.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {destinations.map((dest, index) => {
                                const name = typeof dest === 'string' ? dest : dest.name
                                const color = typeof dest === 'string' ? '#3b82f6' : dest.color
                                // Use a stable unique key: name + index
                                const uniqueKey = `${name}-${index}`
                                return (
                                    <li key={uniqueKey} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem 0',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: color }} />
                                            <span>
                                                {name}
                                                {dest.defaultClass && <span style={{ fontSize: '0.8em', color: '#64748b', marginLeft: '0.5rem' }}>({dest.defaultClass})</span>}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => startEditing(index)}
                                                style={{ color: '#0891b2', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                                title="Modifier"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmingDelete(dest)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                    <button onClick={onClose} className="btn" style={{ background: '#f1f5f9' }}>Fermer</button>
                </div>
            </div>
        </div>
    )
}
