import type { H3Event } from 'h3'

export function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}

export function badRequest(message: string, data?: unknown): never {
  throw createError({ statusCode: 400, statusMessage: message, data })
}
