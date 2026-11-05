export type Role = 'USER' | 'ADMIN'
export type FulfillmentType = 'PICKUP' | 'DELIVERY'
export type OrderStatus = 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED'
export type ProductSort = 'price_asc' | 'price_desc' | 'newest'

export type User = { id: string; name: string; email: string; role: Role }
export type Session = { token: string; user: User }

export type CategorySummary = { id: string; name: string; slug: string }
export type Category = CategorySummary & { createdAt: string; updatedAt: string }

export type Product = {
  id: string
  name: string
  description: string | null
  flavor: string
  price: string
  categories: CategorySummary[]
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Paginated<T> = { data: T[]; page: number; limit: number; total: number }

export type CartItemInput = { productId: string; quantity: number }

export type PricedItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export type CartPreview = {
  items: PricedItem[]
  unavailableProductIds: string[]
  total: string
}

export type AddressInput = {
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zipCode: string
}

export type Order = {
  id: string
  status: OrderStatus
  fulfillmentType: FulfillmentType
  scheduledDate: string
  total: string
  address: (Omit<AddressInput, 'complement'> & { complement: string | null }) | null
  items: PricedItem[]
  createdAt: string
  updatedAt: string
}

export type AdminOrder = Order & { user: { id: string; name: string; email: string } }

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown[] }
}
