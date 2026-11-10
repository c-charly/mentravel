// Reseau MEN TRAVEL: villes, lignes, horaires, tarifs, classes.
// Source: audit du site existant (docs/audit-source.md). Modifiable sans toucher aux composants.
import type { CityId, ClassFare, ClassId, Localized, RouteDef } from '../shared/types'

export const SETTINGS = {
  maxSeats: 5,
  holdMinutes: 10,
  calendarDays: 60,
  alertSecondsLeft: 120,
  // En dessous de ce nombre de places, un horaire est signale "dernieres places"
  lastSeatsThreshold: 6,
  // Part de places restantes sous laquelle un jour est "en tension"
  tightRatio: 0.3,
  // Fuseau de reference: Africa/Douala (UTC+1, sans heure d'ete)
  utcOffsetMinutes: 60,
  boardingOpensMinutesBefore: 60,
  // Les ventes ferment 30 minutes avant le depart
  bookingCutoffMinutes: 30,
} as const

export const CITY_IDS: CityId[] = ['yaounde', 'douala', 'kribi']

export const CITIES: Record<
  CityId,
  { id: CityId; name: string; agency: string; tagline: Localized }
> = {
  yaounde: {
    id: 'yaounde',
    name: 'Yaoundé',
    agency: 'Agence Nylon Bastos',
    tagline: { fr: 'La capitale aux sept collines', en: 'The capital of seven hills' },
  },
  douala: {
    id: 'douala',
    name: 'Douala',
    agency: 'Agence Akwa',
    tagline: { fr: 'Le grand port qui ne dort jamais', en: 'The great port that never sleeps' },
  },
  kribi: {
    id: 'kribi',
    name: 'Kribi',
    agency: 'Agence Kribi Centre',
    tagline: { fr: 'Là où la forêt finit dans l\'océan', en: 'Where the forest meets the ocean' },
  },
}

export const CLASS_IDS: ClassId[] = ['business', 'masterclass-s', 'masterclass-plus']

export interface EquipmentDef {
  icon: string
  label: Localized
}

export const EQUIPMENTS: Record<string, EquipmentDef> = {
  ac: { icon: 'lucide:snowflake', label: { fr: 'Climatisation', en: 'Air conditioning' } },
  tv: { icon: 'lucide:tv', label: { fr: 'TV à bord', en: 'On-board TV' } },
  tvPersonal: { icon: 'lucide:monitor-play', label: { fr: 'TV personnelle', en: 'Personal screen' } },
  toilet: { icon: 'lucide:door-closed', label: { fr: 'Toilettes', en: 'Toilet' } },
  snack: { icon: 'lucide:cookie', label: { fr: 'Casse-croûte', en: 'Snack' } },
  drinkIncluded: { icon: 'lucide:cup-soda', label: { fr: 'Boisson offerte', en: 'Free drink' } },
  fullMeal: { icon: 'lucide:utensils', label: { fr: 'Repas complet', en: 'Full meal' } },
  drinks: { icon: 'lucide:wine', label: { fr: 'Boissons', en: 'Drinks' } },
  bed: { icon: 'lucide:bed-double', label: { fr: 'Sièges-lits', en: 'Lie-flat seats' } },
  wifi: { icon: 'lucide:wifi', label: { fr: 'Wi-Fi', en: 'Wi-Fi' } },
  netflix: { icon: 'lucide:clapperboard', label: { fr: 'Netflix', en: 'Netflix' } },
  charger: { icon: 'lucide:zap', label: { fr: 'Borne de recharge', en: 'Charging point' } },
  headphones: { icon: 'lucide:headphones', label: { fr: 'Écouteurs', en: 'Headphones' } },
  pillow: { icon: 'lucide:sofa', label: { fr: 'Coussin de voyage', en: 'Travel pillow' } },
  usb: { icon: 'lucide:plug', label: { fr: 'Prises USB', en: 'USB sockets' } },
}

export interface ClassDef {
  id: ClassId
  name: string
  tier: Localized
  tagline: Localized
  layoutLabel: string
  seats: number
  rows: number
  strokes: 1 | 2 | 3
  equipments: string[]
}

export const CLASSES: Record<ClassId, ClassDef> = {
  business: {
    id: 'business',
    name: 'Business Class',
    tier: { fr: 'Essentiel', en: 'Essential' },
    tagline: { fr: 'Le voyage malin', en: 'The smart way to travel' },
    layoutLabel: '2+2',
    seats: 35,
    rows: 9,
    strokes: 1,
    equipments: ['ac', 'tv', 'toilet', 'snack'],
  },
  'masterclass-s': {
    id: 'masterclass-s',
    name: 'MasterClass S',
    tier: { fr: 'Confort+', en: 'Comfort+' },
    tagline: { fr: 'Le confort accessible', en: 'Accessible comfort' },
    layoutLabel: '2+1',
    seats: 15,
    rows: 5,
    strokes: 2,
    equipments: ['ac', 'snack', 'toilet', 'tvPersonal', 'drinkIncluded'],
  },
  'masterclass-plus': {
    id: 'masterclass-plus',
    name: 'MasterClass Plus',
    tier: { fr: 'Premium', en: 'Premium' },
    tagline: { fr: 'L\'excellence du voyage', en: 'Travel at its finest' },
    layoutLabel: '2+1',
    seats: 9,
    rows: 3,
    strokes: 3,
    equipments: [
      'ac', 'bed', 'wifi', 'netflix', 'fullMeal', 'tvPersonal', 'toilet', 'charger',
      'headphones', 'pillow', 'drinks',
    ],
  },
}

