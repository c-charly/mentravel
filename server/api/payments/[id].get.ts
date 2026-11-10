import { getPayment } from '../../services/payments'

export default defineEventHandler((event) => {
  const res = getPayment(getRouterParam(event, 'id') ?? '')
  if (!res) throw createError({ statusCode: 404, statusMessage: 'Paiement introuvable' })
  return res
})
