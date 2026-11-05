import { beforeEach, describe, expect, it } from 'vitest'
import { useCart } from './cart'

const item = { productId: 'a', name: 'Morango', imageUrl: null }

describe('carrinho', () => {
  beforeEach(() => {
    useCart.setState({ items: [] })
  })

  it('soma a quantidade ao adicionar o mesmo item', () => {
    useCart.getState().add(item)
    useCart.getState().add(item, 2)
    expect(useCart.getState().items).toHaveLength(1)
    expect(useCart.getState().items[0].quantity).toBe(3)
  })

  it('limita a 99 por cupcake', () => {
    useCart.getState().add(item, 98)
    expect(useCart.getState().add(item, 5)).toBe('limit')
    expect(useCart.getState().items[0].quantity).toBe(99)
    useCart.getState().setQuantity('a', 500)
    expect(useCart.getState().items[0].quantity).toBe(99)
  })

  it('remove o item', () => {
    useCart.getState().add(item)
    useCart.getState().remove('a')
    expect(useCart.getState().items).toHaveLength(0)
  })

  it('aceita até 100 cupcakes diferentes', () => {
    for (let i = 0; i < 100; i++) useCart.getState().add({ ...item, productId: `p${i}` })
    expect(useCart.getState().add({ ...item, productId: 'extra' })).toBe('full')
    expect(useCart.getState().items).toHaveLength(100)
  })
})
