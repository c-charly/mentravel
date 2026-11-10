// Billets de demonstration avec PNR connus (verification et deverrouillage).
// Recrees a chaque demarrage pour que les dates restent dans le futur.
import { addDays, compactTime, todayDouala } from '../../shared/time'
import { legAmounts } from '../../shared/pricing'
import type { CityId, ClassId } from '../../shared/types'
import { generateToken } from '../utils/random'
import { getDb, persist, type StoredBooking } from '../utils/store'
import { buildDepartureId } from './catalog'

interface DemoDef {
  pnr: string
  dayOffset: number
  from: CityId
  to: CityId
  time: string
  classId: ClassId
  seatIds: string[]
  status: StoredBooking['status']
  lastName: string
  firstName: string
  phone: string
  idType: 'cni' | 'passport'
  idNumber: string
}

export const DEMO_BOOKINGS: DemoDef[] = [
  {
    pnr: 'MT-K7N2QX-4HDM',
    dayOffset: 3,
    from: 'yaounde',
    to: 'douala',
    time: '08:30',
    classId: 'business',
    seatIds: ['3A', '3B'],
    status: 'paid',
    lastName: 'Mballa',
    firstName: 'Jean-Pierre',
    phone: '677112233',
    idType: 'cni',
    idNumber: '112233445',
  },
  {
    pnr: 'MT-P5R8WZ-9CTE',
    dayOffset: 6,
    from: 'douala',
    to: 'kribi',
    time: '10:30',
    classId: 'masterclass-plus',
    seatIds: ['1A'],
    status: 'paid',
    lastName: 'Ngono',
    firstName: 'Aline',
    phone: '699887766',
    idType: 'passport',
    idNumber: 'CE123456',
  },
  {
    pnr: 'MT-B3F6HM-2VKP',
    dayOffset: -1,
    from: 'kribi',
    to: 'yaounde',
    time: '08:00',
    classId: 'masterclass-s',
    seatIds: ['2B', '2C'],
    status: 'boarded',
    lastName: 'Essomba',
    firstName: 'Paul',
    phone: '655443322',
    idType: 'cni',
    idNumber: '998877665',
  },
  {
    pnr: 'MT-C9L4TS-6WJN',
    dayOffset: 10,
    from: 'yaounde',
    to: 'douala',
    time: '14:00',
    classId: 'business',
    seatIds: ['5A'],
    status: 'cancelled',
    lastName: 'Fotso',
    firstName: 'Carine',
    phone: '690112244',
    idType: 'cni',
    idNumber: '554433221',
  },
]

export function seedDemoBookings(now = Date.now()): void {
  const db = getDb()
  for (const [pnr, b] of Object.entries(db.bookings)) {
    if (b.demo) Reflect.deleteProperty(db.bookings, pnr)
  }
  const today = todayDouala(now)
  for (const d of DEMO_BOOKINGS) {
    const date = addDays(today, d.dayOffset)
    const depId = buildDepartureId(d.from, d.to, date, d.time)
    const [amount] = legAmounts([{ from: d.from, to: d.to, classId: d.classId, seatCount: d.seatIds.length }])
    db.bookings[d.pnr] = {
      pnr: d.pnr,
      accessToken: generateToken(),
      groupId: `grp_demo_${compactTime(d.time)}_${d.pnr.slice(3, 9)}`,
      departureId: depId,
      classId: d.classId,
      seatIds: d.seatIds,
      holder: {
        lastName: d.lastName,
        firstName: d.firstName,
        phone: d.phone,
        idType: d.idType,
        idNumber: d.idNumber,
      },
      amountFcfa: amount!,
      amountPaidFcfa: d.status === 'cancelled' ? 0 : amount!,
      status: d.status,
      createdAt: new Date(now - 86400000).toISOString(),
      paidAt: new Date(now - 86000000).toISOString(),
      demo: true,
    }
  }
  persist()
}
