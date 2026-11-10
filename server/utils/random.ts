// Aleatoire securise (PNR, jetons) et aleatoire deterministe (donnees de demonstration).
import { randomBytes, randomInt } from 'node:crypto'

// Alphabet sans caracteres ambigus (pas de I, O, 0, 1)
export const PNR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function randomChars(length: number, alphabet = PNR_ALPHABET): string {
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)]
  return out
}

export function generatePnr(): string {
  return `MT-${randomChars(6)}-${randomChars(4)}`
}

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString('base64url')}`
}

// FNV-1a 32 bits
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededRandom(key: string): () => number {
  return mulberry32(hashString(key))
}
