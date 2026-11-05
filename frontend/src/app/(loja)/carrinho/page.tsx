import type { Metadata } from "next"
import { CartView } from "@/components/cart/cart-view"

export const metadata: Metadata = { title: "Carrinho" }

export default function CarrinhoPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-4xl font-semibold">Seu carrinho</h1>
      <CartView />
    </div>
  )
}
