import { CITY_IDS, getRoute } from '../../content/network'
import type { CityId } from '../../shared/types'
import { getCalendar } from '../services/catalog'
import { badRequest } from '../utils/http'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const from = String(q.from ?? '') as CityId
  const to = String(q.to ?? '') as CityId
  if (!CITY_IDS.includes(from) || !CITY_IDS.includes(to) || !getRoute(from, to)) badRequest('Ligne inconnue')
  const days = q.days ? Number(q.days) : undefined
  return getCalendar(from, to, q.start ? String(q.start) : undefined, days)
})
