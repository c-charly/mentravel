// Paiement Mobile Money simule. Le resultat arrive apres un delai; ?sim=fail|timeout|success
// permet de tester chaque cas tant que NUXT_ALLOW_SIM n'est pas desactive.
import type { Operator, PaymentResponse, PaymentSim, PaymentStatus } from '../../shared/types'
import { detectOperator, normalizePhone } from '../../shared/validation'
import { getConfig } from '../utils/config'
import { generateId } from '../utils/random'
import { getDb, persist, type StoredBooking } from '../utils/store'
import { takenSeatsOf } from './catalog'
import { findBooking } from './bookings'
import { consumeHold, getHold, heldSeatsOf } from './holds'

interface Payment {
  id: string
  pnrs: string[]
  operator: Operator
  amount: number
  status: PaymentStatus
  reason?: PaymentResponse['reason']
  resolveAt: number
  outcome: 'success' | 'failed' | 'timeout'
  finalized: boolean
}

const payments = new Map<string, Payment>()

export type StartPaymentError =
  | { code: 'unknown_booking' }
  | { code: 'not_payable' }
  | { code: 'invalid_phone' }
  | { code: 'unsupported_operator' }
  | { code: 'expired' }

function view(p: Payment): PaymentResponse {
  return { paymentId: p.id, status: p.status, operator: p.operator, amountFcfa: p.amount, reason: p.reason }
}

export function startPayment(
  input: { pnrs: string[]; phone: string; sim?: PaymentSim },
  now = Date.now(),
): { ok: true; payment: PaymentResponse } | { ok: false; error: StartPaymentError } {
  const cfg = getConfig()
  const bookings: StoredBooking[] = []
  for (const pnr of input.pnrs ?? []) {
    const b = findBooking(pnr, now)
    if (!b) return { ok: false, error: { code: 'unknown_booking' } }
    bookings.push(b)
  }
  if (bookings.length === 0) return { ok: false, error: { code: 'unknown_booking' } }
  if (new Set(bookings.map((b) => b.groupId)).size !== 1) return { ok: false, error: { code: 'unknown_booking' } }
  if (bookings.some((b) => b.status === 'expired')) return { ok: false, error: { code: 'expired' } }
  if (bookings.some((b) => b.status !== 'pending')) return { ok: false, error: { code: 'not_payable' } }
  if (!/^6\d{8}$/.test(normalizePhone(input.phone))) return { ok: false, error: { code: 'invalid_phone' } }
  const operator = detectOperator(input.phone)
  if (!operator) return { ok: false, error: { code: 'unsupported_operator' } }

  const sim = cfg.allowSim ? input.sim : undefined
  const delay = sim === 'timeout' ? 12 : sim === 'fail' ? 3 : cfg.paymentDelaySec
  const outcome: Payment['outcome'] = sim === 'fail' ? 'failed' : sim === 'timeout' ? 'timeout' : 'success'
  const payment: Payment = {
    id: generateId('pay'),
    pnrs: bookings.map((b) => b.pnr),
    operator,
    amount: bookings.reduce((sum, b) => sum + b.amountFcfa, 0),
    status: 'pending',
    resolveAt: now + delay * 1000,
    outcome,
    finalized: false,
  }
  payments.set(payment.id, payment)
  bookings.forEach((b) => {
    b.paymentId = payment.id
    b.paymentPendingUntil = payment.resolveAt + 5000
  })
  persist()
  return { ok: true, payment: view(payment) }
}

function finalize(p: Payment, now: number): void {
  if (p.finalized || now < p.resolveAt) return
  p.finalized = true
  const bookings = p.pnrs.map((pnr) => getDb().bookings[pnr]).filter((b): b is StoredBooking => !!b)
  bookings.forEach((b) => {
    b.paymentPendingUntil = 0
  })

  if (p.outcome !== 'success') {
    p.status = p.outcome === 'timeout' ? 'timeout' : 'failed'
    p.reason = p.outcome === 'timeout' ? 'timeout' : 'refused'
    persist()
    return
  }

  // Succes: on verifie que les sieges n'ont pas ete pris entre-temps
  const lost = bookings.some((b) => {
    const taken = takenSeatsOf(b.departureId, b.classId)
    const held = heldSeatsOf(b.departureId, b.classId, b.holdId, now)
    return b.seatIds.some((s) => taken.has(s) || held.has(s))
  })
  if (lost) {
    bookings.forEach((b) => {
      b.status = 'expired'
    })
    p.status = 'failed'
    p.reason = 'seats_lost'
    persist()
    return
  }
  bookings.forEach((b) => {
    b.status = 'paid'
    b.amountPaidFcfa = b.amountFcfa
    b.paidAt = new Date(now).toISOString()
    if (b.holdId && getHold(b.holdId, now)) consumeHold(b.holdId)
  })
  p.status = 'success'
  persist()
}

export function getPayment(id: string, now = Date.now()): PaymentResponse | null {
  const p = payments.get(id)
  if (!p) return null
  finalize(p, now)
  return view(p)
}

export function resetPaymentsForTests(): void {
  payments.clear()
}
