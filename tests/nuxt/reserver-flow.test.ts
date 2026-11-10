// Parcours complet de la page de reservation, avec la vraie logique serveur branchee a la place du reseau.
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReserverPage from '~/pages/reserver.vue'
import { createBookings } from '../../server/services/bookings'
import { getCalendar, getDepartureInfo, getSeats, listDepartures, takenSeatsOf } from '../../server/services/catalog'
import { createHold, releaseHold } from '../../server/services/holds'
import { getPayment, startPayment } from '../../server/services/payments'
import { getFullTicket } from '../../server/services/tickets'
import { resetStoreForTests } from '../../server/utils/store'

const holder = vi.hoisted(() => ({ api: {} as Record<string, unknown> }))
mockNuxtImport('useMtApi', () => () => holder.api)

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function apiError(status: number, code: string, data?: unknown) {
  const e = new Error(code) as Error & { status: number; code: string; data: unknown }
  e.status = status
  e.code = code
  e.data = data
  return e
}

function installApi() {
  process.env.NUXT_PAYMENT_DELAY_SEC = '0.2'
  resetStoreForTests()
  holder.api = {
      calendar: async (from: never, to: never) => getCalendar(from, to),
      departures: async (from: never, to: never, date: string) => ({ departures: listDepartures(from, to, date) }),
      seats: async (id: string, classId: never, hold?: string) => getSeats(id, classId, hold),
      hold: async (body: { departureId: string; classId: never; seatIds: string[]; replaceHoldId?: string }) => {
        const res = createHold({ ...body, ownerKey: 'test' }, takenSeatsOf)
        if (!res.ok) throw apiError(409, res.error.code, res.error)
        return res.hold
      },
      release: async (id: string) => ({ released: releaseHold(id) }),
      createBookings: async (body: never) => {
        const res = createBookings(body, 'test')
        if (!res.ok) throw apiError(res.error.code === 'hold_expired' ? 410 : 422, res.error.code, res.error)
        return res.result
      },
      startPayment: async (body: { pnrs: string[]; phone: string }) => {
        const res = startPayment(body)
        if (!res.ok) throw apiError(422, res.error.code)
        return res.payment
      },
      payment: async (id: string) => getPayment(id),
      ticket: async (pnr: string, token: string) => {
        const t = getFullTicket(pnr, token)
        if (!t) throw apiError(401, 'unauthorized')
        return t
      },
  }
}

describe('page de reservation, parcours complet', () => {
  it('va de la date au billet pour un aller simple', async () => {
    installApi()
    const wrapper = await mountSuspended(ReserverPage, { route: '/reserver?de=yaounde&vers=douala&etape=date' })
    const store = useBookingStore()
    store.resetAll()
    await flushPromises()
    await wait(150)

    // 1. date
    expect(store.step).toBe('date')
    const cells = wrapper.findAll('button.cal-cell').filter((c) => c.attributes('disabled') === undefined)
    expect(cells.length).toBeGreaterThan(20)
    await cells[6]!.trigger('click')
    await flushPromises()
    await wait(150)
    expect(store.step).toBe('horaire')
    expect(store.legs[0].date).toBeTruthy()

    // 2. horaire et classe: une voie MasterClass S avec assez de places
    const lanes = wrapper
      .findAll('button.lane')
      .filter((l) => l.attributes('disabled') === undefined && l.attributes('aria-label')!.includes('MasterClass S'))
    expect(lanes.length).toBeGreaterThan(0)
    await lanes[0]!.trigger('click')
    await flushPromises()
    await wait(150)
    expect(store.step).toBe('sieges')
    expect(store.legs[0].classId).toBe('masterclass-s')

    // 3. sieges: deux sieges libres, la retenue demarre
    expect(wrapper.findAll('button.seat').length).toBe(15)
    const free = wrapper.findAll('button.seat').filter((b) => b.attributes('disabled') === undefined)
    expect(free.length).toBeGreaterThanOrEqual(2)
    await free[0]!.trigger('click')
    await free[1]!.trigger('click')
    await wait(650)
    expect(store.legs[0].seatIds).toHaveLength(2)
    expect(store.legs[0].hold).not.toBeNull()
    expect(store.hasActiveHold).toBe(true)

    // 4. continuer vers le titulaire
    const cont = wrapper.findAll('button').find((b) => b.text().includes('Continuer'))!
    await cont.trigger('click')
    await flushPromises()
    await wait(150)
    expect(store.step).toBe('titulaire')
    expect(store.legs[0].confirmed).toBe(true)

    // 5. un seul titulaire pour deux sieges
    store.holder = { lastName: 'Tchoumi', firstName: 'Marie', phone: '655123456', idType: 'cni', idNumber: '123456789' }
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await wait(150)
    expect(store.step).toBe('paiement')
    expect(store.result?.bookings).toHaveLength(1)
    expect(store.result?.bookings[0]?.seatIds).toHaveLength(2)

    // 6. paiement Mobile Money simule, puis billet
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.paying).toBe(true)
    await wait(2600)
    await flushPromises()
    await wait(300)
    expect(store.payment?.status).toBe('success')
    expect(store.step).toBe('billet')
    const pnr = store.result!.bookings[0]!.pnr
    expect(wrapper.text()).toContain(pnr)
    expect(wrapper.text()).toContain('Tchoumi')
  }, 20000)

  it('depuis une URL profonde, saute directement a la frise horaire', async () => {
    const dep = getDepartureInfo(listDepartures('douala', 'kribi', '2026-12-15')[0]!.id)!
    void dep
    const store = useBookingStore()
    store.resetAll()
    await mountSuspended(ReserverPage, { route: '/reserver?de=douala&vers=kribi&d=2026-12-15&etape=horaire' })
    await flushPromises()
    expect(store.from).toBe('douala')
    expect(store.to).toBe('kribi')
    expect(store.legs[0].date).toBe('2026-12-15')
    expect(store.step).toBe('horaire')
  })
})


