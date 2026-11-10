// Stockage mock: donnees en memoire, persistees dans un fichier JSON (volume Docker).
// Les services sont isoles derriere server/services pour brancher une vraie API plus tard.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { BookingStatus, ClassId, Holder, ParcelInput, QuoteInput } from '../../shared/types'
import { getConfig } from './config'

export interface StoredBooking {
  pnr: string
  accessToken: string
  groupId: string
  departureId: string
  classId: ClassId
  seatIds: string[]
  holder: Holder
  amountFcfa: number
  amountPaidFcfa: number
  status: BookingStatus
  createdAt: string
  holdId?: string
  paymentId?: string
  paidAt?: string
  paymentPendingUntil?: number
  demo?: boolean
}

export interface StoredParcel extends ParcelInput {
  trackingId: string
  estimateFcfa: number
  createdAt: string
}

export interface StoredQuote extends QuoteInput {
  reference: string
  createdAt: string
  estimateMinFcfa: number
  estimateMaxFcfa: number
}

interface Db {
  bookings: Record<string, StoredBooking>
  parcels: Record<string, StoredParcel>
  quotes: StoredQuote[]
}

let db: Db | null = null
let filePath: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let persistEnabled = true

function emptyDb(): Db {
  return { bookings: {}, parcels: {}, quotes: [] }
}

export function getDb(): Db {
  if (db) return db
  filePath = join(getConfig().dataDir, 'db.json')
  db = emptyDb()
  if (persistEnabled && existsSync(filePath)) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<Db>
      db = {
        bookings: parsed.bookings ?? {},
        parcels: parsed.parcels ?? {},
        quotes: parsed.quotes ?? [],
      }
    } catch {
      db = emptyDb()
    }
  }
  return db
}

function writeNow(): void {
  if (!persistEnabled || !db || !filePath) return
  try {
    mkdirSync(dirname(filePath), { recursive: true })
    const tmp = `${filePath}.tmp`
    writeFileSync(tmp, JSON.stringify(db))
    renameSync(tmp, filePath)
  } catch {
    // Disque en lecture seule: on continue en memoire
  }
}

export function persist(): void {
  if (!persistEnabled) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(writeNow, 250)
}

export function flushStore(): void {
  if (timer) clearTimeout(timer)
  writeNow()
}

// Pour les tests: base vierge, sans ecriture disque
export function resetStoreForTests(): void {
  if (timer) clearTimeout(timer)
  persistEnabled = false
  db = emptyDb()
}

let hooked = false
export function hookShutdown(): void {
  if (hooked) return
  hooked = true
  process.once('SIGTERM', flushStore)
  process.once('SIGINT', flushStore)
  process.once('beforeExit', flushStore)
}
