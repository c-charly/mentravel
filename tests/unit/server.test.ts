import { beforeEach, describe, expect, it } from 'vitest'
import { CLASS_IDS } from '../../content/network'
import { legAmounts } from '../../shared/pricing'
import { capacityOf } from '../../shared/seats'
import { addDays, instantOf, todayDouala } from '../../shared/time'
import { createBookings } from '../../server/services/bookings'
import { buildDepartureId, getCalendar, getSeats, listDepartures, takenSeatsOf } from '../../server/services/catalog'
import { DEMO_BOOKINGS, seedDemoBookings } from '../../server/services/demo'
import { createHold, getHold, releaseHold, resetHoldsForTests } from '../../server/services/holds'
import { getPayment, resetPaymentsForTests, startPayment } from '../../server/services/payments'
import { buildMaskedTicket, getFullTicket, getMaskedTicket, unlockTicket } from '../../server/services/tickets'
import { maskIdNumber, maskName, maskPhone } from '../../server/utils/mask'
import { resetRateLimits } from '../../server/utils/rateLimit'
import { getDb, resetStoreForTests } from '../../server/utils/store'

const NOW = instantOf('2026-11-05', '10:00')
const DATE = addDays(todayDouala(NOW), 8)
const DEP = buildDepartureId('yaounde', 'douala', DATE, '14:00')

const holder = {
  lastName: 'Tchoumi',
  firstName: 'Marie',
  phone: '677 12 34 56',
  idType: 'cni' as const,
  idNumber: '123 456 789',
}

beforeEach(() => {
  resetStoreForTests()
  resetHoldsForTests()
  resetPaymentsForTests()
  resetRateLimits()
})

function freeSeats(depId: string, classId: (typeof CLASS_IDS)[number], n: number): string[] {
  const seats = getSeats(depId, classId, undefined, NOW)!.seats.filter((s) => s.status === 'free')
  expect(seats.length).toBeGreaterThanOrEqual(n)
  return seats.slice(0, n).map((s) => s.id)
}

function holdOf(seatIds: string[], classId: (typeof CLASS_IDS)[number] = 'business', depId = DEP) {
  const res = createHold({ departureId: depId, classId, seatIds, ownerKey: 'ip' }, takenSeatsOf, NOW)
  if (!res.ok) throw new Error(`hold refuse: ${JSON.stringify(res.error)}`)
  return res.hold
}

describe('plans de sieges', () => {
  it('respecte les capacites du site source', () => {
    expect(capacityOf('business')).toBe(35)
    expect(capacityOf('masterclass-s')).toBe(15)
    expect(capacityOf('masterclass-plus')).toBe(9)
  })
})

describe('disponibilites', () => {
  it('propose plusieurs classes sur un meme horaire', () => {
    const deps = listDepartures('yaounde', 'douala', DATE, NOW)
    const master = deps.find((d) => d.departureTime === '14:00')!
    expect(master.offers.map((o) => o.classId)).toEqual(CLASS_IDS)
    const business = deps.find((d) => d.departureTime === '12:30')!
    expect(business.offers.map((o) => o.classId)).toEqual(['business'])
  })

  it('couvre 60 jours avec un taux d occupation varie', () => {
    const cal = getCalendar('yaounde', 'douala', undefined, 60, NOW)
    expect(cal.days).toHaveLength(60)
    const totals = cal.days.map((d) => d.departures.reduce((s, x) => s + (x.left.business ?? 0), 0))
    expect(Math.min(...totals)).toBeLessThan(40)
    expect(Math.max(...totals)).toBeGreaterThan(200)
  })

  it('ferme les departs passes du jour', () => {
    const cal = getCalendar('yaounde', 'douala', undefined, 1, NOW)
    const times = cal.days[0]!.departures.map((d) => d.time)
    expect(times).not.toContain('08:30')
    expect(times).toContain('17:00')
  })
})

