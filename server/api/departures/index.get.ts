import { CITY_IDS, getRoute } from '../../../content/network'
import { isIsoDate } from '../../../shared/time'
import type { CityId } from '../../../shared/types'
import { listDepartures } from '../../services/catalog'
import { badRequest } from '../../utils/http'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  const from = String(q.from ?? '') as CityId
  const to = String(q.to ?? '') as CityId
  const date = String(q.date ?? '')
  if (!CITY_IDS.includes(from) || !CITY_IDS.includes(to) || !getRoute(from, to)) badRequest('Ligne inconnue')
  if (!isIsoDate(date)) badRequest('Date invalide')
  return { departures: listDepartures(from, to, date) }
})
