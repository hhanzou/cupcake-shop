import { request } from '../api'
import { authRequest } from '../auth-request'
import type { Category } from '../types'

export const listCategories = (cache?: RequestCache, timeoutMs?: number) =>
  request<{ data: Category[] }>('/categories', { cache, timeoutMs })

export const createCategory = (body: { name: string }) =>
  authRequest<Category>('/categories', { method: 'POST', body })

export const updateCategory = (id: string, body: { name: string }) =>
  authRequest<Category>(`/categories/${id}`, { method: 'PUT', body })

export const deleteCategory = (id: string) =>
  authRequest<void>(`/categories/${id}`, { method: 'DELETE' })
