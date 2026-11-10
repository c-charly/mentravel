import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import PlanBus from '~/components/booking/PlanBus.vue'
import CalendrierCodeBarres from '~/components/booking/CalendrierCodeBarres.vue'
import FriseHoraire from '~/components/booking/FriseHoraire.vue'
import { getCalendar, getSeats, listDepartures } from '../../server/services/catalog'
import { addDays, todayDouala } from '../../shared/time'

const NOW = Date.now()
const DATE = addDays(todayDouala(NOW), 9)

registerEndpoint('/api/calendar', () => getCalendar('yaounde', 'douala', undefined, 60, NOW))
registerEndpoint('/api/departures', () => ({ departures: listDepartures('yaounde', 'douala', DATE, NOW) }))

let holdCount = 0
registerEndpoint('/api/holds', {
  method: 'POST',
  handler: () => {
    holdCount += 1
    return {
      holdId: `hold_test_${holdCount}`,
      departureId: 'x',
      classId: 'business',
      seatIds: [],
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      holdMinutes: 10,
    }
  },
})

describe('PlanBus', () => {
  const depId = listDepartures('yaounde', 'douala', DATE, NOW)[0]!.id

  it('affiche 35 sieges Business et emet les clics', async () => {
    const data = getSeats(depId, 'business', undefined, NOW)!
    const wrapper = await mountSuspended(PlanBus, {
      props: { layout: data.layout, seats: data.seats, classId: 'business', selected: [], max: 5 },
    })
    const buttons = wrapper.findAll('button.seat')
    expect(buttons).toHaveLength(35)
    const free = buttons.find((b) => b.attributes('disabled') === undefined)!
    await free.trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
  })

  it('bloque au dela du maximum et le signale', async () => {
    const data = getSeats(depId, 'business', undefined, NOW)!
    const freeIds = data.seats.filter((s) => s.status === 'free').map((s) => s.id)
    const picked = freeIds.slice(0, 5)
    const target = freeIds[5]
    expect(target).toBeDefined()
    const wrapper = await mountSuspended(PlanBus, {
      props: { layout: data.layout, seats: data.seats, classId: 'business', selected: picked, max: 5 },
    })
    await wrapper.find(`button[aria-label^="Siège ${target}"]`).trigger('click')
    expect(wrapper.emitted('limit')).toBeTruthy()
    expect(wrapper.emitted('toggle')).toBeFalsy()
    expect(wrapper.findAll('button[aria-pressed="true"]')).toHaveLength(5)
  })

  it('rend le plan en lecture seule avec les sieges du billet', async () => {
    const masterDep = listDepartures('yaounde', 'douala', DATE, NOW).find((d) => d.departureTime === '14:00')!
    const data = getSeats(masterDep.id, 'masterclass-plus', undefined, NOW)!
    const wrapper = await mountSuspended(PlanBus, {
      props: { layout: data.layout, seats: data.seats, classId: 'masterclass-plus', highlight: ['1A'], readonly: true },
    })
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.findAll('.seat')).toHaveLength(9)
    expect(wrapper.find('.seat-mine').text()).toContain('1A')
  })
})