describe('retenue des sieges', () => {
  it('retient, refuse les doublons, libere et expire', () => {
    const [a, b] = freeSeats(DEP, 'business', 2) as [string, string]
    const hold = holdOf([a])
    expect(getSeats(DEP, 'business', undefined, NOW)!.seats.find((s) => s.id === a)!.status).toBe('held')
    const again = createHold({ departureId: DEP, classId: 'business', seatIds: [a, b], ownerKey: 'x' }, takenSeatsOf, NOW)
    expect(again.ok).toBe(false)
    expect(releaseHold(hold.holdId)).toBe(true)
    expect(getSeats(DEP, 'business', undefined, NOW)!.seats.find((s) => s.id === a)!.status).toBe('free')

    const h2 = holdOf([b])
    expect(getHold(h2.holdId, NOW)).not.toBeNull()
    expect(getHold(h2.holdId, NOW + 11 * 60_000)).toBeNull()
  })

  it('limite a 5 sieges', () => {
    const seats = freeSeats(DEP, 'business', 6)
    const res = createHold({ departureId: DEP, classId: 'business', seatIds: seats, ownerKey: 'x' }, takenSeatsOf, NOW)
    expect(res.ok).toBe(false)
  })
})

describe('reservation et paiement', () => {
  it('un seul titulaire pour plusieurs sieges, paiement reussi', () => {
    const seats = freeSeats(DEP, 'business', 3)
    const hold = holdOf(seats)
    const booking = createBookings({ legs: [{ holdId: hold.holdId }], holder }, 'ip', NOW)
    expect(booking.ok).toBe(true)
    if (!booking.ok) return
    const b = booking.result.bookings[0]!
    expect(b.seatIds).toHaveLength(3)
    expect(b.amountFcfa).toBe(30000)
    expect(b.pnr).toMatch(/^MT-[A-HJ-NP-Z2-9]{6}-[A-HJ-NP-Z2-9]{4}$/)

    const pay = startPayment({ pnrs: [b.pnr], phone: '677123456' }, NOW)
    expect(pay.ok).toBe(true)
    if (!pay.ok) return
    expect(pay.payment.operator).toBe('mtn')
    expect(getPayment(pay.payment.paymentId, NOW + 1000)!.status).toBe('pending')
    expect(getPayment(pay.payment.paymentId, NOW + 6000)!.status).toBe('success')
    const taken = takenSeatsOf(DEP, 'business')
    seats.forEach((s) => expect(taken.has(s)).toBe(true))
    expect(getDb().bookings[b.pnr]!.status).toBe('paid')
  })

  it('un paiement refuse garde la selection retenue', () => {
    const hold = holdOf(freeSeats(DEP, 'business', 1))
    const res = createBookings({ legs: [{ holdId: hold.holdId }], holder }, 'ip', NOW)
    if (!res.ok) throw new Error('echec')
    const pnr = res.result.bookings[0]!.pnr
    const pay = startPayment({ pnrs: [pnr], phone: '655123456', sim: 'fail' }, NOW)
    if (!pay.ok) throw new Error('echec')
    expect(pay.payment.operator).toBe('orange')
    expect(getPayment(pay.payment.paymentId, NOW + 4000)!.status).toBe('failed')
    expect(getDb().bookings[pnr]!.status).toBe('pending')
    expect(getHold(hold.holdId, NOW + 4000)).not.toBeNull()
  })

  it('refuse un titulaire invalide', () => {
    const hold = holdOf(freeSeats(DEP, 'business', 1))
    const res = createBookings({ legs: [{ holdId: hold.holdId }], holder: { ...holder, phone: '12345' } }, 'ip', NOW)
    expect(res.ok).toBe(false)
  })

  it('applique le tarif aller-retour de la grille', () => {
    const [a, b] = legAmounts([
      { from: 'yaounde', to: 'douala', classId: 'business', seatCount: 1 },
      { from: 'douala', to: 'yaounde', classId: 'business', seatCount: 1 },
    ]) as [number, number]
    expect(a + b).toBe(16000)
    const mixed = legAmounts([
      { from: 'yaounde', to: 'douala', classId: 'business', seatCount: 1 },
      { from: 'douala', to: 'yaounde', classId: 'masterclass-s', seatCount: 1 },
    ])
    expect(mixed).toEqual([10000, 15000])
  })
})

