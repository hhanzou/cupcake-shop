import { describe, expect, it } from 'vitest'
import { safeNext } from './safe-next'

describe('safeNext', () => {
  it('aceita caminhos internos', () => {
    expect(safeNext('/pedidos')).toBe('/pedidos')
    expect(safeNext('/pedidos/abc?x=1')).toBe('/pedidos/abc?x=1')
  })
  it('recusa destinos externos', () => {
    expect(safeNext('//site.com')).toBe('/')
    expect(safeNext('https://site.com')).toBe('/')
    expect(safeNext('/\\site.com')).toBe('/')
    expect(safeNext('javascript:alert(1)')).toBe('/')
  })
  it('usa / quando vazio', () => {
    expect(safeNext(null)).toBe('/')
    expect(safeNext(undefined)).toBe('/')
    expect(safeNext('')).toBe('/')
  })
})
