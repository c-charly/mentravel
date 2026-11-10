import { CLASS_IDS } from '../../../content/network'
import type { ClassId } from '../../../shared/types'
import { getDepartureInfo, takenSeatsOf } from '../../services/catalog'
import { activeHoldsOfOwner, createHold } from '../../services/holds'
import { clientIp } from '../../utils/http'
import { hit } from '../../utils/rateLimit'

interface Body {
  departureId?: string
  classId?: ClassId
  seatIds?: string[]
  replaceHoldId?: string
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<Body>(event)) ?? {}
  const ip = clientIp(event)
  if (!hit(`hold:${ip}`, 30, 600)) throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives' })
  if (!body.departureId || !body.classId || !CLASS_IDS.includes(body.classId) || !Array.isArray(body.seatIds)) {
    throw createError({ statusCode: 400, statusMessage: 'Requete invalide' })
  }
  const dep = getDepartureInfo(body.departureId)
  if (!dep || !dep.offers.some((o) => o.classId === body.classId)) {
    throw createError({ statusCode: 404, statusMessage: 'Depart introuvable' })
  }
  if (dep.departed) throw createError({ statusCode: 409, statusMessage: 'Depart ferme', data: { code: 'departed' } })
  if (!body.replaceHoldId && activeHoldsOfOwner(ip) >= 6) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de retenues actives' })
  }
  const res = createHold(
    {
      departureId: body.departureId,
      classId: body.classId,
      seatIds: body.seatIds.map(String),
      ownerKey: ip,
      replaceHoldId: body.replaceHoldId,
    },
    takenSeatsOf,
  )
  if (!res.ok) throw createError({ statusCode: 409, statusMessage: 'Sieges indisponibles', data: res.error })
  return res.hold
})
