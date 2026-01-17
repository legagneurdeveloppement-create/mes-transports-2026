import { useState, useEffect } from 'react'
import { X, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react'

export default function ScheduleManagerModal({ isOpen, onClose, transport, onSave }) {
    const [allerSteps, setAllerSteps] = useState([])
    const [retourSteps, setRetourSteps] = useState([])

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
            } catch (e) {
                console.error('Error parsing schedule data:', e)
                setAllerSteps([])
                setRetourSteps([])
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
            time_arrival_school: JSON.stringify(retourSteps)
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
                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{transport.title}</div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{transport.schoolClass}</div>
                    </div>
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
