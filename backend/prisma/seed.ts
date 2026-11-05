import fs from 'node:fs'
import path from 'node:path'
import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { detectImageType, MAX_IMAGE_BYTES } from '../src/shared/image'
import { slugify } from '../src/shared/slugify'
import { CUPCAKES } from './seed-data/cupcakes'

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

async function seedCupcakes() {
  if (CUPCAKES.length !== 12) {
    throw new Error(`Esperados 12 cupcakes em seed-data/cupcakes.ts, encontrados ${CUPCAKES.length}`)
  }

  for (const item of CUPCAKES) {
    const price = new Prisma.Decimal(item.price)
    if (!price.isFinite() || price.lessThanOrEqualTo(0) || price.decimalPlaces() > 2) {
      throw new Error(`Preço inválido para "${item.name}": ${item.price}`)
    }

    const categories = await prisma.category.findMany({ where: { slug: { in: item.categories } } })
    const missing = item.categories.filter((slug) => !categories.some((c) => c.slug === slug))
    if (item.categories.length === 0 || missing.length > 0) {
      throw new Error(`Categoria não encontrada para "${item.name}": ${missing.join(', ') || '(nenhuma informada)'}`)
    }

    const imagePath = path.join(__dirname, 'seed-data', 'images', item.image)
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Imagem não encontrada para "${item.name}": ${imagePath}`)
    }
    const bytes = new Uint8Array(fs.readFileSync(imagePath))
    const mimeType = detectImageType(bytes)
    if (!mimeType) throw new Error(`Imagem de "${item.name}" não é JPEG, PNG ou WebP`)
    if (bytes.length > MAX_IMAGE_BYTES) {
      throw new Error(`Imagem de "${item.name}" passa de 1 MB (${bytes.length} bytes)`)
    }

    const data = {
      name: item.name,
      description: item.description,
      flavor: item.flavor,
      price,
      active: true,
      categories: { set: categories.map((c) => ({ id: c.id })) },
    }

    const existing = await prisma.product.findFirst({ where: { name: item.name } })
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({
          data: { ...data, categories: { connect: categories.map((c) => ({ id: c.id })) } },
        })

    await prisma.productImage.upsert({
      where: { productId: product.id },
      create: { productId: product.id, data: bytes, mimeType },
      update: { data: bytes, mimeType },
    })
  }
}

async function main() {
  await seedAdmin()
  await seedCategories()
  await seedCupcakes()
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
