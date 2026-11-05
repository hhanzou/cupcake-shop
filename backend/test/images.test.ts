import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { authHeader, createAdmin, createProduct, createUser, db, resetDb } from './helpers'

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('conteudo-png'),
])
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('conteudo-jpeg')])
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x10, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('conteudo'),
])

function multipart(content: Buffer, opts: { field?: string; contentType?: string } = {}) {
  const boundary = '----cupcaketest'
  const head =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${opts.field ?? 'file'}"; filename="x.bin"\r\n` +
    `Content-Type: ${opts.contentType ?? 'image/png'}\r\n\r\n`
  const tail = `\r\n--${boundary}--\r\n`
  return {
    payload: Buffer.concat([Buffer.from(head), content, Buffer.from(tail)]),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  }
}

describe('images', () => {
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

  const upload = (id: string, content: Buffer, opts = {}, token: string | null = admin) => {
    const m = multipart(content, opts)
    return app.inject({
      method: 'PUT',
      url: `/products/${id}/image`,
      payload: m.payload,
      headers: { ...m.headers, ...(token ? authHeader(token) : {}) },
    })
  }

  it.each([
    ['PNG', PNG, 'image/png'],
    ['JPEG', JPEG, 'image/jpeg'],
    ['WebP', WEBP, 'image/webp'],
  ])('aceita %s e serve os bytes com o tipo detectado', async (_n, content, mime) => {
    const p = await createProduct()
    // Content-Type do header propositalmente genérico: vale o conteúdo.
    const res = await upload(p.id, content, { contentType: 'application/octet-stream' })
    expect(res.statusCode).toBe(200)
    expect(res.json().imageUrl).toMatch(new RegExp(`^/products/${p.id}/image\\?v=\\d+$`))

    const img = await app.inject({ method: 'GET', url: `/products/${p.id}/image` })
    expect(img.statusCode).toBe(200)
    expect(img.headers['content-type']).toBe(mime)
    expect(img.headers['cache-control']).toBe('public, max-age=86400')
    expect(img.headers['x-content-type-options']).toBe('nosniff')
    expect(Buffer.compare(img.rawPayload, content)).toBe(0)
  })

  it('recusa arquivo de texto mesmo com Content-Type image/png (415)', async () => {
    const p = await createProduct()
    const res = await upload(p.id, Buffer.from('isto é texto'), { contentType: 'image/png' })
    expect(res.statusCode).toBe(415)
    expect(res.json().error.code).toBe('IMAGE_UNSUPPORTED_TYPE')
    expect(await db().productImage.count()).toBe(0)
  })

  it('recusa RIFF que não é WebP (415)', async () => {
    const p = await createProduct()
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVEfmt ')])
    expect((await upload(p.id, wav)).statusCode).toBe(415)
  })

  it('recusa arquivo acima de 1 MB (413)', async () => {
    const p = await createProduct()
    const big = Buffer.concat([PNG, Buffer.alloc(1048576)])
    const res = await upload(p.id, big)
    expect(res.statusCode).toBe(413)
    expect(await db().productImage.count()).toBe(0)
  })

  it('aceita arquivo de exatamente 1 MB', async () => {
    const p = await createProduct()
    const exact = Buffer.concat([PNG, Buffer.alloc(1048576 - PNG.length)])
    expect((await upload(p.id, exact)).statusCode).toBe(200)
  })

  it('campo diferente de "file" responde 400', async () => {
    const p = await createProduct()
    expect((await upload(p.id, PNG, { field: 'outro' })).statusCode).toBe(400)
  })

  it('trocar a imagem muda o valor de v e os bytes servidos', async () => {
    const p = await createProduct()
    const first = (await upload(p.id, PNG)).json().imageUrl as string
    await new Promise((r) => setTimeout(r, 15))
    const second = (await upload(p.id, JPEG)).json().imageUrl as string
    expect(second).not.toBe(first)
    expect(await db().productImage.count()).toBe(1)
    const img = await app.inject({ method: 'GET', url: `/products/${p.id}/image` })
    expect(img.headers['content-type']).toBe('image/jpeg')
  })

  it('permissões: 401 sem login, 403 para usuário padrão', async () => {
    const p = await createProduct()
    expect((await upload(p.id, PNG, {}, null)).statusCode).toBe(401)
    expect((await upload(p.id, PNG, {}, user)).statusCode).toBe(403)
  })

  it('produto inexistente ou inativo no upload dá 404', async () => {
    const inactive = await createProduct({ active: false })
    expect((await upload(inactive.id, PNG)).statusCode).toBe(404)
    expect((await upload('nao-existe', PNG)).statusCode).toBe(404)
  })

  it('GET da imagem: 404 sem imagem e 404 com produto inativo', async () => {
    const p = await createProduct()
    expect((await app.inject({ method: 'GET', url: `/products/${p.id}/image` })).statusCode).toBe(404)
    await upload(p.id, PNG)
    await db().product.update({ where: { id: p.id }, data: { active: false } })
    expect((await app.inject({ method: 'GET', url: `/products/${p.id}/image` })).statusCode).toBe(404)
  })

  it('GET /products não traz bytes de imagem', async () => {
    const p = await createProduct()
    await upload(p.id, PNG)
    const res = await app.inject({ method: 'GET', url: '/products' })
    const item = res.json().data[0]
    expect(item.imageUrl).toContain(`/products/${p.id}/image?v=`)
    expect(item).not.toHaveProperty('image')
    expect(item).not.toHaveProperty('data')
    expect(res.payload).not.toContain('conteudo-png')
    expect(res.payload.length).toBeLessThan(2000)
  })
})
