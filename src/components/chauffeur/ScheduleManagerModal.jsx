import { useState, useEffect } from 'react'
import { X, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react'

export default function ScheduleManagerModal({ isOpen, onClose, transport, onSave }) {
    const [allerSteps, setAllerSteps] = useState([])
    const [retourSteps, setRetourSteps] = useState([])
    const [stayedOnSite, setStayedOnSite] = useState(false)

    useEffect(() => {
        if (isOpen && transport) {
            // Parse existing data from JSON columns
            try {
                const aller = transport.time_departure_school
                    ? (typeof transport.time_departure_school === 'string'
                        ? JSON.parse(transport.time_departure_school)
                        : transport.time_departure_school)
                    : []
                const retour = transport.time_arrival_school
                    ? (typeof transport.time_arrival_school === 'string'
                        ? JSON.parse(transport.time_arrival_school)
                        : transport.time_arrival_school)
                    : []

                setAllerSteps(Array.isArray(aller) ? aller : [])
                setRetourSteps(Array.isArray(retour) ? retour : [])
                setStayedOnSite(transport.stayed_on_site || false)
            } catch (e) {
                console.error('Error parsing schedule data:', e)
                setAllerSteps([])
                setRetourSteps([])
                setStayedOnSite(false)
            }
        }
    }, [isOpen, transport])

    const addStep = (type) => {
        const newStep = { time: '', location: '' }
        if (type === 'aller') {
            setAllerSteps([...allerSteps, newStep])
        } else {
            setRetourSteps([...retourSteps, newStep])
        }
    }

    const removeStep = (type, index) => {
        if (type === 'aller') {
            setAllerSteps(allerSteps.filter((_, i) => i !== index))
        } else {
            setRetourSteps(retourSteps.filter((_, i) => i !== index))
        }
    }

    const updateStep = (type, index, field, value) => {
        if (type === 'aller') {
            const updated = [...allerSteps]
            updated[index][field] = value
            setAllerSteps(updated)
        } else {
            const updated = [...retourSteps]
            updated[index][field] = value
            setRetourSteps(updated)
        }
    }

    const handleSave = () => {
        onSave({
            time_departure_school: JSON.stringify(allerSteps),
            time_arrival_school: JSON.stringify(retourSteps),
            stayed_on_site: stayedOnSite
        })
        onClose()
    }

    if (!isOpen) return null

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
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        Gérer les horaires détaillés
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {transport && (
                    <>
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                            <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{transport.title}</div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{transport.schoolClass}</div>
                        </div>

                        {/* Stayed On-Site Checkbox */}
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '0.75rem',
                            background: '#fef3c7',
                            borderRadius: '0.5rem',
                            border: '1px solid #f59e0b'
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={stayedOnSite}
                                    onChange={(e) => setStayedOnSite(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>
                                    📍 Resté sur place
                                </span>
                            </label>
                        </div>
                    </>
                )}

                {/* Section Aller */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <ArrowRight size={20} color="#0891b2" />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0891b2', margin: 0 }}>
                            Aller
                        </h4>
                    </div>

                    {allerSteps.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                            Aucune étape définie pour l'aller
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {allerSteps.map((step, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="time"
                                        value={step.time}
                                        onChange={(e) => updateStep('aller', index, 'time', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '0.375rem',
                                            width: '120px'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={step.location}
                                        onChange={(e) => updateStep('aller', index, 'location', e.target.value)}
                                        placeholder="Lieu (ex: Domicile, Arrêt 1, École)"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '0.375rem'
                                        }}
                                    />
                                    <button
                                        onClick={() => removeStep('aller', index)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            color: '#dc2626'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => addStep('aller')}
                        style={{
                            marginTop: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#e0f2fe',
                            border: '1px solid #0891b2',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            color: '#0891b2',
                            fontWeight: '500',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Plus size={16} /> Ajouter une étape
                    </button>
                </div>

                {/* Section Retour */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <ArrowLeft size={20} color="#f97316" />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f97316', margin: 0 }}>
                            Retour
                        </h4>
                    </div>

                    {retourSteps.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                            Aucune étape définie pour le retour
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {retourSteps.map((step, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="time"
                                        value={step.time}
                                        onChange={(e) => updateStep('retour', index, 'time', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '0.375rem',
                                            width: '120px'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        value={step.location}
                                        onChange={(e) => updateStep('retour', index, 'location', e.target.value)}
                                        placeholder="Lieu (ex: École, Arrêt 1, Domicile)"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '0.375rem'
                                        }}
                                    />
                                    <button
                                        onClick={() => removeStep('retour', index)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            color: '#dc2626'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => addStep('retour')}
                        style={{
                            marginTop: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#ffedd5',
                            border: '1px solid #f97316',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            color: '#f97316',
                            fontWeight: '500',
                            fontSize: '0.875rem'
                        }}
                    >
                        <Plus size={16} /> Ajouter une étape
                    </button>
                </div>

                {/* Work Hours Summary */}
                {(() => {
                    const calculateDuration = (steps) => {
                        if (!Array.isArray(steps) || steps.length < 2) return null

                        const validSteps = steps.filter(s => s.time && s.time.trim())
                        if (validSteps.length < 2) return null

                        const firstTime = validSteps[0].time
                        const lastTime = validSteps[validSteps.length - 1].time

                        const [h1, m1] = firstTime.split(':').map(Number)
                        const [h2, m2] = lastTime.split(':').map(Number)

                        const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1)
                        if (totalMinutes <= 0) return null

                        const hours = Math.floor(totalMinutes / 60)
                        const minutes = totalMinutes % 60

                        return { hours, minutes, totalMinutes }
                    }

                    const allerDuration = calculateDuration(allerSteps)
                    const retourDuration = calculateDuration(retourSteps)
                    const totalMinutes = (allerDuration?.totalMinutes || 0) + (retourDuration?.totalMinutes || 0)

                    if (totalMinutes === 0) return null

                    const totalHours = Math.floor(totalMinutes / 60)
                    const totalMins = totalMinutes % 60

                    return (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            borderRadius: '0.5rem',
                            border: '1px solid #0891b2'
                        }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ⏱️ Temps de travail calculé
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: '0.375rem' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Aller</div>
                                    <div style={{ fontWeight: '700', color: '#0891b2', fontSize: '1rem' }}>
                                        {allerDuration ? `${allerDuration.hours}h${allerDuration.minutes.toString().padStart(2, '0')}` : '--'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: '0.375rem' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Retour</div>
                                    <div style={{ fontWeight: '700', color: '#f97316', fontSize: '1rem' }}>
                                        {retourDuration ? `${retourDuration.hours}h${retourDuration.minutes.toString().padStart(2, '0')}` : '--'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: '#0891b2', borderRadius: '0.375rem' }}>
                                    <div style={{ color: 'white', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.9 }}>Total</div>
                                    <div style={{ fontWeight: '700', color: 'white', fontSize: '1.1rem' }}>
                                        {totalHours}h{totalMins.toString().padStart(2, '0')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* Total Time from First Departure to Last Return */}
                {(() => {
                    const getAllTimes = () => {
                        const allerTimes = allerSteps.filter(s => s.time && s.time.trim()).map(s => s.time)
                        const retourTimes = retourSteps.filter(s => s.time && s.time.trim()).map(s => s.time)
                        return [...allerTimes, ...retourTimes]
                    }

                    const allTimes = getAllTimes()
                    if (allTimes.length < 2) return null

                    const firstTime = allTimes[0]
                    const lastTime = allTimes[allTimes.length - 1]

                    const [h1, m1] = firstTime.split(':').map(Number)
                    const [h2, m2] = lastTime.split(':').map(Number)

                    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1)
                    if (totalMinutes <= 0) return null

                    const hours = Math.floor(totalMinutes / 60)
                    const minutes = totalMinutes % 60

                    return (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '0.5rem',
                            border: '2px solid #f59e0b'
                        }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🕐 Temps total (Premier départ → Dernier retour)
                            </h4>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem' }}>
                                    {firstTime} → {lastTime}
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f59e0b' }}>
                                    {hours}h{minutes.toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                        onClick={onClose}
                        className="btn"
                        style={{ background: '#f1f5f9', color: '#334155' }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    )
}
