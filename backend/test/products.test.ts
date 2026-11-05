import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import {
  authHeader,
  createAdmin,
  createCategory,
  createProduct,
  createUser,
  db,
  resetDb,
} from './helpers'

type Item = { id: string; name: string; price: string; categories: { slug: string }[] }

describe('products', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  let admin: string
  let user: string

  beforeAll(async () => {
    app = await buildApp()
  })
  afterAll(async () => {
    await app.close()
    await db().$disconnect()
  })
  beforeEach(async () => {
    await resetDb()
    admin = (await createAdmin(app)).token
    user = (await createUser(app)).token
  })

  const list = async (query = '') => {
    const res = await app.inject({ method: 'GET', url: `/products${query}` })
    expect(res.statusCode).toBe(200)
    return res.json() as { data: Item[]; page: number; limit: number; total: number }
  }
  const names = (r: { data: Item[] }) => r.data.map((p) => p.name).sort()

  describe('listagem', () => {
    beforeEach(async () => {
      const vegano = await createCategory('Vegano')
      const gourmet = await createCategory('Gourmet')
      await createProduct({
        name: 'Chocolate Belga',
        description: 'Cobertura de ganache',
        flavor: 'Chocolate',
        price: '12.50',
        categoryIds: [gourmet.id],
      })
      await createProduct({
        name: 'Morango Vegano',
        flavor: 'Morango',
        price: '9.00',
        categoryIds: [vegano.id],
      })
      await createProduct({
        name: 'Chocolate Vegano',
        flavor: 'chocolate',
        price: '15.00',
        categoryIds: [vegano.id, gourmet.id],
      })
      await createProduct({ name: 'Inativo', flavor: 'Chocolate', active: false, categoryIds: [vegano.id] })
    })

    it('retorna só ativos, com paginação e preço como string', async () => {
      const r = await list()
      expect(r).toMatchObject({ page: 1, limit: 12, total: 3 })
      expect(names(r)).toEqual(['Chocolate Belga', 'Chocolate Vegano', 'Morango Vegano'])
      expect(r.data.find((p) => p.name === 'Chocolate Belga')!.price).toBe('12.50')
    })

    it('q busca no nome e na descrição sem diferenciar maiúsculas', async () => {
      expect(names(await list('?q=MORANGO'))).toEqual(['Morango Vegano'])
      expect(names(await list('?q=ganache'))).toEqual(['Chocolate Belga'])
    })

    it('flavor ignora maiúsculas e é igualdade exata', async () => {
      expect(names(await list('?flavor=CHOCOLATE'))).toEqual(['Chocolate Belga', 'Chocolate Vegano'])
      expect(names(await list('?flavor=choc'))).toEqual([])
    })

    it('category filtra por slug; cupcake aparece em todas as suas categorias', async () => {
      expect(names(await list('?category=vegano'))).toEqual(['Chocolate Vegano', 'Morango Vegano'])
      expect(names(await list('?category=gourmet'))).toEqual(['Chocolate Belga', 'Chocolate Vegano'])
      const multi = (await list('?category=gourmet')).data.find((p) => p.name === 'Chocolate Vegano')!
      expect(multi.categories.map((c) => c.slug).sort()).toEqual(['gourmet', 'vegano'])
    })

    it('minPrice e maxPrice', async () => {
      expect(names(await list('?minPrice=10'))).toEqual(['Chocolate Belga', 'Chocolate Vegano'])
      expect(names(await list('?maxPrice=12.50'))).toEqual(['Chocolate Belga', 'Morango Vegano'])
      expect(names(await list('?minPrice=10&maxPrice=14'))).toEqual(['Chocolate Belga'])
    })

    it('filtros combinados', async () => {
      expect(names(await list('?category=vegano&flavor=chocolate&q=vegano&minPrice=10'))).toEqual([
        'Chocolate Vegano',
      ])
    })

    it('sort', async () => {
      const asc = (await list('?sort=price_asc')).data.map((p) => p.price)
      expect(asc).toEqual(['9.00', '12.50', '15.00'])
      const desc = (await list('?sort=price_desc')).data.map((p) => p.price)
      expect(desc).toEqual(['15.00', '12.50', '9.00'])
      const newest = (await list()).data.map((p) => p.name)
      expect(newest).toEqual(['Chocolate Vegano', 'Morango Vegano', 'Chocolate Belga'])
    })

    it('paginação', async () => {
      const p1 = await list('?sort=price_asc&limit=2&page=1')
      const p2 = await list('?sort=price_asc&limit=2&page=2')
      expect(p1).toMatchObject({ page: 1, limit: 2, total: 3 })
      expect(p1.data.map((p) => p.price)).toEqual(['9.00', '12.50'])
      expect(p2.data.map((p) => p.price)).toEqual(['15.00'])
    })

    it('limit acima de 50 ou page inválida dão 400', async () => {
      expect((await app.inject({ method: 'GET', url: '/products?limit=51' })).statusCode).toBe(400)
      expect((await app.inject({ method: 'GET', url: '/products?page=0' })).statusCode).toBe(400)
      expect((await app.inject({ method: 'GET', url: '/products?sort=foo' })).statusCode).toBe(400)
    })
  })

  describe('detalhe', () => {
    it('devolve o produto ativo com imageUrl nulo sem imagem', async () => {
      const cat = await createCategory('Vegano')
      const p = await createProduct({ price: '7.5', categoryIds: [cat.id] })
      const res = await app.inject({ method: 'GET', url: `/products/${p.id}` })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({
        id: p.id,
        price: '7.50',
        imageUrl: null,
        categories: [{ id: cat.id, name: 'Vegano', slug: 'vegano' }],
      })
    })

    it('inexistente ou inativo dá 404', async () => {
      const p = await createProduct({ active: false })
      expect((await app.inject({ method: 'GET', url: `/products/${p.id}` })).statusCode).toBe(404)
      expect((await app.inject({ method: 'GET', url: '/products/xyz' })).statusCode).toBe(404)
    })
  })

  describe('CRUD do admin', () => {
    const body = (categoryIds: string[], extra: object = {}) => ({
      name: 'Red Velvet',
      description: 'Clássico',
      flavor: 'Red Velvet',
      price: '11.90',
      categoryIds,
      ...extra,
    })

    it('permissões: 401 sem login, 403 para usuário padrão, admin consegue', async () => {
      const cat = await createCategory('Gourmet')
      const p = await createProduct({ categoryIds: [cat.id] })
      const calls = [
        { method: 'POST', url: '/products', payload: body([cat.id]) },
        { method: 'PUT', url: `/products/${p.id}`, payload: body([cat.id]) },
        { method: 'DELETE', url: `/products/${p.id}` },
      ] as const
      for (const call of calls) {
        expect((await app.inject(call)).statusCode).toBe(401)
        expect((await app.inject({ ...call, headers: authHeader(user) })).statusCode).toBe(403)
      }
      const ok = await app.inject({
        method: 'POST',
        url: '/products',
        headers: authHeader(admin),
        payload: body([cat.id]),
      })
      expect(ok.statusCode).toBe(201)
      expect(ok.json()).toMatchObject({
        name: 'Red Velvet',
        price: '11.90',
        imageUrl: null,
        categories: [{ slug: 'gourmet' }],
      })
    })

    it('POST ignora active no corpo e aceita preço numérico', async () => {
      const cat = await createCategory('Gourmet')
      const res = await app.inject({
        method: 'POST',
        url: '/products',
        headers: authHeader(admin),
        payload: body([cat.id], { active: false, price: 8 }),
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().price).toBe('8.00')
      const saved = await db().product.findUniqueOrThrow({ where: { id: res.json().id } })
      expect(saved.active).toBe(true)
    })

    it('valida preço, categoryIds vazio e categoria inexistente', async () => {
      const cat = await createCategory('Gourmet')
      const post = (payload: object) =>
        app.inject({ method: 'POST', url: '/products', headers: authHeader(admin), payload })
      expect((await post(body([cat.id], { price: 0 }))).statusCode).toBe(400)
      expect((await post(body([cat.id], { price: '-3' }))).statusCode).toBe(400)
      expect((await post(body([cat.id], { price: 'abc' }))).statusCode).toBe(400)
      expect((await post(body([cat.id], { price: '1.234' }))).statusCode).toBe(400)
      expect((await post(body([]))).statusCode).toBe(400)
      const missing = await post(body(['nao-existe']))
      expect(missing.statusCode).toBe(400)
      expect(missing.json().error.code).toBe('PRODUCT_INVALID_CATEGORY')
      expect((await post(body([cat.id, 'nao-existe']))).statusCode).toBe(400)
      expect(await db().product.count()).toBe(0)
    })

    it('PUT atualiza campos e substitui as categorias', async () => {
      const a = await createCategory('Gourmet')
      const b = await createCategory('Vegano')
      const p = await createProduct({ categoryIds: [a.id] })
      const res = await app.inject({
        method: 'PUT',
        url: `/products/${p.id}`,
        headers: authHeader(admin),
        payload: body([b.id], { name: 'Novo nome', price: '20' }),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({
        name: 'Novo nome',
        price: '20.00',
        categories: [{ slug: 'vegano' }],
      })
    })

    it('PUT rejeita categoryIds vazio/inválido e produto inativo/inexistente dá 404', async () => {
      const cat = await createCategory('Gourmet')
      const p = await createProduct({ categoryIds: [cat.id] })
      const put = (id: string, payload: object) =>
        app.inject({
          method: 'PUT',
          url: `/products/${id}`,
          headers: authHeader(admin),
          payload,
        })
      expect((await put(p.id, body([]))).statusCode).toBe(400)
      expect((await put(p.id, body(['nao-existe']))).statusCode).toBe(400)
      expect((await put('nao-existe', body([cat.id]))).statusCode).toBe(404)
      const inactive = await createProduct({ active: false, categoryIds: [cat.id] })
      expect((await put(inactive.id, body([cat.id]))).statusCode).toBe(404)
    })

    it('DELETE desativa: some do catálogo mas continua no banco', async () => {
      const cat = await createCategory('Gourmet')
      const p = await createProduct({ categoryIds: [cat.id] })
      const res = await app.inject({
        method: 'DELETE',
        url: `/products/${p.id}`,
        headers: authHeader(admin),
      })
      expect(res.statusCode).toBe(204)
      expect((await list()).total).toBe(0)
      expect((await app.inject({ method: 'GET', url: `/products/${p.id}` })).statusCode).toBe(404)
      const saved = await db().product.findUniqueOrThrow({ where: { id: p.id } })
      expect(saved.active).toBe(false)
      const again = await app.inject({
        method: 'DELETE',
        url: `/products/${p.id}`,
        headers: authHeader(admin),
      })
      expect(again.statusCode).toBe(404)
    })
  })
})
