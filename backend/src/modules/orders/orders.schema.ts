import { z } from 'zod'

export const MAX_NOTES_LENGTH = 200

/** Observação livre do item ("sem amendoim, morango extra"). Vazio vira null. */
const notes = z
  .string()
  .trim()
  .max(MAX_NOTES_LENGTH, `A observação pode ter até ${MAX_NOTES_LENGTH} caracteres`)
  .nullish()
  .transform((value) => value || null)

export const cartItem = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  notes,
})

export const cartItems = z.array(cartItem).max(100)

const text = z.string().trim().max(200).optional()

/** Siglas das 26 unidades federativas e do Distrito Federal. */
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

const uf = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(UFS, 'UF inválida: use a sigla do estado, como SP'))
  .optional()

export const addressInput = z.object({
  street: text,
  number: text,
  complement: text,
  district: text,
  city: text,
  state: uf,
  zipCode: text,
})

export const createOrderBody = z.object({
  items: cartItems.min(1, 'O pedido precisa ter ao menos um item'),
  fulfillmentType: z.enum(['PICKUP', 'DELIVERY']),
  scheduledDate: z.string(),
  address: addressInput.nullish(),
})

export const idParams = z.object({ id: z.string().min(1) })

export type CartItemInput = z.infer<typeof cartItem>
export type CreateOrderBody = z.infer<typeof createOrderBody>
