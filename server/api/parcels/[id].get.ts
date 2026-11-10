import { getParcel } from '../../services/parcels'

export default defineEventHandler((event) => {
  const parcel = getParcel(getRouterParam(event, 'id') ?? '')
  if (!parcel) throw createError({ statusCode: 404, statusMessage: 'unknown' })
  return parcel
})
