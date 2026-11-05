import { Prisma, PrismaClient } from '@prisma/client'
import { AppError } from '../../plugins/errors'
import { formatMoney } from '../../shared/money'
import { ProductBody, ProductListQuery } from './products.schema'

/** Nunca selecione `image.data` aqui: a listagem não pode carregar bytes. */
export const productInclude = {
  categories: {
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  },
  image: { select: { updatedAt: true } },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>

export function serializeProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    flavor: product.flavor,
    price: formatMoney(product.price),
    categories: product.categories,
    imageUrl: product.image
      ? `/products/${product.id}/image?v=${product.image.updatedAt.getTime()}`
      : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

const notFound = () => new AppError(404, 'PRODUCT_NOT_FOUND', 'Cupcake não encontrado')

export async function findActiveProduct(prisma: PrismaClient, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, active: true },
    include: productInclude,
  })
  if (!product) throw notFound()
  return product
}

export async function getProduct(prisma: PrismaClient, id: string) {
  return serializeProduct(await findActiveProduct(prisma, id))
}

export async function listProducts(prisma: PrismaClient, query: ProductListQuery) {
  const price: Prisma.DecimalFilter = {}
  if (query.minPrice) price.gte = query.minPrice
  if (query.maxPrice) price.lte = query.maxPrice

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
    ...(query.flavor && { flavor: { equals: query.flavor, mode: 'insensitive' } }),
    ...(query.category && { categories: { some: { slug: query.category } } }),
    ...(Object.keys(price).length > 0 && { price }),
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === 'price_asc'
      ? [{ price: 'asc' }, { id: 'asc' }]
      : query.sort === 'price_desc'
        ? [{ price: 'desc' }, { id: 'asc' }]
        : [{ createdAt: 'desc' }, { id: 'asc' }]

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: productInclude,
    }),
  ])

  return {
    data: products.map(serializeProduct),
    page: query.page,
    limit: query.limit,
    total,
  }
}

async function assertCategoriesExist(prisma: PrismaClient, ids: string[]) {
  const found = await prisma.category.count({ where: { id: { in: ids } } })
  if (found !== ids.length) {
    throw new AppError(400, 'PRODUCT_INVALID_CATEGORY', 'Uma ou mais categorias não existem')
  }
}

export async function createProduct(prisma: PrismaClient, input: ProductBody) {
  await assertCategoriesExist(prisma, input.categoryIds)
  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      flavor: input.flavor,
      price: input.price,
      categories: { connect: input.categoryIds.map((id) => ({ id })) },
    },
    include: productInclude,
  })
  return serializeProduct(product)
}

export async function updateProduct(prisma: PrismaClient, id: string, input: ProductBody) {
  await findActiveProduct(prisma, id)
  await assertCategoriesExist(prisma, input.categoryIds)
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description ?? null,
      flavor: input.flavor,
      price: input.price,
      categories: { set: input.categoryIds.map((categoryId) => ({ id: categoryId })) },
    },
    include: productInclude,
  })
  return serializeProduct(product)
}

export async function deactivateProduct(prisma: PrismaClient, id: string) {
  const result = await prisma.product.updateMany({
    where: { id, active: true },
    data: { active: false },
  })
  if (result.count === 0) throw notFound()
}

export async function saveProductImage(
  prisma: PrismaClient,
  id: string,
  buffer: Uint8Array,
  mimeType: string,
) {
  await findActiveProduct(prisma, id)
  const data = new Uint8Array(buffer)
  await prisma.productImage.upsert({
    where: { productId: id },
    create: { productId: id, data, mimeType },
    update: { data, mimeType },
  })
  return getProduct(prisma, id)
}

export async function loadProductImage(prisma: PrismaClient, id: string) {
  const image = await prisma.productImage.findFirst({
    where: { productId: id, product: { active: true } },
    select: { data: true, mimeType: true },
  })
  if (!image) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Imagem não encontrada')
  return image
}
