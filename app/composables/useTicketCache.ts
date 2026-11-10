// Memoire locale des billets ouverts: lisibles hors ligne (reseau instable en voyage).
import type { FullTicket } from '#shared/types'

interface Entry {
  token: string
  ticket: FullTicket
  savedAt: number
}

const KEY = 'mt-tickets-v1'

function read(): Record<string, Entry> {
  if (!import.meta.client) return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Entry>
  } catch {
    return {}
  }
}

export function useTicketCache() {
  function save(ticket: FullTicket, token: string) {
    if (!import.meta.client) return
    try {
      const all = read()
      all[ticket.pnr] = { token, ticket, savedAt: Date.now() }
      // On garde les 12 billets les plus recents
      const keep = Object.entries(all)
        .sort(([, a], [, b]) => b.savedAt - a.savedAt)
        .slice(0, 12)
      localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep)))
    } catch {
      // Stockage plein ou bloque: sans effet sur le parcours
    }
  }

  function load(pnr: string): Entry | null {
    return read()[pnr] ?? null
  }

  function list(): Entry[] {
    return Object.values(read()).sort((a, b) => b.savedAt - a.savedAt)
  }

  function remove(pnr: string) {
    const all = read()
    Reflect.deleteProperty(all, pnr)
    localStorage.setItem(KEY, JSON.stringify(all))
  }

  return { save, load, list, remove }
}
