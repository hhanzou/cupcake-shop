import { describe, expect, it } from 'vitest'
import { formatPrice, toApiPrice } from './money'

describe('formatPrice', () => {
  it('formata em reais', () => {
    expect(formatPrice('20.00')).toBe('R$ 20,00')
    expect(formatPrice('1234.50')).toBe('R$ 1.234,50')
  })
})

describe('toApiPrice', () => {
  it('troca vírgula por ponto', () => {
    expect(toApiPrice('12,50')).toBe('12.50')
    expect(toApiPrice('12.5')).toBe('12.50')
    expect(toApiPrice('12')).toBe('12.00')
  })
  it('recusa valores inválidos ou com mais de 2 casas', () => {
    expect(toApiPrice('')).toBeNull()
    expect(toApiPrice('abc')).toBeNull()
    expect(toApiPrice('1,234')).toBeNull()
    expect(toApiPrice('-5')).toBeNull()
  })
})
