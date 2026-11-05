import { Prisma } from '@prisma/client'
import { z } from 'zod'

const MAX_PRICE = new Prisma.Decimal('99999999.99')

/** Aceita número ou string, com no máximo 2 casas, e devolve um Decimal. */
const money = z.union([z.string().trim().min(1), z.number()]).transform((value, ctx) => {
  if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) {
    ctx.addIssue({ code: 'custom', message: 'Valor monetário inválido' })
    return z.NEVER
  }
  const decimal = new Prisma.Decimal(value)
  if (!decimal.isFinite() || decimal.decimalPlaces() > 2 || decimal.greaterThan(MAX_PRICE)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Valor monetário inválido (máximo 2 casas decimais)',
    })
    return z.NEVER
  }
  return decimal
})

export const productBody = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120),
  description: z.string().trim().max(1000).nullish(),
  flavor: z.string().trim().min(1, 'Sabor é obrigatório').max(60),
  price: money.refine((d) => d.greaterThan(0), 'O preço deve ser maior que zero'),
  categoryIds: z
    .array(z.string().min(1))
    .min(1, 'Informe ao menos uma categoria')
    .transform((ids) => [...new Set(ids)]),
})

export const productListQuery = z.object({
  q: z.string().trim().min(1).optional(),
  flavor: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  minPrice: money.optional(),
  maxPrice: money.optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

export const idParams = z.object({ id: z.string().min(1) })

export type ProductBody = z.infer<typeof productBody>
export type ProductListQuery = z.infer<typeof productListQuery>