describe('masquage', () => {
  it('masque nom, prenom, telephone et piece', () => {
    expect(maskName('Mballa')).toBe('M******')
    expect(maskName('Mballa')).toBe(maskName('Mb'))
    expect(maskPhone('653677443')).toBe('+237 6** ** ** 43')
    expect(maskIdNumber('112 233-445')).toBe('********45')
  })

  it('le billet public ne contient aucune donnee en clair', () => {
    seedDemoBookings(NOW)
    const demo = DEMO_BOOKINGS[0]!
    const json = JSON.stringify(getMaskedTicket(demo.pnr, NOW))
    for (const secret of [demo.lastName, demo.firstName, demo.phone, demo.idNumber, getDb().bookings[demo.pnr]!.accessToken]) {
      expect(json).not.toContain(secret)
    }
    const masked = getMaskedTicket(demo.pnr, NOW)!
    expect(masked.seatIds).toEqual(demo.seatIds)
    expect(masked.passengerCount).toBe(2)
    expect(masked.amountFcfa).toBe(20000)
    expect(masked.stamp).toBe('authentic')
  })

  it('donne les bons tampons de statut', () => {
    seedDemoBookings(NOW)
    const stamp = (i: number) => getMaskedTicket(DEMO_BOOKINGS[i]!.pnr, NOW)!.stamp
    expect(stamp(0)).toBe('authentic')
    expect(stamp(2)).toBe('used')
    expect(stamp(3)).toBe('cancelled')
    expect(getMaskedTicket('MT-AAAAAA-BBBB', NOW)).toBeNull()
  })
})

describe('controle d acces au billet complet', () => {
  it('deverrouille par piece d identite, jamais par telephone', () => {
    seedDemoBookings(NOW)
    const demo = DEMO_BOOKINGS[0]!
    expect(unlockTicket(demo.pnr, demo.phone, '1.1.1.1', NOW).ok).toBe(false)
    expect(unlockTicket(demo.pnr, '+237 ' + demo.phone, '1.1.1.1', NOW).ok).toBe(false)
    const ok = unlockTicket(demo.pnr, '112-233 445', '1.1.1.1', NOW)
    expect(ok.ok).toBe(true)
    if (!ok.ok) return
    const full = getFullTicket(demo.pnr, ok.token, NOW)!
    expect(full.holder.lastName).toBe('Mballa')
    expect(getFullTicket(demo.pnr, 'mauvais-jeton', NOW)).toBeNull()
  })

  it('bloque apres plusieurs echecs', () => {
    seedDemoBookings(NOW)
    const demo = DEMO_BOOKINGS[0]!
    for (let i = 0; i < 5; i++) unlockTicket(demo.pnr, 'FAUX' + i + '12345', '2.2.2.2', NOW)
    const locked = unlockTicket(demo.pnr, demo.idNumber, '2.2.2.2', NOW + 1000)
    expect(locked.ok).toBe(false)
    if (!locked.ok) expect(locked.reason).toBe('locked')
    const later = unlockTicket(demo.pnr, demo.idNumber, '2.2.2.2', NOW + 16 * 60_000)
    expect(later.ok).toBe(true)
  })

  it('le plan du billet met en evidence les sieges sans nom', () => {
    seedDemoBookings(NOW)
    const demo = DEMO_BOOKINGS[0]!
    const t = buildMaskedTicket(getDb().bookings[demo.pnr]!, NOW)!
    expect(t.seatMap.filter((s) => demo.seatIds.includes(s.id)).every((s) => s.status === 'taken')).toBe(true)
    expect(t.availability.length).toBe(1)
  })
})
