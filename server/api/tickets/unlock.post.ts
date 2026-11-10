import type { UnlockResponse } from '../../../shared/types'
import { isValidPnr } from '../../../shared/validation'
import { unlockTicket } from '../../services/tickets'
import { clientIp } from '../../utils/http'

interface Body {
  pnr?: string
  idNumber?: string
}

export default defineEventHandler(async (event): Promise<UnlockResponse> => {
  const body = (await readBody<Body>(event)) ?? {}
  const pnr = String(body.pnr ?? '').toUpperCase()
  if (!isValidPnr(pnr)) throw createError({ statusCode: 400, statusMessage: 'invalid' })
  const res = unlockTicket(pnr, String(body.idNumber ?? ''), clientIp(event))
  if (!res.ok) {
    if (res.reason === 'locked') {
      setResponseHeader(event, 'Retry-After', res.retryAfterSec)
      throw createError({ statusCode: 429, statusMessage: 'locked', data: { retryAfterSec: res.retryAfterSec } })
    }
    throw createError({ statusCode: 401, statusMessage: 'invalid' })
  }
  return { token: res.token }
})
