import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { slugify } from '../src/shared/slugify'

const prisma = new PrismaClient()

const CATEGORIES = ['Tradicional', 'Gourmet', 'Vegano', 'Sem glúten', 'Sem lactose', 'Sazonal']

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios para o seed')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { name: 'Administrador', email, passwordHash, role: 'ADMIN' },
  })
}

async function seedCategories() {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    })
  }
}

async function main() {
  await seedAdmin()
  await seedCategories()
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
