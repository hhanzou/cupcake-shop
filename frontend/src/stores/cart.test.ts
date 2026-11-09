import { beforeEach, describe, expect, it } from 'vitest'
import { migrateCart, previewKey, productTotal, toOrderItems, toPriceItems, useCart, type CartLine } from './cart'

const item = { productId: 'a', name: 'Morango', imageUrl: null }
const cart = () => useCart.getState()
const lines = () => cart().items

describe('carrinho', () => {
  beforeEach(() => {
    useCart.setState({ items: [] })
  })

  it('soma na mesma linha quando o cupcake e a observação são iguais', () => {
    cart().add(item)
    cart().add(item, 2)
    cart().add({ ...item, notes: 'sem amendoim' })
    cart().add({ ...item, notes: '  sem amendoim ' })
    expect(lines()).toHaveLength(2)
    expect(lines().map((l) => [l.notes.trim(), l.quantity])).toEqual([
      ['', 3],
      ['sem amendoim', 2],
    ])
  })

  it('o limite de 99 vale para o cupcake, somando as linhas', () => {
    cart().add(item, 60)
    expect(cart().add({ ...item, notes: 'sem amendoim' }, 50)).toBe('limit')
    expect(productTotal(lines(), 'a')).toBe(99)
    expect(cart().add(item)).toBe('limit')

    const [first, second] = lines()
    cart().setQuantity(second.id, 500)
    expect(productTotal(lines(), 'a')).toBe(99)
    cart().setQuantity(first.id, 1)
    cart().setQuantity(second.id, 500)
    expect(lines()[1].quantity).toBe(98)
  })

  it('cria outra linha do mesmo cupcake para uma observação diferente', () => {
    cart().add(item, 2)
    const original = lines()[0]
    expect(cart().addVariant(original.id)).toBe('added')
    expect(lines()).toHaveLength(2)
    expect(lines()[1]).toMatchObject({ productId: 'a', quantity: 1, notes: '' })
    expect(lines()[1].id).not.toBe(original.id)
  })

  it('guarda a observação limitada a 200 caracteres', () => {
    cart().add(item)
    const id = lines()[0].id
    cart().setNotes(id, 'sem amendoim')
    expect(lines()[0].notes).toBe('sem amendoim')
    cart().setNotes(id, 'x'.repeat(250))
    expect(lines()[0].notes).toHaveLength(200)
  })

  it('junta linhas que ficaram com a mesma observação', () => {
    cart().add({ ...item, notes: 'sem amendoim' }, 2)
    cart().add({ ...item, notes: 'morango extra' })
    cart().setNotes(lines()[1].id, 'sem amendoim ')
    cart().mergeDuplicates()
    expect(lines()).toHaveLength(1)
    expect(lines()[0].quantity).toBe(3)
  })

  it('remove só a linha escolhida', () => {
    cart().add(item)
    cart().add({ ...item, notes: 'sem amendoim' })
    cart().remove(lines()[0].id)
    expect(lines()).toHaveLength(1)
    expect(lines()[0].notes).toBe('sem amendoim')
  })

  it('aceita até 100 linhas', () => {
    for (let i = 0; i < 100; i++) cart().add({ ...item, productId: `p${i}` })
    expect(cart().add({ ...item, productId: 'extra' })).toBe('full')
    expect(lines()).toHaveLength(100)
  })

  it('converte o carrinho salvo no formato antigo (um item por cupcake)', () => {
    const state = migrateCart({ items: [{ productId: 'a', quantity: 2, name: 'Morango', imageUrl: null }] }, 0)
    expect(state.items[0]).toMatchObject({ productId: 'a', quantity: 2, notes: '' })
    expect(state.items[0].id).toBeTruthy()
  })
})

describe('formato para a API', () => {
  const line = (over: Partial<CartLine>): CartLine => ({
    id: Math.random().toString(),
    productId: 'a',
    quantity: 1,
    name: 'Morango',
    imageUrl: null,
    notes: '',
    ...over,
  })

  it('pedido: uma entrada por linha, observação sem espaços e omitida se vazia', () => {
    expect(
      toOrderItems([
        line({ quantity: 2, notes: '  sem amendoim  ' }),
        line({ quantity: 1, notes: 'morango extra' }),
        line({ productId: 'b', quantity: 3, notes: '   ' }),
      ]),
    ).toEqual([
      { productId: 'a', quantity: 2, notes: 'sem amendoim' },
      { productId: 'a', quantity: 1, notes: 'morango extra' },
      { productId: 'b', quantity: 3 },
    ])
  })

  it('preview: soma as linhas por cupcake e ignora observações', () => {
    const items = [line({ quantity: 2, notes: 'sem amendoim' }), line({ quantity: 1 }), line({ productId: 'b' })]
    expect(toPriceItems(items)).toEqual([
      { productId: 'a', quantity: 3 },
      { productId: 'b', quantity: 1 },
    ])
    // Mudar só a observação não muda a chave, então não refaz a consulta.
    expect(previewKey(items)).toEqual(previewKey([...items.slice(0, 2).map((l) => ({ ...l, notes: 'x' })), items[2]]))
    expect(previewKey([])).toBeNull()
  })
})
