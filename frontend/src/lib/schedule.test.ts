import { describe, expect, it } from 'vitest'
import { formatDate, getAvailableDates } from './schedule'

describe('getAvailableDates', () => {
  // 02:00 UTC ainda é dia 4 em São Paulo (UTC-3)
  const dates = getAvailableDates(new Date('2026-11-05T02:00:00Z'))

  it('começa em amanhã, no fuso de São Paulo', () => {
    expect(dates[0]).toBe('2026-11-05')
    expect(dates).not.toContain('2026-11-04')
  })
  it('exclui domingos', () => {
    expect(dates).not.toContain('2026-11-08')
    expect(dates).toContain('2026-11-09')
  })
  it('termina 30 dias à frente', () => {
    expect(dates[dates.length - 1]).toBe('2026-12-04')
    expect(dates).not.toContain('2026-12-05')
  })
  it('vira o dia em São Paulo, não em UTC', () => {
    const later = getAvailableDates(new Date('2026-11-05T04:00:00Z'))
    expect(later[0]).toBe('2026-11-06')
  })
})

describe('formatDate', () => {
  it('não desloca o dia', () => {
    expect(formatDate('2026-11-20')).toBe('20/11/2026')
    expect(formatDate('2026-11-20T00:00:00.000Z')).toBe('20/11/2026')
  })
})
