// Formats d'affichage (FCFA, dates, durees) localises.
import { parseIsoDate } from './time'

export function formatFcfa(amount: number, locale = 'fr'): string {
  const n = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[\u202f\u00a0]/g, '\u00a0')
  return `${n}\u00a0FCFA`
}

export function formatNumber(n: number, locale = 'fr'): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR')
    .format(n)
    .replace(/[\u202f\u00a0]/g, ' ')
}

function intlLocale(locale: string): string {
  return locale === 'en' ? 'en-GB' : 'fr-FR'
}

export function formatDateLong(date: string, locale = 'fr'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(parseIsoDate(date))
}

export function formatDateShort(date: string, locale = 'fr'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parseIsoDate(date))
}

export function formatMonthYear(date: string, locale = 'fr'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseIsoDate(date))
}

export function formatWeekdayShort(date: string, locale = 'fr'): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', timeZone: 'UTC' }).format(
    parseIsoDate(date),
  )
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h00`
}
