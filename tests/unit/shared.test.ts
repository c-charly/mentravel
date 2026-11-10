import { describe, expect, it } from 'vitest'
import { estimateParcel, estimateQuote, busSizeFor } from '../../shared/quote'
import {
  detectOperator,
  formatPnrInput,
  isValidIdNumber,
  isValidName,
  isValidPhone,
  isValidPnr,
  normalizePhone,
} from '../../shared/validation'
import { arrivalOf, addDays, instantOf } from '../../shared/time'

describe('telephone', () => {
  it('normalise et valide les numeros camerounais', () => {
    expect(normalizePhone('+237 6 53 67 74 43')).toBe('653677443')
    expect(normalizePhone('237653677443')).toBe('653677443')
    expect(isValidPhone('653677443')).toBe(true)
    expect(isValidPhone('553677443')).toBe(false)
    expect(isValidPhone('65367744')).toBe(false)
  })
  it('detecte l operateur Mobile Money', () => {
    expect(detectOperator('677 12 34 56')).toBe('mtn')
    expect(detectOperator('650123456')).toBe('mtn')
    expect(detectOperator('655123456')).toBe('orange')
    expect(detectOperator('699123456')).toBe('orange')
    expect(detectOperator('662123456')).toBeNull()
  })
})

describe('identite et PNR', () => {
  it('valide noms et pieces', () => {
    expect(isValidName("Ngo N'Dongo")).toBe(true)
    expect(isValidName('A')).toBe(false)
    expect(isValidName('12')).toBe(false)
    expect(isValidIdNumber('112 233-445')).toBe(true)
    expect(isValidIdNumber('12')).toBe(false)
  })
  it('guide la saisie du PNR', () => {
    expect(formatPnrInput('k7n2qx4hdm')).toBe('MT-K7N2QX-4HDM')
    expect(formatPnrInput('MT-K7N2QX-4HDM')).toBe('MT-K7N2QX-4HDM')
    expect(isValidPnr('MT-K7N2QX-4HDM')).toBe(true)
    expect(isValidPnr('MT-K7N2QX-4HD0')).toBe(false)
  })
})

describe('temps', () => {
  it('calcule l arrivee avec passage de minuit', () => {
    expect(arrivalOf('21:00', 240)).toEqual({ time: '01:00', nextDay: true })
    expect(arrivalOf('08:30', 240)).toEqual({ time: '12:30', nextDay: false })
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(instantOf('2026-11-05', '10:00')).toBe(Date.UTC(2026, 10, 5, 9, 0))
  })
})

describe('estimations', () => {
  it('choisit la taille de bus', () => {
    expect(busSizeFor(12)).toEqual({ size: 15, count: 1 })
    expect(busSizeFor(45)).toEqual({ size: 50, count: 1 })
    expect(busSizeFor(150)).toEqual({ size: 70, count: 3 })
  })
  it('estime un devis et un colis', () => {
    const q = estimateQuote({ tripKind: 'one-way', passengers: 30, fromPlace: 'Yaoundé', toPlace: 'Douala', startDate: '2026-12-01' })
    expect(q.busSize).toBe(30)
    expect(q.minFcfa).toBeLessThan(q.maxFcfa)
    expect(estimateParcel('document', 0.2, 'douala', 'kribi')).toBe(1500)
    expect(estimateParcel('small', 3, 'yaounde', 'douala')).toBe(3800)
  })
})
