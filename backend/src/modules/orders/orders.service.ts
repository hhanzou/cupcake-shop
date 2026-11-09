import { Prisma, PrismaClient } from '@prisma/client'
import { AppError } from '../../plugins/errors'
import { formatMoney } from '../../shared/money'
import { CartItemInput, CreateOrderBody } from './orders.schema'
import { validateScheduledDate } from './schedule'

type Db = PrismaClient | Prisma.TransactionClient

export const orderInclude = {
  items: { include: { product: { select: { name: true } } } },
} satisfies Prisma.OrderInclude

export const adminOrderInclude = {
  ...orderInclude,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>
type OrderWithUser = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>

export function serializeOrder(order: OrderWithItems | OrderWithUser) {
  const address =
    order.fulfillmentType === 'DELIVERY'
      ? {
          street: order.street,
          number: order.number,
          complement: order.complement,
          district: order.district,
          city: order.city,
          state: order.state,
          zipCode: order.zipCode,
        }
      : null

  return {
    id: order.id,
    status: order.status,
    fulfillmentType: order.fulfillmentType,
    scheduledDate: order.scheduledDate.toISOString().slice(0, 10),
    total: formatMoney(order.total),
    address,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      notes: item.notes,
      unitPrice: formatMoney(item.unitPrice),
      lineTotal: formatMoney(item.unitPrice.mul(item.quantity)),
    })),
    ...('user' in order ? { user: order.user } : {}),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export type PricedLine = {
  productId: string
  name: string
  quantity: number
  notes: string | null
  unitPrice: Prisma.Decimal
  lineTotal: Prisma.Decimal
}

/**
 * Agrupa itens repetidos (mesmo cupcake e mesma observação), busca os preços no banco e
 * separa itens disponíveis (produto ativo) dos indisponíveis (inativo ou inexistente).
 * Observações diferentes do mesmo cupcake viram linhas separadas, mas o limite de 99
 * vale para o total do cupcake. Usada por carrinho e pedidos.
 */
export async function priceItems(db: Db, items: CartItemInput[]) {
  const groups = new Map<string, { productId: string; notes: string | null; quantity: number }>()
  const totals = new Map<string, number>()

  for (const item of items) {
    const notes = item.notes ?? null
    const key = JSON.stringify([item.productId, notes])
    const group = groups.get(key)
    if (group) group.quantity += item.quantity
    else groups.set(key, { productId: item.productId, notes, quantity: item.quantity })
    totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity)
  }

  for (const [productId, quantity] of totals) {
    if (quantity > 99) {
      throw new AppError(
        400,
        'CART_INVALID_QUANTITY',
        'A quantidade total de um mesmo cupcake não pode passar de 99',
        [{ productId, quantity }],
      )
    }
  }

  const products = await db.product.findMany({
    where: { id: { in: [...totals.keys()] } },
    select: { id: true, name: true, price: true, active: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  const lines: PricedLine[] = []
  const unavailable = new Set<string>()
  let total = new Prisma.Decimal(0)

  for (const { productId, notes, quantity } of groups.values()) {
    const product = byId.get(productId)
    if (!product || !product.active) {
      unavailable.add(productId)
      continue
    }
    const lineTotal = product.price.mul(quantity)
    total = total.add(lineTotal)
    lines.push({ productId, name: product.name, quantity, notes, unitPrice: product.price, lineTotal })
  }

  return { lines, unavailableProductIds: [...unavailable], total }
}

const ADDRESS_REQUIRED = ['street', 'number', 'district', 'city', 'state', 'zipCode'] as const

function resolveAddress(input: CreateOrderBody) {
  const address = input.address ?? undefined

  if (input.fulfillmentType === 'PICKUP') {
    if (address && Object.values(address).some((v) => v !== undefined)) {
      throw new AppError(400, 'ORDER_INVALID_ADDRESS', 'Retirada na loja não aceita endereço')
    }
    return {}
  }

  const missing = ADDRESS_REQUIRED.filter((field) => !address?.[field])
  if (!address || missing.length > 0) {
    throw new AppError(
      400,
      'ORDER_INVALID_ADDRESS',
      'Entrega exige endereço completo (complemento é opcional)',
      missing.map((field) => ({ path: `address.${field}`, message: 'Campo obrigatório' })),
    )
  }
  return {
    street: address.street,
    number: address.number,
    complement: address.complement || null,
    district: address.district,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
  }
}

export async function createOrder(
  prisma: PrismaClient,
  userId: string,
  input: CreateOrderBody,
  now = new Date(),
) {
  const addressData = resolveAddress(input)

  const schedule = validateScheduledDate(input.scheduledDate, now)
  if (!schedule.valid) {
    throw new AppError(400, 'ORDER_INVALID_DATE', schedule.message)
  }

  const order = await prisma.$transaction(async (tx) => {
    const priced = await priceItems(tx, input.items)
    if (priced.unavailableProductIds.length > 0) {
      throw new AppError(
        409,
        'ORDER_ITEM_UNAVAILABLE',
        'Alguns itens não estão mais disponíveis',
        priced.unavailableProductIds,
      )
    }

    return tx.order.create({
      data: {
        userId,
        status: 'CONFIRMED',
        fulfillmentType: input.fulfillmentType,
        scheduledDate: schedule.date,
        total: priced.total,
        ...addressData,
        items: {
          create: priced.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            notes: line.notes,
          })),
        },
      },
      include: orderInclude,
    })
  })

  return serializeOrder(order)
}

export async function listUserOrders(prisma: PrismaClient, userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    include: orderInclude,
  })
  return { data: orders.map(serializeOrder) }
}

export async function getUserOrder(prisma: PrismaClient, userId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude })
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado')
  return serializeOrder(order)
}
