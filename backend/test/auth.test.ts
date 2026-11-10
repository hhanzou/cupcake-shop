import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { authHeader, createUser, db, resetDb } from './helpers'

const STRONG = 'Senha@12345'

describe('auth', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })
  afterAll(async () => {
    await app.close()
    await db().$disconnect()
  })
  beforeEach(resetDb)

  const register = (payload: object) =>
    app.inject({ method: 'POST', url: '/auth/register', payload })

  it('cadastra um usuário e devolve token', async () => {
    const res = await register({ name: 'Ana', email: 'Ana@Teste.com', password: STRONG })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.token).toBeTruthy()
    expect(body.user).toMatchObject({ name: 'Ana', email: 'ana@teste.com', role: 'USER' })
    expect(JSON.stringify(body)).not.toContain('passwordHash')
  })

  it('recusa e-mail repetido (inclusive com maiúsculas)', async () => {
    await register({ name: 'Ana', email: 'ana@teste.com', password: STRONG })
    const res = await register({ name: 'Outra', email: 'ANA@teste.com', password: STRONG })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.code).toBe('EMAIL_IN_USE')
  })

  it('recusa senha curta e e-mail inválido com 400', async () => {
    const short = await register({ name: 'Ana', email: 'ana@teste.com', password: '1234567' })
    expect(short.statusCode).toBe(400)
    expect(short.json().error.code).toBe('VALIDATION_ERROR')
    const bad = await register({ name: 'Ana', email: 'nao-e-email', password: STRONG })
    expect(bad.statusCode).toBe(400)
  })

  describe('senha forte no cadastro', () => {
    const passwordErrors = async (password: string) => {
      const res = await register({ name: 'Ana', email: 'ana@teste.com', password })
      expect(res.statusCode).toBe(400)
      expect(res.json().error.code).toBe('VALIDATION_ERROR')
      return (res.json().error.details as { path: string; message: string }[])
        .filter((d) => d.path === 'password')
        .map((d) => d.message)
    }

    it.each([
      ['sem maiúscula', 'senha@12345', 'maiúscula'],
      ['sem minúscula', 'SENHA@12345', 'minúscula'],
      ['sem número', 'Senha@abcde', 'número'],
      ['sem caractere especial', 'Senha12345', 'caractere especial'],
      ['com menos de 8 caracteres', 'Se@1', '8 caracteres'],
    ])('recusa senha %s', async (_case, password, expected) => {
      const messages = await passwordErrors(password)
      expect(messages).toHaveLength(1)
      expect(messages[0]).toContain(expected)
      expect(await db().user.count()).toBe(0)
    })

    it('devolve todas as regras que faltam de uma vez', async () => {
      const messages = await passwordErrors('abc')
      expect(messages).toHaveLength(4) // tamanho, maiúscula, número e especial
    })

    it('espaço não conta como caractere especial', async () => {
      const messages = await passwordErrors('Senha 12345')
      expect(messages).toEqual([expect.stringContaining('caractere especial')])
    })

    it('aceita letras acentuadas e qualquer símbolo como especial', async () => {
      const res = await register({ name: 'Ana', email: 'ana@teste.com', password: 'Ébano#2026çã' })
      expect(res.statusCode).toBe(201)
    })

    it('o login não aplica as regras (contas antigas continuam entrando)', async () => {
      const { password } = await createUser(app, { email: 'antiga@teste.com', password: 'senha12345' })
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'antiga@teste.com', password },
      })
      expect(res.statusCode).toBe(200)
    })
  })

  it('ignora role: "ADMIN" no cadastro', async () => {
    const res = await register({
      name: 'Hacker',
      email: 'h@teste.com',
      password: STRONG,
      role: 'ADMIN',
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().user.role).toBe('USER')
    const saved = await db().user.findUniqueOrThrow({ where: { email: 'h@teste.com' } })
    expect(saved.role).toBe('USER')
  })

  it('faz login com credenciais corretas', async () => {
    const { user, password } = await createUser(app, { email: 'login@teste.com' })
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'LOGIN@teste.com', password },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().user.id).toBe(user.id)
    expect(res.json().token).toBeTruthy()
  })

  it('senha errada e e-mail inexistente dão 401 com a mesma mensagem', async () => {
    await createUser(app, { email: 'login@teste.com' })
    const wrong = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login@teste.com', password: 'errada12345' },
    })
    const missing = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'naoexiste@teste.com', password: 'errada12345' },
    })
    expect(wrong.statusCode).toBe(401)
    expect(missing.statusCode).toBe(401)
    expect(wrong.json()).toEqual(missing.json())
  })

  it('GET /auth/me: 401 sem token, 401 com token inválido, 200 com token', async () => {
    const { token, user } = await createUser(app)
    expect((await app.inject({ method: 'GET', url: '/auth/me' })).statusCode).toBe(401)
    const bad = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: authHeader('lixo'),
    })
    expect(bad.statusCode).toBe(401)
    const ok = await app.inject({ method: 'GET', url: '/auth/me', headers: authHeader(token) })
    expect(ok.statusCode).toBe(200)
    expect(ok.json().user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'USER',
    })
  })
})