describe('CalendrierCodeBarres', () => {
  it('affiche 60 jours en codes-barres et emet la date choisie', async () => {
    const wrapper = await mountSuspended(CalendrierCodeBarres, {
      props: { from: 'yaounde', to: 'douala', leg: 0, selected: null },
    })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 50))
    const cells = wrapper.findAll('button.cal-cell')
    expect(cells.length).toBe(60)
    const enabled = cells.filter((c) => c.attributes('disabled') === undefined)
    expect(enabled.length).toBeGreaterThan(30)
    expect(cells[10]!.findAll('span.min-w-\\[2px\\]').length).toBeGreaterThan(5)
    await enabled[3]!.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('le filtre de classe recalcule les barres sans erreur', async () => {
    const wrapper = await mountSuspended(CalendrierCodeBarres, {
      props: { from: 'yaounde', to: 'douala', leg: 0, selected: null },
    })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 50))
    const chips = wrapper.findAll('button[aria-pressed]').filter((b) => b.text().includes('MasterClass Plus'))
    await chips[0]!.trigger('click')
    expect(useBookingStore().classFilter).toBe('masterclass-plus')
    expect(wrapper.findAll('button.cal-cell').length).toBe(60)
    useBookingStore().classFilter = 'all'
  })

  it('desactive les jours avant la date d aller pour le retour', async () => {
    const out = addDays(todayDouala(NOW), 5)
    const wrapper = await mountSuspended(CalendrierCodeBarres, {
      props: { from: 'douala', to: 'yaounde', leg: 1, minDate: out, selected: null },
    })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 50))
    const cells = wrapper.findAll('button.cal-cell')
    expect(cells.slice(0, 5).every((c) => c.attributes('disabled') !== undefined)).toBe(true)
    expect(cells.slice(5).some((c) => c.attributes('disabled') === undefined)).toBe(true)
  })
})

describe('FriseHoraire', () => {
  it('liste les departs avec une voie par classe et emet le choix', async () => {
    const wrapper = await mountSuspended(FriseHoraire, {
      props: { from: 'yaounde', to: 'douala', date: DATE },
    })
    await flushPromises()
    await new Promise((r) => setTimeout(r, 50))
    expect(wrapper.findAll('ol > li').length).toBe(13)
    const lanes = wrapper.findAll('button.lane')
    expect(lanes.length).toBeGreaterThan(13)
    const open = lanes.find((l) => l.attributes('disabled') === undefined)!
    await open.trigger('click')
    const emitted = wrapper.emitted('pick')!
    expect(emitted).toHaveLength(1)
    expect((emitted[0] as unknown[])[0]).toHaveProperty('departureTime')
  })
})

describe('store de reservation', () => {
  beforeEach(() => {
    useBookingStore().resetAll()
    useBookingStore().setRoundTrip(false)
  })

  it('retient les sieges apres selection et calcule le total', async () => {
    const store = useBookingStore()
    store.setCities('yaounde', 'douala')
    store.pickDate(0, DATE)
    store.pickOffer(0, { departureId: 'yaounde-douala_x_0830', time: '08:30', arrivalTime: '12:30', arrivalNextDay: false, classId: 'business', unitPrice: 10000 })
    store.setSeats(0, ['3A', '3B'])
    await new Promise((r) => setTimeout(r, 500))
    expect(store.legs[0].hold?.holdId).toMatch(/^hold_test_/)
    expect(store.totalFcfa).toBe(20000)
    expect(store.holdExpiresAt).toBeGreaterThan(Date.now())
    expect(store.hasActiveHold).toBe(true)
  })

  it('applique le tarif aller-retour et limite les etapes accessibles', () => {
    const store = useBookingStore()
    store.setCities('yaounde', 'douala')
    store.setRoundTrip(true)
    store.pickDate(0, DATE)
    expect(store.maxReachable()).toBe('horaire')
    expect(store.canGo('sieges')).toBe(false)
    store.pickOffer(0, { departureId: 'a', time: '08:30', arrivalTime: '12:30', arrivalNextDay: false, classId: 'business', unitPrice: 10000 })
    store.legs[0].seatIds = ['1A']
    store.legs[1].classId = 'business'
    store.legs[1].seatIds = ['2A']
    expect(store.totalFcfa).toBe(16000)
  })

  it('inverser le trajet reinitialise la selection', () => {
    const store = useBookingStore()
    store.setCities('yaounde', 'kribi')
    store.pickDate(0, DATE)
    store.swapCities()
    expect(store.from).toBe('kribi')
    expect(store.to).toBe('yaounde')
    expect(store.legs[0].date).toBeNull()
  })
})

