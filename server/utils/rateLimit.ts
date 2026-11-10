// Limitation de debit et verrouillage apres echecs (en memoire, par instance).
interface Bucket {
  count: number
  resetAt: number
}

interface FailState {
  fails: number
  lockedUntil: number
}

const buckets = new Map<string, Bucket>()
const fails = new Map<string, FailState>()

// Retourne true si l'appel est autorise
export function hit(key: string, max: number, windowSec: number, now = Date.now()): boolean {
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return true
  }
  b.count += 1
  return b.count <= max
}

export function lockStatus(key: string, now = Date.now()): { locked: boolean; retryAfterSec: number } {
  const f = fails.get(key)
  if (f && f.lockedUntil > now) {
    return { locked: true, retryAfterSec: Math.ceil((f.lockedUntil - now) / 1000) }
  }
  return { locked: false, retryAfterSec: 0 }
}

export function registerFail(key: string, maxFails: number, lockMinutes: number, now = Date.now()): void {
  const f = fails.get(key) ?? { fails: 0, lockedUntil: 0 }
  if (f.lockedUntil && f.lockedUntil <= now) {
    f.fails = 0
    f.lockedUntil = 0
  }
  f.fails += 1
  if (f.fails >= maxFails) f.lockedUntil = now + lockMinutes * 60_000
  fails.set(key, f)
}

export function clearFails(key: string): void {
  fails.delete(key)
}

export function resetRateLimits(): void {
  buckets.clear()
  fails.clear()
}
