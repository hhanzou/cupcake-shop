import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Limite por cupcake, somando todas as linhas dele (mesma regra da API). */
export const MAX_QUANTITY = 99
/** Máximo de linhas no carrinho (a API aceita até 100 itens por pedido). */
export const MAX_DISTINCT_ITEMS = 100
/** Mesmo limite da API para a observação de cada item. */
export const MAX_NOTES_LENGTH = 200

/**
 * Uma linha do carrinho: um cupcake com uma observação. O mesmo cupcake pode aparecer em
 * várias linhas, cada uma com sua observação ("2 sem amendoim" e "1 com morango extra").
 */
export type CartLine = {
  id: string
  productId: string
  quantity: number
  name: string
  imageUrl: string | null
  notes: string
}

export type AddInput = {
  productId: string
  name: string
  imageUrl: string | null
  notes?: string
}

export type AddResult = 'added' | 'limit' | 'full'

type CartState = {
  items: CartLine[]
  add: (item: AddInput, quantity?: number) => AddResult
  /** Cria uma linha nova do mesmo cupcake, com 1 unidade e observação vazia. */
  addVariant: (lineId: string) => AddResult
  setQuantity: (lineId: string, quantity: number) => void
  setNotes: (lineId: string, notes: string) => void
  /** Junta linhas do mesmo cupcake que ficaram com a mesma observação. */
  mergeDuplicates: () => void
  remove: (lineId: string) => void
  clear: () => void
}

const clampNotes = (notes: string | undefined) => (notes ?? '').slice(0, MAX_NOTES_LENGTH)
const sameNotes = (a: string, b: string) => a.trim() === b.trim()

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Quantidade total de um cupcake no carrinho, somando as linhas (opcionalmente ignorando uma). */
export function productTotal(items: CartLine[], productId: string, exceptLineId?: string) {
  return items.reduce(
    (sum, i) => (i.productId === productId && i.id !== exceptLineId ? sum + i.quantity : sum),
    0,
  )
}

function merge(items: CartLine[]): CartLine[] {
  const result: CartLine[] = []
  for (const line of items) {
    const twin = result.find((r) => r.productId === line.productId && sameNotes(r.notes, line.notes))
    if (twin) twin.quantity += line.quantity
    else result.push({ ...line })
  }
  return result
}

/** v0 guardava um item por cupcake, sem id e com observação opcional. */
export function migrateCart(persisted: unknown, version: number): { items: CartLine[] } {
  const state = (persisted ?? {}) as { items?: Partial<CartLine>[] }
  if (version >= 1) return state as { items: CartLine[] }
  return {
    ...state,
    items: (state.items ?? []).map((i) => ({
      id: newId(),
      productId: String(i.productId),
      quantity: i.quantity ?? 1,
      name: i.name ?? '',
      imageUrl: i.imageUrl ?? null,
      notes: clampNotes(i.notes),
    })),
  }
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item, quantity = 1) => {
        const { items } = get()
        const notes = clampNotes(item.notes)
        const available = MAX_QUANTITY - productTotal(items, item.productId)
        if (available <= 0) return 'limit'
        const amount = Math.min(quantity, available)

        const existing = items.find((i) => i.productId === item.productId && sameNotes(i.notes, notes))
        if (existing) {
          set({
            items: items.map((i) => (i.id === existing.id ? { ...i, quantity: i.quantity + amount } : i)),
          })
        } else {
          if (items.length >= MAX_DISTINCT_ITEMS) return 'full'
          set({
            items: [
              ...items,
              {
                id: newId(),
                productId: item.productId,
                name: item.name,
                imageUrl: item.imageUrl,
                notes,
                quantity: amount,
              },
            ],
          })
        }
        return quantity > available ? 'limit' : 'added'
      },

      addVariant: (lineId) => {
        const { items } = get()
        const index = items.findIndex((i) => i.id === lineId)
        if (index === -1) return 'added'
        const source = items[index]
        if (productTotal(items, source.productId) >= MAX_QUANTITY) return 'limit'
        if (items.length >= MAX_DISTINCT_ITEMS) return 'full'
        const line: CartLine = { ...source, id: newId(), quantity: 1, notes: '' }
        set({ items: [...items.slice(0, index + 1), line, ...items.slice(index + 1)] })
        return 'added'
      },

      setQuantity: (lineId, quantity) => {
        const { items } = get()
        const line = items.find((i) => i.id === lineId)
        if (!line) return
        const max = MAX_QUANTITY - productTotal(items, line.productId, lineId)
        const q = Math.max(1, Math.min(max, Math.floor(quantity) || 1))
        set({ items: items.map((i) => (i.id === lineId ? { ...i, quantity: q } : i)) })
      },

      setNotes: (lineId, notes) => {
        set({
          items: get().items.map((i) => (i.id === lineId ? { ...i, notes: clampNotes(notes) } : i)),
        })
      },

      mergeDuplicates: () => {
        const { items } = get()
        const merged = merge(items)
        if (merged.length !== items.length) set({ items: merged })
      },

      remove: (lineId) => set({ items: get().items.filter((i) => i.id !== lineId) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'cupcake-cart',
      version: 1,
      skipHydration: true,
      migrate: (persisted, version) => migrateCart(persisted, version) as CartState,
    },
  ),
)

/** Itens no formato da API: uma entrada por linha, observação sem espaços e omitida se vazia. */
export function toOrderItems(items: CartLine[]) {
  return items.map(({ productId, quantity, notes }) => {
    const trimmed = notes.trim()
    return { productId, quantity, ...(trimmed && { notes: trimmed }) }
  })
}

/**
 * Itens para o preview de preços: só cupcake e quantidade, somando as linhas.
 * A observação não muda o preço, então digitar nela não dispara uma nova consulta.
 */
export function toPriceItems(items: CartLine[]) {
  const totals = new Map<string, number>()
  for (const i of items) totals.set(i.productId, (totals.get(i.productId) ?? 0) + i.quantity)
  return [...totals].map(([productId, quantity]) => ({ productId, quantity }))
}

/** Chave estável do SWR para o preview, igual no carrinho e no checkout. */
export function previewKey(items: CartLine[]) {
  if (items.length === 0) return null
  const parts = toPriceItems(items).map((i) => `${i.productId}:${i.quantity}`)
  return ['cart-preview', parts.sort().join(',')] as const
}
