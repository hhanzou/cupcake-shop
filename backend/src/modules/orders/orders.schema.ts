import { z } from 'zod'

export const cartItem = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
})

export const cartItems = z.array(cartItem).max(100)

const text = z.string().trim().max(200).optional()

export const addressInput = z.object({
  street: text,
  number: text,
  complement: text,
  district: text,
  city: text,
  state: text,
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
