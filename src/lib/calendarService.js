export const generateICS = (transport) => {
    // Helper to format date for ICS (YYYYMMDDTHHmm00Z)
    // Assuming dates are stored as ISO strings or similar in the transport object
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const start = formatDate(transport.departureTime || transport.start)
    const end = formatDate(transport.arrivalTime || transport.end) || start // Default to start if no end

    // Clean text for ICS
    const clean = (text) => (text || '').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')

    const title = clean(`Transport: ${transport.clientName || 'Client'} - ${transport.type || ''}`)
    const description = clean(`
Client: ${transport.clientName || ''}
Type: ${transport.type || ''}
Lieu: ${transport.pickupLocation || ''} -> ${transport.dropoffLocation || ''}
Notes: ${transport.notes || ''}
    `.trim())
    const location = clean(transport.pickupLocation || '')

    // ICS File Content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MesTransports//App//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${transport.id || Date.now()}@mestransports.app
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Rappel Transport (Demain)
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Rappel Transport (Dans 1h)
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`

    // Create Blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `transport-${transport.clientName || 'event'}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
