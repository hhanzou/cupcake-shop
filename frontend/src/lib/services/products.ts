import { request } from '../api'
import { authRequest } from '../auth-request'
import type { Paginated, Product } from '../types'

export function listProducts(
  params: Record<string, string | number | undefined> = {},
  cache?: RequestCache,
) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return request<Paginated<Product>>(`/products${qs ? `?${qs}` : ''}`, { cache })
}

export const getProduct = (id: string, cache?: RequestCache) =>
  request<Product>(`/products/${encodeURIComponent(id)}`, { cache })

export type ProductInput = {
  name: string
  description?: string | null
  flavor: string
  price: string
  categoryIds: string[]
}

export const createProduct = (body: ProductInput) =>
  authRequest<Product>('/products', { method: 'POST', body })

export const updateProduct = (id: string, body: ProductInput) =>
  authRequest<Product>(`/products/${id}`, { method: 'PUT', body })

export const deleteProduct = (id: string) =>
  authRequest<void>(`/products/${id}`, { method: 'DELETE' })

export function uploadProductImage(id: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return authRequest<Product>(`/products/${id}/image`, { method: 'PUT', formData })
}
