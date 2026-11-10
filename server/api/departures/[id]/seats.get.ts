import { CLASS_IDS } from '../../../../content/network'
import type { ClassId } from '../../../../shared/types'
import { getSeats } from '../../../services/catalog'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const q = getQuery(event)
  const classId = String(q.class ?? '') as ClassId
  if (!CLASS_IDS.includes(classId)) throw createError({ statusCode: 400, statusMessage: 'Classe inconnue' })
  const res = getSeats(id, classId, q.hold ? String(q.hold) : undefined)
  if (!res) throw createError({ statusCode: 404, statusMessage: 'Depart introuvable' })
  return res
})
