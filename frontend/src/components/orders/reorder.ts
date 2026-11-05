import { toast } from "sonner"
import type { PricedItem, Product } from "@/lib/types"
import { useCart } from "@/stores/cart"

/**
 * Coloca os itens de um pedido no carrinho. Itens que saíram da loja são ignorados.
 * Retorna quantos cupcakes diferentes entraram.
 */
export function addItemsToCart(items: PricedItem[], catalog: Map<string, Product>): number {
  let added = 0
  let skipped = 0
  let limited = false
  for (const item of items) {
    const product = catalog.get(item.productId)
    if (!product) {
      skipped++
      continue
    }
    const result = useCart.getState().add(
      { productId: product.id, name: product.name, imageUrl: product.imageUrl },
      item.quantity,
    )
    if (result === "full") skipped++
    else added++
    if (result === "limit") limited = true
  }

  if (added > 0) toast.success(added === 1 ? "Cupcake adicionado ao carrinho" : `${added} cupcakes adicionados ao carrinho`)
  if (skipped > 0) {
    toast.warning(
      skipped === 1 ? "Um cupcake deste pedido não está mais disponível" : `${skipped} cupcakes deste pedido não estão mais disponíveis`,
    )
  }
  if (limited) toast.warning("Algumas quantidades foram limitadas a 99 unidades")
  return added
}
