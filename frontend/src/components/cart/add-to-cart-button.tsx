"use client"

import { ShoppingBasket } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MAX_DISTINCT_ITEMS, MAX_QUANTITY, useCart } from "@/stores/cart"
import type { Product } from "@/lib/types"

export function AddToCartButton({
  product,
  notes,
  onAdded,
  className,
}: {
  product: Product
  /** Observação opcional; o mesmo cupcake com outra observação vira outra linha no carrinho. */
  notes?: string
  onAdded?: () => void
  className?: string
}) {
  const add = useCart((s) => s.add)

  function onClick() {
    const result = add({ productId: product.id, name: product.name, imageUrl: product.imageUrl, notes })
    if (result === "added") {
      toast.success(`${product.name} foi para o carrinho`)
      onAdded?.()
    } else if (result === "limit") {
      toast.warning(`Limite de ${MAX_QUANTITY} unidades por cupcake atingido`)
    } else {
      toast.warning(`O carrinho já tem o máximo de ${MAX_DISTINCT_ITEMS} itens diferentes`)
    }
  }

  return (
    <Button type="button" onClick={onClick} className={className}>
      <ShoppingBasket aria-hidden="true" />
      Adicionar ao carrinho
    </Button>
  )
}
