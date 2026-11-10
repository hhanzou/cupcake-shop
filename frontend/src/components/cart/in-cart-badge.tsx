"use client"

import { ShoppingBasket } from "lucide-react"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"
import { productTotal, useCart } from "@/stores/cart"

/** Quantas unidades deste cupcake já estão no carrinho (somando todas as linhas dele). */
export function InCartBadge({ productId, className }: { productId: string; className?: string }) {
  const hydrated = useHydrated()
  const quantity = useCart((s) => productTotal(s.items, productId))

  // Só aparece depois de ler o carrinho salvo, para não divergir do HTML do servidor.
  if (!hydrated || quantity === 0) return null

  return (
    <span
      key={quantity}
      className={cn(
        "animate-pop inline-flex h-6 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-soft",
        className,
      )}
      aria-label={`${quantity} no carrinho`}
    >
      <ShoppingBasket className="size-3.5" aria-hidden="true" />
      {quantity} no carrinho
    </span>
  )
}
