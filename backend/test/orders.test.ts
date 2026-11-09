import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { authHeader, createAdmin, createProduct, createUser, db, resetDb } from './helpers'

/** Data civil de hoje em São Paulo mais n dias (UTC meia-noite). */
function saoPauloDay(offset: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value)
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day') + offset))
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Primeira data válida a partir de hoje + min dias, pulando domingos. */
function validDate(min = 3) {
  let d = saoPauloDay(min)
  if (d.getUTCDay() === 0) d = saoPauloDay(min + 1)
  return iso(d)
}

function nextSunday() {
  let n = 2
  while (saoPauloDay(n).getUTCDay() !== 0) n++
  return iso(saoPauloDay(n))
}

const address = {
  street: 'Rua das Flores',
  number: '123',
  district: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01000-000',
}

describe('orders', () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  let user: { token: string; id: string }
  let other: { token: string; id: string }
  let admin: string

  beforeAll(async () => {
    app = await buildApp()
  })
  afterAll(async () => {
    await app.close()
    await db().$disconnect()
  })
  beforeEach(async () => {
    await resetDb()
    const u = await createUser(app)
    const o = await createUser(app)
    user = { token: u.token, id: u.user.id }
    other = { token: o.token, id: o.user.id }
    admin = (await createAdmin(app)).token
  })

  const post = (payload: object, token: string | null = user.token) =>
    app.inject({
      method: 'POST',
      url: '/orders',
      payload,
      headers: token ? authHeader(token) : {},
    })

  const pickup = (items: object[], extra: object = {}) => ({
    items,
    fulfillmentType: 'PICKUP',
    scheduledDate: validDate(),
    ...extra,
  })

  describe('POST /orders', () => {
    it('sem login dá 401', async () => {
      const p = await createProduct()
      const res = await post(pickup([{ productId: p.id, quantity: 1 }]), null)
      expect(res.statusCode).toBe(401)
    })

    it('retirada válida cria o pedido CONFIRMED com total do banco', async () => {
      const a = await createProduct({ name: 'A', price: '12.50' })
      const b = await createProduct({ name: 'B', price: '3.10' })
      const res = await post(
        pickup([
          { productId: a.id, quantity: 2 },
          { productId: b.id, quantity: 3 },
        ]),
      )
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toMatchObject({
        status: 'CONFIRMED',
        fulfillmentType: 'PICKUP',
        total: '34.30',
        address: null,
        scheduledDate: validDate(),
      })
      expect(body.items).toHaveLength(2)
      expect(body.items.find((i: { name: string }) => i.name === 'A')).toMatchObject({
        quantity: 2,
        unitPrice: '12.50',
        lineTotal: '25.00',
      })
      const saved = await db().order.findUniqueOrThrow({ where: { id: body.id } })
      expect(saved.userId).toBe(user.id)
    })

    it('entrega válida grava o endereço (complemento opcional)', async () => {
      const p = await createProduct()
      const res = await post({
        items: [{ productId: p.id, quantity: 1 }],
        fulfillmentType: 'DELIVERY',
        scheduledDate: validDate(),
        address,
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().address).toMatchObject({ ...address, complement: null })

      const withComplement = await post({
        items: [{ productId: p.id, quantity: 1 }],
        fulfillmentType: 'DELIVERY',
        scheduledDate: validDate(),
        address: { ...address, complement: 'Apto 4' },
      })
      expect(withComplement.json().address.complement).toBe('Apto 4')
    })

    it('entrega sem endereço ou com endereço incompleto dá 400', async () => {
      const p = await createProduct()
      const base = {
        items: [{ productId: p.id, quantity: 1 }],
        fulfillmentType: 'DELIVERY',
        scheduledDate: validDate(),
      }
      expect((await post(base)).statusCode).toBe(400)
      const { city: _city, ...incomplete } = address
      const res = await post({ ...base, address: incomplete })
      expect(res.statusCode).toBe(400)
      expect(res.json().error.code).toBe('ORDER_INVALID_ADDRESS')
      expect((await post({ ...base, address: { ...address, street: '  ' } })).statusCode).toBe(400)
      expect(await db().order.count()).toBe(0)
    })

    it('UF inexistente dá 400 de validação, e sigla minúscula é normalizada', async () => {
      const p = await createProduct()
      const base = {
        items: [{ productId: p.id, quantity: 1 }],
        fulfillmentType: 'DELIVERY',
        scheduledDate: validDate(),
      }

      for (const state of ['XX', 'São Paulo', 'S', '']) {
        const res = await post({ ...base, address: { ...address, state } })
        expect(res.statusCode).toBe(400)
        expect(res.json().error.code).toBe('VALIDATION_ERROR')
        expect(res.json().error.details).toContainEqual(
          expect.objectContaining({ path: 'address.state' }),
        )
      }
      expect(await db().order.count()).toBe(0)

      const ok = await post({ ...base, address: { ...address, state: ' rj ' } })
      expect(ok.statusCode).toBe(201)
      expect(ok.json().address.state).toBe('RJ')
    })

    it('retirada com endereço dá 400', async () => {
      const p = await createProduct()
      const res = await post(pickup([{ productId: p.id, quantity: 1 }], { address }))
      expect(res.statusCode).toBe(400)
      expect(res.json().error.code).toBe('ORDER_INVALID_ADDRESS')
    })

    it('data passada, hoje, domingo, muito distante e formato inválido dão 400', async () => {
      const p = await createProduct()
      const items = [{ productId: p.id, quantity: 1 }]
      for (const scheduledDate of [
        iso(saoPauloDay(-1)),
        iso(saoPauloDay(0)),
        nextSunday(),
        iso(saoPauloDay(31)),
        '2026-02-31',
        'amanhã',
      ]) {
        const res = await post(pickup(items, { scheduledDate }))
        expect(res.statusCode, scheduledDate).toBe(400)
        expect(res.json().error.code).toBe('ORDER_INVALID_DATE')
      }
      expect(await db().order.count()).toBe(0)
    })

    it('lista de itens vazia e quantidades inválidas dão 400', async () => {
      const p = await createProduct()
      expect((await post(pickup([]))).statusCode).toBe(400)
      for (const quantity of [0, -1, 100, 1.5, '2']) {
        expect((await post(pickup([{ productId: p.id, quantity }]))).statusCode).toBe(400)
      }
      const merged = await post(
        pickup([
          { productId: p.id, quantity: 60 },
          { productId: p.id, quantity: 60 },
        ]),
      )
      expect(merged.statusCode).toBe(400)
    })

    it('soma itens repetidos do mesmo produto', async () => {
      const p = await createProduct({ price: '5.00' })
      const res = await post(
        pickup([
          { productId: p.id, quantity: 1 },
          { productId: p.id, quantity: 2 },
        ]),
      )
      expect(res.statusCode).toBe(201)
      expect(res.json().items).toHaveLength(1)
      expect(res.json()).toMatchObject({ total: '15.00' })
      expect(res.json().items[0].quantity).toBe(3)
    })

    it('ignora preços enviados no corpo: o total vem do banco', async () => {
      const p = await createProduct({ price: '20.00' })
      const res = await post({
        ...pickup([{ productId: p.id, quantity: 2, unitPrice: '0.01', price: 0.01 }]),
        total: '0.01',
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().total).toBe('40.00')
      expect(res.json().items[0].unitPrice).toBe('20.00')
    })

    it('mudar o preço do cupcake não altera pedidos antigos', async () => {
      const p = await createProduct({ price: '10.00' })
      const created = await post(pickup([{ productId: p.id, quantity: 2 }]))
      await db().product.update({ where: { id: p.id }, data: { price: '99.00' } })

      const res = await app.inject({
        method: 'GET',
        url: `/orders/${created.json().id}`,
        headers: authHeader(user.token),
      })
      expect(res.json().total).toBe('20.00')
      expect(res.json().items[0].unitPrice).toBe('10.00')

      const next = await post(pickup([{ productId: p.id, quantity: 1 }]))
      expect(next.json().total).toBe('99.00')
    })

    it('item inativo ou inexistente dá 409 com os ids e nada é gravado', async () => {
      const good = await createProduct()
      const inactive = await createProduct({ active: false })
      const res = await post(
        pickup([
          { productId: good.id, quantity: 1 },
          { productId: inactive.id, quantity: 1 },
          { productId: 'nao-existe', quantity: 1 },
        ]),
      )
      expect(res.statusCode).toBe(409)
      expect(res.json().error.details.sort()).toEqual([inactive.id, 'nao-existe'].sort())
      expect(await db().order.count()).toBe(0)
      expect(await db().orderItem.count()).toBe(0)
    })
  })

  describe('histórico', () => {
    it('GET /orders e /orders/:id exigem login', async () => {
      expect((await app.inject({ method: 'GET', url: '/orders' })).statusCode).toBe(401)
      expect((await app.inject({ method: 'GET', url: '/orders/x' })).statusCode).toBe(401)
    })

    it('lista só os pedidos do usuário, do mais novo para o mais antigo', async () => {
      const p = await createProduct()
      const first = (await post(pickup([{ productId: p.id, quantity: 1 }]))).json()
      const second = (await post(pickup([{ productId: p.id, quantity: 2 }]))).json()
      await post(pickup([{ productId: p.id, quantity: 3 }]), other.token)

      const res = await app.inject({
        method: 'GET',
        url: '/orders',
        headers: authHeader(user.token),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.map((o: { id: string }) => o.id)).toEqual([second.id, first.id])
    })

    it('um usuário não acessa o pedido de outro (404)', async () => {
      const p = await createProduct()
      const order = (await post(pickup([{ productId: p.id, quantity: 1 }]))).json()

      const mine = await app.inject({
        method: 'GET',
        url: `/orders/${order.id}`,
        headers: authHeader(user.token),
      })
      expect(mine.statusCode).toBe(200)

      const theirs = await app.inject({
        method: 'GET',
        url: `/orders/${order.id}`,
        headers: authHeader(other.token),
      })
      expect(theirs.statusCode).toBe(404)

      const missing = await app.inject({
        method: 'GET',
        url: '/orders/nao-existe',
        headers: authHeader(user.token),
      })
      expect(missing.statusCode).toBe(404)
    })
  })

  describe('gestão pelo admin', () => {
    const adminList = (token: string | null, query = '') =>
      app.inject({
        method: 'GET',
        url: `/admin/orders${query}`,
        headers: token ? authHeader(token) : {},
      })

    const setStatus = (token: string | null, id: string, status: unknown) =>
      app.inject({
        method: 'PATCH',
        url: `/admin/orders/${id}/status`,
        payload: { status },
        headers: token ? authHeader(token) : {},
      })

    it('401 sem login e 403 para usuário padrão nas duas rotas', async () => {
      expect((await adminList(null)).statusCode).toBe(401)
      expect((await adminList(user.token)).statusCode).toBe(403)
      expect((await setStatus(null, 'x', 'READY')).statusCode).toBe(401)
      expect((await setStatus(user.token, 'x', 'READY')).statusCode).toBe(403)
    })

    it('lista todos os pedidos com cliente, sem passwordHash, e filtra por status', async () => {
      const p = await createProduct()
      const a = (await post(pickup([{ productId: p.id, quantity: 1 }]))).json()
      const b = (await post(pickup([{ productId: p.id, quantity: 1 }]), other.token)).json()
      await setStatus(admin, b.id, 'PREPARING')

      const all = await adminList(admin)
      expect(all.statusCode).toBe(200)
      const body = all.json()
      expect(body).toMatchObject({ page: 1, limit: 12, total: 2 })
      expect(body.data.map((o: { id: string }) => o.id).sort()).toEqual([a.id, b.id].sort())
      const first = body.data.find((o: { id: string }) => o.id === a.id)
      expect(first.user).toEqual({
        id: user.id,
        name: expect.any(String),
        email: expect.any(String),
      })
      expect(all.payload).not.toContain('passwordHash')

      const filtered = (await adminList(admin, '?status=PREPARING')).json()
      expect(filtered.total).toBe(1)
      expect(filtered.data[0].id).toBe(b.id)

      expect((await adminList(admin, '?status=INVALIDO')).statusCode).toBe(400)
    })

    it('pagina a listagem', async () => {
      const p = await createProduct()
      for (let i = 0; i < 3; i++) await post(pickup([{ productId: p.id, quantity: 1 }]))
      const page2 = (await adminList(admin, '?limit=2&page=2')).json()
      expect(page2).toMatchObject({ page: 2, limit: 2, total: 3 })
      expect(page2.data).toHaveLength(1)
    })

    it('muda o status e o dono enxerga a mudança', async () => {
      const p = await createProduct()
      const order = (await post(pickup([{ productId: p.id, quantity: 1 }]))).json()

      const res = await setStatus(admin, order.id, 'READY')
      expect(res.statusCode).toBe(200)
      expect(res.json().status).toBe('READY')
      expect(res.payload).not.toContain('passwordHash')

      // sem regra de transição: pode voltar
      expect((await setStatus(admin, order.id, 'CONFIRMED')).statusCode).toBe(200)
      expect((await setStatus(admin, order.id, 'CANCELED')).statusCode).toBe(200)

      const mine = await app.inject({
        method: 'GET',
        url: `/orders/${order.id}`,
        headers: authHeader(user.token),
      })
      expect(mine.json().status).toBe('CANCELED')
    })

    it('status inválido dá 400 e pedido inexistente dá 404', async () => {
      const p = await createProduct()
      const order = (await post(pickup([{ productId: p.id, quantity: 1 }]))).json()
      expect((await setStatus(admin, order.id, 'ENTREGUE')).statusCode).toBe(400)
      expect((await setStatus(admin, 'nao-existe', 'READY')).statusCode).toBe(404)
    })
  })
})
