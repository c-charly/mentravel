// Types partages entre l'application et le serveur Nitro

export type CityId = 'yaounde' | 'douala' | 'kribi'
export type ClassId = 'business' | 'masterclass-s' | 'masterclass-plus'
export type SeatStatus = 'free' | 'taken' | 'held'
export type IdType = 'cni' | 'passport' | 'other'
export type BookingStatus = 'pending' | 'paid' | 'boarded' | 'cancelled' | 'expired'
export type JourneyStage = 'reserved' | 'paid' | 'boarding' | 'enroute' | 'arrived'
export type VerifyStamp = 'authentic' | 'used' | 'cancelled' | 'pending' | 'unknown'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'timeout'
export type PaymentSim = 'success' | 'fail' | 'timeout'
export type Operator = 'orange' | 'mtn'

export interface Localized {
  fr: string
  en: string
}

export interface RouteDef {
  id: string
  from: CityId
  to: CityId
  km: number
  durationMin: number
  boardingPoint: string
  arrivalPoint: string
}

export interface ClassFare {
  one: number
  round: number
}

export interface OfferInfo {
  classId: ClassId
  price: number
  capacity: number
  left: number
}

export interface DepartureInfo {
  id: string
  routeId: string
  from: CityId
  to: CityId
  date: string
  departureTime: string
  arrivalTime: string
  arrivalNextDay: boolean
  durationMin: number
  boardingPoint: string
  arrivalPoint: string
  departed: boolean
  offers: OfferInfo[]
}

export interface CalendarDeparture {
  id: string
  time: string
  arrival: string
  left: Partial<Record<ClassId, number>>
}

export interface CalendarDay {
  date: string
  departures: CalendarDeparture[]
}

export interface CalendarResponse {
  from: CityId
  to: CityId
  today: string
  capacity: Record<ClassId, number>
  days: CalendarDay[]
}

export interface LayoutSeat {
  id: string
  row: number
  col: number
}

export interface SeatLayout {
  classId: ClassId
  rows: number
  columns: string[]
  aisleAfter: number
  seats: LayoutSeat[]
}

export interface SeatInfo {
  id: string
  status: SeatStatus
}

export interface SeatsResponse {
  departure: DepartureInfo
  classId: ClassId
  price: number
  layout: SeatLayout
  seats: SeatInfo[]
  maxSeats: number
}

export interface HoldResponse {
  holdId: string
  departureId: string
  classId: ClassId
  seatIds: string[]
  expiresAt: string
  holdMinutes: number
}

export interface Holder {
  lastName: string
  firstName: string
  phone: string
  idType: IdType
  idNumber: string
}

export interface MaskedHolder {
  lastName: string
  firstName: string
  phone: string
  idNumber: string
}

export interface TicketRoute {
  fromCity: CityId
  toCity: CityId
  boardingPoint: string
  arrivalPoint: string
  durationMin: number
}

export interface AvailabilityEntry {
  classId: ClassId
  seatsLeft: number
  capacity: number
}

export interface MaskedTicket {
  pnr: string
  departureId: string
  status: BookingStatus
  stamp: VerifyStamp
  stage: JourneyStage
  classId: ClassId
  passengerCount: number
  seatIds: string[]
  route: TicketRoute
  date: string
  departureTime: string
  arrivalTime: string
  arrivalNextDay: boolean
  amountFcfa: number
  amountPaidFcfa: number
  linkedCount: number
  holderMasked: MaskedHolder
  availability: AvailabilityEntry[]
  seatMap: SeatInfo[]
  layout: SeatLayout
}

export interface FullTicket extends MaskedTicket {
  holder: Holder
  linkedPnrs: string[]
}

export interface BookingLegInput {
  holdId: string
}

export interface CreateBookingBody {
  legs: BookingLegInput[]
  holder: Holder
}

export interface CreatedBooking {
  pnr: string
  accessToken: string
  departureId: string
  classId: ClassId
  seatIds: string[]
  amountFcfa: number
  expiresAt: string
}

export interface CreateBookingResponse {
  groupId: string
  totalFcfa: number
  bookings: CreatedBooking[]
}

export interface PaymentResponse {
  paymentId: string
  status: PaymentStatus
  operator: Operator
  amountFcfa: number
  reason?: 'refused' | 'timeout' | 'seats_lost' | 'expired'
}

export interface UnlockResponse {
  token: string
}

export type ParcelKind = 'document' | 'small' | 'medium' | 'large'
export type ParcelStage = 'registered' | 'dropped' | 'onboard' | 'arrived' | 'delivered'

export interface ParcelInput {
  senderName: string
  senderPhone: string
  senderEmail?: string
  kind: ParcelKind
  weightKg: number
  from: CityId
  to: CityId
  sendDate: string
  declaredValue?: number
  receiverName: string
  receiverPhone: string
  notes?: string
}

export interface ParcelView {
  trackingId: string
  kind: ParcelKind
  from: CityId
  to: CityId
  sendDate: string
  weightKg: number
  stage: ParcelStage
  estimateFcfa: number
  receiverMasked: string
  createdAt: string
}

export type TripKind = 'one-way' | 'round-trip' | 'charter'

export interface QuoteInput {
  name: string
  phone: string
  email?: string
  tripKind: TripKind
  passengers: number
  fromPlace: string
  toPlace: string
  startDate: string
  endDate?: string
  occasion?: string
  notes?: string
}
