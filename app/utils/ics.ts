// Fichier calendrier (.ics) pour ajouter le depart a son agenda.
import { instantOf } from '#shared/time'
import type { MaskedTicket } from '#shared/types'

function stamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildIcs(t: MaskedTicket, title: string, location: string): string {
  const start = instantOf(t.date, t.departureTime)
  const end = instantOf(t.date, t.departureTime, t.route.durationMin)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MEN TRAVEL//Billet//FR',
    'BEGIN:VEVENT',
    `UID:${t.pnr}@men-travel`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:PNR ${t.pnr}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
