import { PrismaClient } from '@prisma/client'
import { AppError } from '../../plugins/errors'
import { slugify } from '../../shared/slugify'

const notFound = () => new AppError(404, 'CATEGORY_NOT_FOUND', 'Categoria não encontrada')

function ensureSlug(name: string) {
  const slug = slugify(name)
  if (!slug) throw new AppError(400, 'CATEGORY_INVALID_NAME', 'Nome de categoria inválido')
  return slug
}

export function listCategories(prisma: PrismaClient) {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory(prisma: PrismaClient, name: string) {
  return prisma.category.create({ data: { name, slug: ensureSlug(name) } })
}

export async function updateCategory(prisma: PrismaClient, id: string, name: string) {
  const exists = await prisma.category.findUnique({ where: { id } })
  if (!exists) throw notFound()
  return prisma.category.update({ where: { id }, data: { name, slug: ensureSlug(name) } })
}

export async function deleteCategory(prisma: PrismaClient, id: string) {
  await prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({ where: { id } })
    if (!category) throw notFound()

    const activeCount = await tx.product.count({
      where: { active: true, categories: { some: { id } } },
    })
    if (activeCount > 0) {
      throw new AppError(
        409,
        'CATEGORY_IN_USE',
        'A categoria está ligada a cupcakes ativos. Remova o vínculo antes de apagá-la.',
      )
    }

    // Os vínculos com cupcakes inativos saem junto (tabela de ligação com cascade).
    await tx.category.delete({ where: { id } })
  })
}
