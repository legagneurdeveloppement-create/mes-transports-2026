import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon } from 'lucide-react'
import { generateICS } from '../../lib/calendarService'

export default function EventModal({ isOpen, onClose, onSave, eventData, selectedDate, destinations = [] }) {
    const [title, setTitle] = useState('')
    const [schoolClass, setSchoolClass] = useState('')
    const [color, setColor] = useState('#3b82f6') // Default blue
    const [isCustomTitle, setIsCustomTitle] = useState(false)
    const [isCustomClass, setIsCustomClass] = useState(false)

    // New time fields
    const [timeDeparture, setTimeDeparture] = useState('')
    const [timeReturn, setTimeReturn] = useState('')

    // Use destinations prop directly
    const availableDestinations = destinations

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

            // Times
            setTimeDeparture(eventData.time_departure_origin || '')
            setTimeReturn(eventData.time_departure_destination || '')
        } else {
            setTitle('')
            setSchoolClass('')
            setColor('#3b82f6')
            setIsCustomTitle(false)
            setIsCustomClass(false)
            setTimeDeparture('')
            setTimeReturn('')
        }
    }, [eventData, isOpen, availableDestinations])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({
            title,
            schoolClass,
            color,
            time_departure_origin: timeDeparture,
            time_departure_destination: timeReturn
        })
        onClose()
    }

    const handleDelete = () => {
        if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
            onSave(null)
            onClose()
        }
    }

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
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
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
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Destination</label>
                        {!isCustomTitle ? (
                            <select
                                value={(() => {
                                    // Use name + schoolClass for matching since name is no longer unique
                                    const matchedIndex = availableDestinations.findIndex(d => {
                                        const dName = typeof d === 'string' ? d : d.name
                                        const dClass = typeof d === 'string' ? '' : (d.defaultClass || d.default_class || '')
                                        return dName === title && dClass === schoolClass
                                    })
                                    return matchedIndex !== -1 ? matchedIndex.toString() : ""
                                })()}
                                onChange={(e) => {
                                    const idxStr = e.target.value
                                    if (idxStr === 'Autre') {
                                        setIsCustomTitle(true)
                                        setTitle('')
                                    } else {
                                        setIsCustomTitle(false)
                                        const idx = parseInt(idxStr)
                                        const destObj = availableDestinations[idx]

                                        if (destObj) {
                                            const name = typeof destObj === 'string' ? destObj : destObj.name
                                            setTitle(name)

                                            // Auto-set color and class if provided
                                            if (typeof destObj !== 'string') {
                                                if (destObj.color) {
                                                    setColor(destObj.color)
                                                }
                                                if (destObj.defaultClass || destObj.default_class) {
                                                    setSchoolClass(destObj.defaultClass || destObj.default_class)
                                                    setIsCustomClass(false)
                                                }
                                            }
                                        }
                                    }
                                }}
                                className="input"
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
                                required
                            >
                                <option value="" disabled>Sélectionner une destination</option>
                                {availableDestinations.map((d, index) => {
                                    const name = typeof d === 'string' ? d : d.name
                                    const dClass = typeof d === 'string' ? null : (d.defaultClass || d.default_class)
                                    return (
                                        <option key={index} value={index.toString()}>
                                            {name}{dClass ? ` (${dClass})` : ''}
                                        </option>
                                    )
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

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Classe (Optionnel)</label>
                        {!isCustomClass ? (
                            <select
                                value={schoolClasses.includes(schoolClass) ? schoolClass : (schoolClass ? 'Autre' : '')}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val === 'Autre') {
                                        setIsCustomClass(true)
                                        setSchoolClass('')
                                    } else {
                                        setIsCustomClass(false)
                                        setSchoolClass(val)
                                    }
                                }}
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

                    <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Horaires Détaillés</h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Départ</label>
                                <input
                                    type="time"
                                    value={timeDeparture}
                                    onChange={(e) => setTimeDeparture(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Retour</label>
                                <input
                                    type="time"
                                    value={timeReturn}
                                    onChange={(e) => setTimeReturn(e.target.value)}
                                    style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
                                />
                            </div>
                        </div>

                        {/* Read-only Schedule from Chauffeur */}
                        {(() => {
                            let allerSteps = []
                            let retourSteps = []
                            let stayedOnSite = false
                            try {
                                if (eventData) {
                                    if (eventData.time_departure_school) {
                                        const rawAller = typeof eventData.time_departure_school === 'string'
                                            ? JSON.parse(eventData.time_departure_school)
                                            : eventData.time_departure_school

                                        if (Array.isArray(rawAller)) {
                                            allerSteps = rawAller
                                        } else if (rawAller && typeof rawAller === 'object') {
                                            allerSteps = rawAller.steps || []
                                            stayedOnSite = rawAller.stayedOnSite || false
                                        }
                                    }
                                    if (eventData.time_arrival_school) {
                                        retourSteps = typeof eventData.time_arrival_school === 'string'
                                            ? JSON.parse(eventData.time_arrival_school)
                                            : eventData.time_arrival_school
                                    }
                                    stayedOnSite = stayedOnSite || eventData.stayed_on_site || false
                                }
                            } catch (e) {
                                console.error('Error parsing schedule:', e)
                            }

                            const hasDetailedSchedule = (Array.isArray(allerSteps) && allerSteps.length > 0) ||
                                (Array.isArray(retourSteps) && retourSteps.length > 0) || stayedOnSite

                            if (!hasDetailedSchedule) return null

                            return (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📝 Infos Chauffeur</span>
                                    </h4>

                                    {stayedOnSite && (
                                        <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#92400e', background: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', display: 'inline-block', fontWeight: '600' }}>
                                            📍 Resté sur place
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0891b2', marginBottom: '0.25rem' }}>→ Aller (Réel)</div>
                                            {Array.isArray(allerSteps) && allerSteps.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {allerSteps.map((step, idx) => (
                                                        <div key={idx} style={{ fontSize: '0.8rem', color: '#334155' }}>
                                                            <strong>{step.time}</strong> <span style={{ color: '#64748b' }}>- {step.location}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f97316', marginBottom: '0.25rem' }}>← Retour (Réel)</div>
                                            {Array.isArray(retourSteps) && retourSteps.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {retourSteps.map((step, idx) => (
                                                        <div key={idx} style={{ fontSize: '0.8rem', color: '#334155' }}>
                                                            <strong>{step.time}</strong> <span style={{ color: '#64748b' }}>- {step.location}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Couleur</label>
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            opacity: !isCustomTitle && availableDestinations.some(d => (d.name || d) === title) ? 0.5 : 1,
                            pointerEvents: !isCustomTitle && availableDestinations.some(d => (d.name || d) === title) ? 'none' : 'auto'
                        }}>
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
                        {!isCustomTitle && availableDestinations.some(d => (d.name || d) === title) && (
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                💡 La couleur est liée au lieu sélectionné.
                            </p>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        marginTop: '1rem',
                        paddingBottom: '1rem' // Added space at the bottom
                    }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: '1 1 150px', minHeight: '3rem' }}>Enregistrer</button>
                        {eventData && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => generateICS(eventData)}
                                    className="btn btn-outline"
                                    style={{
                                        flex: '1 1 120px',
                                        borderColor: '#0891b2',
                                        color: '#0891b2',
                                        minHeight: '3rem'
                                    }}
                                    title="Ajouter au calendrier (Rappel)"
                                >
                                    <CalendarIcon size={18} style={{ marginRight: '0.4rem' }} /> Rappel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="btn"
                                    style={{
                                        flex: '1 1 120px',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        minHeight: '3rem'
                                    }}
                                >
                                    Supprimer
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
