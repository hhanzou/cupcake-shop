"use client"

import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import { Minus, Plus, Trash2 } from "lucide-react"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { imageUrl } from "@/lib/image-url"
import { formatPrice } from "@/lib/money"
import { previewCart } from "@/lib/services/cart"
import { MAX_QUANTITY, useCart } from "@/stores/cart"

export function CartView() {
  const hydrated = useHydrated()
  const items = useCart((s) => s.items)
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)

  // A chave usa só productId e quantity; nome e imagem não mudam o preço.
  const key = items.length ? ["cart-preview", items.map((i) => `${i.productId}:${i.quantity}`).join(",")] : null
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => previewCart(items.map(({ productId, quantity }) => ({ productId, quantity }))),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  if (!hydrated) {
    return <Skeleton className="h-64 rounded-3xl" role="status" aria-label="Carregando carrinho" />
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-secondary bg-card px-6 py-14 text-center shadow-soft">
        <CupcakeIllustration className="size-28" />
        <h2 className="text-2xl font-semibold">Seu carrinho está com fome!</h2>
        <p className="text-muted-foreground">Escolha alguns cupcakes para matar a vontade.</p>
        <Link href="/" className={buttonVariants()}>
          Ver o catálogo
        </Link>
      </div>
    )
  }

  const unavailable = new Set(data?.unavailableProductIds ?? [])
  const priced = new Map(data?.items.map((i) => [i.productId, i]))
  const canCheckout = !!data && !error && unavailable.size === 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>Não foi possível atualizar os preços. Seu carrinho continua salvo.</span>
            <Button size="sm" variant="secondary" onClick={() => mutate()}>
              Tentar de novo
            </Button>
          </div>
        )}
        {unavailable.size > 0 && (
          <p role="alert" className="rounded-2xl bg-butter px-4 py-3 text-sm">
            Alguns cupcakes não estão mais disponíveis. Remova-os para continuar.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const line = priced.get(item.productId)
            const isUnavailable = unavailable.has(item.productId)
            return (
              <li
                key={item.productId}
                className="flex gap-4 rounded-3xl border border-secondary bg-card p-3 shadow-soft"
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={imageUrl(item.imageUrl)}
                    alt={item.name}
                    fill
                    unoptimized
                    sizes="96px"
                    className={isUnavailable ? "object-cover opacity-40 grayscale" : "object-cover"}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg leading-tight font-semibold">{item.name}</h2>
                      {isUnavailable ? (
                        <p className="text-sm font-semibold text-destructive">Indisponível</p>
                      ) : line ? (
                        <p className="text-sm text-muted-foreground">{formatPrice(line.unitPrice)} cada</p>
                      ) : (
                        <Skeleton className="mt-1 h-4 w-20" />
                      )}
                    </div>
                    {line && !isUnavailable && (
                      <p className="font-heading text-lg font-semibold">{formatPrice(line.lineTotal)}</p>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2">
                    {isUnavailable ? (
                      <span />
                    ) : (
                      <div className="flex items-center gap-1" role="group" aria-label={`Quantidade de ${item.name}`}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          aria-label="Diminuir quantidade"
                          disabled={item.quantity <= 1}
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center font-semibold" aria-live="polite">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          aria-label="Aumentar quantidade"
                          disabled={item.quantity >= MAX_QUANTITY}
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(item.productId)}>
                      <Trash2 aria-hidden="true" />
                      Remover
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <aside className="h-fit rounded-3xl border border-secondary bg-card p-5 shadow-soft lg:sticky lg:top-4">
        <h2 className="mb-3 text-xl font-semibold">Resumo</h2>
        <div className="flex items-baseline justify-between">
          <span>Total</span>
          {data ? (
            <span className={`font-heading text-2xl font-semibold ${isValidating ? "opacity-60" : ""}`}>
              {formatPrice(data.total)}
            </span>
          ) : isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <span>—</span>
          )}
        </div>
        {canCheckout ? (
          <Link href="/checkout" className={buttonVariants({ size: "lg", className: "mt-5 w-full" })}>
            Finalizar compra
          </Link>
        ) : (
          <Button size="lg" className="mt-5 w-full" disabled>
            Finalizar compra
          </Button>
        )}
      </aside>
    </div>
  )
}
