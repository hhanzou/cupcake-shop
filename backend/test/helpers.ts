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
