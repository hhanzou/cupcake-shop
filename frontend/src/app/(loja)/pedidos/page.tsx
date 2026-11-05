import type { Metadata } from "next"
import { OrdersList } from "@/components/orders/orders-list"

export const metadata: Metadata = { title: "Meus pedidos" }

export default function PedidosPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-4xl font-semibold">Meus pedidos</h1>
      <OrdersList />
    </div>
  )
}
