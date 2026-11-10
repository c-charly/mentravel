import type { QuoteInput } from '../../shared/types'
import { createQuote, validateQuote } from '../services/quotes'
import { clientIp } from '../utils/http'
import { hit } from '../utils/rateLimit'

export default defineEventHandler(async (event) => {
  if (!hit(`quote:${clientIp(event)}`, 10, 600)) throw createError({ statusCode: 429, statusMessage: 'Trop de demandes' })
  const body = (await readBody<QuoteInput>(event)) ?? ({} as QuoteInput)
  const bad = validateQuote(body)
  if (bad.length) throw createError({ statusCode: 422, statusMessage: 'invalid', data: { fields: bad } })
  const q = createQuote(body)
  return { reference: q.reference, estimateMinFcfa: q.estimateMinFcfa, estimateMaxFcfa: q.estimateMaxFcfa }
})
