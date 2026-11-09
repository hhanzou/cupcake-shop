"use client"

import Image from "next/image"
import Link from "next/link"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, Plus, RefreshCw } from "lucide-react"
import { addItemsToCart } from "@/components/orders/reorder"
import { useCatalogMap } from "@/hooks/use-catalog-map"
import { imageUrl } from "@/lib/image-url"
import { OrderTimeline } from "@/components/orders/order-timeline"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { Confetti } from "@/components/illustrations/confetti"
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
  const router = useRouter()
  const { map: catalog, ready: catalogReady } = useCatalogMap()
  const { data, error, isLoading, mutate } = useSWR(ready ? ["order", id] : null, () => getOrder(id), {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
    // Acompanha o andamento: atualiza sozinho até o pedido terminar.
    refreshInterval: (latest) => (latest && ["COMPLETED", "CANCELED"].includes(latest.status) ? 0 : 15000),
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
        <p role="status" className="relative overflow-hidden rounded-2xl bg-mint px-4 py-3 font-semibold animate-pop">
          <Confetti />
          Pagamento aprovado! Seu pedido foi confirmado.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Pedido de {formatInstantDate(order.createdAt)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderTimeline status={order.status} fulfillmentType={order.fulfillmentType} scheduledDate={order.scheduledDate} />

      <div className="grid gap-5 md:grid-cols-[1fr_320px]">
        <section aria-labelledby="itens" className="rounded-3xl border border-secondary bg-card p-5 shadow-soft">
          <h2 id="itens" className="mb-3 text-xl font-semibold">
            Itens
          </h2>
          <ul className="divide-y divide-secondary">
            {order.items.map((item, index) => {
              const product = catalog.get(item.productId)
              return (
                <li key={`${item.productId}-${index}`} className="flex items-center gap-3 py-3">
                  {product ? (
                    <Link href={`/cupcakes/${product.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-2xl" aria-label={`Ver ${item.name}`}>
                      <Image src={imageUrl(product.imageUrl)} alt="" fill unoptimized sizes="64px" className="object-cover" />
                    </Link>
                  ) : (
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl opacity-60 grayscale">
                      <Image src={imageUrl(null)} alt="" fill unoptimized sizes="64px" className="object-cover" />
                    </span>
                  )}
                  <span className="flex-1">
                    {item.quantity} × {item.name}
                    <span className="block text-sm text-muted-foreground">{formatPrice(item.unitPrice)} cada</span>
                    {item.notes && <span className="block text-sm">Obs.: {item.notes}</span>}
                    {catalogReady && !product && <span className="block text-sm font-semibold text-destructive">Não está mais à venda</span>}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
                    {product && (
                      <Button variant="ghost" size="xs" onClick={() => addItemsToCart([item], catalog)} aria-label={`Adicionar ${item.name} ao carrinho`}>
                        <Plus aria-hidden="true" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-secondary pt-3">
            <span>Total</span>
            <span className="font-heading text-2xl font-semibold">{formatPrice(order.total)}</span>
          </p>
          <Button
            className="mt-4 w-full"
            disabled={!catalogReady}
            onClick={() => {
              if (addItemsToCart(order.items, catalog) > 0) router.push("/carrinho")
            }}
          >
            <RefreshCw aria-hidden="true" />
            Pedir novamente
          </Button>
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
              CEP {order.address.zipCode.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
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
