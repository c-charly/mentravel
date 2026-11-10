import type { ParcelInput } from '../../../shared/types'
import { createParcel, validateParcel } from '../../services/parcels'
import { clientIp } from '../../utils/http'
import { hit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  if (!hit(`parcel:${clientIp(event)}`, 10, 600)) throw createError({ statusCode: 429, statusMessage: 'Trop de demandes' })
  const body = (await readBody<ParcelInput>(event)) ?? ({} as ParcelInput)
  const bad = validateParcel(body)
  if (bad.length) throw createError({ statusCode: 422, statusMessage: 'invalid', data: { fields: bad } })
  return createParcel(body)
})
