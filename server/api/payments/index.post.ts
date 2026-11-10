import type { PaymentSim } from '../../../shared/types'
import { startPayment } from '../../services/payments'
import { clientIp } from '../../utils/http'
import { hit } from '../../utils/rateLimit'

interface Body {
  pnrs?: string[]
  phone?: string
  sim?: PaymentSim
}

export default defineEventHandler(async (event) => {
  const ip = clientIp(event)
  if (!hit(`pay:${ip}`, 20, 600)) throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives' })
  const body = (await readBody<Body>(event)) ?? {}
  const sims: PaymentSim[] = ['success', 'fail', 'timeout']
  const res = startPayment({
    pnrs: Array.isArray(body.pnrs) ? body.pnrs.map(String) : [],
    phone: String(body.phone ?? ''),
    sim: sims.includes(body.sim as PaymentSim) ? body.sim : undefined,
  })
  if (!res.ok) {
    const status = res.error.code === 'expired' ? 410 : res.error.code === 'unknown_booking' ? 404 : 422
    throw createError({ statusCode: status, statusMessage: res.error.code, data: res.error })
  }
  return res.payment
})
