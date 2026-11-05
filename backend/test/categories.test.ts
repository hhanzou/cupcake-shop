import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { authHeader, createAdmin, createUser, db, resetDb } from './helpers'

describe('categories', () => {
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

  const create = (name: string, token = admin) =>
    app.inject({
      method: 'POST',
      url: '/categories',
      headers: authHeader(token),
      payload: { name },
    })

  it('GET é público e ordenado por nome', async () => {
    await create('Vegano')
    await create('Gourmet')
    const res = await app.inject({ method: 'GET', url: '/categories' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.map((c: { name: string }) => c.name)).toEqual(['Gourmet', 'Vegano'])
  })

  it('cria "Sem glúten" com o slug sem-gluten', async () => {
    const res = await create('Sem glúten')
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ name: 'Sem glúten', slug: 'sem-gluten' })
  })

  it('ignora slug enviado no corpo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/categories',
      headers: authHeader(admin),
      payload: { name: 'Sazonal', slug: 'hack' },
    })
    expect(res.json().slug).toBe('sazonal')
  })

  it('nome repetido responde 409', async () => {
    await create('Vegano')
    expect((await create('Vegano')).statusCode).toBe(409)
  })

  it('slug repetido (nome diferente) responde 409', async () => {
    await create('Sem glúten')
    expect((await create('Sem gluten')).statusCode).toBe(409)
  })

  it('PUT atualiza o nome e o slug acompanha', async () => {
    const { id } = (await create('Vegano')).json()
    const res = await app.inject({
      method: 'PUT',
      url: `/categories/${id}`,
      headers: authHeader(admin),
      payload: { name: 'Sem lactose' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ name: 'Sem lactose', slug: 'sem-lactose' })
  })

  it('PUT com nome já usado responde 409 e id inexistente 404', async () => {
    await create('Vegano')
    const { id } = (await create('Gourmet')).json()
    const dup = await app.inject({
      method: 'PUT',
      url: `/categories/${id}`,
      headers: authHeader(admin),
      payload: { name: 'Vegano' },
    })
    expect(dup.statusCode).toBe(409)
    const missing = await app.inject({
      method: 'PUT',
      url: '/categories/nao-existe',
      headers: authHeader(admin),
      payload: { name: 'X' },
    })
    expect(missing.statusCode).toBe(404)
  })

  it('nome vazio responde 400', async () => {
    expect((await create('   ')).statusCode).toBe(400)
  })

  it('permissões: 401 sem login, 403 para usuário padrão', async () => {
    const { id } = (await create('Vegano')).json()
    const calls = [
      { method: 'POST', url: '/categories', payload: { name: 'A' } },
      { method: 'PUT', url: `/categories/${id}`, payload: { name: 'B' } },
      { method: 'DELETE', url: `/categories/${id}` },
    ] as const
    for (const call of calls) {
      expect((await app.inject(call)).statusCode).toBe(401)
      const res = await app.inject({ ...call, headers: authHeader(user) })
      expect(res.statusCode).toBe(403)
    }
  })

  it('DELETE apaga categoria sem produtos e responde 204', async () => {
    const { id } = (await create('Vegano')).json()
    const res = await app.inject({
      method: 'DELETE',
      url: `/categories/${id}`,
      headers: authHeader(admin),
    })
    expect(res.statusCode).toBe(204)
    expect(await db().category.count()).toBe(0)
  })

  it('DELETE de id inexistente responde 404', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/categories/nao-existe',
      headers: authHeader(admin),
    })
    expect(res.statusCode).toBe(404)
  })

  it('DELETE com cupcake ativo responde 409; com só inativos apaga', async () => {
    const { id } = (await create('Vegano')).json()
    const product = await db().product.create({
      data: { name: 'Cupcake', flavor: 'Baunilha', price: '10.00', categories: { connect: { id } } },
    })

    const blocked = await app.inject({
      method: 'DELETE',
      url: `/categories/${id}`,
      headers: authHeader(admin),
    })
    expect(blocked.statusCode).toBe(409)
    expect(blocked.json().error.code).toBe('CATEGORY_IN_USE')
    expect(await db().category.count()).toBe(1)

    await db().product.update({ where: { id: product.id }, data: { active: false } })
    const ok = await app.inject({
      method: 'DELETE',
      url: `/categories/${id}`,
      headers: authHeader(admin),
    })
    expect(ok.statusCode).toBe(204)
    expect(await db().category.count()).toBe(0)
    // o cupcake inativo continua existindo
    expect(await db().product.count()).toBe(1)
  })
})
