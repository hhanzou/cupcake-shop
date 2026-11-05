import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { createProduct, db, resetDb } from './helpers'

describe('cart preview', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })
  afterAll(async () => {
    await app.close()
    await db().$disconnect()
  })
  beforeEach(resetDb)

  const preview = (items: unknown) =>
    app.inject({ method: 'POST', url: '/cart/preview', payload: { items } })

  it('funciona sem token e calcula preços e total com o banco', async () => {
    const a = await createProduct({ name: 'A', price: '12.50' })
    const b = await createProduct({ name: 'B', price: '0.10' })
    const res = await preview([
      { productId: a.id, quantity: 2 },
      { productId: b.id, quantity: 3 },
    ])
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe('25.30')
    expect(body.unavailableProductIds).toEqual([])
    expect(body.items).toContainEqual({
      productId: a.id,
      name: 'A',
      quantity: 2,
      unitPrice: '12.50',
      lineTotal: '25.00',
    })
  })

  it('soma quantidades repetidas', async () => {
    const a = await createProduct({ price: '5.00' })
    const body = (
      await preview([
        { productId: a.id, quantity: 1 },
        { productId: a.id, quantity: 4 },
      ])
    ).json()
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toMatchObject({ quantity: 5, lineTotal: '25.00' })
    expect(body.total).toBe('25.00')
  })

  it('itens indisponíveis vão para unavailableProductIds, sem erro', async () => {
    const ok = await createProduct({ price: '4.00' })
    const inactive = await createProduct({ active: false })
    const res = await preview([
      { productId: ok.id, quantity: 1 },
      { productId: inactive.id, quantity: 1 },
      { productId: 'nao-existe', quantity: 1 },
    ])
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.items).toHaveLength(1)
    expect(body.total).toBe('4.00')
    expect(body.unavailableProductIds.sort()).toEqual([inactive.id, 'nao-existe'].sort())
  })

  it('carrinho vazio devolve total 0.00 e quantidade inválida dá 400', async () => {
    const p = await createProduct()
    expect((await preview([])).json()).toEqual({ items: [], unavailableProductIds: [], total: '0.00' })
    expect((await preview([{ productId: p.id, quantity: 0 }])).statusCode).toBe(400)
    expect((await preview([{ productId: p.id, quantity: 100 }])).statusCode).toBe(400)
    expect((await preview('x')).statusCode).toBe(400)
  })
})
