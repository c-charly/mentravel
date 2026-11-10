import { isValidPnr } from '../../../shared/validation'
import { getFullTicket } from '../../services/tickets'

export default defineEventHandler((event) => {
  const pnr = (getRouterParam(event, 'pnr') ?? '').toUpperCase()
  const token = String(getQuery(event).t ?? '')
  const ticket = isValidPnr(pnr) && token ? getFullTicket(pnr, token) : null
  // Meme reponse pour "inconnu" et "jeton invalide": on ne revele pas l'existence du billet
  if (!ticket) throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  return ticket
})
