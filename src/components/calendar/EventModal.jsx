import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function EventModal({ isOpen, onClose, onSave, eventData, selectedDate, destinations = [] }) {
    const [title, setTitle] = useState('')
    const [schoolClass, setSchoolClass] = useState('')
    const [color, setColor] = useState('#3b82f6') // Default blue
    const [isCustomTitle, setIsCustomTitle] = useState(false)
    const [isCustomClass, setIsCustomClass] = useState(false)

    // Fallback if no destinations provided
    const availableDestinations = destinations.length > 0 ? destinations : [
        { name: "Aéroport Charles de Gaulle", color: "#3b82f6" },
        { name: "Aéroport d'Orly", color: "#3b82f6" },
        { name: "Gare de Lyon", color: "#22c55e" },
        { name: "Paris Centre", color: "#a855f7" }
    ]

    const schoolClasses = [
        "MAT / CP", "CE / CM",
        "Petite Section", "Moyenne Section", "Grande Section",
        "CP", "CE1", "CE2", "CM1", "CM2",
        "6ème", "5ème", "4ème", "3ème",
        "Seconde", "Première", "Terminale"
    ]

    useEffect(() => {
        if (eventData) {
            setTitle(eventData.title || '')
            setSchoolClass(eventData.schoolClass || '')
            setColor(eventData.color || '#3b82f6')

            // Check if title exists in destinations
            const exists = availableDestinations.some(d => {
                const dName = typeof d === 'string' ? d : d.name
                return dName === eventData.title
            })
            setIsCustomTitle(!exists)

            // Check if class exists in list
            const classExists = schoolClasses.includes(eventData.schoolClass)
            setIsCustomClass(!!eventData.schoolClass && !classExists)
        } else {
            setTitle('')
            setSchoolClass('')
            setColor('#3b82f6')
            setIsCustomTitle(false)
            setIsCustomClass(false)
        }
    }, [eventData, isOpen, availableDestinations])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({ title, schoolClass, color })
        onClose()
    }

    const handleDelete = () => {
        if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
            onSave(null) // Signal to delete
            onClose()
        }
    }

    const handleDestinationChange = (e) => {
        const val = e.target.value
        if (val === 'Autre') {
            setIsCustomTitle(true)
            setTitle('')
        } else {
            setIsCustomTitle(false)
            setTitle(val)

            // Auto-set color if destination has one
            const destObj = availableDestinations.find(d => {
                const dName = typeof d === 'string' ? d : d.name
                return dName === val
            })

            if (destObj && typeof destObj !== 'string') {
                if (destObj.color) setColor(destObj.color)
                if (destObj.defaultClass) {
                    setSchoolClass(destObj.defaultClass)
                    setIsCustomClass(false)
                }
            }
        }
    }

    const handleClassChange = (e) => {
        const val = e.target.value
        if (val === 'Autre') {
            setIsCustomClass(true)
            setSchoolClass('')
        } else {
            setIsCustomClass(false)
            setSchoolClass(val)
        }
    }

    // Predefined colors
    const colors = [
        { name: 'Bleu', value: '#3b82f6' },
        { name: 'Vert', value: '#22c55e' },
        { name: 'Rouge', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Violet', value: '#a855f7' },
        { name: 'Rose', value: '#ec4899' },
        { name: 'Gris', value: '#64748b' },
    ]

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {eventData ? 'Modifier le transport' : 'Nouveau transport'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                    Date : {(() => {
                        if (!selectedDate) return ''
                        const [year, month, day] = selectedDate.split('-').map(Number)
                        return `${day.toString().padStart(2, '0')} - ${(month + 1).toString().padStart(2, '0')} - ${year}`
                    })()}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Destination Field */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Destination</label>
                        {!isCustomTitle ? (
                            <select
                                value={availableDestinations.some(d => (typeof d === 'string' ? d : d.name) === title) ? title : (title ? 'Autre' : '')}
                                onChange={handleDestinationChange}
                                className="input"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                                required
                            >
                                <option value="" disabled>Sélectionner une destination</option>
                                {availableDestinations.map((d, index) => {
                                    const name = typeof d === 'string' ? d : d.name
                                    return <option key={index} value={name}>{name}</option>
                                })}
                                <option value="Autre">Autre (Saisir manuellement)...</option>
                            </select>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="input"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                    placeholder="Saisir la destination..."
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => { setIsCustomTitle(false); setTitle('') }}
                                    style={{ fontSize: '0.8rem', color: '#64748b', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                                >
                                    Liste
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Class Field */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Classe (Optionnel)</label>
                        {!isCustomClass ? (
                            <select
                                value={schoolClasses.includes(schoolClass) ? schoolClass : (schoolClass ? 'Autre' : '')}
                                onChange={handleClassChange}
                                className="input"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                            >
                                <option value="">Aucune classe</option>
                                {schoolClasses.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="Autre">Autre...</option>
                            </select>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={schoolClass}
                                    onChange={(e) => setSchoolClass(e.target.value)}
                                    className="input"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                    placeholder="Ex: Groupe A, Professeurs..."
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => { setIsCustomClass(false); setSchoolClass('') }}
                                    style={{ fontSize: '0.8rem', color: '#64748b', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                                >
                                    Liste
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Color Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Couleur</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    style={{
                                        width: '2rem',
                                        height: '2rem',
                                        borderRadius: '50%',
                                        backgroundColor: c.value,
                                        border: color === c.value ? '2px solid black' : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            Enregistrer
                        </button>
                        {eventData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn"
                                style={{ flex: 1, backgroundColor: '#fee2e2', color: '#dc2626' }}
                            >
                                Supprimer
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
