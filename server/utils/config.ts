// Configuration serveur lue dans les variables d'environnement (NUXT_*), avec valeurs par defaut.
// Lire process.env directement garde la logique testable sans le runtime Nitro.
import { SETTINGS } from '../../content/network'

function num(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getConfig() {
  const env = process.env
  return {
    dataDir: env.NUXT_DATA_DIR || '.data',
    allowSim: (env.NUXT_ALLOW_SIM ?? 'true') !== 'false',
    holdMinutes: num(env.NUXT_HOLD_MINUTES, SETTINGS.holdMinutes),
    maxSeats: num(env.NUXT_MAX_SEATS, SETTINGS.maxSeats),
    calendarDays: num(env.NUXT_CALENDAR_DAYS, SETTINGS.calendarDays),
    paymentDelaySec: num(env.NUXT_PAYMENT_DELAY_SEC, 4),
    unlockMaxFails: num(env.NUXT_UNLOCK_MAX_FAILS, 5),
    unlockLockMinutes: num(env.NUXT_UNLOCK_LOCK_MINUTES, 15),
  }
}
