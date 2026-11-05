"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import useSWR from "swr"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { OrderThumbs } from "@/components/orders/order-thumbs"
import { addItemsToCart } from "@/components/orders/reorder"
import { useCatalogMap } from "@/hooks/use-catalog-map"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { ApiError } from "@/lib/api"
import { FULFILLMENT_LABEL } from "@/lib/labels"
import { formatPrice } from "@/lib/money"
import { formatDate, formatInstantDate } from "@/lib/schedule"
import { listOrders } from "@/lib/services/orders"

export function OrdersList() {
  const { ready } = useRequireAuth()
  const router = useRouter()
  const { map: catalog, ready: catalogReady } = useCatalogMap()
  const { data, error, isLoading, mutate } = useSWR(ready ? "orders" : null, listOrders, {
    revalidateOnFocus: false,
  })

  if (!ready || isLoading) {
    return (
      <div role="status" aria-label="Carregando pedidos" className="flex flex-col gap-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    )
  }

  // 401 já limpou a sessão; o guard redireciona para o login.
  if (error instanceof ApiError && error.status === 401) return null

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-3xl border border-secondary bg-card px-6 py-12 text-center shadow-soft">
        <p>{error instanceof ApiError ? error.message : "Não foi possível carregar seus pedidos."}</p>
        <Button onClick={() => mutate()}>Tentar de novo</Button>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-secondary bg-card px-6 py-14 text-center shadow-soft">
        <CupcakeIllustration className="size-28" />
        <h2 className="text-2xl font-semibold">Você ainda não fez pedidos</h2>
        <p className="text-muted-foreground">Que tal começar escolhendo uns cupcakes?</p>
        <Link href="/" className={buttonVariants()}>
          Ver o catálogo
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.data.map((order, i) => (
        <li key={order.id} className="stagger" style={{ ["--i" as string]: i }}>
          <div className="overflow-hidden rounded-3xl border border-secondary bg-card shadow-soft transition-transform hover:-translate-y-0.5">
            <Link
              href={`/pedidos/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-3 p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-center gap-4">
                <OrderThumbs items={order.items} catalog={catalog} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Pedido de {formatInstantDate(order.createdAt)}</span>
                  <span className="font-semibold">
                    {FULFILLMENT_LABEL[order.fulfillmentType]} para {formatDate(order.scheduledDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <span className="font-heading text-lg font-semibold">{formatPrice(order.total)}</span>
              </div>
            </Link>
            <div className="flex justify-end border-t border-secondary bg-secondary/30 px-4 py-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!catalogReady}
                onClick={() => {
                  if (addItemsToCart(order.items, catalog) > 0) router.push("/carrinho")
                }}
              >
                <RefreshCw aria-hidden="true" />
                Pedir novamente
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