describe('page de reservation, aller-retour', () => {
  it('enchaine deux trajets, un titulaire, un paiement, deux billets', async () => {
    installApi()
    const wrapper = await mountSuspended(ReserverPage, { route: '/reserver?de=yaounde&vers=douala&etape=date&ar=1' })
    const store = useBookingStore()
    store.resetAll()
    store.setCities('yaounde', 'douala')
    store.setRoundTrip(true)
    await flushPromises()
    await wait(150)
    expect(store.roundTrip).toBe(true)

    async function pickDayAndBusinessSeat(dayIndex: number) {
      const cells = wrapper.findAll('button.cal-cell').filter((c) => c.attributes('disabled') === undefined)
      await cells[dayIndex]!.trigger('click')
      await flushPromises()
      await wait(150)
      const lane = wrapper
        .findAll('button.lane')
        .find((l) => l.attributes('disabled') === undefined && l.attributes('aria-label')!.includes('Business Class'))!
      await lane.trigger('click')
      await flushPromises()
      await wait(150)
      const seat = wrapper.findAll('button.seat').find((b) => b.attributes('disabled') === undefined)!
      await seat.trigger('click')
      await wait(650)
      await wrapper.findAll('button').find((b) => b.text().includes('Continuer') || b.text().includes('Choisir le retour'))!.trigger('click')
      await flushPromises()
      await wait(150)
    }

    // Aller
    await pickDayAndBusinessSeat(2)
    expect(store.step).toBe('date')
    expect(store.activeLeg).toBe(1)
    expect(store.legs[0].confirmed).toBe(true)

    // Retour: le calendrier du retour ne propose rien avant l'aller
    await wait(150)
    const outDate = store.legs[0].date!
    const returnCells = wrapper.findAll('button.cal-cell')
    expect(returnCells.some((c) => c.attributes('disabled') !== undefined)).toBe(true)
    await pickDayAndBusinessSeat(4)
    expect(store.legs[1].date! >= outDate).toBe(true)
    expect(store.step).toBe('titulaire')
    expect(store.allConfirmed).toBe(true)
    expect(store.totalFcfa).toBe(16000)

    store.holder = { lastName: 'Kamga', firstName: 'Luc', phone: '677123456', idType: 'passport', idNumber: 'CE998877' }
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await wait(150)
    expect(store.result?.bookings).toHaveLength(2)
    expect(store.result?.totalFcfa).toBe(16000)
    expect(store.step).toBe('paiement')

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await wait(2800)
    await flushPromises()
    await wait(300)
    expect(store.step).toBe('billet')
    const [a, b] = store.result!.bookings
    expect(wrapper.text()).toContain(a!.pnr)
    const tabs = wrapper.findAll('button[role="tab"]')
    expect(tabs).toHaveLength(2)
    await tabs[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(b!.pnr)
  }, 25000)
})
