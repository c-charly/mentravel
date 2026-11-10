// Masquage des donnees sensibles. Execute cote serveur: la donnee en clair
// n'est jamais envoyee par une route publique.
import type { Holder, MaskedHolder } from '../../shared/types'
import { normalizeId, normalizePhone } from '../../shared/validation'

const MASK = '*'

// Premiere lettre + masque de longueur fixe (ne revele pas la vraie longueur)
export function maskName(name: string): string {
  const first = name.trim().charAt(0).toUpperCase()
  return `${first}${MASK.repeat(6)}`
}

// +237 6** ** ** 43 : seuls le premier et les deux derniers chiffres restent visibles
export function maskPhone(phone: string): string {
  const d = normalizePhone(phone)
  const first = d.charAt(0) || MASK
  const last2 = d.slice(-2).padStart(2, MASK)
  return `+237 ${first}${MASK.repeat(2)} ${MASK.repeat(2)} ${MASK.repeat(2)} ${last2}`
}

// ******** + 2 derniers caracteres
export function maskIdNumber(idNumber: string): string {
  const n = normalizeId(idNumber)
  return `${MASK.repeat(8)}${n.slice(-2)}`
}

export function maskHolder(holder: Holder): MaskedHolder {
  return {
    lastName: maskName(holder.lastName),
    firstName: maskName(holder.firstName),
    phone: maskPhone(holder.phone),
    idNumber: maskIdNumber(holder.idNumber),
  }
}