export const BOARD_AMENITIES = ['wifi', 'ac', 'usb'] as const

interface PairDef {
  a: CityId
  b: CityId
  km: number
  durationMin: number
  // Horaires publies pour la Business seule
  businessTimes: string[]
  // Horaires MasterClass: ces departs proposent aussi la Business (bus double-etage de 59 sieges)
  masterTimes: string[]
  fares: Record<ClassId, ClassFare>
}

const PAIRS: PairDef[] = [
  {
    a: 'yaounde',
    b: 'douala',
    km: 245,
    durationMin: 240,
    businessTimes: ['03:30', '04:30', '05:00', '06:30', '08:30', '12:30', '15:30', '17:00', '19:30', '21:00'],
    masterTimes: ['04:00', '14:00', '18:00'],
    fares: {
      business: { one: 10000, round: 16000 },
      'masterclass-s': { one: 15000, round: 25000 },
      'masterclass-plus': { one: 20000, round: 35000 },
    },
  },
  {
    a: 'yaounde',
    b: 'kribi',
    km: 185,
    durationMin: 300,
    businessTimes: ['06:00', '10:30', '14:00', '18:00', '21:00'],
    masterTimes: ['08:00', '15:30'],
    fares: {
      business: { one: 8000, round: 15000 },
      'masterclass-s': { one: 10000, round: 18000 },
      'masterclass-plus': { one: 15000, round: 25000 },
    },
  },
  {
    a: 'douala',
    b: 'kribi',
    km: 165,
    durationMin: 300,
    businessTimes: ['04:00', '08:30', '12:30', '15:30', '18:00'],
    masterTimes: ['10:30', '18:00'],
    fares: {
      business: { one: 5000, round: 9000 },
      'masterclass-s': { one: 8000, round: 15000 },
      'masterclass-plus': { one: 10000, round: 18000 },
    },
  },
]

function buildRoutes(): RouteDef[] {
  const out: RouteDef[] = []
  for (const p of PAIRS) {
    for (const [from, to] of [[p.a, p.b], [p.b, p.a]] as [CityId, CityId][]) {
      out.push({
        id: `${from}-${to}`,
        from,
        to,
        km: p.km,
        durationMin: p.durationMin,
        boardingPoint: CITIES[from].agency,
        arrivalPoint: CITIES[to].agency,
      })
    }
  }
  return out
}

export const ROUTES: RouteDef[] = buildRoutes()

export function getPair(a: CityId, b: CityId): PairDef | undefined {
  return PAIRS.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a))
}

export function getRoute(from: CityId, to: CityId): RouteDef | undefined {
  return ROUTES.find((r) => r.from === from && r.to === to)
}

export function getRouteById(id: string): RouteDef | undefined {
  return ROUTES.find((r) => r.id === id)
}

export function fareFor(from: CityId, to: CityId, classId: ClassId): ClassFare {
  const pair = getPair(from, to)
  if (!pair) throw new Error('Ligne inconnue')
  return pair.fares[classId]
}

// Horaires d'un jour pour une ligne: union des horaires, classes proposees par horaire.
export interface TimetableEntry {
  time: string
  classes: ClassId[]
}

export function timetableFor(from: CityId, to: CityId): TimetableEntry[] {
  const pair = getPair(from, to)
  if (!pair) return []
  const entries: TimetableEntry[] = [
    ...pair.businessTimes.map((t) => ({ time: t, classes: ['business'] as ClassId[] })),
    ...pair.masterTimes.map((t) => ({ time: t, classes: [...CLASS_IDS] as ClassId[] })),
  ]
  const merged = new Map<string, Set<ClassId>>()
  for (const e of entries) {
    const set = merged.get(e.time) ?? new Set<ClassId>()
    e.classes.forEach((c) => set.add(c))
    merged.set(e.time, set)
  }
  return [...merged.entries()]
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([time, set]) => ({ time, classes: CLASS_IDS.filter((c) => set.has(c)) }))
}

export const BRAND = {
  name: 'MEN TRAVEL',
  signature: { fr: 'Une autre vision du voyage', en: 'A different vision of travel' } as Localized,
  address: 'Nylon Bastos, Yaoundé',
  phoneDisplay: '+237 6 53 67 74 43',
  phoneRaw: '+237653677443',
  whatsapp: '237653677443',
  email: 'contact@men-travel.cm',
  hours: { fr: '7j/7, de 6h à 22h', en: '7 days a week, 6am to 10pm' } as Localized,
  ussd: { orange: '#150#', mtn: '*126#' },
}
