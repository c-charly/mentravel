import type { CreateBookingBody } from '../../shared/types'
import { createBookings } from '../services/bookings'
import { clientIp } from '../utils/http'
import { hit } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const ip = clientIp(event)
  if (!hit(`booking:${ip}`, 20, 600)) throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives' })
  const body = await readBody<CreateBookingBody>(event)
  const res = createBookings(body, ip)
  if (!res.ok) {
    const status = res.error.code === 'invalid_holder' ? 422 : res.error.code === 'hold_expired' ? 410 : 409
    throw createError({ statusCode: status, statusMessage: res.error.code, data: res.error })
  }
  return res.result
})
