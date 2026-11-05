import { authRequest } from '../auth-request'
import type { AdminOrder, OrderStatus, Paginated } from '../types'

export function listAdminOrders(params: { status?: OrderStatus; page?: number; limit?: number }) {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  const qs = search.toString()
  return authRequest<Paginated<AdminOrder>>(`/admin/orders${qs ? `?${qs}` : ''}`)
}

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  authRequest<AdminOrder>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } })
