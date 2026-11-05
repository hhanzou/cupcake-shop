"use client"

import { Fragment, useState } from "react"
import useSWR from "swr"
import { ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api"
import { FULFILLMENT_LABEL, ORDER_STATUSES, STATUS_LABEL } from "@/lib/labels"
import { formatPrice } from "@/lib/money"
import { formatDate, formatInstantDate } from "@/lib/schedule"
import { listAdminOrders, updateOrderStatus } from "@/lib/services/admin-orders"
import type { OrderStatus } from "@/lib/types"

const LIMIT = 10

export function OrdersManager() {
  const [status, setStatus] = useState<OrderStatus | "">("")
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const { data, error, isLoading, mutate } = useSWR(
    ["admin-orders", status, page],
    () => listAdminOrders({ status: status || undefined, page, limit: LIMIT }),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function changeStatus(id: string, next: OrderStatus) {
    setSaving((prev) => new Set(prev).add(id))
    try {
      await updateOrderStatus(id, next)
      toast.success(`Status alterado para "${STATUS_LABEL[next]}"`)
      await mutate()
    } catch (err) {
      // O select é controlado pelos dados da lista, então o valor anterior permanece.
      toast.error(err instanceof ApiError ? err.message : "Não foi possível alterar o status.")
    } finally {
      setSaving((prev) => {
        const copy = new Set(prev)
        copy.delete(id)
        return copy
      })
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold">Pedidos</h1>
        <div className="flex w-56 flex-col gap-1.5">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Filtrar por status
          </label>
          <NativeSelect
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | "")
              setPage(1)
            }}
          >
            <option value="">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error instanceof ApiError ? error.message : "Não foi possível carregar os pedidos."}</span>
          <Button size="sm" variant="secondary" onClick={() => mutate()}>
            Tentar de novo
          </Button>
        </div>
      ) : isLoading || !data ? (
        <Skeleton role="status" aria-label="Carregando pedidos" className="h-72 rounded-3xl" />
      ) : data.data.length === 0 ? (
        <p className="rounded-3xl border border-secondary bg-card p-8 text-center">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-secondary bg-card p-3 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><span className="sr-only">Detalhes</span></TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pedido em</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data planejada</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((order) => {
                const open = expanded.has(order.id)
                return (
                  <Fragment key={order.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggle(order.id)}
                          aria-expanded={open}
                          aria-controls={`order-${order.id}`}
                          aria-label={`${open ? "Recolher" : "Expandir"} pedido de ${order.user.name}`}
                        >
                          {open ? <ChevronDown /> : <ChevronRight />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold">{order.user.name}</TableCell>
                      <TableCell>{formatInstantDate(order.createdAt)}</TableCell>
                      <TableCell>{FULFILLMENT_LABEL[order.fulfillmentType]}</TableCell>
                      <TableCell>{formatDate(order.scheduledDate)}</TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <NativeSelect
                          aria-label={`Status do pedido de ${order.user.name}`}
                          value={order.status}
                          disabled={saving.has(order.id)}
                          onChange={(e) => void changeStatus(order.id, e.target.value as OrderStatus)}
                          className="h-9 min-w-36"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </NativeSelect>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow id={`order-${order.id}`} className="bg-secondary/40">
                        <TableCell />
                        <TableCell colSpan={6}>
                          <div className="grid gap-4 py-2 md:grid-cols-2">
                            <div>
                              <h3 className="mb-1 font-semibold">Itens</h3>
                              <ul className="text-sm">
                                {order.items.map((item) => (
                                  <li key={item.productId}>
                                    {item.quantity} × {item.name} — {formatPrice(item.lineTotal)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="text-sm">
                              <h3 className="mb-1 font-semibold">Cliente</h3>
                              <p>
                                {order.user.name} ({order.user.email})
                              </p>
                              <h3 className="mt-3 mb-1 font-semibold">{order.address ? "Endereço de entrega" : "Retirada na loja"}</h3>
                              {order.address ? (
                                <address className="not-italic">
                                  {order.address.street}, {order.address.number}
                                  {order.address.complement ? ` - ${order.address.complement}` : ""}
                                  <br />
                                  {order.address.district}, {order.address.city} - {order.address.state}
                                  <br />
                                  CEP {order.address.zipCode}
                                </address>
                              ) : (
                                <p>O cliente retira no balcão.</p>
                              )}
                              <p className="mt-3">
                                Status atual: <OrderStatusBadge status={order.status} />
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </nav>
      )}
    </div>
  )
}
