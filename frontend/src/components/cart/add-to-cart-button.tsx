"use client"

import { ShoppingBasket } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MAX_QUANTITY, useCart } from "@/stores/cart"
import type { Product } from "@/lib/types"

export function AddToCartButton({ product, className }: { product: Product; className?: string }) {
  const add = useCart((s) => s.add)

  function onClick() {
    const result = add({ productId: product.id, name: product.name, imageUrl: product.imageUrl })
    if (result === "added") toast.success(`${product.name} foi para o carrinho`)
    else if (result === "limit") toast.warning(`Limite de ${MAX_QUANTITY} unidades por cupcake atingido`)
    else toast.warning("O carrinho já tem o máximo de 100 cupcakes diferentes")
  }

  return (
    <Button type="button" onClick={onClick} className={className}>
      <ShoppingBasket aria-hidden="true" />
      Adicionar ao carrinho
    </Button>
  )
}
