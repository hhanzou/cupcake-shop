import type { Metadata } from "next"
import { CheckoutFlow } from "@/components/checkout/checkout-flow"

export const metadata: Metadata = { title: "Finalizar compra" }

export default function CheckoutPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <h1 className="mb-4 text-4xl font-semibold">Finalizar compra</h1>
      <CheckoutFlow />
    </div>
  )
}
