// Client d'API typé. Les erreurs sont normalisees pour que l'interface puisse expliquer quoi faire.
import type {
  CalendarResponse,
  CityId,
  ClassId,
  CreateBookingBody,
  CreateBookingResponse,
  DepartureInfo,
  FullTicket,
  HoldResponse,
  MaskedTicket,
  ParcelInput,
  ParcelView,
  PaymentResponse,
  PaymentSim,
  QuoteInput,
  SeatsResponse,
  UnlockResponse,
} from '#shared/types'

export class ApiError extends Error {
  status: number
  code: string
  data: unknown

  constructor(status: number, code: string, data?: unknown) {
    super(code)
    this.status = status
    this.code = code
    this.data = data
  }
}

async function call<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  try {
    return (await $fetch<T>(url, opts)) as T
  } catch (e) {
    const err = e as { statusCode?: number; status?: number; statusMessage?: string; data?: { data?: { code?: string }; statusMessage?: string } }
    const status = err.statusCode ?? err.status ?? 0
    const nested = err.data?.data
    const code = nested?.code ?? err.data?.statusMessage ?? err.statusMessage ?? (status === 0 ? 'network' : 'error')
    throw new ApiError(status, code, nested ?? err.data)
  }
}

export function useMtApi() {
  return {
    calendar: (from: CityId, to: CityId) => call<CalendarResponse>('/api/calendar', { query: { from, to } }),
    departures: (from: CityId, to: CityId, date: string) =>
      call<{ departures: DepartureInfo[] }>('/api/departures', { query: { from, to, date } }),
    seats: (departureId: string, classId: ClassId, hold?: string) =>
      call<SeatsResponse>(`/api/departures/${departureId}/seats`, { query: { class: classId, hold } }),
    hold: (body: { departureId: string; classId: ClassId; seatIds: string[]; replaceHoldId?: string }) =>
      call<HoldResponse>('/api/holds', { method: 'POST', body }),
    release: (holdId: string) => call<{ released: boolean }>(`/api/holds/${holdId}`, { method: 'DELETE' }),
    createBookings: (body: CreateBookingBody) =>
      call<CreateBookingResponse>('/api/bookings', { method: 'POST', body }),
    startPayment: (body: { pnrs: string[]; phone: string; sim?: PaymentSim }) =>
      call<PaymentResponse>('/api/payments', { method: 'POST', body }),
    payment: (id: string) => call<PaymentResponse>(`/api/payments/${id}`),
    verify: (pnr: string) => call<MaskedTicket>(`/api/verify/${pnr}`),
    ticket: (pnr: string, token: string) => call<FullTicket>(`/api/tickets/${pnr}`, { query: { t: token } }),
    unlock: (pnr: string, idNumber: string) =>
      call<UnlockResponse>('/api/tickets/unlock', { method: 'POST', body: { pnr, idNumber } }),
    createParcel: (body: ParcelInput) => call<ParcelView>('/api/parcels', { method: 'POST', body }),
    parcel: (id: string) => call<ParcelView>(`/api/parcels/${id}`),
    createQuote: (body: QuoteInput) =>
      call<{ reference: string; estimateMinFcfa: number; estimateMaxFcfa: number }>('/api/quotes', {
        method: 'POST',
        body,
      }),
  }
}
