import { describe, expect, it } from 'vitest'
import { validateScheduledDate } from '../src/modules/orders/schedule'

// 2026-11-04 é quarta-feira; 2026-11-08 e 2026-11-15 são domingos.
const NOW = new Date('2026-11-04T15:00:00Z')

const ok = (value: string, now = NOW) => validateScheduledDate(value, now).valid

describe('validateScheduledDate', () => {
  it('rejeita ontem e hoje', () => {
    expect(ok('2026-11-03')).toBe(false)
    expect(ok('2026-11-04')).toBe(false)
  })

  it('aceita amanhã', () => {
    const r = validateScheduledDate('2026-11-05', NOW)
    expect(r).toEqual({ valid: true, date: new Date('2026-11-05T00:00:00Z') })
  })

  it('aceita até 30 dias e rejeita 31', () => {
    expect(ok('2026-12-04')).toBe(true) // hoje + 30 (sexta)
    expect(ok('2026-12-05')).toBe(false) // hoje + 31
  })

  it('rejeita domingo e aceita o dia seguinte', () => {
    expect(ok('2026-11-08')).toBe(false)
    expect(ok('2026-11-09')).toBe(true)
  })

  it('rejeita formato inválido e datas inexistentes', () => {
    for (const bad of ['2026-02-31', '2026-13-01', '2026-1-5', '05/11/2026', 'abc', '', '2026-11-05T10:00:00Z']) {
      expect(ok(bad)).toBe(false)
    }
  })

  it('usa o fuso de São Paulo: 02:00Z de 5/11 ainda é dia 4', () => {
    const now = new Date('2026-11-05T02:00:00Z')
    expect(ok('2026-11-04', now)).toBe(false) // hoje em SP
    expect(ok('2026-11-05', now)).toBe(true) // amanhã em SP (seria "hoje" em UTC)
  })

  it('vira o dia em São Paulo às 03:00Z', () => {
    const now = new Date('2026-11-05T03:00:00Z')
    expect(ok('2026-11-05', now)).toBe(false)
    expect(ok('2026-11-06', now)).toBe(true)
  })

  it('o limite de 30 dias também respeita o fuso', () => {
    const now = new Date('2026-11-05T02:00:00Z') // dia 4 em SP
    expect(ok('2026-12-04', now)).toBe(true)
    expect(ok('2026-12-05', now)).toBe(false)
  })
})
