"use client"

import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CupcakeIllustration } from "@/components/illustrations/cupcake"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useHydrated } from "@/hooks/use-hydrated"
import { imageUrl } from "@/lib/image-url"
import { formatPrice, multiplyPrice } from "@/lib/money"
import { previewCart } from "@/lib/services/cart"
import {
  MAX_NOTES_LENGTH,
  MAX_QUANTITY,
  previewKey,
  productTotal,
  toPriceItems,
  useCart,
} from "@/stores/cart"

export function CartView() {
  const hydrated = useHydrated()
  const items = useCart((s) => s.items)
  const setQuantity = useCart((s) => s.setQuantity)
  const setNotes = useCart((s) => s.setNotes)
  const mergeDuplicates = useCart((s) => s.mergeDuplicates)
  const addVariant = useCart((s) => s.addVariant)
  const remove = useCart((s) => s.remove)

  // A chave usa só cupcake e quantidade: nome, imagem e observações não mudam o preço.
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    previewKey(items),
    () => previewCart(toPriceItems(items)),
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  function onAddVariant(lineId: string) {
    const index = useCart.getState().items.findIndex((i) => i.id === lineId)
    const result = addVariant(lineId)
    if (result === "limit") {
      toast.warning(`Limite de ${MAX_QUANTITY} unidades por cupcake atingido`)
      return
    }
    if (result === "full") {
      toast.warning("O carrinho já tem o máximo de 100 itens diferentes")
      return
    }
    const created = useCart.getState().items[index + 1]
    if (created) requestAnimationFrame(() => document.getElementById(`notes-${created.id}`)?.focus())
  }

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
  const unitPrices = new Map(data?.items.map((i) => [i.productId, i.unitPrice]))
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
          {items.map((item, i) => {
            const unitPrice = unitPrices.get(item.productId)
            const isUnavailable = unavailable.has(item.productId)
            const atLimit = productTotal(items, item.productId) >= MAX_QUANTITY
            return (
              <li
                key={item.id}
                className="stagger flex gap-4 rounded-3xl border border-secondary bg-card p-3 shadow-soft"
                style={{ ["--i" as string]: i }}
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
                      ) : unitPrice ? (
                        <p className="text-sm text-muted-foreground">{formatPrice(unitPrice)} cada</p>
                      ) : (
                        <Skeleton className="mt-1 h-4 w-20" />
                      )}
                    </div>
                    {unitPrice && !isUnavailable && (
                      <p className="font-heading text-lg font-semibold">
                        {formatPrice(multiplyPrice(unitPrice, item.quantity))}
                      </p>
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
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
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
                          disabled={atLimit}
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(item.id)}>
                      <Trash2 aria-hidden="true" />
                      Remover
                    </Button>
                  </div>

                  {!isUnavailable && (
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`notes-${item.id}`} className="text-sm font-semibold">
                        Observações <span className="font-normal text-muted-foreground">(opcional)</span>
                      </label>
                      <Textarea
                        id={`notes-${item.id}`}
                        value={item.notes}
                        onChange={(e) => setNotes(item.id, e.target.value)}
                        onBlur={mergeDuplicates}
                        maxLength={MAX_NOTES_LENGTH}
                        rows={2}
                        placeholder="Ex.: sem amendoim, morango extra"
                        aria-describedby={`notes-${item.id}-count`}
                        className="min-h-12"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={atLimit}
                          onClick={() => onAddVariant(item.id)}
                        >
                          <Plus aria-hidden="true" />
                          Mais um com outra observação
                        </Button>
                        <span id={`notes-${item.id}-count`} className="text-xs text-muted-foreground">
                          {item.notes.length}/{MAX_NOTES_LENGTH}
                        </span>
                      </div>
                    </div>
                  )}
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
          <Link
            href="/checkout"
            onClick={mergeDuplicates}
            className={buttonVariants({ size: "lg", className: "mt-5 w-full" })}
          >
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
