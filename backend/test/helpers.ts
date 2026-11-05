import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | undefined

export function db() {
  return (prisma ??= new PrismaClient())
}

/** Limpa todas as tabelas (menos o controle de migrations). */
export async function resetDb() {
  const client = db()
  const tables = await client.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length === 0) return
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ')
  await client.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
}

import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

let counter = 0

export async function createUser(
  app: FastifyInstance,
  overrides: { email?: string; password?: string; role?: Role; name?: string } = {},
) {
  counter += 1
  const password = overrides.password ?? 'senha12345'
  const user = await db().user.create({
    data: {
      name: overrides.name ?? `Usuário ${counter}`,
      email: overrides.email ?? `user${counter}-${Date.now()}@teste.com`,
      passwordHash: await bcrypt.hash(password, 4),
      role: overrides.role ?? 'USER',
    },
  })
  const token = app.jwt.sign({ sub: user.id, role: user.role })
  return { user, token, password }
}

export function createAdmin(app: FastifyInstance) {
  return createUser(app, { role: 'ADMIN' })
}

export function authHeader(token: string) {
  return { authorization: `Bearer ${token}` }
}

export async function createCategory(name: string) {
  return db().category.create({
    data: { name, slug: name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-') },
  })
}

export async function createProduct(
  overrides: {
    name?: string
    description?: string | null
    flavor?: string
    price?: string
    active?: boolean
    categoryIds?: string[]
  } = {},
) {
  counter += 1
  return db().product.create({
    data: {
      name: overrides.name ?? `Cupcake ${counter}`,
      description: overrides.description ?? null,
      flavor: overrides.flavor ?? 'Baunilha',
      price: overrides.price ?? '10.00',
      active: overrides.active ?? true,
      categories: { connect: (overrides.categoryIds ?? []).map((id) => ({ id })) },
    },
  })
}
