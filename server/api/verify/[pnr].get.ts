// Route publique: renvoie UNIQUEMENT le billet masque (MaskedTicket). Les donnees du titulaire
// en clair ne quittent jamais le serveur ici.
import { isValidPnr } from '../../../shared/validation'
import { getMaskedTicket } from '../../services/tickets'
import { clientIp } from '../../utils/http'
import { hit } from '../../utils/rateLimit'

export default defineEventHandler((event) => {
  if (!hit(`verify:${clientIp(event)}`, 60, 60)) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de verifications' })
  }
  const pnr = (getRouterParam(event, 'pnr') ?? '').toUpperCase()
  const ticket = isValidPnr(pnr) ? getMaskedTicket(pnr) : null
  if (!ticket) throw createError({ statusCode: 404, statusMessage: 'unknown' })
  return ticket
})
