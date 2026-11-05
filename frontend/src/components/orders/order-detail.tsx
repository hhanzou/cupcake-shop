"use client"

import Link from "next/link"
import { notFound, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft } from "lucide-react"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { ApiError } from "@/lib/api"
import { FULFILLMENT_LABEL } from "@/lib/labels"
import { formatPrice } from "@/lib/money"
import { formatDate, formatInstantDate } from "@/lib/schedule"
import { getOrder } from "@/lib/services/orders"
import { STORE } from "@/lib/store"

export function OrderDetail({ id }: { id: string }) {
  const justCreated = useSearchParams().get("novo") === "1"
  const { ready } = useRequireAuth()
  const { data, error, isLoading, mutate } = useSWR(ready ? ["order", id] : null, () => getOrder(id), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  if (error instanceof ApiError && error.status === 404) notFound()
  if (error instanceof ApiError && error.status === 401) return null

  if (!ready || isLoading) {
    return <Skeleton role="status" aria-label="Carregando pedido" className="h-80 rounded-3xl" />
  }

  if (error || !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-3xl border border-secondary bg-card px-6 py-12 text-center shadow-soft">
        <p>{error instanceof ApiError ? error.message : "Não foi possível carregar o pedido."}</p>
        <Button onClick={() => mutate()}>Tentar de novo</Button>
      </div>
    )
  }

  const order = data

  return (
    <div className="flex flex-col gap-5">
      <Link href="/pedidos" className="inline-flex w-fit items-center gap-1 text-sm font-medium">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Meus pedidos
      </Link>

      {justCreated && (
        <p role="status" className="rounded-2xl bg-mint px-4 py-3 font-semibold">
          Pagamento aprovado! Seu pedido foi confirmado.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Pedido de {formatInstantDate(order.createdAt)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_320px]">
        <section aria-labelledby="itens" className="rounded-3xl border border-secondary bg-card p-5 shadow-soft">
          <h2 id="itens" className="mb-3 text-xl font-semibold">
            Itens
          </h2>
          <ul className="divide-y divide-secondary">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {item.quantity} × {item.name}
                  <span className="block text-sm text-muted-foreground">{formatPrice(item.unitPrice)} cada</span>
                </span>
                <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-secondary pt-3">
            <span>Total</span>
            <span className="font-heading text-2xl font-semibold">{formatPrice(order.total)}</span>
          </p>
        </section>

        <section aria-labelledby="entrega" className="h-fit rounded-3xl border border-secondary bg-card p-5 shadow-soft">
          <h2 id="entrega" className="mb-3 text-xl font-semibold">
            {FULFILLMENT_LABEL[order.fulfillmentType]}
          </h2>
          <p className="text-sm text-muted-foreground">Data planejada</p>
          <p className="mb-3 font-semibold">{formatDate(order.scheduledDate)}</p>
          {order.address ? (
            <address className="text-sm not-italic">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` - ${order.address.complement}` : ""}
              <br />
              {order.address.district}
              <br />
              {order.address.city} - {order.address.state}
              <br />
              CEP {order.address.zipCode.replace(/^(d{5})(d{3})$/, "$1-$2")}
            </address>
          ) : (
            <address className="text-sm not-italic">
              {STORE.name}
              <br />
              {STORE.address}
              <br />
              {STORE.hours}
            </address>
          )}
        </section>
      </div>
    </div>
  )
}
