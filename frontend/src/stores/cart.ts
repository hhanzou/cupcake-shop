import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MAX_QUANTITY = 99
export const MAX_DISTINCT_ITEMS = 100

export type CartItem = {
  productId: string
  quantity: number
  name: string
  imageUrl: string | null
}

export type AddResult = 'added' | 'limit' | 'full'

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => AddResult
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) => {
        const { items } = get()
        const existing = items.find((i) => i.productId === item.productId)
        if (!existing) {
          if (items.length >= MAX_DISTINCT_ITEMS) return 'full'
          set({ items: [...items, { ...item, quantity: Math.min(quantity, MAX_QUANTITY) }] })
          return quantity > MAX_QUANTITY ? 'limit' : 'added'
        }
        const next = existing.quantity + quantity
        set({
          items: items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: Math.min(next, MAX_QUANTITY) } : i,
          ),
        })
        return next > MAX_QUANTITY ? 'limit' : 'added'
      },
      setQuantity: (productId, quantity) => {
        const q = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(quantity) || 1))
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i)),
        })
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'cupcake-cart', skipHydration: true },
  ),
)
